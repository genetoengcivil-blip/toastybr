import type { SalesOrderStatus } from '../../../lib/supabase/types'

export interface StatusConfig {
  label: string
  variant: 'default' | 'warning' | 'success' | 'info' | 'destructive'
}

export const ORDER_STATUS_CONFIG: Record<SalesOrderStatus, StatusConfig> = {
  open: { label: 'Aberto', variant: 'info' },
  confirmed: { label: 'Confirmado', variant: 'info' },
  preparing: { label: 'Em preparo', variant: 'warning' },
  ready: { label: 'Pronto', variant: 'success' },
  completed: { label: 'Concluído', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

export const CHANNEL_LABELS: Record<string, string> = {
  pos: 'PDV',
  counter: 'Balcão',
  takeaway: 'Retirada',
  delivery: 'Delivery',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  debit_card: 'Débito',
  credit_card: 'Crédito',
  other: 'Outro',
}

export function formatElapsed(confirmedAt: string | null): string {
  if (!confirmedAt) return '--'
  const now = Date.now()
  const confirmed = new Date(confirmedAt).getTime()
  const diffMs = now - confirmed
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin} min`

  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return `${hours}h ${mins}min`
}

export function canAdvanceStatus(current: SalesOrderStatus): SalesOrderStatus | null {
  const transitions: Record<SalesOrderStatus, SalesOrderStatus | null> = {
    open: null,
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'completed',
    completed: null,
    cancelled: null,
  }
  return transitions[current] ?? null
}

export function canCancel(current: SalesOrderStatus): boolean {
  return !['completed', 'cancelled'].includes(current)
}
