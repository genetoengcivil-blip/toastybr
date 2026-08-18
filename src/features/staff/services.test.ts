import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../test/mocks/supabase'

vi.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../lib/supabase/client'
import {
  getOrganizationMembers,
  getOrganizationInvites,
  inviteMember,
  cancelInvite,
  changeMemberRole,
  removeMember,
} from '../../features/staff/services'

const mockSupabase = supabase as unknown as MockSupabaseClient

describe('Staff Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrganizationMembers', () => {
    it('calls supabase with correct params', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', user_id: 'user1', role: 'owner', created_at: '2026-01-01', profiles: { full_name: 'Owner' } },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getOrganizationMembers('org1')

      expect(supabase.from).toHaveBeenCalledWith('organization_members')
      expect(result).toEqual(mockData)
    })

    it('throws on error', async () => {
      mockSupabase._setFromResponse({ data: null, error: { message: 'Failed', code: 'PGRST116' } })

      await expect(getOrganizationMembers('org1')).rejects.toThrow('Failed')
    })
  })

  describe('getOrganizationInvites', () => {
    it('calls supabase with correct params', async () => {
      const mockData = [
        { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'staff', expires_at: '2026-12-31', invited_by: 'user1', created_at: '2026-01-01', profiles: { full_name: 'Inviter' } },
      ]
      mockSupabase._setFromResponse({ data: mockData, error: null })

      const result = await getOrganizationInvites('org1')

      expect(supabase.from).toHaveBeenCalledWith('organization_invites')
      expect(result).toEqual(mockData)
    })
  })

  describe('inviteMember', () => {
    it('calls rpc with correct params', async () => {
      mockSupabase._setRpcResponse({ data: 'invite-id-123', error: null })

      const result = await inviteMember('org1', 'test@test.com', 'staff')

      expect(supabase.rpc).toHaveBeenCalledWith('invite_organization_member', {
        p_org_id: 'org1',
        p_email: 'test@test.com',
        p_role: 'staff',
      })
      expect(result).toBe('invite-id-123')
    })

    it('throws on error', async () => {
      mockSupabase._setRpcResponse({ data: null, error: { message: 'Email already invited' } })

      await expect(inviteMember('org1', 'test@test.com', 'staff')).rejects.toThrow('Email already invited')
    })
  })

  describe('cancelInvite', () => {
    it('calls rpc with correct params', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await cancelInvite('invite-123')

      expect(supabase.rpc).toHaveBeenCalledWith('cancel_organization_invite', {
        p_invite_id: 'invite-123',
      })
      expect(result).toBe(true)
    })
  })

  describe('changeMemberRole', () => {
    it('calls rpc with correct params', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await changeMemberRole('org1', 'member-123', 'manager')

      expect(supabase.rpc).toHaveBeenCalledWith('change_organization_member_role', {
        p_org_id: 'org1',
        p_member_id: 'member-123',
        p_new_role: 'manager',
      })
      expect(result).toBe(true)
    })
  })

  describe('removeMember', () => {
    it('calls rpc with correct params', async () => {
      mockSupabase._setRpcResponse({ data: true, error: null })

      const result = await removeMember('org1', 'member-123')

      expect(supabase.rpc).toHaveBeenCalledWith('remove_organization_member', {
        p_org_id: 'org1',
        p_member_id: 'member-123',
      })
      expect(result).toBe(true)
    })
  })
})