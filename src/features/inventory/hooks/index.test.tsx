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
import { useInventoryBalances } from './useInventoryBalances'
import { useApplyMovement, useUpdateMinimumQuantity } from './useInventoryMovements'

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

describe('Inventory Hooks (item 19)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useInventoryBalances fetches per org', async () => {
    mockSupabase._setFromResponse({ data: [{ ingredient_id: 'i1', quantity: 5 }], error: null })
    const { result } = renderHook(() => useInventoryBalances(), { wrapper: makeWrapper('org-1') })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(supabase.from).toHaveBeenCalledWith('inventory_balances')
  })

  it('useApplyMovement invokes movement service', async () => {
    mockSupabase._setRpcResponse({ data: 'movement-id', error: null })
    const { result } = renderHook(() => useApplyMovement(), { wrapper: makeWrapper('org-1') })

    await act(async () => {
      await result.current.mutateAsync({
        ingredient_id: 'i1',
        type: 'entry',
        quantity: 3,
        reason: 'test',
      } as any)
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'apply_inventory_movement',
      expect.objectContaining({ p_ingredient_id: 'i1', p_quantity: 3 })
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useUpdateMinimumQuantity invokes service', async () => {
    mockSupabase._setRpcResponse({ data: null, error: null })
    const { result } = renderHook(() => useUpdateMinimumQuantity(), { wrapper: makeWrapper('org-1') })

    await act(async () => {
      await result.current.mutateAsync({ ingredientId: 'i1', minimum: 2 })
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'update_minimum_quantity',
      expect.objectContaining({ p_ingredient_id: 'i1', p_minimum_quantity: 2 })
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
