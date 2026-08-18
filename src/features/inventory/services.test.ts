import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../test/mocks/supabase'

vi.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../lib/supabase/client'
import {
  getInventoryBalances,
  getInventoryMovements,
  applyInventoryMovement,
  updateMinimumQuantity,
} from '../../features/inventory/services'

const mockSupabase = supabase as unknown as MockSupabaseClient

describe('Inventory Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInventoryBalances', () => {
    it('calls supabase with correct params', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', ingredient_id: 'ing1', quantity: 100, minimum_quantity: 10, updated_at: '2026-01-01', ingredients: { id: 'ing1', name: 'Pão', unit: 'un', cost_per_unit: 1.5, is_active: true } },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getInventoryBalances('org1')

      expect(supabase.from).toHaveBeenCalledWith('inventory_balances')
      expect(result).toEqual(mockData)
    })

    it('throws on error', async () => {
      mockSupabase._setFromResponse({ data: null, error: { message: 'Failed to fetch', code: 'PGRST116' } })

      await expect(getInventoryBalances('org1')).rejects.toThrow('Failed to fetch')
    })
  })

  describe('getInventoryMovements', () => {
    it('calls supabase with correct params and order', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', ingredient_id: 'ing1', type: 'entry', quantity: 10, reason: 'Compra', created_at: '2026-01-01', ingredients: { name: 'Pão' } },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getInventoryMovements('org1')

      expect(supabase.from).toHaveBeenCalledWith('inventory_movements')
      expect(result).toEqual(mockData)
    })
  })

  describe('applyInventoryMovement', () => {
    it('calls rpc with correct params', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await applyInventoryMovement({
        organization_id: 'org1',
        ingredient_id: 'ing1',
        type: 'entry',
        quantity: 10,
        reason: 'Compra',
      })

      expect(supabase.rpc).toHaveBeenCalledWith('apply_inventory_movement', {
        p_org_id: 'org1',
        p_ingredient_id: 'ing1',
        p_type: 'entry',
        p_quantity: 10,
        p_reason: 'Compra',
      })
      expect(result).toBe(true)
    })

    it('throws on error', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Saldo insuficiente' } })

      await expect(applyInventoryMovement({
        organization_id: 'org1',
        ingredient_id: 'ing1',
        type: 'exit',
        quantity: 100,
        reason: 'Venda',
      })).rejects.toThrow('Saldo insuficiente')
    })
  })

  describe('updateMinimumQuantity', () => {
    it('calls rpc with correct params', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await updateMinimumQuantity('org1', 'ing1', 20)

      expect(supabase.rpc).toHaveBeenCalledWith('update_minimum_quantity', {
        p_org_id: 'org1',
        p_ingredient_id: 'ing1',
        p_minimum_quantity: 20,
      })
      expect(result).toBe(true)
    })
  })
})