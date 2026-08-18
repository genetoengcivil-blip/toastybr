import { supabase } from '../../../lib/supabase/client'
import type { CustomerAddress } from '../../../lib/supabase/types'
import type { CustomerAddressFormValues } from '../types'

export async function getCustomerAddresses(
  customerId: string,
  organizationId: string
): Promise<CustomerAddress[]> {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customerId)
    .eq('organization_id', organizationId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as CustomerAddress[]
}

export async function createCustomerAddress(
  customerId: string,
  organizationId: string,
  values: CustomerAddressFormValues
): Promise<CustomerAddress> {
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      label: values.label,
      street: values.street,
      number: values.number ?? null,
      complement: values.complement ?? null,
      neighborhood: values.neighborhood ?? null,
      city: values.city,
      state: values.state,
      zip_code: values.zip_code ?? null,
      is_default: values.is_default ?? false,
    })
    .select()
    .single()

  if (error) throw error
  return data as CustomerAddress
}

export async function updateCustomerAddress(
  addressId: string,
  values: CustomerAddressFormValues
): Promise<CustomerAddress> {
  const { data, error } = await supabase
    .from('customer_addresses')
    .update({
      label: values.label,
      street: values.street,
      number: values.number ?? null,
      complement: values.complement ?? null,
      neighborhood: values.neighborhood ?? null,
      city: values.city,
      state: values.state,
      zip_code: values.zip_code ?? null,
    })
    .eq('id', addressId)
    .select()
    .single()

  if (error) throw error
  return data as CustomerAddress
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', addressId)

  if (error) throw error
}

export async function setDefaultAddress(addressId: string): Promise<void> {
  const { error } = await supabase.rpc('set_default_customer_address', {
    p_address_id: addressId,
  })

  if (error) throw error
}
