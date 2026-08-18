import { createContext, useContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { OrganizationWithMembership, OrganizationRole } from '../../lib/supabase/types'

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

export interface OrganizationContextValue {
  organization: OrganizationWithMembership | null
  organizations: OrganizationWithMembership[]
  role: OrganizationRole | null
  loading: boolean
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
export const OrganizationContext = createContext<OrganizationContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useCurrentOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext)
  if (!ctx) throw new Error('useCurrentOrganization must be used within OrganizationProvider')
  return ctx
}
