import { supabase } from '../../../lib/supabase/client'
import type { ProductRecipeItemWithIngredient } from '../../../lib/supabase/types'

export async function getProductRecipe(
  organizationId: string,
  productId: string
): Promise<ProductRecipeItemWithIngredient[]> {
  const { data, error } = await supabase
    .from('product_recipe_items')
    .select('*, ingredients(*)')
    .eq('organization_id', organizationId)
    .eq('product_id', productId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as ProductRecipeItemWithIngredient[]
}

export async function addRecipeItem(
  organizationId: string,
  data: {
    product_id: string
    ingredient_id: string
    quantity: number
    waste_percent?: number
  }
): Promise<ProductRecipeItemWithIngredient> {
  const { data: created, error } = await supabase
    .from('product_recipe_items')
    .insert({ organization_id: organizationId, ...data })
    .select('*, ingredients(*)')
    .single()

  if (error) throw error
  return created as ProductRecipeItemWithIngredient
}

export async function updateRecipeItem(
  id: string,
  data: Partial<{ quantity: number; waste_percent: number }>
): Promise<ProductRecipeItemWithIngredient> {
  const { data: updated, error } = await supabase
    .from('product_recipe_items')
    .update(data)
    .eq('id', id)
    .select('*, ingredients(*)')
    .single()

  if (error) throw error
  return updated as ProductRecipeItemWithIngredient
}

export async function removeRecipeItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('product_recipe_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
