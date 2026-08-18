import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMockSupabaseClient, type MockSupabaseClient } from '../../../test/mocks/supabase'
import { OrganizationContext } from '../../auth/context'
import type { OrganizationContextValue } from '../../auth/context'

vi.mock('../../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}))

import { supabase } from '../../../lib/supabase/client'
import { PayAccountPayableDialog } from './PayAccountPayableDialog'

const mockSupabase = supabase as unknown as MockSupabaseClient

function wrapper(orgId = 'org-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const org: OrganizationContextValue = {
    organization: { id: orgId } as any,
    organizations: [],
    role: 'owner',
    loading: false,
    refresh: vi.fn(),
  }
  return function W({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <OrganizationContext.Provider value={org}>{children}</OrganizationContext.Provider>
      </QueryClientProvider>
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PayAccountPayableDialog (item 25)', () => {
  it('pays an accounts payable with the entered amount', async () => {
    mockSupabase._setRpcResponse({ data: { success: true, status: 'paid' }, error: null })
    render(<PayAccountPayableDialog apId="ap-1" />, { wrapper: wrapper() })

    fireEvent.change(screen.getByLabelText(/valor do pagamento/i), { target: { value: '120.50' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar pagamento/i }))

    await waitFor(() => expect(mockSupabase.rpc).toHaveBeenCalledTimes(1))
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'pay_account_payable',
      expect.objectContaining({ p_ap_id: 'ap-1', p_amount: 120.5 })
    )
  })

  it('does not submit an invalid amount', async () => {
    mockSupabase._setRpcResponse({ data: { success: true }, error: null })
    render(<PayAccountPayableDialog apId="ap-1" />, { wrapper: wrapper() })

    fireEvent.change(screen.getByLabelText(/valor do pagamento/i), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar pagamento/i }))

    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })
})
