import { supabase } from '../../../lib/supabase/client'
import type { InventoryMovementWithIngredient } from '../../../lib/supabase/types'

export async function getInventoryMovements(
  organizationId: string
): Promise<InventoryMovementWithIngredient[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, ingredients(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as InventoryMovementWithIngredient[]
}

export async function applyInventoryMovement(params: {
  ingredient_id: string
  type: string
  quantity: number
  reason?: string | null
}): Promise<string> {
  const { data, error } = await supabase.rpc('apply_inventory_movement', {
    p_ingredient_id: params.ingredient_id,
    p_type: params.type,
    p_quantity: params.quantity,
    p_reason: params.reason ?? null,
  })

  if (error) throw error
  return data as string
}

export async function updateMinimumQuantity(
  ingredientId: string,
  minimumQuantity: number
): Promise<void> {
  const { error } = await supabase.rpc('update_minimum_quantity', {
    p_ingredient_id: ingredientId,
    p_minimum_quantity: minimumQuantity,
  })

  if (error) throw error
}
