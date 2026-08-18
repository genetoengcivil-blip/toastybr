import { describe, it, expect, vi } from 'vitest'
import React from 'react'
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

/**
 * Realistic Supabase mock that mirrors the real realtime-js behavior:
 *
 *  - `channel(topic)` returns the SAME instance while the registry still holds
 *    the topic (supabase-js reuses channels by topic).
 *  - `on()` THROWS if the channel is joined/subscribed — this is exactly the
 *    production error: "cannot add postgres_changes callbacks ... after subscribe()".
 *  - `subscribe()` marks the channel subscribed immediately.
 *  - `unsubscribe()` flips the subscribed flag IMMEDIATELY (synchronous), then
 *    resolves a promise — modeling realtime-js `unsubscribe()` which returns a
 *    Promise but sets the channel state synchronously via the channel adapter.
 *  - `removeChannel()` is ASYNC: it returns a Promise and only drops the registry
 *    entry on the next microtask. This reproduces the real gap between cleanup
 *    firing and supabase-js actually removing the channel from its registry.
 *
 * `unsubscribeResetsState` lets us contrast the two cleanup strategies:
 *  - true  → final fix: unsubscribe() clears the joined flag up front.
 *  - false → removeChannel-only world: nothing clears the flag before remount.
 */
function createRealisticSupabaseMock(options: { unsubscribeResetsState?: boolean } = {}) {
  const unsubscribeResetsState = options.unsubscribeResetsState ?? true
  const channels = new Map<string, any>()
  const calls: string[] = []

  class MockRealtimeChannel {
    readonly topic: string
    isSubscribed = false

    constructor(topic: string) {
      this.topic = topic
    }

    on(_event: string, _filter: any, _callback: (payload: any) => void) {
      if (this.isSubscribed) {
        throw new Error(
          `cannot add postgres_changes callbacks for realtime:${this.topic} after subscribe()`
        )
      }
      return this
    }

    subscribe(cb?: (status: string) => void) {
      this.isSubscribed = true
      if (cb) cb('SUBSCRIBED')
      return this
    }

    unsubscribe() {
      calls.push('unsubscribe')
      // Final fix: unsubscribe immediately clears the joined flag so a reused
      // channel can accept .on() again. In the removeChannel-only scenario we
      // deliberately do NOT clear it, so the window stays open.
      if (unsubscribeResetsState) this.isSubscribed = false
      return Promise.resolve('ok')
    }
  }

  const mockChannel = vi.fn((topic: string) => {
    if (!channels.has(topic)) channels.set(topic, new MockRealtimeChannel(topic))
    return channels.get(topic)
  })

  const mockRemoveChannel = vi.fn((channel: any) => {
    calls.push('removeChannel')
    // Async removal: the registry entry is NOT dropped synchronously. It is
    // removed on the next microtask, modeling supabase-js which awaits the
    // server "leave" ack before dropping the channel from its registry.
    return Promise.resolve().then(() => {
      for (const [t, c] of channels.entries()) {
        if (c === channel) {
          channels.delete(t)
          break
        }
      }
    })
  })

  return {
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
    _calls: calls,
    _channels: channels,
  }
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function makeStrictWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </React.StrictMode>
  )
}

describe('useOrdersRealtime - Realistic Supabase Behavior (V4 async removal)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = createTestQueryClient()
    supabaseMockRef.current = createRealisticSupabaseMock()
  })

  it('allows sequential mounts/unmounts of same topic (cleanup clears subscription)', () => {
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

    // Verify channel was removed and calls were made
    expect(supabaseMockRef.current.removeChannel).toHaveBeenCalledWith(channel1)
    expect(supabaseMockRef.current._calls).toEqual(['unsubscribe', 'removeChannel'])

    // Second mount with same topic should work now
    const { unmount: unmount2 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(supabaseMockRef.current.channel).toHaveBeenCalledWith('dashboard:org-1')
    const channel2 = supabaseMockRef.current.channel.mock.results[1].value
    expect(channel2.isSubscribed).toBe(true)

    // Cleanup second mount
    act(() => {
      unmount2()
    })
  })

  it('A) removeChannel-only reproduces async race: throws on remount before removal resolves', () => {
    // Simulate the world where cleanup does NOT clear the joined flag before
    // the async removeChannel completes (the buggy behavior).
    supabaseMockRef.current = createRealisticSupabaseMock({ unsubscribeResetsState: false })

    // First mount
    const { unmount } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(supabaseMockRef.current.channel).toHaveBeenCalledWith('dashboard:org-1')
    const channel = supabaseMockRef.current.channel.mock.results[0].value
    expect(channel.isSubscribed).toBe(true)

    // First unmount — cleanup runs unsubscribe() + removeChannel(), but because
    // unsubscribeResetsState is false the joined flag is NOT cleared.
    act(() => {
      unmount()
    })

    // Registry still holds the topic (async removal pending) and, crucially,
    // the channel is still joined — this is the gap that the final fix closes.
    expect(supabaseMockRef.current._channels.has('dashboard:org-1')).toBe(true)
    expect(channel.isSubscribed).toBe(true) // Still subscribed!

    // Immediate remount reuses the SAME still-subscribed channel → .on() throws.
    expect(() => {
      renderHook(
        () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
        { wrapper: makeWrapper(queryClient) }
      )
    }).toThrow(
      /cannot add postgres_changes callbacks for realtime:dashboard:org-1 after subscribe/
    )
  })

  it('B) unsubscribe-first (final fix) prevents throw on remount before removal resolves', () => {
    // First mount
    const { unmount: unmount1 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(supabaseMockRef.current.channel).toHaveBeenCalledWith('dashboard:org-1')
    const channel1 = supabaseMockRef.current.channel.mock.results[0].value
    expect(channel1.isSubscribed).toBe(true)

    // First unmount - unsubscribe() clears joined flag immediately
    act(() => {
      unmount1()
    })

    // Verify the call order and state
    expect(supabaseMockRef.current._calls).toEqual(['unsubscribe', 'removeChannel'])
    // After unmount, the channel should be unsubscribed but not yet removed from registry
    expect(supabaseMockRef.current._channels.has('dashboard:org-1')).toBe(true) // Still in registry due to async removal
    expect(channel1.isSubscribed).toBe(false) // Should be unsubscribed immediately

    // Second mount with same topic - should NOT throw because channel is unsubscribed
    const { unmount: unmount2 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(supabaseMockRef.current.channel).toHaveBeenCalledWith('dashboard:org-1')
    const channel2 = supabaseMockRef.current.channel.mock.results[1].value
    expect(channel2.isSubscribed).toBe(true) // Should be subscribed again

    // Cleanup second mount
    act(() => {
      unmount2()
    })
  })

  it('C) StrictMode double-invoke with async removeChannel does not throw', () => {
    expect(() => {
      renderHook(
        () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
        { wrapper: makeStrictWrapper(queryClient) }
      )
    }).not.toThrow()
  })
})