import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  getBusinessHours,
  updateBusinessHours,
  updateOwnProfile,
} from './services'
import { toast } from 'sonner'

export function useOrganizationSettings(orgId: string | null) {
  return useQuery({
    queryKey: ['settings', orgId],
    queryFn: () => getOrganizationSettings(orgId!),
    enabled: !!orgId,
  })
}

export function useUpdateOrganizationSettings(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Parameters<typeof updateOrganizationSettings>[1]) =>
      updateOrganizationSettings(orgId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', orgId] })
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      toast.success('Configurações salvas')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar configurações')
    },
  })
}

export function useBusinessHours(orgId: string | null) {
  return useQuery({
    queryKey: ['settings', orgId, 'business-hours'],
    queryFn: () => getBusinessHours(orgId!),
    enabled: !!orgId,
  })
}

export function useUpdateBusinessHours(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      weekday,
      isOpen,
      openTime,
      closeTime,
    }: {
      weekday: number
      isOpen: boolean
      openTime: string
      closeTime: string
    }) => updateBusinessHours(orgId, weekday, isOpen, openTime, closeTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', orgId, 'business-hours'] })
      toast.success('Horários atualizados')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar horários')
    },
  })
}

export function useUpdateOwnProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fullName, avatarUrl }: { fullName?: string; avatarUrl?: string }) =>
      updateOwnProfile(fullName, avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Perfil atualizado')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar perfil')
    },
  })
}
