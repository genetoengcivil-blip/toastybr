import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  toggleProductActive,
} from '../services/product'
import type { ProductFormData } from '../types'

export function useProducts() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useQuery({
    queryKey: ['menu', orgId, 'products'],
    queryFn: () => getProducts(orgId),
    enabled: !!orgId,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: (data: ProductFormData) => createProduct(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}

export function useToggleProductAvailability() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      toggleProductAvailability(id, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}

export function useToggleProductActive() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      toggleProductActive(id, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}
