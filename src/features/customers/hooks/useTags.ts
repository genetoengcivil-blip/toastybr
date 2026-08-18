import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getCustomerTags,
  createCustomerTag,
  deleteCustomerTag,
  assignTagToCustomer,
  removeTagFromCustomer,
} from '../services/tag'
import type { TagFormValues } from '../types'

export function useCustomerTags() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['customers', orgId, 'tags'],
    queryFn: () => getCustomerTags(orgId!),
    enabled: !!orgId,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (values: TagFormValues) => createCustomerTag(orgId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId, 'tags'] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (tagId: string) => deleteCustomerTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId, 'tags'] })
    },
  })
}

export function useAssignTag() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      customerId,
      tagId,
    }: {
      customerId: string
      tagId: string
    }) => assignTagToCustomer(customerId, tagId, orgId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] })
    },
  })
}

export function useRemoveTag() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      customerId,
      tagId,
    }: {
      customerId: string
      tagId: string
    }) => removeTagFromCustomer(customerId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] })
    },
  })
}
