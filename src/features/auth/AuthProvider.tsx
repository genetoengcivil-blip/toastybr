import { useState, useEffect, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase/client'
import { AuthContext, OrganizationContext } from './context'
import type { OrganizationWithMembership, OrganizationRole } from '../../lib/supabase/types'
import { getUserOrganizations } from './services/organization'
import { signOut as authSignOut } from './services/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      <OrganizationProviderWrapper user={user} authLoading={loading}>
        {children}
      </OrganizationProviderWrapper>
    </AuthContext.Provider>
  )
}

interface OrganizationProviderWrapperProps {
  children: React.ReactNode
  user: User | null
  authLoading: boolean
}

function OrganizationProviderWrapper({ children, user, authLoading }: OrganizationProviderWrapperProps) {
  const [organization, setOrganization] = useState<OrganizationWithMembership | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationWithMembership[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setOrganization(null)
      setOrganizations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const orgs = await getUserOrganizations()
      setOrganizations(orgs)
      setOrganization(orgs.length > 0 ? orgs[0] : null)
    } catch {
      setOrganization(null)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      refresh()
    }
  }, [authLoading, refresh])

  const role: OrganizationRole | null = organization?.membership?.role ?? null

  return (
    <OrganizationContext.Provider value={{ organization, organizations, role, loading, refresh }}>
      {children}
    </OrganizationContext.Provider>
  )
}
