import { supabase } from '../../lib/supabase/client'
import type { SalesOrderStatus } from '../../lib/supabase/types'

export async function generateOrderNumber(orgId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_order_number', {
    p_org_id: orgId,
  })

  if (error) throw error
  return data as string
}

export async function updateOrderStatus(orderId: string, newStatus: SalesOrderStatus): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
  })

  if (error) throw error
  return data as boolean
}

export interface FinalizeSalesOrderParams {
  p_customer_id?: string | null
  p_coupon_id?: string | null
  p_coupon_code?: string | null
  p_coupon_discount?: number
  p_discount?: number
  p_service_fee?: number
  p_delivery_fee?: number
}

export interface FinalizeResult {
  order_number: string
  subtotal: number
  total: number
  change: number
  points_earned: number
}

export async function finalizeSalesOrder(orderId: string, params: FinalizeSalesOrderParams): Promise<FinalizeResult> {
  const { data, error } = await supabase.rpc('finalize_sales_order', {
    p_order_id: orderId,
    p_customer_id: params.p_customer_id,
    p_coupon_id: params.p_coupon_id,
    p_coupon_code: params.p_coupon_code,
    p_coupon_discount: params.p_coupon_discount ?? 0,
    p_discount: params.p_discount ?? 0,
    p_service_fee: params.p_service_fee ?? 0,
    p_delivery_fee: params.p_delivery_fee ?? 0,
  })

  if (error) throw error
  return data as FinalizeResult
}

export async function cancelSalesOrder(orderId: string, reason: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('cancel_sales_order', {
    p_order_id: orderId,
    p_reason: reason,
  })

  if (error) throw error
  return data as boolean
}

export async function getSalesOrders(orgId: string): Promise<Array<{ id: string; organization_id: string; order_number: string; status: string; total: number; created_at: string }>> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('id, organization_id, order_number, status, total, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Array<{ id: string; organization_id: string; order_number: string; status: string; total: number; created_at: string }>
}