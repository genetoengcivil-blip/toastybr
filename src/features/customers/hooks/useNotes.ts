import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import { getCustomerNotes, createCustomerNote } from '../services/note'

export function useCustomerNotes(customerId: string | null) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['customers', orgId, 'notes', customerId],
    queryFn: () => getCustomerNotes(customerId!, orgId!),
    enabled: !!orgId && !!customerId,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      customerId,
      content,
    }: {
      customerId: string
      content: string
    }) => createCustomerNote(customerId, orgId!, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customers', orgId, 'notes', variables.customerId],
      })
    },
  })
}
