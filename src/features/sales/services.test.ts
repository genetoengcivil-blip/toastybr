import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../test/mocks/supabase'

vi.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../lib/supabase/client'
import {
  generateOrderNumber,
  updateOrderStatus,
  finalizeSalesOrder,
  cancelSalesOrder,
  getSalesOrders,
} from '../../features/sales/services'

const mockSupabase = supabase as unknown as MockSupabaseClient

describe('Sales Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateOrderNumber', () => {
    it('calls RPC with correct org_id', async () => {
      mockSupabase._setRpcResponse({ data: 'ORD-000001', error: null })

      const result = await generateOrderNumber('org1')

      expect(supabase.rpc).toHaveBeenCalledWith('generate_order_number', {
        p_org_id: 'org1',
      })
      expect(result).toBe('ORD-000001')
    })
  })

  describe('updateOrderStatus', () => {
    it('calls RPC with correct params', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await updateOrderStatus('order1', 'confirmed')

      expect(supabase.rpc).toHaveBeenCalledWith('update_order_status', {
        p_order_id: 'order1',
        p_new_status: 'confirmed',
      })
      expect(result).toBe(true)
    })

    it('throws on invalid status transition', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Transição inválida' } })

      await expect(updateOrderStatus('order1', 'completed')).rejects.toThrow('Transição inválida')
    })
  })

  describe('finalizeSalesOrder', () => {
    it('calls RPC with all required params', async () => {
      mockSupabase._setRpcResponse({ data: { order_number: 'ORD-000001', total: 100, change: 0, points_earned: 10 }, error: null })

      const result = await finalizeSalesOrder('order1', {
        p_customer_id: 'cust1',
        p_coupon_id: undefined,
        p_coupon_code: undefined,
        p_coupon_discount: 0,
        p_discount: 0,
        p_service_fee: 0,
        p_delivery_fee: 0,
      })

      expect(supabase.rpc).toHaveBeenCalledWith('finalize_sales_order', {
        p_order_id: 'order1',
        p_customer_id: 'cust1',
        p_coupon_id: undefined,
        p_coupon_code: undefined,
        p_coupon_discount: 0,
        p_discount: 0,
        p_service_fee: 0,
        p_delivery_fee: 0,
      })
      expect(result.order_number).toBe('ORD-000001')
    })

    it('throws on insufficient payment', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Pagamentos insuficientes' } })

      await expect(finalizeSalesOrder('order1', {
        p_customer_id: undefined,
        p_coupon_id: undefined,
        p_coupon_code: undefined,
        p_coupon_discount: 0,
        p_discount: 0,
        p_service_fee: 0,
        p_delivery_fee: 0,
      })).rejects.toThrow('Pagamentos insuficientes')
    })
  })

  describe('cancelSalesOrder', () => {
    it('calls RPC with reason', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await cancelSalesOrder('order1', 'Cliente cancelou')

      expect(supabase.rpc).toHaveBeenCalledWith('cancel_sales_order', {
        p_order_id: 'order1',
        p_reason: 'Cliente cancelou',
      })
      expect(result).toBe(true)
    })

    it('throws on completed order', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Pedido já completed — não pode cancelar' } })

      await expect(cancelSalesOrder('order1', 'Teste')).rejects.toThrow('Pedido já completed')
    })
  })

  describe('getSalesOrders', () => {
    it('fetches orders with correct organization', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', order_number: 'ORD-000001', status: 'completed', total: 100, created_at: '2026-01-01' },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getSalesOrders('org1')

      expect(supabase.from).toHaveBeenCalledWith('sales_orders')
      expect(result).toEqual(mockData)
    })
  })
})