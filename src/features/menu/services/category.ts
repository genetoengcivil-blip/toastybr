import { supabase } from '../../../lib/supabase/client'
import type { MenuCategory } from '../../../lib/supabase/types'

export async function getCategories(organizationId: string): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as MenuCategory[]
}

export async function createCategory(
  organizationId: string,
  data: { name: string; description?: string | null; sort_order?: number; is_active?: boolean }
): Promise<MenuCategory> {
  const { data: created, error } = await supabase
    .from('menu_categories')
    .insert({ organization_id: organizationId, ...data })
    .select()
    .single()

  if (error) throw error
  return created as MenuCategory
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string | null; sort_order: number; is_active: boolean }>
): Promise<MenuCategory> {
  const { data: updated, error } = await supabase
    .from('menu_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated as MenuCategory
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}
