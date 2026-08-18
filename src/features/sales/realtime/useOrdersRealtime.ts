import { useEffect, useRef, useState } from 'react'
import type { QueryKey } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase/client'

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

    const channelName = `${channelPrefix}:${organizationId}`

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

    // removeChannel() internally unsubscribes the channel, so a separate
    // unsubscribe() call is unnecessary and would be a redundant operation.
    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, channelPrefix, queryClient])

  return { status }
}

