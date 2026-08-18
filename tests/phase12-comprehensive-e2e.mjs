import { createClient } from '@supabase/supabase-js'

const URL = process.env.TEST_SUPABASE_URL
const ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY
if (!URL || !ANON_KEY) {
  console.error('TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY must be set (see .env.test.example)')
  process.exit(1)
}

const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD
const ORG_ID = process.env.TEST_ORG_ID
if (!URL || !ANON_KEY || !EMAIL || !PASSWORD || !ORG_ID) {
  console.error('TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ORG_ID must be set')
  process.exit(1)
}

let pass = 0, fail = 0, blocked = 0

function log(label, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'BLOCKED' ? '🛡️' : '⚠️'
  console.log(`  ${icon} ${label}: ${status}${detail ? ' — ' + detail : ''}`)
  if (status === 'PASS') pass++
  else if (status === 'FAIL') fail++
  else if (status === 'BLOCKED') blocked++
}

async function rpc(name, params = {}) {
  const supabase = createClient(URL, ANON_KEY)
  await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  return supabase.rpc(name, params)
}

async function main() {
  console.log('==================================================')
  console.log('PHASE 12 — COMPREHENSIVE E2E VALIDATION')
  console.log('==================================================')

  const supabase = createClient(URL, ANON_KEY)
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })
  if (authErr) { console.error('Auth failed:', authErr.message); return }
  console.log(`\n🔐 User: ${authData.user.id}\n`)

  // ========================================================
  // 1. INVITE: full lifecycle
  // ========================================================
  console.log('1. INVITE LIFECYCLE')
  const testEmail = `lifecycle-${Date.now()}@example.com`

  // Create
  const { data: inviteId, error: e1 } = await supabase.rpc('invite_organization_member', {
    p_org_id: ORG_ID, p_email: testEmail, p_role: 'manager',
  })
  log('Create invite (manager)', e1 ? 'FAIL' : 'PASS', e1?.message || `id=${inviteId}`)

  // Duplicate
  const { error: e2 } = await supabase.rpc('invite_organization_member', {
    p_org_id: ORG_ID, p_email: testEmail, p_role: 'manager',
  })
  log('Duplicate invite blocked', e2 ? 'BLOCKED' : 'FAIL', e2?.message)

  // Cancel
  const { error: e3 } = await supabase.rpc('cancel_organization_invite', {
    p_invite_id: inviteId,
  })
  log('Cancel invite', e3 ? 'FAIL' : 'PASS', e3?.message)

  // Cancel non-existent
  const { error: e4 } = await supabase.rpc('cancel_organization_invite', {
    p_invite_id: '00000000-0000-0000-0000-000000000000',
  })
  log('Cancel non-existent invite', e4 ? 'BLOCKED' : 'FAIL', e4?.message)

  // ========================================================
  // 2. ROLE ESCALATION
  // ========================================================
  console.log('\n2. ROLE ESCALATION')

  // Get all members
  const { data: members } = await supabase
    .from('organization_members')
    .select('id, role, user_id')
    .eq('organization_id', ORG_ID)

  const myMember = members?.find(m => m.user_id === authData.user.id)
  const otherMember = members?.find(m => m.user_id !== authData.user.id)

  if (myMember && otherMember) {
    // Self role change
    const { error: e5 } = await supabase.rpc('change_organization_member_role', {
      p_org_id: ORG_ID, p_member_id: myMember.id, p_new_role: 'staff',
    })
    log('Self role change blocked', e5 ? 'BLOCKED' : 'FAIL', e5?.message)

    // Self removal
    const { error: e6 } = await supabase.rpc('remove_organization_member', {
      p_org_id: ORG_ID, p_member_id: myMember.id,
    })
    log('Self removal blocked', e6 ? 'BLOCKED' : 'FAIL', e6?.message)

    // Last owner protection: try to downgrade self
    if (myMember.role === 'owner') {
      const { data: ownerCount } = await supabase
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ORG_ID)
        .eq('role', 'owner')

      if (ownerCount <= 1) {
        const { error: e7 } = await supabase.rpc('change_organization_member_role', {
          p_org_id: ORG_ID, p_member_id: myMember.id, p_new_role: 'admin',
        })
        log('Last owner downgrade blocked', e7 ? 'BLOCKED' : 'FAIL', e7?.message)
      }
    }

    // Valid role change: change other member's role then change back
    const originalRole = otherMember.role
    const newRole = originalRole === 'staff' ? 'manager' : 'staff'
    const { error: e8 } = await supabase.rpc('change_organization_member_role', {
      p_org_id: ORG_ID, p_member_id: otherMember.id, p_new_role: newRole,
    })
    log(`Change role ${originalRole} → ${newRole}`, e8 ? 'FAIL' : 'PASS', e8?.message)

    // Restore original role
    if (!e8) {
      await supabase.rpc('change_organization_member_role', {
        p_org_id: ORG_ID, p_member_id: otherMember.id, p_new_role: originalRole,
      })
    }
  } else {
    log('Role escalation tests', 'FAIL', 'need at least 2 members')
  }

  // ========================================================
  // 3. ORGANIZATION SETTINGS
  // ========================================================
  console.log('\n3. ORGANIZATION SETTINGS')

  // Update settings
  const { error: e9 } = await supabase.rpc('update_organization_settings', {
    p_org_id: ORG_ID,
    p_name: null,
    p_phone: '+5511999999999',
    p_email: 'settings@test.com',
    p_address: 'Rua Test, 123',
    p_timezone: 'America/Sao_Paulo',
    p_currency: 'BRL',
    p_locale: 'pt-BR',
  })
  log('Update settings', e9 ? 'FAIL' : 'PASS', e9?.message)

  // Read settings
  const { data: settings, error: e10 } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('organization_id', ORG_ID)
    .single()
  log('Read settings', e10 ? 'FAIL' : 'PASS',
    settings ? `phone=${settings.phone}, tz=${settings.timezone}` : e10?.message)

  // ========================================================
  // 4. BUSINESS HOURS
  // ========================================================
  console.log('\n4. BUSINESS HOURS')

  // Set Monday hours
  const { error: e11 } = await supabase.rpc('update_organization_business_hours', {
    p_org_id: ORG_ID, p_weekday: 1, p_is_open: true,
    p_open_time: '08:00', p_close_time: '22:00',
  })
  log('Set Monday hours', e11 ? 'FAIL' : 'PASS', e11?.message)

  // Set Saturday closed
  const { error: e12 } = await supabase.rpc('update_organization_business_hours', {
    p_org_id: ORG_ID, p_weekday: 6, p_is_open: false,
    p_open_time: '09:00', p_close_time: '18:00',
  })
  log('Set Saturday closed', e12 ? 'FAIL' : 'PASS', e12?.message)

  // Invalid weekday
  const { error: e13 } = await supabase.rpc('update_organization_business_hours', {
    p_org_id: ORG_ID, p_weekday: 99, p_is_open: true,
  })
  log('Invalid weekday blocked', e13 ? 'BLOCKED' : 'FAIL', e13?.message)

  // Read hours
  const { data: hours, error: e14 } = await supabase
    .from('organization_business_hours')
    .select('*')
    .eq('organization_id', ORG_ID)
  log('Read business hours', e14 ? 'FAIL' : 'PASS', `${hours?.length || 0} entries`)

  // ========================================================
  // 5. PROFILE UPDATE
  // ========================================================
  console.log('\n5. PROFILE UPDATE')

  const { error: e15 } = await supabase.rpc('update_own_profile', {
    p_full_name: 'E2E Tester Updated',
  })
  log('Update own profile', e15 ? 'FAIL' : 'PASS', e15?.message)

  // Verify
  const { data: profile, error: e16 } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()
  log('Read own profile', e16 ? 'FAIL' : 'PASS',
    profile ? `name=${profile.full_name}` : e16?.message)

  // Restore original name
  await supabase.rpc('update_own_profile', { p_full_name: 'E2E Test User' })

  // ========================================================
  // 6. INVITE ACCEPTANCE
  // ========================================================
  console.log('\n6. INVITE ACCEPTANCE')

  // Create an invite for the current user's email
  const { data: acceptInviteId, error: e17 } = await supabase.rpc('invite_organization_member', {
    p_org_id: ORG_ID, p_email: EMAIL, p_role: 'staff',
  })
  // Might fail because user is already a member
  if (e17?.message?.includes('já é membro')) {
    log('Invite for existing member blocked', 'BLOCKED', e17.message)
  } else {
    log('Create invite for acceptance test', e17 ? 'FAIL' : 'PASS', `id=${acceptInviteId}`)

    // Invalid token
    const { error: e18 } = await supabase.rpc('accept_organization_invite', {
      p_token: 'invalid-token-123',
    })
    log('Invalid token blocked', e18 ? 'BLOCKED' : 'FAIL', e18?.message)

    // Cleanup: cancel the invite
    if (acceptInviteId) {
      await supabase.rpc('cancel_organization_invite', { p_invite_id: acceptInviteId })
    }
  }

  // ========================================================
  // 7. CROSS-TENANT PROTECTION
  // ========================================================
  console.log('\n7. CROSS-TENANT PROTECTION')

  const { data: otherMembers } = await supabase
    .from('organization_members')
    .select('id')
    .neq('organization_id', ORG_ID)
    .limit(1)
  log('Cross-tenant member isolation', (otherMembers?.length || 0) === 0 ? 'PASS' : 'FAIL',
    `got ${otherMembers?.length || 0}`)

  const { data: otherSettings } = await supabase
    .from('organization_settings')
    .select('*')
    .neq('organization_id', ORG_ID)
    .limit(1)
  log('Cross-tenant settings isolation', (otherSettings?.length || 0) === 0 ? 'PASS' : 'FAIL',
    `got ${otherSettings?.length || 0}`)

  const { data: otherHours } = await supabase
    .from('organization_business_hours')
    .select('*')
    .neq('organization_id', ORG_ID)
    .limit(1)
  log('Cross-tenant hours isolation', (otherHours?.length || 0) === 0 ? 'PASS' : 'FAIL',
    `got ${otherHours?.length || 0}`)

  const { data: otherInvites } = await supabase
    .from('organization_invites')
    .select('*')
    .neq('organization_id', ORG_ID)
    .limit(1)
  log('Cross-tenant invite isolation', (otherInvites?.length || 0) === 0 ? 'PASS' : 'FAIL',
    `got ${otherInvites?.length || 0}`)

  // ========================================================
  // 8. GRANTS + RLS
  // ========================================================
  console.log('\n8. GRANTS + RLS')

  // Anon should not access new tables
  const anonClient = createClient(URL, ANON_KEY)
  const { error: eAnon1 } = await anonClient.from('organization_settings').select('*').limit(1)
  log('Anon: organization_settings blocked', eAnon1 ? 'BLOCKED' : 'FAIL', eAnon1?.message)

  const { error: eAnon2 } = await anonClient.from('organization_invites').select('*').limit(1)
  log('Anon: organization_invites blocked', eAnon2 ? 'BLOCKED' : 'FAIL', eAnon2?.message)

  const { error: eAnon3 } = await anonClient.from('organization_business_hours').select('*').limit(1)
  log('Anon: business_hours blocked', eAnon3 ? 'BLOCKED' : 'FAIL', eAnon3?.message)

  // RPCs should not be callable by anon
  const { error: eAnon4 } = await anonClient.rpc('invite_organization_member', {
    p_org_id: ORG_ID, p_email: 'x@x.com', p_role: 'staff',
  })
  log('Anon: RPC blocked', eAnon4 ? 'BLOCKED' : 'FAIL', eAnon4?.message)

  // ========================================================
  // 9. MEMBERS LIST
  // ========================================================
  console.log('\n9. MEMBERS LIST')

  const { data: allMembers, error: e19 } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', ORG_ID)

  log('Members list', e19 ? 'FAIL' : 'PASS', `${allMembers?.length || 0} members`)

  if (allMembers && allMembers.length > 0) {
    const userIds = allMembers.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone, address')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    for (const m of allMembers) {
      const profile = profileMap.get(m.user_id)
      log(`  Member: ${profile?.full_name || 'sem perfil'} (${m.role})`, 'PASS')
    }
  }

  // ========================================================
  // SUMMARY
  // ========================================================
  console.log('\n==================================================')
  console.log('RESULTS SUMMARY')
  console.log('==================================================')
  console.log(`  ✅ PASS: ${pass}`)
  console.log(`  ❌ FAIL: ${fail}`)
  console.log(`  🛡️ BLOCKED: ${blocked}`)
  console.log(`  Total: ${pass + fail + blocked}`)

  if (fail > 0) {
    console.log('\n❌ SOME TESTS FAILED')
  } else {
    console.log('\n✅ ALL TESTS PASSED')
  }
}

main().catch(console.error)
