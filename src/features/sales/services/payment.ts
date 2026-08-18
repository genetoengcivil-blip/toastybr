import { supabase } from '../../../lib/supabase/client'
import type { SalesPayment } from '../../../lib/supabase/types'
import type { PaymentEntry } from '../types'

export async function addPayment(
  organizationId: string,
  orderId: string,
  payment: PaymentEntry
): Promise<SalesPayment> {
  const userId = (await supabase.auth.getUser()).data.user?.id

  const { data, error } = await supabase
    .from('sales_payments')
    .insert({
      organization_id: organizationId,
      sales_order_id: orderId,
      method: payment.method,
      amount: payment.amount,
      status: 'confirmed',
      reference: payment.reference ?? null,
      created_by: userId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as SalesPayment
}

export async function getOrderPayments(
  orderId: string
): Promise<SalesPayment[]> {
  const { data, error } = await supabase
    .from('sales_payments')
    .select('*')
    .eq('sales_order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as SalesPayment[]
}

export async function cancelPayment(
  paymentId: string
): Promise<void> {
  const { error } = await supabase
    .from('sales_payments')
    .update({ status: 'cancelled' })
    .eq('id', paymentId)

  if (error) throw error
}
