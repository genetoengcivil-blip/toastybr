import { supabase } from '../../lib/supabase/client'
import type { OrganizationSettings, OrganizationBusinessHours } from '../../lib/supabase/types'

export async function getOrganizationSettings(orgId: string): Promise<OrganizationSettings | null> {
  const { data, error } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('organization_id', orgId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateOrganizationSettings(
  orgId: string,
  settings: {
    name?: string
    phone?: string
    email?: string
    address?: string
    timezone?: string
    currency?: string
    locale?: string
  }
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_organization_settings', {
    p_org_id: orgId,
    p_name: settings.name,
    p_phone: settings.phone,
    p_email: settings.email,
    p_address: settings.address,
    p_timezone: settings.timezone,
    p_currency: settings.currency,
    p_locale: settings.locale,
  })

  if (error) throw error
  return data as boolean
}

export async function getBusinessHours(orgId: string): Promise<OrganizationBusinessHours[]> {
  const { data, error } = await supabase
    .from('organization_business_hours')
    .select('*')
    .eq('organization_id', orgId)
    .order('weekday', { ascending: true })

  if (error) throw error
  return data as OrganizationBusinessHours[]
}

export async function updateBusinessHours(
  orgId: string,
  weekday: number,
  isOpen: boolean,
  openTime: string,
  closeTime: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_organization_business_hours', {
    p_org_id: orgId,
    p_weekday: weekday,
    p_is_open: isOpen,
    p_open_time: openTime,
    p_close_time: closeTime,
  })

  if (error) throw error
  return data as boolean
}

export async function updateOwnProfile(
  fullName?: string,
  avatarUrl?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_own_profile', {
    p_full_name: fullName,
    p_avatar_url: avatarUrl,
  })

  if (error) throw error
  return data as boolean
}
