import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../test/mocks/supabase'
import type { AccountPayableStatus, AccountReceivableStatus } from '../../lib/supabase/types'

vi.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../lib/supabase/client'
import {
  getAccountsPayable,
  getAccountsReceivable,
  payAccountPayable,
  receiveAccountReceivable,
  cancelAccountPayable,
  cancelAccountReceivable,
  createManualTransaction,
  reverseFinancialTransaction,
  getFinanceOverview,
} from '../../features/finance/services'

const mockSupabase = supabase as unknown as MockSupabaseClient

describe('Finance Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAccountsPayable', () => {
    it('fetches AP with organization scope', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', description: 'Fornecedor A', amount: 1000, due_date: '2026-09-15', status: 'pending' as AccountPayableStatus, paid_amount: 0, category_id: 'cat1', cost_center_id: 'cc1', created_at: '2026-01-01' },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getAccountsPayable('org1')

      expect(supabase.from).toHaveBeenCalledWith('accounts_payable')
      expect(result).toEqual(mockData)
    })

    it('filters by status when provided', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', description: 'Conta A', amount: 500, due_date: '2026-09-15', status: 'pending' as AccountPayableStatus, paid_amount: 0, category_id: null, cost_center_id: null, created_at: '2026-01-01' },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getAccountsPayable('org1', 'pending')

      expect(supabase.from).toHaveBeenCalledWith('accounts_payable')
      expect(result).toEqual(mockData)
    })
  })

  describe('getAccountsReceivable', () => {
    it('fetches AR with organization scope', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', description: 'Cliente A', amount: 500, due_date: '2026-09-30', status: 'pending' as AccountReceivableStatus, received_amount: 0, category_id: 'cat1', cost_center_id: 'cc1', created_at: '2026-01-01' },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getAccountsReceivable('org1')

      expect(supabase.from).toHaveBeenCalledWith('accounts_receivable')
      expect(result).toEqual(mockData)
    })
  })

  describe('payAccountPayable', () => {
    it('calls RPC with positional args', async () => {
      mockSupabase._setRpcResponse({ data: { success: true, paid_amount: 500, status: 'partially_paid' }, error: null })

      const result = await payAccountPayable('ap1', 500, 'cat1', 'cc1', 'Pagamento parcial')

      expect(supabase.rpc).toHaveBeenCalledWith('pay_account_payable', {
        p_ap_id: 'ap1',
        p_amount: 500,
        p_category_id: 'cat1',
        p_cost_center_id: 'cc1',
        p_notes: 'Pagamento parcial',
      })
      expect(result.paid_amount).toBe(500)
    })

    it('throws on overpayment', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Conta já paid' } })

      await expect(payAccountPayable('paid-ap', 100)).rejects.toThrow('Conta já paid')
    })
  })

  describe('receiveAccountReceivable', () => {
    it('calls RPC with positional args', async () => {
      mockSupabase._setRpcResponse({ data: { success: true, received_amount: 250, status: 'partially_received' }, error: null })

      const result = await receiveAccountReceivable('ar1', 250, 'cat1', 'cc1', 'Recebimento parcial')

      expect(supabase.rpc).toHaveBeenCalledWith('receive_account_receivable', {
        p_ar_id: 'ar1',
        p_amount: 250,
        p_category_id: 'cat1',
        p_cost_center_id: 'cc1',
        p_notes: 'Recebimento parcial',
      })
      expect(result.received_amount).toBe(250)
    })
  })

  describe('cancelAccountPayable', () => {
    it('calls RPC with org_id, ap_id, and reason', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await cancelAccountPayable('org1', 'ap1', 'Fornecedor cancelou pedido')

      expect(supabase.rpc).toHaveBeenCalledWith('cancel_account_payable', {
        p_ap_id: 'ap1',
        p_reason: 'Fornecedor cancelou pedido',
      })
      expect(result).toBe(true)
    })

    it('throws on partially paid AP', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Conta com pagamento parcial não pode ser cancelada diretamente. Use estorno financeiro.' } })

      await expect(cancelAccountPayable('org1', 'partial-ap', 'Teste'))
        .rejects.toThrow('pagamento parcial')
    })
  })

  describe('cancelAccountReceivable', () => {
    it('calls RPC with org_id, ar_id, and reason', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await cancelAccountReceivable('org1', 'ar1', 'Cliente cancelou')

      expect(supabase.rpc).toHaveBeenCalledWith('cancel_account_receivable', {
        p_ar_id: 'ar1',
        p_reason: 'Cliente cancelou',
      })
      expect(result).toBe(true)
    })
  })

  describe('createManualTransaction', () => {
    it('calls RPC with correct params', async () => {
      mockSupabase._setRpcResponse({ data: { success: true, id: 'tx-id' }, error: null })

      const result = await createManualTransaction('org1', {
        direction: 'in',
        amount: 500,
        description: 'Entrada diversa',
        category_id: 'cat1',
        cost_center_id: 'cc1',
        occurred_at: '2026-08-17T10:00:00Z',
      })

      expect(supabase.rpc).toHaveBeenCalledWith('create_manual_financial_transaction', {
        p_org_id: 'org1',
        p_direction: 'in',
        p_amount: 500,
        p_description: 'Entrada diversa',
        p_category_id: 'cat1',
        p_cost_center_id: 'cc1',
        p_occurred_at: '2026-08-17T10:00:00Z',
      })
      expect(result.id).toBe('tx-id')
    })
  })

  describe('reverseFinancialTransaction', () => {
    it('calls RPC with correct params', async () => {
      mockSupabase._setRpcResponse({ data: 'rev-id', error: null })

      const result = await reverseFinancialTransaction('tx-original', 'Estorno de entrada indevida')

      expect(supabase.rpc).toHaveBeenCalledWith('reverse_financial_transaction', {
        p_original_id: 'tx-original',
        p_description: 'Estorno de entrada indevida',
      })
      expect(result).toBe('rev-id')
    })

    it('throws on double reversal', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Já existe estorno para esta transação' } })

      await expect(reverseFinancialTransaction('tx-original', 'Tentativa 2'))
        .rejects.toThrow('Já existe estorno')
    })
  })

  describe('getFinanceOverview', () => {
    it('calls RPC with organization', async () => {
      const mockData = { today_in: 1000, today_out: 500, month_in: 50000, month_out: 30000, open_payables: 5, open_receivables: 3, overdue_payables: 1, overdue_receivables: 0 }
      mockSupabase._setRpcResponse({ data: mockData, error: null })

      const result = await getFinanceOverview('org1')

      expect(supabase.rpc).toHaveBeenCalledWith('finance_overview', { p_org_id: 'org1' })
      expect(result).toEqual(mockData)
    })
  })
})
