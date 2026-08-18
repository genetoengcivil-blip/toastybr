import { supabase } from '../../../lib/supabase/client'
import type { Customer, CustomerWithTags } from '../../../lib/supabase/types'
import type { CustomerFormValues } from '../types'

export async function getCustomers(organizationId: string): Promise<CustomerWithTags[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*, customer_tag_assignments(customer_tags(*))')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as CustomerWithTags[]
}

export async function getActiveCustomers(organizationId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Customer[]
}

export async function createCustomer(
  organizationId: string,
  values: CustomerFormValues
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      organization_id: organizationId,
      name: values.name,
      email: values.email || null,
      phone: values.phone ?? null,
      document: values.document ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function updateCustomer(
  customerId: string,
  values: CustomerFormValues
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: values.name,
      email: values.email || null,
      phone: values.phone ?? null,
      document: values.document ?? null,
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function deactivateCustomer(customerId: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', customerId)

  if (error) throw error
}

export async function activateCustomer(customerId: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ is_active: true })
    .eq('id', customerId)

  if (error) throw error
}
