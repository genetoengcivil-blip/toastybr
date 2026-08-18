import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
} from '../services/campaign'
import type { CampaignFormValues } from '../../customers/types'

export function useCampaigns() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useQuery({
    queryKey: ['marketing', orgId, 'campaigns'],
    queryFn: () => getCampaigns(orgId!),
    enabled: !!orgId,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (values: CampaignFormValues) => createCampaign(orgId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'campaigns'] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CampaignFormValues }) =>
      updateCampaign(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'campaigns'] })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'campaigns'] })
    },
  })
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateCampaignStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', orgId, 'campaigns'] })
    },
  })
}
