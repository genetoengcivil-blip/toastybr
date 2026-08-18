import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
} from '../services/purchase-order'

export function usePurchaseOrders() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['purchasing', orgId, 'orders'],
    queryFn: () => getPurchaseOrders(orgId!),
    enabled: !!orgId,
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (params: {
      supplierId: string | null
      notes: string | null
      items: { ingredient_id: string; quantity: number; unit_cost: number }[]
    }) =>
      createPurchaseOrder({
        organizationId: orgId!,
        supplierId: params.supplierId,
        notes: params.notes,
        items: params.items,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', orgId, 'orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string
      status: 'draft' | 'sent' | 'cancelled'
    }) => updatePurchaseOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', orgId, 'orders'] })
    },
  })
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (params: {
      poId: string
      items: { po_item_id: string; quantity: number }[]
      notes: string | null
    }) => receivePurchaseOrder(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', orgId, 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', orgId, 'balances'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', orgId, 'movements'] })
    },
  })
}
