import { createClient } from '@supabase/supabase-js'

const URL = process.env.TEST_SUPABASE_URL
const ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY
if (!URL || !ANON_KEY) {
  console.error('TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY must be set (see .env.test.example)')
  process.exit(1)
}

const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD
if (!URL || !ANON_KEY || !EMAIL || !PASSWORD) {
  console.error('TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD must be set')
  process.exit(1)
}

async function main() {
  // Test 1: Unauthenticated client
  const unauth = createClient(URL, ANON_KEY)
  const { error: e1 } = await unauth.rpc('invite_organization_member', {
    p_org_id: '00000000-0000-0000-0000-000000000000',
    p_email: 'x@x.com',
    p_role: 'staff'
  })
  console.log('UNAUTH:', e1?.code, e1?.message?.substring(0, 80))

  // Test 2: Fresh authenticated client
  const fresh = createClient(URL, ANON_KEY)
  const { error: authErr } = await fresh.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (authErr) { console.log('Auth failed:', authErr.message); return }
  console.log('Auth OK, user:', fresh.auth.getUser)

  const { error: e2 } = await fresh.rpc('invite_organization_member', {
    p_org_id: '00000000-0000-0000-0000-000000000000',
    p_email: 'x@x.com',
    p_role: 'staff'
  })
  console.log('AUTH FRESH:', e2?.code, e2?.message?.substring(0, 80))

  // Test 3: Authenticated client, test from() on new table
  const { data: settings, error: e3 } = await fresh.from('organization_settings').select('*').limit(1)
  console.log('SETTINGS:', e3?.code, e3?.message?.substring(0, 80), 'data:', settings?.length)
}

main().catch(console.error)
