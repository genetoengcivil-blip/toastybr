import { supabase } from '../../../lib/supabase/client'
import type { CustomerNote } from '../../../lib/supabase/types'

export async function getCustomerNotes(
  customerId: string,
  organizationId: string
): Promise<CustomerNote[]> {
  const { data, error } = await supabase
    .from('customer_notes')
    .select('*')
    .eq('customer_id', customerId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as CustomerNote[]
}

export async function createCustomerNote(
  customerId: string,
  organizationId: string,
  content: string
): Promise<CustomerNote> {
  const { data, error } = await supabase
    .from('customer_notes')
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data as CustomerNote
}
