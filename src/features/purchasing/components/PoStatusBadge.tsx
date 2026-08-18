import { Badge } from '../../../components/ui/badge'
import type { PurchaseOrderStatus } from '../../../lib/supabase/types'

const STATUS_CONFIG: Record<
  PurchaseOrderStatus,
  { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary' }
> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  sent: { label: 'Enviado', variant: 'info' },
  partially_received: { label: 'Parcial', variant: 'warning' },
  received: { label: 'Recebido', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

interface PoStatusBadgeProps {
  status: PurchaseOrderStatus
}

export function PoStatusBadge({ status }: PoStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
