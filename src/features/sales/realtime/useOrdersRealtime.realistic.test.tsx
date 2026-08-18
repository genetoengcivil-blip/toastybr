import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../../../test/test-utils'
import { useOrdersRealtime } from './useOrdersRealtime'

// Global mock setup - must be at top level
const supabaseMockRef = { current: null as any }
vi.mock('../../../lib/supabase/client', () => ({
  get supabase() {
    return supabaseMockRef.current
  },
}))

// Realistic Supabase mock that throws on .on() after subscribe()
function createRealisticSupabaseMock() {
  const channels = new Map<string, any>()

  // Mock RealtimeChannel class that mimics Supabase behavior
  class MockRealtimeChannel {
    private topic: string
    private listeners: Array<{
      event: string,
      filter: any,
      callback: (payload: any) => void
    }> = []
    private isSubscribed = false

    constructor(topic: string) {
      this.topic = topic
    }

    on(event: string, filter: any, callback: (payload: any) => void) {
      // THIS IS THE KEY BEHAVIOR: Throw if already subscribed
      if (this.isSubscribed) {
        throw new Error(`cannot add postgres_changes callbacks for realtime:${this.topic} after subscribe()`)
      }

      this.listeners.push({ event, filter, callback })
      return this // return chainable
    }

    subscribe(cb?: (status: string) => void) {
      this.isSubscribed = true
      if (cb) cb('SUBSCRIBED')
      return this
    }

    unsubscribe() {
      this.isSubscribed = false
      return this
    }

    // Helper to emit events for testing
    emit(event: string, payload: any) {
      this.listeners
        .filter(l => l.event === event || l.event === '*')
        .forEach(l => l.callback(payload))
    }
  }

  const mockFrom = vi.fn(() => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    return chain
  })

  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })

  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  }

  const mockChannel = vi.fn((topic: string) => {
    if (!channels.has(topic)) {
      channels.set(topic, new MockRealtimeChannel(topic))
    }
    return channels.get(topic)
  })

  const mockRemoveChannel = vi.fn((channel: any) => {
    // Find and remove the channel from our map
    for (const [topic, chan] of channels.entries()) {
      if (chan === channel) {
        channels.delete(topic)
        break
      }
    }
    return Promise.resolve()
  })

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOrdersRealtime - Realistic Supabase Behavior', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = createTestQueryClient()
    supabaseMockRef.current = createRealisticSupabaseMock()
  })

  afterEach(() => {
    supabaseMockRef.current = null
  })

  it('throws when trying to add listeners after subscribe (reproduces old bug)', () => {
    // Mount first consumer
    const { unmount: unmount1 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    // Verify first mount worked
    expect(supabaseMockRef.current.channel).toHaveBeenCalledWith('dashboard:org-1')
    const channel1 = supabaseMockRef.current.channel.mock.results[0].value
    expect(channel1.isSubscribed).toBe(true)

    // Now try to mount second consumer with SAME topic
    // This should throw because the realistic mock prevents .on() after subscribe
    expect(() => {
      renderHook(
        () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
        { wrapper: makeWrapper(queryClient) }
      )
    }).toThrow(/cannot add postgres_changes callbacks for realtime:dashboard:org-1 after subscribe/)

    // Cleanup first consumer
    act(() => {
      unmount1()
    })
  })

  it('allows sequential mounts/unmounts of same topic', () => {
    // First mount
    const { unmount: unmount1 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(supabaseMockRef.current.channel).toHaveBeenCalledWith('dashboard:org-1')
    const channel1 = supabaseMockRef.current.channel.mock.results[0].value
    expect(channel1.isSubscribed).toBe(true)

    // First unmount
    act(() => {
      unmount1()
    })

    // Verify channel was removed
    expect(supabaseMockRef.current.removeChannel).toHaveBeenCalledWith(channel1)

    // Second mount with same topic should work now
    const { unmount: unmount2 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(supabaseMockRef.current.channel).toHaveBeenCalledWith('dashboard:org-1')
    const channel2 = supabaseMockRef.current.channel.mock.results[1].value
    expect(channel2.isSubscribed).toBe(true)

    // Cleanup
    act(() => {
      unmount2()
    })
  })
})