import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext, OrganizationContext } from '../context'
import type { AuthContextValue, OrganizationContextValue } from '../context'
import ProtectedRoute from './ProtectedRoute'

function renderWith(ctx: {
  auth: Partial<AuthContextValue>
  org: Partial<OrganizationContextValue>
}) {
  const auth: AuthContextValue = {
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
    ...ctx.auth,
  }
  const org: OrganizationContextValue = {
    organization: null,
    organizations: [],
    role: null,
    loading: false,
    refresh: vi.fn(),
    ...ctx.org,
  }
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthContext.Provider value={auth}>
        <OrganizationContext.Provider value={org}>
          <Routes>
            <Route path="/login" element={<div>LOGIN</div>} />
            <Route path="/forbidden" element={<div>FORBIDDEN</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute requirePermission={'finance.payAP' as any}>
                  <div>SECRET</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </OrganizationContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('ProtectedRoute (item 15)', () => {
  it('redirects unauthenticated users to /login', () => {
    renderWith({ auth: { user: null }, org: { role: null } })
    expect(screen.getByText('LOGIN')).toBeDefined()
    expect(screen.queryByText('SECRET')).toBeNull()
  })

  it('redirects authenticated-but-unauthorized users to /forbidden', () => {
    renderWith({ auth: { user: { id: 'u1' } as any }, org: { role: 'staff' } })
    expect(screen.getByText('FORBIDDEN')).toBeDefined()
    expect(screen.queryByText('SECRET')).toBeNull()
  })

  it('renders children for authorized users', () => {
    renderWith({ auth: { user: { id: 'u1' } as any }, org: { role: 'owner' } })
    expect(screen.getByText('SECRET')).toBeDefined()
  })

  it('renders children without permission requirement when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/p']}>
        <AuthContext.Provider value={{ user: { id: 'u1' } as any, session: null, loading: false, signOut: vi.fn() }}>
          <OrganizationContext.Provider value={{ organization: null, organizations: [], role: 'staff', loading: false, refresh: vi.fn() }}>
            <Routes>
              <Route path="/login" element={<div>LOGIN</div>} />
              <Route path="/p" element={<ProtectedRoute><div>OPEN</div></ProtectedRoute>} />
            </Routes>
          </OrganizationContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    expect(screen.getByText('OPEN')).toBeDefined()
  })
})
