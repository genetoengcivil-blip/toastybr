import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../../test/mocks/supabase'
import { OrganizationContext } from '../../auth/context'
import type { OrganizationContextValue } from '../../auth/context'

vi.mock('../../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../../lib/supabase/client'
import { useSalesOrders, useFinalizeSalesOrder, useCancelSalesOrder } from './useSalesOrders'

const mockSupabase = supabase as unknown as MockSupabaseClient

function makeWrapper(orgId: string | null = 'org-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const org: OrganizationContextValue = {
    organization: orgId ? ({ id: orgId } as any) : null,
    organizations: [],
    role: 'owner',
    loading: false,
    refresh: vi.fn(),
  }
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <OrganizationContext.Provider value={org}>{children}</OrganizationContext.Provider>
      </QueryClientProvider>
    )
  }
}

describe('Sales Hooks (item 20)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useSalesOrders fetches per org and is idle without org', async () => {
    mockSupabase._setFromResponse({ data: [{ id: 'so1', status: 'open' }], error: null })
    const { result } = renderHook(() => useSalesOrders('open'), { wrapper: makeWrapper('org-1') })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(supabase.from).toHaveBeenCalledWith('sales_orders')

    const { result: noOrg } = renderHook(() => useSalesOrders('open'), { wrapper: makeWrapper(null) })
    expect(noOrg.current.fetchStatus).toBe('idle')
  })

  it('useFinalizeSalesOrder invokes finalize rpc', async () => {
    mockSupabase._setRpcResponse({ data: { success: true }, error: null })
    const { result } = renderHook(() => useFinalizeSalesOrder(), { wrapper: makeWrapper('org-1') })

    await act(async () => {
      await result.current.mutateAsync({ order_id: 'so1' } as any)
    })

    expect(supabase.rpc).toHaveBeenCalledWith('finalize_sales_order', expect.objectContaining({ p_order_id: 'so1' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useCancelSalesOrder invokes cancel rpc', async () => {
    mockSupabase._setRpcResponse({ data: { success: true }, error: null })
    const { result } = renderHook(() => useCancelSalesOrder(), { wrapper: makeWrapper('org-1') })

    await act(async () => {
      await result.current.mutateAsync({ orderId: 'so1', reason: 'x' })
    })

    expect(supabase.rpc).toHaveBeenCalledWith('cancel_sales_order', expect.objectContaining({ p_order_id: 'so1' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
