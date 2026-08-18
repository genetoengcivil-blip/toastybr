import { supabase } from '../../../lib/supabase/client'
import type { Supplier } from '../../../lib/supabase/types'
import type { SupplierFormValues } from '../types'

export async function getSuppliers(organizationId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Supplier[]
}

export async function getActiveSuppliers(organizationId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Supplier[]
}

export async function createSupplier(
  organizationId: string,
  values: SupplierFormValues
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      organization_id: organizationId,
      name: values.name,
      contact_name: values.contact_name ?? null,
      phone: values.phone ?? null,
      email: values.email || null,
      cnpj: values.cnpj ?? null,
      notes: values.notes ?? null,
      is_active: values.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(
  supplierId: string,
  values: SupplierFormValues
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: values.name,
      contact_name: values.contact_name ?? null,
      phone: values.phone ?? null,
      email: values.email || null,
      cnpj: values.cnpj ?? null,
      notes: values.notes ?? null,
      is_active: values.is_active ?? true,
    })
    .eq('id', supplierId)
    .select()
    .single()

  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId)

  if (error) throw error
}
