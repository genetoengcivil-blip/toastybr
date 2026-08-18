import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
} from '../services/coupon'
import type { CouponFormValues } from '../../customers/types'

export function useCoupons() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['marketing', orgId, 'coupons'],
    queryFn: () => getCoupons(orgId!),
    enabled: !!orgId,
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (values: CouponFormValues) => createCoupon(orgId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'coupons'] })
    },
  })
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CouponFormValues }) =>
      updateCoupon(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'coupons'] })
    },
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'coupons'] })
    },
  })
}

export function useToggleCouponActive() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCouponActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'coupons'] })
    },
  })
}
