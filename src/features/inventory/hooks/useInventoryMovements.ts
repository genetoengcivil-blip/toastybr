import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import { getInventoryMovements, applyInventoryMovement, updateMinimumQuantity } from '../services/movement'

export function useInventoryMovements() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useQuery({
    queryKey: ['inventory', orgId, 'movements'],
    queryFn: () => getInventoryMovements(orgId),
    enabled: !!orgId,
  })
}

export function useApplyMovement() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: applyInventoryMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', orgId, 'balances'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', orgId, 'movements'] })
    },
  })
}

export function useUpdateMinimumQuantity() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ ingredientId, minimum }: { ingredientId: string; minimum: number }) =>
      updateMinimumQuantity(ingredientId, minimum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', orgId, 'balances'] })
    },
  })
}
