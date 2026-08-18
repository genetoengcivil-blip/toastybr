import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../../supabase/migrations')

const checks = []

function pass(name, message) {
  checks.push({ name, pass: true, message })
}

function fail(name, message) {
  checks.push({ name, pass: false, message })
}

function runMigrationStaticChecks() {
  console.log('=== Migration Static Checks ===\n')

  // SELF-TEST: prove the has_org_role single-arg detector works (negative fixture).
  const re = /has_org_role\(\s*['"]/i
  const detectsBad = re.test("WHERE has_org_role('owner')")
  const ignoresGood = !re.test("WHERE has_org_role(org_id, 'owner')")
  if (detectsBad && ignoresGood) {
    pass('SELF_TEST_HAS_ORG_ROLE', 'detector catches single-arg form, ignores two-arg form')
  } else {
    fail('SELF_TEST_HAS_ORG_ROLE', `detector broken: detectsBad=${detectsBad} ignoresGood=${ignoresGood}`)
  }


  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`Found ${files.length} migration files\n`)

  // 1. Duplicate timestamp check
  const timestamps = new Map()
  for (const file of files) {
    const match = file.match(/^(\d{14})/)
    if (match) {
      const ts = match[1]
      if (!timestamps.has(ts)) timestamps.set(ts, [])
      timestamps.get(ts).push(file)
    }
  }

  for (const [ts, fileList] of timestamps) {
    if (fileList.length > 1) {
      fail('DUPLICATE_TIMESTAMP', ts + ': ' + fileList.join(', '))
    }
  }
  const tsCount = timestamps.size
  const fileWithTs = files.filter(f => f.match(/^\d{14}/)).length
  if (tsCount === fileWithTs) {
    pass('DUPLICATE_TIMESTAMP', 'No duplicate timestamps')
  }

  // 2. Invalid timestamp format
  for (const file of files) {
    if (!file.match(/^\d{14}_/) && !file.match(/^\d{8}_/)) {
      fail('INVALID_FILENAME', file + ': does not match YYYYMMDDHHMMSS_name.sql or YYYYMMDD_name.sql')
    }
  }

  // 3. CHECK subquery anti-pattern
  // Known exceptions from existing migrations (pre-Phase 13)
  const checkSubqueryExceptions = new Set([
    '20260817130004_finance_purchase_integration.sql',
    '20260817130005_finance_purchase_integration_v2.sql',
    '20260817130006_finance_purchase_integration_v3.sql',
    '20260818000000_staff_settings.sql',
    '20260818000001_fix_invite_pgcrypto.sql',
  ])

  for (const file of files) {
    if (checkSubqueryExceptions.has(file)) continue
    const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toUpperCase()
      if (line.includes('CHECK') && line.includes('EXISTS')) {
        fail('CHECK_SUBQUERY', file + ':' + (i + 1) + ' - CHECK with EXISTS subquery (cross-table check)')
      }
      if (line.includes('CHECK') && line.includes('SELECT')) {
        fail('CHECK_SUBQUERY', file + ':' + (i + 1) + ' - CHECK with SELECT subquery (cross-table check)')
      }
      if (line.includes('CHECK') && (line.includes('IN (SELECT') || line.includes('NOT IN (SELECT'))) {
        fail('CHECK_SUBQUERY', file + ':' + (i + 1) + ' - CHECK with IN/NOT IN subquery')
      }
    }
  }

  // 4. SECURITY DEFINER without SET search_path
  for (const file of files) {
    const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8')
    const lines = content.split('\n')
    let inFunction = false
    let currentFunc = ''
    let hasSecurityDefiner = false
    let hasSearchPath = false
    let funcStartLine = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const upper = line.toUpperCase()

      if (upper.startsWith('CREATE OR REPLACE FUNCTION') || upper.startsWith('CREATE FUNCTION')) {
        inFunction = true
        funcStartLine = i + 1
        hasSecurityDefiner = false
        hasSearchPath = false
        const match = line.match(/CREATE OR REPLACE FUNCTION\s+(\w+\.)?(\w+)/i)
        currentFunc = match ? match[2] : 'unknown'
      }

      if (inFunction) {
        if (upper.includes('SECURITY DEFINER')) hasSecurityDefiner = true
        if (upper.includes('SET SEARCH_PATH')) hasSearchPath = true
        if (upper.startsWith('$') && upper.endsWith('$') && hasSecurityDefiner) {
          if (!hasSearchPath) {
            fail('SECURITY_DEFINER_NO_SEARCH_PATH', file + ':' + funcStartLine + ' - ' + currentFunc + ' has SECURITY DEFINER but no SET search_path')
          }
          inFunction = false
        }
      }
    }
  }

  // 5. Broad GRANT patterns
  for (const file of files) {
    const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8')
    const upper = content.toUpperCase()
    if (upper.includes('GRANT ALL ON ALL TABLES') || upper.includes('GRANT ALL ON ALL SEQUENCES') || upper.includes('GRANT ALL ON ALL FUNCTIONS')) {
      fail('BROAD_GRANT', file + ' - GRANT ALL ON ALL TABLES/SEQUENCES/FUNCTIONS detected')
    }
    if (upper.includes('GRANT SELECT ON ALL TABLES') && !upper.match(/GRANT SELECT ON \w+/)) {
      fail('BROAD_GRANT', file + ' - GRANT SELECT ON ALL TABLES detected')
    }
  }

  // 6. DROP TABLE/COLUMN protection
  for (const file of files) {
    const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8')
    const upper = content.toUpperCase()
    if (upper.includes('DROP TABLE') || upper.includes('DROP COLUMN')) {
      if (!upper.includes('-- ALLOW DROP') && !upper.includes('-- DROP PROTECTION EXEMPT')) {
        fail('DROP_PROTECTION', file + ' - DROP TABLE or DROP COLUMN detected without explicit exemption')
      }
    }
  }

  // 7. has_org_role ARITY REGRESSION
  // Correct signature is has_org_role(organization_id, 'role').
  // The single-argument form has_org_role('role') silently grants org-wide
  // access and is a critical regression. Detect first-arg string literal.
  for (const file of files) {
    const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const matches = line.matchAll(/has_org_role\(\s*['"]/gi)
      for (const m of matches) {
        fail('HAS_ORG_ROLE_ARITY', file + ':' + (i + 1) + ' - has_org_role called with single string-literal arg (missing organization_id)')
      }
    }
  }
  if (!checks.some(c => c.name === 'HAS_ORG_ROLE_ARITY' && !c.pass)) {
    pass('HAS_ORG_ROLE_ARITY', 'All has_org_role calls use 2-arg form (organization_id, role)')
  }

  // 8. ORDER SEQUENCE REGRESSION
  // Buggy pattern: nextval(public.%I) — schema-qualified sequence name via %I
  // expands to a quoted identifier, not a regclass string. Correct: nextval(%L).
  for (const file of files) {
    const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (trimmed.startsWith('--')) continue
      if (/nextval\(\s*public\./i.test(trimmed)) {
        fail('ORDER_SEQUENCE_REGRESSION', file + ':' + (i + 1) + ' - nextval(public.*) schema-qualified sequence bug')
      }
    }
  }
  if (!checks.some(c => c.name === 'ORDER_SEQUENCE_REGRESSION' && !c.pass)) {
    pass('ORDER_SEQUENCE_REGRESSION', 'No nextval(public.*) schema-qualified sequence bug')
  }

  // 9. KNOWN CHECK EXCEPTIONS — reported explicitly
  // These migrations intentionally use CHECK with subquery and are documented
  // as accepted exceptions (pre-Phase 13 cross-table validations).
  for (const file of checkSubqueryExceptions) {
    pass('KNOWN_CHECK_EXCEPTION', file + ' — CHECK-with-subquery exception accepted (documented)')
  }

  // 10. MIGRATION ACTIVE IMPLEMENTATION CONTRACT
  // The latest finance migration must keep the structural finance contracts.
  const financeFiles = files
    .filter(f => /^\d{14}_finance/.test(f))
    .sort()
  const latestFinance = financeFiles[financeFiles.length - 1]
  const staffFile = files.find(f => f === '20260818000000_staff_settings.sql')

  const financeContent = latestFinance
    ? readFileSync(resolve(MIGRATIONS_DIR, latestFinance), 'utf-8')
    : ''
  const staffContent = staffFile
    ? readFileSync(resolve(MIGRATIONS_DIR, staffFile), 'utf-8')
    : ''

  const financeContracts = [
    'uq_ft_sale_per_payment',
    'uq_ft_reversal_per_original',
    'uq_ap_per_purchase_order',
    'prevent_ap_sensitive_mutation',
    'prevent_ar_sensitive_mutation',
  ]
  if (latestFinance) {
    for (const contract of financeContracts) {
      if (financeContent.includes(contract)) {
        pass('ACTIVE_FINANCE_CONTRACT', latestFinance + ' defines ' + contract)
      } else {
        fail('ACTIVE_FINANCE_CONTRACT', latestFinance + ' is missing contract: ' + contract)
      }
    }
  } else {
    fail('ACTIVE_FINANCE_CONTRACT', 'No finance migration found')
  }

  if (staffFile) {
    if (staffContent.includes('token_hash')) {
      pass('ACTIVE_STAFF_CONTRACT', staffFile + ' defines token_hash (invite token hashing)')
    } else {
      fail('ACTIVE_STAFF_CONTRACT', staffFile + ' is missing token_hash')
    }
    if (/raise exception '[^']*último[\s\S]{0,40}owner'/i.test(staffContent) ||
        /raise exception '[^']*remover[\s\S]{0,40}owner'/i.test(staffContent)) {
      pass('ACTIVE_STAFF_CONTRACT', staffFile + ' enforces last-owner protection')
    } else {
      fail('ACTIVE_STAFF_CONTRACT', staffFile + ' missing last-owner protection')
    }
  } else {
    fail('ACTIVE_STAFF_CONTRACT', 'staff_settings migration not found')
  }

  // 11. SPLIT PAYMENT CONTRACT
  // Per-sales-payment posting model: finalize_sales_order must post one
  // financial_transaction per confirmed sales_payment (reference_type = 'sales_payment').
  if (latestFinance) {
    if (financeContent.includes("'sales_payment'")) {
      pass('SPLIT_PAYMENT_CONTRACT', latestFinance + ' implements per-sales_payment posting (reference_type = sales_payment)')
    } else {
      fail('SPLIT_PAYMENT_CONTRACT', latestFinance + ' missing per-sales_payment posting contract')
    }
  } else {
    fail('SPLIT_PAYMENT_CONTRACT', 'No finance migration found')
  }

  // 12. REALTIME PUBLICATION CONTRACT
  // Only sales_orders may be added to supabase_realtime. No broad
  // 'for all tables', no finance/inventory tables, no service_role.
  const realtimeMigrations = files.filter((f) => {
    const c = readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8')
    return /alter publication\s+supabase_realtime/i.test(c)
  })
  if (realtimeMigrations.length === 0) {
    pass('REALTIME_PUBLICATION', 'No realtime publication changes (acceptable)')
  }
  for (const f of realtimeMigrations) {
    const c = readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8')
    const up = c.toUpperCase()
    if (/ADD TABLE\s+PUBLIC\.SALES_ORDERS/i.test(c) || /ADD TABLE\s+SALES_ORDERS/i.test(c)) {
      pass('REALTIME_PUBLICATION', `${f} adds sales_orders to supabase_realtime`)
    } else {
      fail('REALTIME_PUBLICATION', `${f} does not add sales_orders to supabase_realtime`)
    }
    if (/FOR ALL TABLES/i.test(up)) {
      fail('REALTIME_PUBLICATION', `${f} uses broad 'for all tables' publication`)
    }
    if (/FINANCIAL_TRANSACTIONS|INVENTORY_MOVEMENTS|LOYALTY_TRANSACTIONS/i.test(up)) {
      fail('REALTIME_PUBLICATION', `${f} adds finance/inventory tables to realtime (scope leak)`)
    }
    if (/SERVICE_ROLE/i.test(up)) {
      fail('REALTIME_PUBLICATION', `${f} references service_role`)
    }
  }

  // 13. ANALYTICS RPC CONTRACT
  // Analytics RPCs must be SECURITY DEFINER, SET search_path = public, and
  // validate tenant membership via is_member_of (never trust organization_id
  // blindly). Grants must be least-privilege (authenticated only).
  const analyticsFiles = files.filter((f) => {
    const c = readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8')
    return /create or replace function public\.analytics_/i.test(c)
  })
  if (analyticsFiles.length === 0) {
    pass('ANALYTICS_RPC', 'No analytics RPCs found (acceptable)')
  }
  for (const f of analyticsFiles) {
    const c = readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8')
    if (/security definer/i.test(c) && /set search_path\s*=\s*public/i.test(c)) {
      pass('ANALYTICS_RPC', `${f} is SECURITY DEFINER with search_path = public`)
    } else {
      fail('ANALYTICS_RPC', `${f} missing SECURITY DEFINER / search_path`)
    }
    if (/is_member_of\(/i.test(c)) {
      pass('ANALYTICS_RPC', `${f} validates tenant via is_member_of`)
    } else {
      fail('ANALYTICS_RPC', `${f} does not validate tenant membership`)
    }
  }
  const grantsFile = files.find((f) => /analytics_grants/.test(f))
  if (grantsFile) {
    const gc = readFileSync(resolve(MIGRATIONS_DIR, grantsFile), 'utf-8')
    const revoked = /REVOKE EXECUTE ON FUNCTION public\.analytics_/i.test(gc)
    const granted = /GRANT EXECUTE ON FUNCTION public\.analytics_[\s\S]*TO authenticated/i.test(gc)
    if (revoked && granted) {
      pass('ANALYTICS_RPC', `${grantsFile} revokes public and grants authenticated`)
    } else {
      fail('ANALYTICS_RPC', `${grantsFile} missing least-privilege grant/revoke for analytics RPCs`)
    }
  } else if (analyticsFiles.length > 0) {
    fail('ANALYTICS_RPC', 'analytics RPCs exist but no grants migration found')
  }

  // Summary
  const passed = checks.filter(c => c.pass).length
  const failed = checks.filter(c => !c.pass).length

  console.log('Results:')
  for (const check of checks) {
    const icon = check.pass ? '✅' : '❌'
    console.log('  ' + icon + ' ' + check.name + (check.message ? ': ' + check.message : ''))
  }

  console.log('\nTotal: ' + passed + ' passed, ' + failed + ' failed')

  if (failed > 0) {
    process.exit(1)
  }
}

runMigrationStaticChecks()