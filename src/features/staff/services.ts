import { supabase } from '../../lib/supabase/client'
import type { OrganizationMember, OrganizationInvite, Profile } from '../../lib/supabase/types'

export interface MemberWithProfile extends OrganizationMember {
  profiles: Profile | null
}

export interface InviteWithInviter extends OrganizationInvite {
  profiles: Profile | null
}

export async function getOrganizationMembers(orgId: string): Promise<MemberWithProfile[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, profiles:user_id(id, full_name, avatar_url)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as MemberWithProfile[]
}

export async function getOrganizationInvites(orgId: string): Promise<InviteWithInviter[]> {
  const { data, error } = await supabase
    .from('organization_invites')
    .select('*, profiles:invited_by(id, full_name, avatar_url)')
    .eq('organization_id', orgId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as InviteWithInviter[]
}

export async function inviteMember(
  orgId: string,
  email: string,
  role: string
): Promise<string> {
  const { data, error } = await supabase.rpc('invite_organization_member', {
    p_org_id: orgId,
    p_email: email,
    p_role: role,
  })

  if (error) throw error
  return data as string
}

export async function cancelInvite(inviteId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('cancel_organization_invite', {
    p_invite_id: inviteId,
  })

  if (error) throw error
  return data as boolean
}

export async function changeMemberRole(
  orgId: string,
  memberId: string,
  newRole: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('change_organization_member_role', {
    p_org_id: orgId,
    p_member_id: memberId,
    p_new_role: newRole,
  })

  if (error) throw error
  return data as boolean
}

export async function removeMember(
  orgId: string,
  memberId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('remove_organization_member', {
    p_org_id: orgId,
    p_member_id: memberId,
  })

  if (error) throw error
  return data as boolean
}
