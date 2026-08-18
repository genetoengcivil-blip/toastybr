import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../test/mocks/supabase'

vi.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../lib/supabase/client'
import AuthProvider from './AuthProvider'
import { useAuth, useCurrentOrganization } from './context'

const mockSupabase = supabase as unknown as MockSupabaseClient

function Probe() {
  const { user, loading } = useAuth()
  const { organization, role } = useCurrentOrganization()
  if (loading) return <div>loading</div>
  return (
    <div>
      <span data-testid="user">{user ? user.id : 'none'}</span>
      <span data-testid="org">{organization ? organization.id : 'none'}</span>
      <span data-testid="role">{role ?? 'none'}</span>
    </div>
  )
}

describe('AuthProvider (item 14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('populates user/session from getSession', async () => {
    mockSupabase._setAuthResponse('getSession', {
      data: { session: { user: { id: 'u1', email: 'a@b.c' }, access_token: 't' } },
      error: null,
    })
    mockSupabase._setAuthResponse('getUser', {
      data: { user: { id: 'u1' } },
      error: null,
    })
    mockSupabase._setFromResponse({
      data: [
        {
          id: 'o1', name: 'Org', slug: 'org', created_at: '2026', updated_at: '2026',
          organization_id: 'o1', user_id: 'u1', role: 'owner',
        },
      ],
      error: null,
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u1'))
    await waitFor(() => expect(screen.getByTestId('org').textContent).toBe('o1'))
    expect(screen.getByTestId('role').textContent).toBe('owner')
  })

  it('clears user after signOut', async () => {
    mockSupabase._setAuthResponse('getSession', { data: { session: null }, error: null })
    mockSupabase._setAuthResponse('getUser', { data: { user: null }, error: null })
    mockSupabase._setAuthResponse('signOut', { error: null })
    mockSupabase._setFromResponse({ data: [], error: null })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'))
    expect(screen.getByTestId('org').textContent).toBe('none')
  })

  it('shows loading before auth resolves', () => {
    mockSupabase._setAuthResponse('getSession', { data: { session: null }, error: null })
    mockSupabase._setAuthResponse('getUser', { data: { user: null }, error: null })
    mockSupabase._setFromResponse({ data: [], error: null })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.queryByText('loading')).not.toBeNull()
  })

  it('exposes null organization/role when user has no membership', async () => {
    mockSupabase._setAuthResponse('getSession', {
      data: { session: { user: { id: 'u2', email: 'a@b.c' }, access_token: 't' } },
      error: null,
    })
    mockSupabase._setAuthResponse('getUser', { data: { user: { id: 'u2' } }, error: null })
    mockSupabase._setFromResponse({ data: [], error: null })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByTestId('org').textContent).toBe('none'))
    expect(screen.getByTestId('role').textContent).toBe('none')
  })

  it('handles Supabase error gracefully (null organization)', async () => {
    mockSupabase._setAuthResponse('getSession', {
      data: { session: { user: { id: 'u3' }, access_token: 't' } },
      error: null,
    })
    mockSupabase._setAuthResponse('getUser', { data: { user: { id: 'u3' } }, error: null })
    mockSupabase._setFromResponse({ data: null, error: { message: 'boom' } })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByTestId('org').textContent).toBe('none'))
    expect(screen.getByTestId('role').textContent).toBe('none')
  })
})

describe('Auth/Organization context guards (item 16)', () => {
  it('useAuth throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <MemoryRouter>
          <Probe />
        </MemoryRouter>
      )
    ).toThrow('useAuth must be used within AuthProvider')
    spy.mockRestore()
  })

  it('exposes null organization/role when unauthenticated', async () => {
    mockSupabase._setAuthResponse('getSession', { data: { session: null }, error: null })
    mockSupabase._setAuthResponse('getUser', { data: { user: null }, error: null })
    mockSupabase._setFromResponse({ data: [], error: null })

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByTestId('org').textContent).toBe('none'))
    expect(screen.getByTestId('role').textContent).toBe('none')
  })
})
