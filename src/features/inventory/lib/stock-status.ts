import type { InventoryStatus } from '../../../lib/supabase/types'

export function getStockStatus(
  quantity: number,
  minimumQuantity: number
): InventoryStatus {
  if (quantity <= 0) return 'out'
  if (minimumQuantity <= 0) return 'normal'
  if (quantity <= minimumQuantity * 0.5) return 'critical'
  if (quantity <= minimumQuantity) return 'low'
  return 'normal'
}

export const STOCK_STATUS_CONFIG: Record<
  InventoryStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  normal: { label: 'Normal', variant: 'success' },
  low: { label: 'Baixo', variant: 'warning' },
  critical: { label: 'Crítico', variant: 'warning' },
  out: { label: 'Sem estoque', variant: 'destructive' },
}

export function formatMovementType(type: string): string {
  const map: Record<string, string> = {
    entry: 'Entrada',
    exit: 'Saída',
    adjustment_in: 'Ajuste positivo',
    adjustment_out: 'Ajuste negativo',
  }
  return map[type] ?? type
}

export function getMovementTypeColor(type: string): string {
  const map: Record<string, string> = {
    entry: 'text-emerald-600',
    exit: 'text-red-600',
    adjustment_in: 'text-blue-600',
    adjustment_out: 'text-amber-600',
  }
  return map[type] ?? ''
}
