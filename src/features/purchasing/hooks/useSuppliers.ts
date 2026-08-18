import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/supplier'
import type { SupplierFormValues } from '../types'

export function useSuppliers() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['purchasing', orgId, 'suppliers'],
    queryFn: () => getSuppliers(orgId!),
    enabled: !!orgId,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (values: SupplierFormValues) => createSupplier(orgId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', orgId, 'suppliers'] })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) =>
      updateSupplier(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', orgId, 'suppliers'] })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', orgId, 'suppliers'] })
    },
  })
}
