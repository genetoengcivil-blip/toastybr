import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrganizationMembers,
  getOrganizationInvites,
  inviteMember,
  cancelInvite,
  changeMemberRole,
  removeMember,
} from './services'
import { toast } from 'sonner'

export function useOrganizationMembers(orgId: string | null) {
  return useQuery({
    queryKey: ['staff', orgId],
    queryFn: () => getOrganizationMembers(orgId!),
    enabled: !!orgId,
  })
}

export function useOrganizationInvites(orgId: string | null) {
  return useQuery({
    queryKey: ['staff', orgId, 'invites'],
    queryFn: () => getOrganizationInvites(orgId!),
    enabled: !!orgId,
  })
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      inviteMember(orgId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', orgId, 'invites'] })
      toast.success('Convite enviado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar convite')
    },
  })
}

export function useCancelInvite(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: string) => cancelInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', orgId, 'invites'] })
      toast.success('Convite cancelado')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar convite')
    },
  })
}

export function useChangeMemberRole(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: string }) =>
      changeMemberRole(orgId, memberId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', orgId] })
      toast.success('Role alterada com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar role')
    },
  })
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => removeMember(orgId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', orgId] })
      toast.success('Membro removido')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover membro')
    },
  })
}
