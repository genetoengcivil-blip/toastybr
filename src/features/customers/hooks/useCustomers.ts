import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  activateCustomer,
} from '../services/customer'
import type { CustomerFormValues } from '../types'

export function useCustomers() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['customers', orgId],
    queryFn: () => getCustomers(orgId!),
    enabled: !!orgId,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (values: CustomerFormValues) => createCustomer(orgId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CustomerFormValues }) =>
      updateCustomer(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] })
    },
  })
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (id: string) => deactivateCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] })
    },
  })
}

export function useActivateCustomer() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (id: string) => activateCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] })
    },
  })
}
