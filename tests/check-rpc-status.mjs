import { createClient } from '@supabase/supabase-js'

const URL = process.env.TEST_SUPABASE_URL
const ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY
if (!URL || !ANON_KEY) {
  console.error('TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY must be set (see .env.test.example)')
  process.exit(1)
}

const supabase = createClient(URL, ANON_KEY)

// Check which functions exist in pg_proc
async function checkFunctions() {
  const { data: funcs, error } = await supabase.rpc('is_member_of', { org_id: '00000000-0000-0000-0000-000000000000' })
  console.log('is_member_of check:', error?.message || 'exists')
  
  // Try each RPC and log exact error
  const rpcs = [
    ['invite_organization_member', { p_org_id: '00000000-0000-0000-0000-000000000000', p_email: 'x@x.com', p_role: 'staff' }],
    ['change_organization_member_role', { p_org_id: '00000000-0000-0000-0000-000000000000', p_member_id: '00000000-0000-0000-0000-000000000000', p_new_role: 'staff' }],
    ['remove_organization_member', { p_org_id: '00000000-0000-0000-0000-000000000000', p_member_id: '00000000-0000-0000-0000-000000000000' }],
    ['update_own_profile', {}],
  ]
  
  for (const [name, params] of rpcs) {
    const { data, error } = await supabase.rpc(name, params)
    console.log(`\n${name}:`)
    console.log(`  code: ${error?.code}`)
    console.log(`  message: ${error?.message}`)
    console.log(`  details: ${error?.details}`)
    console.log(`  hint: ${error?.hint}`)
    console.log(`  data: ${JSON.stringify(data)}`)
  }
}

checkFunctions().catch(console.error)
