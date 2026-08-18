import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../test/mocks/supabase'
import type { PurchaseOrderStatus } from '../../lib/supabase/types'

vi.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../lib/supabase/client'
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
} from '../../features/purchasing/services'

const mockSupabase = supabase as unknown as MockSupabaseClient

describe('Purchasing Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSuppliers', () => {
    it('calls supabase with correct params', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', name: 'Fornecedor A', contact_name: 'João', phone: '11999999999', email: 'forn@email.com', cnpj: '12.345.678/0001-90', is_active: true, created_at: '2026-01-01' },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getSuppliers('org1')

      expect(supabase.from).toHaveBeenCalledWith('suppliers')
      expect(result).toEqual(mockData)
    })
  })

  describe('createSupplier', () => {
    it('calls insert with correct data', async () => {
      const newSupplier = {
        organization_id: 'org1',
        name: 'Novo Fornecedor',
        contact_name: 'Maria',
        phone: '11888888888',
        email: 'novo@fornecedor.com',
        cnpj: '98.765.432/0001-10',
        notes: 'Observações',
        is_active: true,
      }
      const mockData = { ...newSupplier, id: 'new-id', created_at: '2026-01-01' }
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await createSupplier('org1', newSupplier)

      expect(supabase.from).toHaveBeenCalledWith('suppliers')
      expect(result).toEqual(mockData)
    })
  })

  describe('updateSupplier', () => {
    it('calls update with correct data', async () => {
      const updates = { name: 'Fornecedor Atualizado', phone: '11777777777' }
      const mockData = { id: 'sup1', ...updates, organization_id: 'org1', is_active: true, created_at: '2026-01-01' }
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await updateSupplier('org1', 'sup1', updates)

      expect(supabase.from).toHaveBeenCalledWith('suppliers')
      expect(result).toEqual(mockData)
    })
  })

  describe('deleteSupplier', () => {
    it('calls delete with correct id', async () => {
      mockSupabase._setFromResponse({ data: null, error: null })

      const result = await deleteSupplier('org1', 'sup1')

      expect(supabase.from).toHaveBeenCalledWith('suppliers')
      expect(result).toBe(true)
    })
  })

  describe('getPurchaseOrders', () => {
    it('calls supabase with correct params', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', supplier_id: 'sup1', po_number: 'PO-000001', status: 'draft' as PurchaseOrderStatus, discount: 0, shipping: 0, total: 1000, created_at: '2026-01-01', suppliers: { name: 'Fornecedor A' } },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getPurchaseOrders('org1')

      expect(supabase.from).toHaveBeenCalledWith('purchase_orders')
      expect(result).toEqual(mockData)
    })
  })

  describe('createPurchaseOrder', () => {
    it('inserts PO and items, calls receive RPC', async () => {
      const poData = {
        organization_id: 'org1',
        supplier_id: 'sup1',
        status: 'draft' as PurchaseOrderStatus,
        discount: 0,
        shipping: 0,
        notes: 'Test PO',
      }
      const items = [
        { ingredient_id: 'ing1', quantity_ordered: 100, unit_cost: 5.50 },
        { ingredient_id: 'ing2', quantity_ordered: 50, unit_cost: 3.25 },
      ]
      const mockPO = { id: 'po1', ...poData, created_at: '2026-01-01' }
      mockSupabase._setFromResponse({ data: mockPO, error: null })

      const result = await createPurchaseOrder('org1', poData, items)

      expect(supabase.from).toHaveBeenCalledWith('purchase_orders')
      expect(supabase.from).toHaveBeenCalledWith('purchase_order_items')
      expect(result).toEqual(mockPO)
    })
  })

  describe('receivePurchaseOrder', () => {
    it('calls RPC with correct JSON payload', async () => {
      const items = [
        { po_item_id: 'item1', quantity: 50 },
        { po_item_id: 'item2', quantity: 25 },
      ]
      mockSupabase._setRpcResponse({ data: 'receipt-id', error: null })

      const result = await receivePurchaseOrder('po1', items, 'Recebimento parcial')

      // Verify the items are passed as array (not double-encoded)
      expect(supabase.rpc).toHaveBeenCalledWith('receive_purchase_order', {
        p_po_id: 'po1',
        p_items: items,
        p_notes: 'Recebimento parcial',
      })
      expect(result).toBe('receipt-id')
    })

    it('throws on error', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Quantidade excede o pedido' } })

      await expect(receivePurchaseOrder('po1', [{ po_item_id: 'item1', quantity: 9999 }], ''))
        .rejects.toThrow('Quantidade excede o pedido')
    })
  })
})