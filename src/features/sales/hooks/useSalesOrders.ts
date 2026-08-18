import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getSalesOrders,
  getSalesOrder,
  createSalesOrder,
  finalizeSalesOrder,
  cancelSalesOrder,
  updateOrderStatus,
  addOrderItem,
  removeOrderItem,
} from '../services/order'
import type { CartItem } from '../types'

export function useSalesOrders(status?: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['sales-orders', orgId, status ?? 'all'],
    queryFn: () => getSalesOrders(orgId!, status),
    enabled: !!orgId,
  })
}

export function useSalesOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['sales-order', orderId],
    queryFn: () => getSalesOrder(orderId!),
    enabled: !!orderId,
  })
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (params: {
      orderNumber: string
      items: CartItem[]
      channel: string
      customerId?: string | null
      customerName?: string | null
      customerPhone?: string | null
      notes?: string | null
    }) =>
      createSalesOrder(
        orgId!,
        params.orderNumber,
        params.items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          notes: i.notes,
        })),
        params.channel,
        params.customerId,
        params.customerName,
        params.customerPhone,
        params.notes
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', orgId] })
    },
  })
}

export function useFinalizeSalesOrder() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: finalizeSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', orgId] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', orgId] })
      queryClient.invalidateQueries({ queryKey: ['customers', orgId] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', orgId] })
    },
  })
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelSalesOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', orgId] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', orgId] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', orgId] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', orgId] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', orgId] })
    },
  })
}

export function useAddOrderItem() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (params: {
      orderId: string
      item: {
        product_id?: string | null
        product_name: string
        quantity: number
        unit_price: number
        notes?: string | null
      }
    }) => addOrderItem(orgId!, params.orderId, params.item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', orgId] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
    },
  })
}

export function useRemoveOrderItem() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (itemId: string) => removeOrderItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', orgId] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
    },
  })
}
