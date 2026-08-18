import { supabase } from '../../lib/supabase/client'
import type { Supplier, PurchaseOrder, PurchaseOrderItem } from '../../lib/supabase/types'

export async function getSuppliers(orgId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Supplier[]
}

export async function createSupplier(orgId: string, supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplier, organization_id: orgId })
    .select()
    .single()

  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(orgId: string, supplierId: string, updates: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', supplierId)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(orgId: string, supplierId: string): Promise<boolean> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId)
    .eq('organization_id', orgId)

  if (error) throw error
  return true
}

export async function getPurchaseOrders(orgId: string): Promise<(PurchaseOrder & { suppliers: { name: string } | null })[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, suppliers:supplier_id(name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (PurchaseOrder & { suppliers: { name: string } | null })[]
}

export async function createPurchaseOrder(
  orgId: string,
  po: Omit<PurchaseOrder, 'id' | 'po_number' | 'created_at' | 'updated_at' | 'total'>,
  items: Omit<PurchaseOrderItem, 'id' | 'organization_id' | 'po_id' | 'quantity_received' | 'created_at' | 'updated_at'>[]
): Promise<PurchaseOrder> {
  const { data: poData, error: poError } = await supabase
    .from('purchase_orders')
    .insert({ ...po, organization_id: orgId })
    .select()
    .single()

  if (poError) throw poError

  const poId = poData.id

  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      ...item,
      organization_id: orgId,
      po_id: poId,
      quantity_received: 0,
    }))

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsToInsert)

    if (itemsError) throw itemsError
  }

  return poData as PurchaseOrder
}

export async function receivePurchaseOrder(
  poId: string,
  items: { po_item_id: string; quantity: number }[],
  notes?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('receive_purchase_order', {
    p_po_id: poId,
    p_items: items,
    p_notes: notes,
  })

  if (error) throw error
  return data as string
}