import { supabase } from '../../../lib/supabase/client'
import type { CustomerTag } from '../../../lib/supabase/types'
import type { TagFormValues } from '../types'

export async function getCustomerTags(organizationId: string): Promise<CustomerTag[]> {
  const { data, error } = await supabase
    .from('customer_tags')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as CustomerTag[]
}

export async function createCustomerTag(
  organizationId: string,
  values: TagFormValues
): Promise<CustomerTag> {
  const { data, error } = await supabase
    .from('customer_tags')
    .insert({
      organization_id: organizationId,
      name: values.name,
    })
    .select()
    .single()

  if (error) throw error
  return data as CustomerTag
}

export async function deleteCustomerTag(tagId: string): Promise<void> {
  const { error } = await supabase
    .from('customer_tags')
    .delete()
    .eq('id', tagId)

  if (error) throw error
}

export async function assignTagToCustomer(
  customerId: string,
  tagId: string,
  organizationId: string
): Promise<void> {
  const { error } = await supabase
    .from('customer_tag_assignments')
    .insert({
      customer_id: customerId,
      tag_id: tagId,
      organization_id: organizationId,
    })

  if (error) throw error
}

export async function removeTagFromCustomer(
  customerId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from('customer_tag_assignments')
    .delete()
    .eq('customer_id', customerId)
    .eq('tag_id', tagId)

  if (error) throw error
}
