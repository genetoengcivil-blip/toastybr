import { createClient } from '@supabase/supabase-js'

// Phase 14 optional Realtime E2E.
// Runs ONLY with TEST_* env configured against an isolated test project.
// Never runs in CI without secrets. Aborts clearly when unconfigured.

const URL = process.env.TEST_SUPABASE_URL
const ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY
const ORG_ID = process.env.TEST_ORG_ID
const USER_EMAIL = process.env.TEST_USER_EMAIL
const USER_PASSWORD = process.env.TEST_USER_PASSWORD

if (!URL || !ANON_KEY || !ORG_ID || !USER_EMAIL || !USER_PASSWORD) {
  console.error('Missing TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY / TEST_ORG_ID / TEST_USER_EMAIL / TEST_USER_PASSWORD')
  process.exit(1)
}

const TIMEOUT_MS = 15000

async function main() {
  const clientA = createClient(URL, ANON_KEY)
  const clientB = createClient(URL, ANON_KEY)

  const { error: signErrA } = await clientA.auth.signInWithPassword({ email: USER_EMAIL, password: USER_PASSWORD })
  if (signErrA) throw signErrA
  const { error: signErrB } = await clientB.auth.signInWithPassword({ email: USER_EMAIL, password: USER_PASSWORD })
  if (signErrB) throw signErrB

  // Pick an order to mutate.
  const { data: orders, error: ordErr } = await clientB
    .from('sales_orders')
    .select('id, status')
    .eq('organization_id', ORG_ID)
    .in('status', ['open', 'confirmed', 'preparing'])
    .limit(1)
  if (ordErr) throw ordErr
  if (!orders || orders.length === 0) {
    console.error('No suitable order found for realtime E2E (need an order in open/confirmed/preparing)')
    process.exit(1)
  }
  const orderId = orders[0].id
  const originalStatus = orders[0].status
  const toggle = originalStatus === 'preparing' ? 'confirmed' : 'preparing'

  const received = new Promise((resolve, reject) => {
    const channel = clientA
      .channel(`orders:e2e-${ORG_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_orders',
          filter: `organization_id=eq.${ORG_ID}`,
        },
        (payload) => {
          if (payload?.new?.id === orderId) resolve(payload)
        }
      )
      .subscribe()

    setTimeout(() => {
      clientA.removeChannel(channel)
      reject(new Error('timeout waiting for realtime event'))
    }, TIMEOUT_MS)
  })

  // Mutate via the server-authoritative RPC (no direct table update).
  const { error: updErr } = await clientB.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: toggle,
  })
  if (updErr) throw updErr

  const payload = await received
  console.log('Realtime event received by client A:', payload.eventType, payload.new?.status)

  // Restore original status.
  await clientB.rpc('update_order_status', { p_order_id: orderId, p_new_status: originalStatus })
  await clientA.auth.signOut()
  await clientB.auth.signOut()
  process.exit(0)
}

main().catch((e) => {
  console.error('Realtime E2E FAILED:', e.message)
  process.exit(1)
})
