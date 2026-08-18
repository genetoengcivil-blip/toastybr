import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  toggleIngredientActive,
} from '../services/ingredient'
import type { IngredientFormData } from '../types'

export function useIngredients() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useQuery({
    queryKey: ['ingredients', orgId],
    queryFn: () => getIngredients(orgId),
    enabled: !!orgId,
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: (data: IngredientFormData) => createIngredient(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', orgId] })
    },
  })
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IngredientFormData> }) =>
      updateIngredient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', orgId] })
    },
  })
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: (id: string) => deleteIngredient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', orgId] })
    },
  })
}

export function useToggleIngredientActive() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      toggleIngredientActive(id, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', orgId] })
    },
  })
}
