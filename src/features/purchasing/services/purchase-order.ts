import { supabase } from '../../../lib/supabase/client'
import type {
  PurchaseOrderWithSupplier,
  PurchaseOrder,
  Ingredient,
} from '../../../lib/supabase/types'

export async function getPurchaseOrders(
  organizationId: string
): Promise<PurchaseOrderWithSupplier[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, suppliers(*), purchase_order_items(*, ingredients(*))')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PurchaseOrderWithSupplier[]
}

export async function getPurchaseOrder(
  orderId: string,
  organizationId: string
): Promise<PurchaseOrderWithSupplier> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, suppliers(*), purchase_order_items(*, ingredients(*))')
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .single()

  if (error) throw error
  return data as PurchaseOrderWithSupplier
}

export async function createPurchaseOrder(params: {
  organizationId: string
  supplierId: string | null
  notes: string | null
  items: { ingredient_id: string; quantity: number; unit_cost: number }[]
}): Promise<PurchaseOrder> {
  const { organizationId, supplierId, notes, items } = params

  // Generate PO number
  const { data: poNumber, error: numError } = await supabase.rpc('generate_po_number', {
    p_org_id: organizationId,
  })
  if (numError) throw numError

  // Calculate subtotal
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unit_cost, 0)

  // Insert PO
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: organizationId,
      supplier_id: supplierId,
      po_number: poNumber as string,
      status: 'draft',
      discount: 0,
      shipping: 0,
      notes,
      total: subtotal,
    })
    .select()
    .single()

  if (poError) throw poError

  // Insert items
  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(
      items.map((item) => ({
        organization_id: organizationId,
        po_id: po.id,
        ingredient_id: item.ingredient_id,
        quantity_ordered: item.quantity,
        quantity_received: 0,
        unit_cost: item.unit_cost,
      }))
    )

  if (itemsError) throw itemsError

  return po as PurchaseOrder
}

export async function updatePurchaseOrderStatus(
  orderId: string,
  status: 'draft' | 'sent' | 'cancelled'
): Promise<void> {
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
}

export async function receivePurchaseOrder(params: {
  poId: string
  items: { po_item_id: string; quantity: number }[]
  notes: string | null
}): Promise<string> {
  const { data, error } = await supabase.rpc('receive_purchase_order', {
    p_po_id: params.poId,
    p_items: params.items,
    p_notes: params.notes,
  })

  if (error) throw error
  return data as string
}

export async function getActiveIngredients(
  organizationId: string
): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Ingredient[]
}
