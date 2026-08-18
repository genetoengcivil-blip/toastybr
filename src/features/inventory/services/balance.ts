import { supabase } from '../../../lib/supabase/client'
import type { InventoryBalanceWithIngredient } from '../../../lib/supabase/types'

export async function getInventoryBalances(
  organizationId: string
): Promise<InventoryBalanceWithIngredient[]> {
  const { data, error } = await supabase
    .from('inventory_balances')
    .select('*, ingredients(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as InventoryBalanceWithIngredient[]
}
