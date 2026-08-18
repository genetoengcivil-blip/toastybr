import { supabase } from '../../lib/supabase/client'
import type { InventoryBalance, InventoryMovement, InventoryMovementType } from '../../lib/supabase/types'

export interface InventoryBalanceWithIngredient extends InventoryBalance {
  ingredients: {
    id: string
    name: string
    unit: string
    cost_per_unit: number
    is_active: boolean
  }
}

export interface InventoryMovementWithIngredient extends InventoryMovement {
  ingredients: {
    id: string
    name: string
    unit: string
    cost_per_unit: number
    is_active: boolean
  }
}

export async function getInventoryBalances(orgId: string): Promise<InventoryBalanceWithIngredient[]> {
  const { data, error } = await supabase
    .from('inventory_balances')
    .select('*, ingredients:ingredient_id(id, name, unit, cost_per_unit, is_active)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as InventoryBalanceWithIngredient[]
}

export async function getInventoryMovements(orgId: string): Promise<InventoryMovementWithIngredient[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, ingredients:ingredient_id(id, name, unit, cost_per_unit, is_active)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as InventoryMovementWithIngredient[]
}

export async function applyInventoryMovement(params: {
  organization_id: string
  ingredient_id: string
  type: InventoryMovementType
  quantity: number
  reason?: string | null
}): Promise<boolean> {
  const { data, error } = await supabase.rpc('apply_inventory_movement', {
    p_org_id: params.organization_id,
    p_ingredient_id: params.ingredient_id,
    p_type: params.type,
    p_quantity: params.quantity,
    p_reason: params.reason,
  })

  if (error) throw error
  return data as boolean
}

export async function updateMinimumQuantity(
  orgId: string,
  ingredientId: string,
  minimumQuantity: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_minimum_quantity', {
    p_org_id: orgId,
    p_ingredient_id: ingredientId,
    p_minimum_quantity: minimumQuantity,
  })

  if (error) throw error
  return data as boolean
}