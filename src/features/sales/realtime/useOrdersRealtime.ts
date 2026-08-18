import { useEffect, useRef, useState } from 'react'
import type { QueryKey } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase/client'

let realtimeChannelSequence = 0

export type RealtimeStatus = 'connecting' | 'subscribed' | 'error' | 'closed'

export interface UseOrdersRealtimeOptions {
  /** Deterministic channel prefix. Distinct per view avoids colliding channel names. */
  channelPrefix?: string
  /** Extra query keys to invalidate on each event (e.g. analytics dashboard). */
  extraInvalidateKeys?: QueryKey[]
}

/**
 * Subscribes to Postgres Changes on `sales_orders` for a single organization
 * and keeps the TanStack Query cache consistent. Realtime is notification-only:
 * it invalidates queries, it never mutates business state (finance/inventory
 * effects remain exclusively server-side via RPCs).
 *
 * IMPORTANT: the subscription effect depends ONLY on values that change the
 * realtime channel identity (organizationId, channelPrefix). `extraInvalidateKeys`
 * is stored in a ref because it only changes what the callback invalidates — NOT
 * the subscription itself. Including it in the dependency array would restart the
 * effect on every status update (setStatus causes a re-render, which creates a
 * new array reference at the call site), causing `.on()` to be called again on an
 * already-subscribed channel and throwing:
 *   "cannot add postgres_changes callbacks ... after subscribe()"
 */
export function useOrdersRealtime(
  organizationId: string | undefined,
  { channelPrefix = 'orders', extraInvalidateKeys }: UseOrdersRealtimeOptions = {}
) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  // Ref holds the latest extraInvalidateKeys without making the subscription
  // effect re-run when a new array reference is passed on a re-render.
  const extraInvalidateKeysRef = useRef<QueryKey[] | undefined>(extraInvalidateKeys)
  useEffect(() => {
    extraInvalidateKeysRef.current = extraInvalidateKeys
  }, [extraInvalidateKeys])

  useEffect(() => {
    if (!organizationId) return

    // Module-level monotonic sequence guarantees a UNIQUE topic per effect
    // instance. Two concurrent hook instances (or a remount that happens
    // before the previous cleanup's async removeChannel resolves) never reuse
    // the same Supabase topic, so `.on()` is never called on a joined channel.
    // The business identity (filter `organization_id=eq.<organizationId>`) is
    // unchanged — only the channel name is made unique per subscription.
    const channelInstanceId = ++realtimeChannelSequence
    const channelName = `${channelPrefix}:${organizationId}:${channelInstanceId}`

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', organizationId] })
      for (const key of extraInvalidateKeysRef.current ?? []) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_orders',
          filter: `organization_id=eq.${organizationId}`,
        },
        invalidate
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') {
          setStatus('subscribed')
        }
        else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
          setStatus('error')
        }
        else if (channelStatus === 'CLOSED') {
          setStatus('closed')
        }
      })

    // Call unsubscribe() to start the leave process immediately, then removeChannel
    // to clean up the registry. Both return promises; we don't await in cleanup
    // to avoid blocking the main thread, but we catch to avoid unhandled rejections.
    return () => {
      void channel.unsubscribe().catch(() => {})
      void supabase.removeChannel(channel).catch(() => {})
    }
  }, [organizationId, channelPrefix, queryClient])

  return { status }
}

