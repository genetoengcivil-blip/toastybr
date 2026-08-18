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
 */
export function useOrdersRealtime(
  organizationId: string | undefined,
  { channelPrefix = 'orders', extraInvalidateKeys }: UseOrdersRealtimeOptions = {}
) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const channelIdRef = useRef(0)

  useEffect(() => {
    if (!organizationId) return

    const channelName = `${channelPrefix}:${organizationId}:${channelIdRef.current}`
    channelIdRef.current++

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', organizationId] })
      for (const key of extraInvalidateKeys ?? []) {
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
        if (channelStatus === 'SUBSCRIBED') setStatus('subscribed')
        else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') setStatus('error')
        else if (channelStatus === 'CLOSED') setStatus('closed')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, channelPrefix, queryClient, extraInvalidateKeys])

  return { status }
}

