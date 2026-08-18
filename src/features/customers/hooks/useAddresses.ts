import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
} from '../services/address'
import type { CustomerAddressFormValues } from '../types'

export function useCustomerAddresses(customerId: string | null) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['customers', orgId, 'addresses', customerId],
    queryFn: () => getCustomerAddresses(customerId!, orgId!),
    enabled: !!orgId && !!customerId,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      customerId,
      values,
    }: {
      customerId: string
      values: CustomerAddressFormValues
    }) => createCustomerAddress(customerId, orgId!, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customers', orgId, 'addresses', variables.customerId],
      })
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      addressId,
      values,
    }: {
      addressId: string
      values: CustomerAddressFormValues
      customerId: string
    }) => updateCustomerAddress(addressId, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customers', orgId, 'addresses', variables.customerId],
      })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      addressId,
      customerId: _customerId,
    }: {
      addressId: string
      customerId: string
    }) => deleteCustomerAddress(addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customers', orgId, 'addresses', variables.customerId],
      })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      addressId,
      customerId: _customerId,
    }: {
      addressId: string
      customerId: string
    }) => setDefaultAddress(addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customers', orgId, 'addresses', variables.customerId],
      })
    },
  })
}
