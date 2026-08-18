import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query'
import { createTestQueryClient } from './test-utils'

describe('Retry Safety (item 22)', () => {
  it('test query client disables retries for queries and mutations', () => {
    const qc = createTestQueryClient()
    expect(qc.getDefaultOptions().queries?.retry).toBe(false)
    expect(qc.getDefaultOptions().mutations?.retry).toBe(false)
  })

  it('a failing query is attempted exactly once (no silent retry)', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useQuery({ queryKey: ['retry-test'], queryFn }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('a failing mutation is attempted exactly once', async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useMutation({ mutationFn }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
      ),
    })

    try {
      await result.current.mutateAsync('x')
    } catch {
      /* expected */
    }
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })
})
