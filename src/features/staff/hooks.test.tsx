import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../test/mocks/supabase'

vi.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '../../lib/supabase/client'
import {
  useOrganizationMembers,
  useInviteMember,
  useCancelInvite,
  useChangeMemberRole,
  useRemoveMember,
} from './hooks'

const mockSupabase = supabase as unknown as MockSupabaseClient

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('Staff Hooks (item 21)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useOrganizationMembers queries members for org', async () => {
    mockSupabase._setFromResponse({ data: [{ id: 'm1', role: 'owner' }], error: null })
    const { result } = renderHook(() => useOrganizationMembers('org-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(supabase.from).toHaveBeenCalledWith('organization_members')
  })

  it('useInviteMember calls invite rpc', async () => {
    mockSupabase._setRpcResponse({ data: 'inv-1', error: null })
    const { result } = renderHook(() => useInviteMember('org-1'), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.c', role: 'staff' })
    })
    expect(supabase.rpc).toHaveBeenCalledWith(
      'invite_organization_member',
      expect.objectContaining({ p_org_id: 'org-1', p_email: 'a@b.c', p_role: 'staff' })
    )
  })

  it('useCancelInvite calls cancel rpc', async () => {
    mockSupabase._setRpcResponse({ data: true, error: null })
    const { result } = renderHook(() => useCancelInvite('org-1'), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync('inv-1')
    })
    expect(supabase.rpc).toHaveBeenCalledWith('cancel_organization_invite', { p_invite_id: 'inv-1' })
  })

  it('useChangeMemberRole calls change-role rpc', async () => {
    mockSupabase._setRpcResponse({ data: true, error: null })
    const { result } = renderHook(() => useChangeMemberRole('org-1'), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ memberId: 'm1', newRole: 'manager' })
    })
    expect(supabase.rpc).toHaveBeenCalledWith(
      'change_organization_member_role',
      expect.objectContaining({ p_org_id: 'org-1', p_member_id: 'm1', p_new_role: 'manager' })
    )
  })

  it('useRemoveMember calls remove rpc', async () => {
    mockSupabase._setRpcResponse({ data: true, error: null })
    const { result } = renderHook(() => useRemoveMember('org-1'), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync('m1')
    })
    expect(supabase.rpc).toHaveBeenCalledWith('remove_organization_member', { p_org_id: 'org-1', p_member_id: 'm1' })
  })
})
