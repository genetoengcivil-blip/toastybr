import { Clock } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { useKitchenOrders, useAdvanceKitchenStatus } from '../features/sales/hooks/useKitchenOrders'
import { useCurrentOrganization } from '../features/auth/context'
import { useOrdersRealtime } from '../features/sales/realtime/useOrdersRealtime'
import { formatElapsed, canAdvanceStatus, ORDER_STATUS_CONFIG } from '../features/sales/utils/status'
import { toast } from 'sonner'
import { Card } from '../components/ui/card'
import { Separator } from '../components/ui/separator'

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between space-y-4 md:space-y-0 md:flex-row">
        <div>
          <h1 className="text-display">Cozinha</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Acompanhe o fluxo de preparo dos pedidos em tempo real
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="hover-lift">
          <RefreshCw size={20} />
        </Button>
      </div>

      {/* Realtime status indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 rounded-md bg-[hsl(var(--muted))]/20 flex items-center justify-center">
          <Clock size={16} className="text-[hsl(var(--muted-foreground))]" />
        </div>
        <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
          Status: {realtimeStatus ?? 'desconectado'}
        </span>
      </div>

      {/* Kitchen board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Carregando pedidos...</div>
        </div>
      ) : (
        <div className="grid gap-6">
          {columns.map((column) => {
            const columnOrders = getOrdersByStatus(column.status)
            const nextStatus = canAdvanceStatus(column.status)
            return (
              <Card
                key={column.status}
                variant="elevated"
                padding="lg"
                className="hover-lift transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-heading">{column.label}</h2>
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs"
                    >
                      {columnOrders.length}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-3">
                    {columnOrders.length === 0 ? (
                      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                        <Clock size={32} className="mx-auto mb-4 opacity-40" />
                        <p className="mt-2 text-sm">Nenhum pedido nesta etapa</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {columnOrders.map((order) => (
                          <Card
                            key={order.id}
                            variant="outline"
                            padding="sm"
                            className="flex items-center gap-4 hover-lift transition-all duration-200 border-l-4"
                            style={{ borderColor: column.color }}
                          >
                            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-[hsl(var(--muted))]/20 flex items-center justify-center">
                              <Clock size={16} className="text-[hsl(var(--muted-foreground))]" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-font-medium truncate">{order.order_number}</p>
                              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                {order.customer_name ?? 'Cliente anônimo'} • {order.sales_order_items.length} itens
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge
                                variant={ORDER_STATUS_CONFIG[order.status]?.variant ?? 'default'}
                                className="text-xs font-medium"
                              >
                                {ORDER_STATUS_CONFIG[order.status]?.label ?? order.status}
                              </Badge>
                              <span className="text-[hsl(var(--muted-foreground))]">
                                {formatElapsed(order.confirmed_at)}
                              </span>
                            </div>
                            {nextStatus && (
                              <Button
                                variant="default"
                                size="sm"
                                className="hover-lift transition-all duration-200"
                                onClick={() => handleAdvance(order.id, order.status)}
                              >
                                Avançar
                              </Button>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Import icons
import { RefreshCw } from 'lucide-react'