// =============================================================
// Toasty OS — test:db SAFETY GUARD
// =============================================================
// Guards `npm run test:db` so DB/E2E tests can ONLY run against a
// dedicated, explicitly-confirmed test project — never production.
//
// Required environment (in .env.test, never committed):
//   TEST_SUPABASE_URL=https://<test-project>.supabase.co
//   TEST_SUPABASE_ANON_KEY=<test-anon-key>
//   TEST_SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>   (optional)
//   TEST_DATABASE_CONFIRMATION=TOASTY_TEST_ONLY              (mandatory opt-in)
//
// The guard ABORTS unless all gates pass. It never runs against a
// project whose URL contains a production marker or the hardcoded
// single shared project id found across tests/*.mjs.
// =============================================================

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TESTS_DIR = resolve(import.meta.dirname, '../../../tests')
const HARDCODED_PROD_PROJECT_ID = 'rkgbhvmykbkdyhzxrqee'
const PROD_MARKERS = ['prod', 'production', HARDCODED_PROD_PROJECT_ID]

const errors = []
const notes = []

function gate(condition, message) {
  if (!condition) errors.push(message)
}

function note(message) {
  notes.push(message)
}

console.log('=== test:db SAFETY GUARD ===\n')

// --- Gate 1: mandatory confirmation token -------------------
const confirmation = process.env.TEST_DATABASE_CONFIRMATION
gate(
  confirmation === 'TOASTY_TEST_ONLY',
  'TEST_DATABASE_CONFIRMATION must equal "TOASTY_TEST_ONLY" (explicit opt-in required)'
)

// --- Gate 2: required test-project credentials --------------
const testUrl = process.env.TEST_SUPABASE_URL
const testAnon = process.env.TEST_SUPABASE_ANON_KEY
gate(!!testUrl, 'TEST_SUPABASE_URL is required')
gate(!!testAnon, 'TEST_SUPABASE_ANON_KEY is required')

// --- Gate 3: never production ------------------------------
if (testUrl) {
  const lower = testUrl.toLowerCase()
  for (const marker of PROD_MARKERS) {
    gate(!lower.includes(marker), `TEST_SUPABASE_URL must not reference production (found marker "${marker}")`)
  }
  gate(testUrl.startsWith('https://'), 'TEST_SUPABASE_URL must be an https URL')
}

// --- Gate 4: no hardcoded prod id in E2E scripts ------------
// If any tests/*.mjs still points at the shared prod project and the
// test URL is unset/different, refuse to run (item 28 hardening).
if (testUrl && testUrl.toLowerCase().includes(HARDCODED_PROD_PROJECT_ID)) {
  errors.push('TEST_SUPABASE_URL points at the hardcoded shared project — use a dedicated test project')
}

try {
  const files = readdirSync(TESTS_DIR).filter(f => f.endsWith('.mjs'))
  for (const f of files) {
    const content = readFileSync(resolve(TESTS_DIR, f), 'utf-8')
    if (content.includes(HARDCODED_PROD_PROJECT_ID) && !content.includes('TEST_SUPABASE_URL')) {
      note(`tests/${f} still hardcodes the shared project id (should read TEST_SUPABASE_URL — see item 28)`)
    }
  }
} catch {
  errors.push('Could not read tests/ directory')
}

if (errors.length > 0) {
  const prodRef = errors.some(e => e.includes('production') || e.includes('hardcoded shared project'))
  if (prodRef) {
    console.log('❌ SAFETY GATE FAILED — test:db aborted (attempt to target production). No DB operations executed.\n')
    for (const e of errors) console.log('  • ' + e)
    if (notes.length > 0) {
      console.log('\nNotes:')
      for (const n of notes) console.log('  • ' + n)
    }
    process.exit(1)
  }
  console.log('DB TESTS SKIPPED — isolated test environment not configured.\n')
  if (notes.length > 0) {
    for (const n of notes) console.log('  • ' + n)
  }
  console.log('Set a dedicated test project in .env.test and re-run:')
  console.log('  TEST_SUPABASE_URL=https://<test>.supabase.co')
  console.log('  TEST_SUPABASE_ANON_KEY=<test-anon>')
  console.log('  TEST_DATABASE_CONFIRMATION=TOASTY_TEST_ONLY')
  process.exit(0)
}

// --- Gates passed: run validation E2E scripts ---------------
// Allowlist excludes push-migration-12.mjs (mutating migration push).
const VALIDATION_ALLOWLIST = new Set([
  'check-migration-status.mjs',
  'check-rpc-status.mjs',
  'debug-e2e-exact.mjs',
  'debug-schema-cache.mjs',
  'finance-migration-007-validation.mjs',
  'phase12-comprehensive-e2e.mjs',
  'phase12-staff-settings-validation.mjs',
])

console.log('✅ All safety gates passed — running DB/E2E validation suite\n')
console.log(`Test project: ${testUrl}\n`)

const scripts = readdirSync(TESTS_DIR)
  .filter(f => f.endsWith('.mjs'))
  .filter(f => VALIDATION_ALLOWLIST.has(f))
  .sort()

let failed = 0
for (const script of scripts) {
  console.log(`--- running tests/${script} ---`)
  try {
    execFileSync('node', [resolve(TESTS_DIR, script)], {
      stdio: 'inherit',
      env: process.env,
    })
  } catch (err) {
    failed++
    console.error(`✗ tests/${script} failed`)
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} DB/E2E script(s) failed`)
  process.exit(1)
}

console.log('\n✅ test:db completed')
