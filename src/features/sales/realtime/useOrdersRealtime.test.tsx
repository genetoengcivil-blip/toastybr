import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../../test/mocks/supabase'
import { createTestQueryClient } from '../../../test/test-utils'

let clientRef: MockSupabaseClient

vi.mock('../../../lib/supabase/client', () => ({
  get supabase() {
    return clientRef
  },
}))

import { useOrdersRealtime } from './useOrdersRealtime'

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const ORDERS_KEY = `postgres_changes:sales_orders`

describe('useOrdersRealtime (items 42-48)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    clientRef = createMockSupabaseClient()
    queryClient = createTestQueryClient()
  })

  it('subscribes to sales_orders for the organization with a deterministic channel name', () => {
    renderHook(() => useOrdersRealtime('org-1'), { wrapper: makeWrapper(queryClient) })

    expect(clientRef.channel).toHaveBeenCalledWith('orders:org-1')
    const channel = clientRef.channel('orders:org-1') as any
    expect(channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'sales_orders',
        filter: 'organization_id=eq.org-1',
      }),
      expect.any(Function)
    )
    expect(channel.subscribe).toHaveBeenCalled()
  })

  it('invalidates orders + kitchen cache on INSERT event (item 45)', () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    renderHook(() => useOrdersRealtime('org-1'), { wrapper: makeWrapper(queryClient) })

    act(() => {
      ;(clientRef.channel('orders:org-1') as any)._emit('postgres_changes', 'sales_orders', {
        eventType: 'INSERT',
        new: { id: 'x' },
      })
    })

    expect(spy).toHaveBeenCalledWith({ queryKey: ['sales-orders', 'org-1'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['sales-order'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['kitchen-orders', 'org-1'] })
  })

  it('invalidates the same cache on UPDATE event', () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    renderHook(() => useOrdersRealtime('org-1'), { wrapper: makeWrapper(queryClient) })

    act(() => {
      ;(clientRef.channel('orders:org-1') as any)._emit('postgres_changes', 'sales_orders', {
        eventType: 'UPDATE',
        new: { id: 'x', status: 'confirmed' },
      })
    })

    expect(spy).toHaveBeenCalledWith({ queryKey: ['kitchen-orders', 'org-1'] })
  })

  it('removes the channel exactly once on unmount (item 46)', () => {
    const { unmount } = renderHook(() => useOrdersRealtime('org-1'), {
      wrapper: makeWrapper(queryClient),
    })

    unmount()

    expect(clientRef.removeChannel).toHaveBeenCalledTimes(1)
  })

  it('switches channel when organization changes (item 47)', () => {
    const { rerender } = renderHook(({ org }) => useOrdersRealtime(org), {
      wrapper: makeWrapper(queryClient),
      initialProps: { org: 'org-A' },
    })

    rerender({ org: 'org-B' })

    expect(clientRef.channel).toHaveBeenCalledWith('orders:org-A')
    expect(clientRef.channel).toHaveBeenCalledWith('orders:org-B')
    expect(clientRef.removeChannel).toHaveBeenCalledTimes(1)
  })

  it('does not create a duplicate subscription on rerender of same org (item 48)', () => {
    const { rerender } = renderHook(() => useOrdersRealtime('org-1'), {
      wrapper: makeWrapper(queryClient),
    })

    rerender()

    expect(clientRef.channel).toHaveBeenCalledTimes(1)
  })

  it('exposes error status on CHANNEL_ERROR (item 26)', () => {
    clientRef.channel('orders:org-1')['_setStatus']('CHANNEL_ERROR')
    const { result } = renderHook(() => useOrdersRealtime('org-1'), {
      wrapper: makeWrapper(queryClient),
    })

    expect(result.current.status).toBe('error')
  })

  it('reports subscribed status on success', () => {
    const { result } = renderHook(() => useOrdersRealtime('org-1'), {
      wrapper: makeWrapper(queryClient),
    })

    expect(result.current.status).toBe('subscribed')
  })
})

describe('useOrdersRealtime integration with kitchen query (item 49)', () => {
  it('a new order event refreshes the kitchen query so the order appears', async () => {
    let serverOrders: any[] = []
    const queryClient = createTestQueryClient()

    function Harness() {
      const query = useQuery({
        queryKey: ['kitchen-orders', 'org-1'],
        queryFn: async () => serverOrders,
      })
      useOrdersRealtime('org-1', { channelPrefix: 'kitchen' })
      return query.data
    }

    const { result } = renderHook(() => Harness(), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(result.current).toEqual([]))

    serverOrders = [{ id: 'new-1', order_number: 'PED-1' }]
    act(() => {
      ;(clientRef.channel('kitchen:org-1') as any)._emit('postgres_changes', 'sales_orders', {
        eventType: 'INSERT',
        new: { id: 'new-1' },
      })
    })

    await waitFor(() =>
      expect(result.current).toEqual([{ id: 'new-1', order_number: 'PED-1' }])
    )
  })
})
