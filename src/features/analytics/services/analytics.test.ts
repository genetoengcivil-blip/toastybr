import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../../../lib/supabase/client'
import * as svc from './analytics'

vi.mock('../../../lib/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}))

const rpc = vi.mocked(supabase.rpc)

beforeEach(() => {
  vi.clearAllMocks()
  rpc.mockResolvedValue({ data: { ok: true }, error: null, count: 1, status: 200, statusText: 'OK', success: true })
})

describe('analytics services — RPC names & payloads', () => {
  it('dashboard passes org + tz', async () => {
    await svc.getDashboard('org-1', 'America/Sao_Paulo')
    expect(rpc).toHaveBeenCalledWith('analytics_dashboard', {
      p_organization_id: 'org-1',
      p_tz: 'America/Sao_Paulo',
    })
  })

  it('sales summary passes org/start/end/tz', async () => {
    await svc.getSalesSummary('org-1', '2026-01-01', '2026-01-31', 'America/Sao_Paulo')
    expect(rpc).toHaveBeenCalledWith('analytics_sales_summary', {
      p_organization_id: 'org-1',
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-31',
      p_tz: 'America/Sao_Paulo',
    })
  })

  it('top products passes limit', async () => {
    await svc.getTopProducts('org-1', '2026-01-01', '2026-01-31', 'America/Sao_Paulo', 7)
    expect(rpc).toHaveBeenCalledWith('analytics_top_products', expect.objectContaining({ p_limit: 7 }))
  })

  it('inventory sends nulls when no range', async () => {
    await svc.getInventory('org-1')
    expect(rpc).toHaveBeenCalledWith('analytics_inventory', {
      p_organization_id: 'org-1',
      p_start_date: null,
      p_end_date: null,
    })
  })

  it('inventory sends dates when provided', async () => {
    await svc.getInventory('org-1', '2026-01-01', '2026-01-31')
    expect(rpc).toHaveBeenCalledWith('analytics_inventory', {
      p_organization_id: 'org-1',
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-31',
    })
  })

  it('cash flow passes interval', async () => {
    await svc.getCashFlow('org-1', '2026-01-01', '2026-01-31', 'America/Sao_Paulo', 'month')
    expect(rpc).toHaveBeenCalledWith('analytics_cash_flow', expect.objectContaining({ p_interval: 'month' }))
  })

  it('aging passes null asof by default', async () => {
    await svc.getAPAging('org-1')
    expect(rpc).toHaveBeenCalledWith('analytics_ap_aging', { p_organization_id: 'org-1', p_asof: null })
  })
})

describe('analytics services — error handling', () => {
  it('throws when rpc returns error', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: 'boom',
        details: 'test details',
        hint: 'test hint',
        code: 'PGRST301',
        name: 'PostgrestError',
        toJSON: vi.fn().mockReturnValue({
          message: 'boom',
          details: 'test details',
          hint: 'test hint',
          code: 'PGRST301'
        })
      },
      success: false,
      count: null,
      status: 400,
      statusText: 'Bad Request'
    })
    await expect(svc.getDashboard('org-1', 'America/Sao_Paulo')).rejects.toBeTruthy()
  })
})
