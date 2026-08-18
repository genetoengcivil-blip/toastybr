import { supabase } from '../../../lib/supabase/client'
import type { OrganizationWithMembership } from '../../../lib/supabase/types'

export async function getUserOrganizations(): Promise<OrganizationWithMembership[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: memberships, error: membersError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', user.id)

  if (membersError) throw membersError
  if (!memberships || memberships.length === 0) return []

  const orgIds = memberships.map((m: { organization_id: string }) => m.organization_id)

  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)

  if (orgsError) throw orgsError

  const result: OrganizationWithMembership[] = orgs.map((org: Record<string, unknown>) => ({
    id: org.id as string,
    name: org.name as string,
    slug: org.slug as string,
    created_at: org.created_at as string,
    updated_at: org.updated_at as string,
    membership: memberships.find((m: { organization_id: string }) => m.organization_id === org.id)!,
  }))

  return result
}

export async function createOrganization(name: string, slug: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_organization', {
    org_name: name,
    org_slug: slug,
  })

  if (error) throw error
  return data as string
}
