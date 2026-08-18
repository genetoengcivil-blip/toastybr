import { supabase } from '../../../lib/supabase/client'
import type { ProductWithCategory } from '../../../lib/supabase/types'

export async function getProducts(organizationId: string): Promise<ProductWithCategory[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, menu_categories(*)')
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data as ProductWithCategory[]
}

export async function createProduct(
  organizationId: string,
  data: {
    name: string
    category_id?: string | null
    description?: string | null
    price: number
    image_url?: string | null
    sku?: string | null
    is_active?: boolean
    is_available?: boolean
    sort_order?: number
  }
): Promise<ProductWithCategory> {
  const { data: created, error } = await supabase
    .from('products')
    .insert({ organization_id: organizationId, ...data })
    .select('*, menu_categories(*)')
    .single()

  if (error) throw error
  return created as ProductWithCategory
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    category_id: string | null
    description: string | null
    price: number
    image_url: string | null
    sku: string | null
    is_active: boolean
    is_available: boolean
    sort_order: number
  }>
): Promise<ProductWithCategory> {
  const { data: updated, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id)
    .select('*, menu_categories(*)')
    .single()

  if (error) throw error
  return updated as ProductWithCategory
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleProductAvailability(
  id: string,
  current: boolean
): Promise<ProductWithCategory> {
  return updateProduct(id, { is_available: !current })
}

export async function toggleProductActive(
  id: string,
  current: boolean
): Promise<ProductWithCategory> {
  return updateProduct(id, { is_active: !current })
}
