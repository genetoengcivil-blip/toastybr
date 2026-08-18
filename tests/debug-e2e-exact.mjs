import { createClient } from '@supabase/supabase-js'

const URL = process.env.TEST_SUPABASE_URL
const ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY
if (!URL || !ANON_KEY) {
  console.error('TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY must be set (see .env.test.example)')
  process.exit(1)
}

// Replicate EXACTLY what the E2E test does
const supabase = createClient(URL, ANON_KEY)

const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD
const ORG_ID = process.env.TEST_ORG_ID
if (!EMAIL || !PASSWORD || !ORG_ID) {
  console.error('TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ORG_ID must be set')
  process.exit(1)
}

async function main() {
  console.log('Authenticating...')
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })
  if (authErr) { console.error('Auth failed:', authErr.message); return }
  console.log(`User: ${authData.user.id}`)

  // Check tables first (like E2E test does)
  console.log('\nChecking tables...')
  const t1 = await supabase.from('organization_invites').select('*').limit(1)
  console.log('invites:', t1.error?.code, t1.error?.message?.substring(0, 100))
  const t2 = await supabase.from('organization_settings').select('*').limit(1)
  console.log('settings:', t2.error?.code, t2.error?.message?.substring(0, 100))

  // Now check RPC
  console.log('\nChecking RPC...')
  const { error: rpcErr } = await supabase.rpc('invite_organization_member', {
    p_org_id: ORG_ID,
    p_email: 'nonexistent@test.com',
    p_role: 'staff',
  })
  console.log('RPC:', rpcErr?.code, rpcErr?.message?.substring(0, 100))
}

main().catch(console.error)
