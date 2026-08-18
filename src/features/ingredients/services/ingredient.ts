import { supabase } from '../../../lib/supabase/client'
import type { Ingredient } from '../../../lib/supabase/types'

export async function getIngredients(organizationId: string): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Ingredient[]
}

export async function createIngredient(
  organizationId: string,
  data: { name: string; description?: string | null; unit: string; cost_per_unit: number; is_active?: boolean }
): Promise<Ingredient> {
  const { data: created, error } = await supabase
    .from('ingredients')
    .insert({ organization_id: organizationId, ...data })
    .select()
    .single()

  if (error) throw error
  return created as Ingredient
}

export async function updateIngredient(
  id: string,
  data: Partial<{ name: string; description: string | null; unit: string; cost_per_unit: number; is_active: boolean }>
): Promise<Ingredient> {
  const { data: updated, error } = await supabase
    .from('ingredients')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated as Ingredient
}

export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleIngredientActive(
  id: string,
  current: boolean
): Promise<Ingredient> {
  return updateIngredient(id, { is_active: !current })
}
