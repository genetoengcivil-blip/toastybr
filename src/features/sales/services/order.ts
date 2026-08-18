import { supabase } from '../../../lib/supabase/client'
import type {
  SalesOrder,
  SalesOrderDetail,
  SalesOrderItem,
  SalesOrderWithItems,
} from '../../../lib/supabase/types'

export async function getSalesOrders(
  organizationId: string,
  status?: string
): Promise<SalesOrderWithItems[]> {
  let query = supabase
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as SalesOrderWithItems[]
}

export async function getSalesOrder(
  orderId: string
): Promise<SalesOrderDetail> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*), sales_payments(*), customers(*)')
    .eq('id', orderId)
    .single()

  if (error) throw error
  return data as SalesOrderDetail
}

export async function getKitchenOrders(
  organizationId: string
): Promise<SalesOrderWithItems[]> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('organization_id', organizationId)
    .in('status', ['confirmed', 'preparing', 'ready'])
    .order('confirmed_at', { ascending: true })

  if (error) throw error
  return data as SalesOrderWithItems[]
}

export async function generateOrderNumber(
  organizationId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_order_number', {
    p_org_id: organizationId,
  })

  if (error) throw error
  return data as string
}

export async function createSalesOrder(
  organizationId: string,
  orderNumber: string,
  items: {
    product_id?: string | null
    product_name: string
    quantity: number
    unit_price: number
    notes?: string | null
  }[],
  channel: string,
  customerId?: string | null,
  customerName?: string | null,
  customerPhone?: string | null,
  notes?: string | null
): Promise<SalesOrder> {
  const userId = (await supabase.auth.getUser()).data.user?.id

  const orderItems = items.map((item) => ({
    product_id: item.product_id ?? null,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
    notes: item.notes ?? null,
  }))

  const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0)

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      organization_id: organizationId,
      order_number: orderNumber,
      customer_id: customerId ?? null,
      channel,
      status: 'open',
      customer_name: customerName ?? null,
      customer_phone: customerPhone ?? null,
      subtotal,
      total: subtotal,
      notes: notes ?? null,
      opened_by: userId ?? null,
    })
    .select()
    .single()

  if (orderError) throw orderError

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(
      orderItems.map((item) => ({
        organization_id: organizationId,
        sales_order_id: order.id,
        ...item,
      }))
    )

  if (itemsError) throw itemsError

  return order as SalesOrder
}

export async function finalizeSalesOrder(params: {
  order_id: string
  customer_id?: string | null
  coupon_id?: string | null
  coupon_code?: string | null
  coupon_discount?: number
  discount?: number
  service_fee?: number
  delivery_fee?: number
}): Promise<{
  order_id: string
  order_number: string
  subtotal: number
  discount: number
  total: number
  payments_total: number
  change: number
  points_earned: number
}> {
  const { data, error } = await supabase.rpc('finalize_sales_order', {
    p_order_id: params.order_id,
    p_customer_id: params.customer_id ?? null,
    p_coupon_id: params.coupon_id ?? null,
    p_coupon_code: params.coupon_code ?? null,
    p_coupon_discount: params.coupon_discount ?? 0,
    p_discount: params.discount ?? 0,
    p_service_fee: params.service_fee ?? 0,
    p_delivery_fee: params.delivery_fee ?? 0,
  })

  if (error) throw error
  return data as {
    order_id: string
    order_number: string
    subtotal: number
    discount: number
    total: number
    payments_total: number
    change: number
    points_earned: number
  }
}

export async function cancelSalesOrder(
  orderId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc('cancel_sales_order', {
    p_order_id: orderId,
    p_reason: reason ?? null,
  })

  if (error) throw error
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<void> {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
  })

  if (error) throw error
}

export async function addOrderItem(
  organizationId: string,
  orderId: string,
  item: {
    product_id?: string | null
    product_name: string
    quantity: number
    unit_price: number
    notes?: string | null
  }
): Promise<SalesOrderItem> {
  const { data, error } = await supabase
    .from('sales_order_items')
    .insert({
      organization_id: organizationId,
      sales_order_id: orderId,
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
      notes: item.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as SalesOrderItem
}

export async function removeOrderItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('sales_order_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}
