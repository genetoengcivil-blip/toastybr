import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase/client'

vi.mock('../../../lib/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}))
vi.mock('../../auth/context', () => ({
  useCurrentOrganization: vi.fn(() => ({ organization: { id: 'org-1' } })),
}))

import {
  useAnalyticsSalesSummary,
  useAnalyticsTopProducts,
  useAnalyticsInventory,
  useAnalyticsPaymentMethods,
} from './useAnalytics'
import { useCurrentOrganization } from '../../auth/context'

const rpc = vi.mocked(supabase.rpc)

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const filters = { startDate: '2026-01-01', endDate: '2026-01-31', timezone: 'America/Sao_Paulo' }

beforeEach(() => {
  vi.clearAllMocks()
  rpc.mockResolvedValue({ data: {}, error: null, count: 1, status: 200, statusText: 'OK', success: true })
})

describe('analytics hooks', () => {
  it('sales summary calls correct RPC with org + filters', async () => {
    renderHook(() => useAnalyticsSalesSummary(filters), { wrapper })
    await waitFor(() => expect(rpc).toHaveBeenCalled())
    expect(rpc).toHaveBeenCalledWith('analytics_sales_summary', {
      p_organization_id: 'org-1',
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-31',
      p_tz: 'America/Sao_Paulo',
    })
  })

  it('top products passes limit and org', async () => {
    renderHook(() => useAnalyticsTopProducts(filters, 7), { wrapper })
    await waitFor(() => expect(rpc).toHaveBeenCalled())
    expect(rpc).toHaveBeenCalledWith('analytics_top_products', expect.objectContaining({ p_organization_id: 'org-1', p_limit: 7 }))
  })

  it('inventory passes org and null dates', async () => {
    renderHook(() => useAnalyticsInventory(), { wrapper })
    await waitFor(() => expect(rpc).toHaveBeenCalled())
    expect(rpc).toHaveBeenCalledWith('analytics_inventory', {
      p_organization_id: 'org-1',
      p_start_date: null,
      p_end_date: null,
    })
  })

  it('surfaces rpc errors in the query', async () => {
    rpc.mockRejectedValue({
      message: 'db down',
      details: 'test details',
      hint: 'test hint',
      code: 'PGRST301',
      name: 'PostgrestError',
      toJSON: vi.fn().mockReturnValue({
        message: 'db down',
        details: 'test details',
        hint: 'test hint',
        code: 'PGRST301'
      })
    })
    const { result } = renderHook(() => useAnalyticsPaymentMethods(filters), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })

  it('does not run query when org is missing', async () => {
    vi.mocked(useCurrentOrganization).mockReturnValue({
      organization: null,
      organizations: [],
      role: null,
      loading: false,
      refresh: vi.fn()
    })
    renderHook(() => useAnalyticsPaymentMethods(filters), { wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(rpc).not.toHaveBeenCalled()
  })
})
