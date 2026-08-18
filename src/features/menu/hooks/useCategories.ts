import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/category'
import type { CategoryFormData } from '../types'

export function useCategories() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useQuery({
    queryKey: ['menu', orgId, 'categories'],
    queryFn: () => getCategories(orgId),
    enabled: !!orgId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}
