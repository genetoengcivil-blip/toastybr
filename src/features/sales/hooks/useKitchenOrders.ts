import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import { getKitchenOrders, updateOrderStatus } from '../services/order'

export function useKitchenOrders() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['kitchen-orders', orgId],
    queryFn: () => getKitchenOrders(orgId!),
    enabled: !!orgId,
  })
}

export function useAdvanceKitchenStatus() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', orgId] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders', orgId] })
    },
  })
}
