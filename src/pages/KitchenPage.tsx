import { Clock } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { useKitchenOrders, useAdvanceKitchenStatus } from '../features/sales/hooks/useKitchenOrders'
import { useCurrentOrganization } from '../features/auth/context'
import { useOrdersRealtime } from '../features/sales/realtime/useOrdersRealtime'
import { formatElapsed, canAdvanceStatus, ORDER_STATUS_CONFIG, CHANNEL_LABELS } from '../features/sales/utils/status'
import { toast } from 'sonner'

type ColumnStatus = 'confirmed' | 'preparing' | 'ready'

const columns: { status: ColumnStatus; label: string; color: string }[] = [
  { status: 'confirmed', label: 'Novos', color: 'border-sky-500' },
  { status: 'preparing', label: 'Em preparo', color: 'border-amber-500' },
  { status: 'ready', label: 'Prontos', color: 'border-emerald-500' },
]

export default function KitchenPage() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  const { status: realtimeStatus } = useOrdersRealtime(orgId, { channelPrefix: 'kitchen' })
  const { data: orders, isLoading } = useKitchenOrders()
  const advanceStatus = useAdvanceKitchenStatus()

  function handleAdvance(orderId: string, currentStatus: string) {
    const nextStatus = canAdvanceStatus(currentStatus as ColumnStatus)
    if (!nextStatus) return

    advanceStatus.mutate(
      { orderId, status: nextStatus },
      {
        onSuccess: () => {
          const label = ORDER_STATUS_CONFIG[nextStatus]?.label ?? nextStatus
          toast.success(`Pedido movido para: ${label}`)
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  function getOrdersByStatus(status: ColumnStatus) {
    return (orders ?? []).filter((o) => o.status === status)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cozinha</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Display de produção</p>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              realtimeStatus === 'subscribed' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            aria-label="status de sincronização"
          />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {realtimeStatus === 'subscribed' ? 'Ao vivo' : 'Reconectando…'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-[hsl(var(--muted-foreground))]">
          Carregando pedidos...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colOrders = getOrdersByStatus(col.status)
            return (
              <div key={col.status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <Badge variant="secondary">{colOrders.length}</Badge>
                </div>
                <div
                  className={`rounded-lg border-t-2 ${col.color} bg-[hsl(var(--muted))]/30 p-3 space-y-2 min-h-[200px]`}
                >
                  {colOrders.map((order) => {
                    const nextStatus = canAdvanceStatus(order.status)
                    return (
                      <div
                        key={order.id}
                        className="p-3 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{order.order_number}</span>
                          <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                            <Clock size={12} />
                            {formatElapsed(order.confirmed_at)}
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          {order.sales_order_items.map((item) => (
                            <p key={item.id} className="text-xs text-[hsl(var(--muted-foreground))]">
                              {item.quantity}x {item.product_name}
                              {item.notes && (
                                <span className="italic ml-1">({item.notes})</span>
                              )}
                            </p>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                            <span>{CHANNEL_LABELS[order.channel]}</span>
                            {order.customer_name && (
                              <>
                                <span>•</span>
                                <span>{order.customer_name}</span>
                              </>
                            )}
                          </div>
                          {nextStatus && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleAdvance(order.id, order.status)}
                              disabled={advanceStatus.isPending}
                            >
                              {ORDER_STATUS_CONFIG[nextStatus]?.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
