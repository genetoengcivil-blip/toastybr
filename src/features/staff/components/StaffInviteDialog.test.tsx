import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../../test/mocks/supabase'

vi.mock('../../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../../lib/supabase/client'
import { StaffInviteDialog } from './StaffInviteDialog'

const mockSupabase = supabase as unknown as MockSupabaseClient

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('StaffInviteDialog (item 24)', () => {
  it('invites a member with email and role', async () => {
    mockSupabase._setRpcResponse({ data: 'inv-1', error: null })
    render(<StaffInviteDialog orgId="org-1" />, { wrapper: wrapper() })

    fireEvent.change(screen.getByLabelText(/email do convidado/i), { target: { value: 'new@toasty.com' } })
    fireEvent.change(screen.getByLabelText(/função/i), { target: { value: 'manager' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar convite/i }))

    await waitFor(() => expect(mockSupabase.rpc).toHaveBeenCalledTimes(1))
    expect(mockSupabase.rpc).toHaveBeenCalledWith('invite_organization_member', {
      p_org_id: 'org-1',
      p_email: 'new@toasty.com',
      p_role: 'manager',
    })
  })

  it('does not submit without email', () => {
    render(<StaffInviteDialog orgId="org-1" />, { wrapper: wrapper() })
    const submit = screen.getByRole('button', { name: /enviar convite/i })
    expect(submit).toBeDisabled()
  })
})
