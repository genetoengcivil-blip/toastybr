import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getProductRecipe,
  addRecipeItem,
  updateRecipeItem,
  removeRecipeItem,
} from '../services/recipe'
import type { RecipeItemFormData } from '../../ingredients/types'

export function useProductRecipe(productId: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useQuery({
    queryKey: ['recipes', orgId, productId],
    queryFn: () => getProductRecipe(orgId, productId),
    enabled: !!orgId && !!productId,
  })
}

export function useAddRecipeItem() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: (data: RecipeItemFormData & { product_id: string }) =>
      addRecipeItem(orgId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', orgId, variables.product_id] })
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}

export function useUpdateRecipeItem() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, data, productId: _pid }: { id: string; data: Partial<RecipeItemFormData>; productId: string }) =>
      updateRecipeItem(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', orgId, variables.productId] })
    },
  })
}

export function useRemoveRecipeItem() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, productId: _pid }: { id: string; productId: string }) =>
      removeRecipeItem(id),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', orgId, variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['menu', orgId, 'products'] })
    },
  })
}
