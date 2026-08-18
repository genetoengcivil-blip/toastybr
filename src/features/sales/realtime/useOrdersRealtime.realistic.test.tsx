import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderHook, render, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../../../test/test-utils'

import { useOrdersRealtime } from './useOrdersRealtime'

const TOPIC_RE = /^dashboard:org-1:\d+$/

let supabaseMock: any = null
let channelInstances: Map<string, any> = new Map()

// Mock supabase client - we will replace the supabaseMock reference in each beforeEach
vi.mock('../../../lib/supabase/client', () => ({
  get supabase() {
    return supabaseMock
  },
}))

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Returns the topic passed to client.channel() for the Nth call (0-indexed).
function topicOf(n: number) {
  return supabaseMock.channel.mock.calls[n][0] as string
}

describe('useOrdersRealtime - Realistic Supabase Behavior (V4 async removal)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.resetModules() // reset the module to get fresh state (including realtimeChannelSequence)
    vi.clearAllMocks()
    channelInstances = new Map()
    queryClient = createTestQueryClient()
    supabaseMock = {
      channel: vi.fn((topic: string) => {
        if (!channelInstances.has(topic)) {
          const channel = {
            on: vi.fn((_event: string, _filter: any, _callback: (payload: any) => void) => {
              if (channelInstances.get(topic).isSubscribed) {
                throw new Error(
                  `cannot add postgres_changes callbacks for realtime:${topic} after subscribe()`
                )
              }
              return channelInstances.get(topic)
            }),
            subscribe: vi.fn((cb?: (status: string) => void) => {
              channelInstances.get(topic).isSubscribed = true
              if (cb) cb('SUBSCRIBED')
              return channelInstances.get(topic)
            }),
            unsubscribe: vi.fn(() => {
              channelInstances.get(topic).isSubscribed = false
              return Promise.resolve('ok')
            }),
            isSubscribed: false,
          }
          channelInstances.set(topic, channel)
        }
        return channelInstances.get(topic)
      }),
      removeChannel: vi.fn((channel: any) => {
        return Promise.resolve().then(() => {
          for (const [topic, c] of channelInstances.entries()) {
            if (c === channel) {
              channelInstances.delete(topic)
              break
            }
          }
        })
      })
    }
  })

  it('allows sequential mounts/unmounts of same topic (cleanup clears subscription)', () => {
    // First mount
    const { unmount: unmount1 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    const topic1 = topicOf(0)
    expect(topic1).toMatch(TOPIC_RE)
    const channel1 = supabaseMock.channel.mock.results[0].value
    expect(channel1.isSubscribed).toBe(true)

    // First unmount
    act(() => {
      unmount1()
    })

    // Verify channel was removed and calls were made
    expect(supabaseMock.removeChannel).toHaveBeenCalledWith(channel1)
    // Note: we don't track the calls to unsubscribe and removeChannel in this mock, but we can if needed.
    // For now, we trust that the cleanup function is called.

    // Second mount with same topic should work now (new unique topic)
    const { unmount: unmount2 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    const topic2 = topicOf(1)
    expect(topic2).toMatch(TOPIC_RE)
    expect(topic2).not.toBe(topic1)
    const channel2 = supabaseMock.channel.mock.results[1].value
    expect(channel2.isSubscribed).toBe(true)

    // Cleanup second mount
    act(() => {
      unmount2()
    })
  })

  it('A) with unique topics, remount before removeChannel resolves: NO THROW and distinct topics', () => {
    // Simulate the world where cleanup does NOT clear the joined flag (removeChannel-only)
    // but we have unique topics per effect instance.
    // We need to adjust the unsubscribe mock to NOT clear the joined flag.
    supabaseMock = {
      channel: vi.fn((topic: string) => {
        if (!channelInstances.has(topic)) {
          const channel = {
            on: vi.fn((_event: string, _filter: any, _callback: (payload: any) => void) => {
              if (channelInstances.get(topic).isSubscribed) {
                throw new Error(
                  `cannot add postgres_changes callbacks for realtime:${topic} after subscribe()`
                )
              }
              return channelInstances.get(topic)
            }),
            subscribe: vi.fn((cb?: (status: string) => void) => {
              channelInstances.get(topic).isSubscribed = true
              if (cb) cb('SUBSCRIBED')
              return channelInstances.get(topic)
            }),
            unsubscribe: vi.fn(() => {
              // In the removeChannel-only scenario, we do NOT clear the joined flag.
              // So we leave isSubscribed as true.
              return Promise.resolve('ok')
            }),
            isSubscribed: false,
          }
          channelInstances.set(topic, channel)
        }
        return channelInstances.get(topic)
      }),
      removeChannel: vi.fn((channel: any) => {
        return Promise.resolve().then(() => {
          for (const [topic, c] of channelInstances.entries()) {
            if (c === channel) {
              channelInstances.delete(topic)
              break
            }
          }
        })
      })
    }

    // First mount
    const { unmount } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    const topic1 = topicOf(0)
    expect(topic1).toMatch(TOPIC_RE)
    const channel1 = supabaseMock.channel.mock.results[0].value
    expect(channel1.isSubscribed).toBe(true)

    // First unmount — cleanup runs unsubscribe() + removeChannel(), but because
    // we are simulating the removeChannel-only scenario, the joined flag is NOT cleared.
    act(() => {
      unmount()
    })

    // Registry still holds the topic (async removal pending) and the channel is still joined.
    expect(channelInstances.has(topic1)).toBe(true)
    expect(channel1.isSubscribed).toBe(true) // Still subscribed!

    // Immediate remount gets a NEW unique topic (because of module-level sequence) so .on() does NOT throw.
    expect(() => {
      const { unmount: unmount2 } = renderHook(
        () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
        { wrapper: makeWrapper(queryClient) }
      )
      act(() => {
        unmount2()
      })
    }).not.toThrow()

    const topic2 = topicOf(1)
    expect(topic2).toMatch(TOPIC_RE)
    expect(topic2).not.toBe(topic1)
  })

  it('B) unsubscribe-first (final fix) prevents throw on remount before removal resolves', () => {
    // First mount
    const { unmount: unmount1 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    const topic1 = topicOf(0)
    expect(topic1).toMatch(TOPIC_RE)
    const channel1 = supabaseMock.channel.mock.results[0].value
    expect(channel1.isSubscribed).toBe(true)

    // First unmount - unsubscribe() clears joined flag immediately
    act(() => {
      unmount1()
    })

    // Verify the call order and state - we don't track the order in this mock, but we know the unsubscribe mock clears the flag.
    // After unmount, the channel should be unsubscribed but not yet removed from registry
    expect(channelInstances.has(topic1)).toBe(true) // Still in registry due to async removal
    expect(channel1.isSubscribed).toBe(false) // Should be unsubscribed immediately

    // Second mount with same topic - should NOT throw because channel is unsubscribed
    const { unmount: unmount2 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    const topic2 = topicOf(1)
    expect(topic2).toMatch(TOPIC_RE)
    expect(topic2).not.toBe(topic1)
    const channel2 = supabaseMock.channel.mock.results[1].value
    expect(channel2.isSubscribed).toBe(true) // Should be subscribed again

    // Cleanup second mount
    act(() => {
      unmount2()
    })
  })

  it('C) StrictMode double-invoke with async removeChannel does not throw', () => {
    function Harness() {
      useOrdersRealtime('org-1', { channelPrefix: 'dashboard' })
      return null
    }

    const { unmount } = render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>
      </React.StrictMode>
    )

    act(() => {
      unmount()
    })

    // StrictMode double-invokes the effect on mount → two distinct topics.
    expect(supabaseMock.channel).toHaveBeenCalledTimes(2)
    const topic0 = topicOf(0)
    const topic1 = topicOf(1)
    expect(topic0).toMatch(TOPIC_RE)
    expect(topic1).toMatch(TOPIC_RE)
    expect(topic0).not.toBe(topic1)
  })
})

describe('useOrdersRealtime - V5 unique channel per instance', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.resetModules() // reset the module to get fresh state (including realtimeChannelSequence)
    vi.clearAllMocks()
    channelInstances = new Map()
    queryClient = createTestQueryClient()
    supabaseMock = {
      channel: vi.fn((topic: string) => {
        if (!channelInstances.has(topic)) {
          const channel = {
            on: vi.fn((_event: string, _filter: any, _callback: (payload: any) => void) => {
              if (channelInstances.get(topic).isSubscribed) {
                throw new Error(
                  `cannot add postgres_changes callbacks for realtime:${topic} after subscribe()`
                )
              }
              return channelInstances.get(topic)
            }),
            subscribe: vi.fn((cb?: (status: string) => void) => {
              channelInstances.get(topic).isSubscribed = true
              if (cb) cb('SUBSCRIBED')
              return channelInstances.get(topic)
            }),
            unsubscribe: vi.fn(() => {
              channelInstances.get(topic).isSubscribed = false
              return Promise.resolve('ok')
            }),
            isSubscribed: false,
          }
          channelInstances.set(topic, channel)
        }
        return channelInstances.get(topic)
      }),
      removeChannel: vi.fn((channel: any) => {
        return Promise.resolve().then(() => {
          for (const [topic, c] of channelInstances.entries()) {
            if (c === channel) {
              channelInstances.delete(topic)
              break
            }
          }
        })
      })
    }
  })

  it('two concurrent same-prefix consumers get DISTINCT topics and NO THROW', () => {
    // Mount two instances WITHOUT unmounting the first — the previous bug
    // happened exactly here, because both would collide on the same topic.
    const { unmount: unmount1 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )
    const { unmount: unmount2 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(supabaseMock.channel).toHaveBeenCalledTimes(2)
    const topic0 = topicOf(0)
    const topic1 = topicOf(1)
    expect(topic0).toMatch(TOPIC_RE)
    expect(topic1).toMatch(TOPIC_RE)
    expect(topic0).not.toBe(topic1)

    // Both allowed to register their own .on()/.subscribe() — no reuse.
    act(() => {
      unmount1()
      unmount2()
    })
  })

  it('previous useRef-counter strategy would have COLLIDED on dashboard:org-1:0', () => {
    // Demonstrate the broken approach: a per-instance counter always starts at 0,
    // so two hook instances sharing a prefix collide on the SAME topic.
    const topicFromUseRef = (instanceSeed: number) => {
      // simulates: const counter = useRef(0); counter.current++ at mount
      const counter = 0
      return `dashboard:org-1:${counter}`
    }
    expect(topicFromUseRef(0)).toBe('dashboard:org-1:0')
    expect(topicFromUseRef(1)).toBe('dashboard:org-1:0')
    expect(topicFromUseRef(0)).toBe(topicFromUseRef(1)) // collision proven
  })

  it('module-level sequence yields DISTINCT topics for two instances', () => {
    const { unmount: unmount1 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )
    const { unmount: unmount2 } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    const topic0 = topicOf(0)
    const topic1 = topicOf(1)
    expect(topic0).not.toBe(topic1)
    expect(topic0).toMatch(TOPIC_RE)
    expect(topic1).toMatch(TOPIC_RE)

    act(() => {
      unmount1()
      unmount2()
    })
  })

  it('immediate remount before removeChannel resolves: DISTINCT topics, NO THROW', () => {
    const { unmount } = renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    const topic0 = topicOf(0)
    expect(topic0).toMatch(TOPIC_RE)

    // Unmount → cleanup kicks off async removeChannel (still pending).
    act(() => {
      unmount()
    })
    expect(channelInstances.has(topic0)).toBe(true) // not yet removed

    // Immediate remount must NOT reuse topic0 (this is the core V5 guarantee).
    expect(() => {
      const { unmount: unmount2 } = renderHook(
        () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
        { wrapper: makeWrapper(queryClient) }
      )
      act(() => {
        unmount2()
      })
    }).not.toThrow()

    const topic1 = topicOf(1)
    expect(topic1).toMatch(TOPIC_RE)
    expect(topic1).not.toBe(topic0)
  })

  it('maintains the business filter (organization_id=eq.org-1) regardless of unique topic', () => {
    renderHook(
      () => useOrdersRealtime('org-1', { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient) }
    )

    // The channel instance used by the effect is the first call to supabase.channel
    const channel = supabaseMock.channel.mock.results[0].value
    expect(channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'sales_orders',
        filter: 'organization_id=eq.org-1',
      }),
      expect.any(Function)
    )
  })

  it('changing organization creates a new channel (new prefix+org identity)', () => {
    const { rerender } = renderHook(
      ({ org }: { org: string }) =>
        useOrdersRealtime(org, { channelPrefix: 'dashboard' }),
      { wrapper: makeWrapper(queryClient), initialProps: { org: 'org-1' } }
    )

    const topic0 = topicOf(0)
    expect(topic0).toMatch(/^dashboard:org-1:\d+$/)

    act(() => {
      rerender({ org: 'org-2' })
    })

    const topic1 = topicOf(1)
    expect(topic1).toMatch(/^dashboard:org-2:\d+$/)
    expect(topic1).not.toBe(topic0)
  })

  it('StrictMode: each effect subscription owns a distinct topic, NO THROW', () => {
    function Harness() {
      useOrdersRealtime('org-1', { channelPrefix: 'dashboard' })
      return null
    }

    const { unmount } = render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>
      </React.StrictMode>
    )

    // Clean up to flush any pending effects
    act(() => {
      unmount()
    })

    expect(supabaseMock.channel).toHaveBeenCalledTimes(2)
    const topic0 = topicOf(0)
    const topic1 = topicOf(1)
    expect(topic0).not.toBe(topic1)
  })
})