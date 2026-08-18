import { supabase } from '../../../lib/supabase/client'
import type { Campaign } from '../../../lib/supabase/types'
import type { CampaignFormValues } from '../../customers/types'

export async function getCampaigns(organizationId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Campaign[]
}

export async function createCampaign(
  organizationId: string,
  values: CampaignFormValues
): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      organization_id: organizationId,
      name: values.name,
      description: values.description ?? null,
      type: values.type,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Campaign
}

export async function updateCampaign(
  campaignId: string,
  values: CampaignFormValues
): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      name: values.name,
      description: values.description ?? null,
      type: values.type,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
    })
    .eq('id', campaignId)
    .select()
    .single()

  if (error) throw error
  return data as Campaign
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)

  if (error) throw error
}

export async function updateCampaignStatus(
  campaignId: string,
  newStatus: string
): Promise<void> {
  const { error } = await supabase.rpc('update_campaign_status', {
    p_campaign_id: campaignId,
    p_new_status: newStatus,
  })

  if (error) throw error
}
