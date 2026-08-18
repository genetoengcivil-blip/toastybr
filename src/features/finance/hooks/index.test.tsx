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
import {
  useFinancialCategories,
  usePayAccountPayable,
  useFinanceOverview,
} from './index'

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

describe('Finance Hooks (item 18)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useFinancialCategories fetches with org id and is disabled without org', async () => {
    mockSupabase._setFromResponse({ data: [{ id: 'c1', name: 'Cat', type: 'expense' }], error: null })

    const { result } = renderHook(() => useFinancialCategories('expense'), {
      wrapper: makeWrapper('org-1'),
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(supabase.from).toHaveBeenCalledWith('financial_categories')

    const { result: noOrg } = renderHook(() => useFinancialCategories('expense'), {
      wrapper: makeWrapper(null),
    })
    expect(noOrg.current.isLoading).toBe(false)
    expect(noOrg.current.fetchStatus).toBe('idle')
  })

  it('useFinanceOverview fetches overview per org', async () => {
    mockSupabase._setRpcResponse({ data: { total_payables: 10, total_receivables: 20 }, error: null })
    const { result } = renderHook(() => useFinanceOverview(), { wrapper: makeWrapper('org-1') })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toMatchObject({ total_payables: 10 })
  })

  it('usePayAccountPayable calls rpc and resolves', async () => {
    mockSupabase._setRpcResponse({ data: { success: true, status: 'paid' }, error: null })
    const { result } = renderHook(() => usePayAccountPayable(), { wrapper: makeWrapper('org-1') })

    await act(async () => {
      await result.current.mutateAsync({ apId: 'ap-1', amount: 50 })
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'pay_account_payable',
      expect.objectContaining({ p_ap_id: 'ap-1', p_amount: 50 })
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
