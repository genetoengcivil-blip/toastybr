import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import { Badge } from '../../../components/ui/badge'
import { Separator } from '../../../components/ui/separator'
import { ORDER_STATUS_CONFIG, CHANNEL_LABELS, PAYMENT_METHOD_LABELS } from '../utils/status'
import type { SalesOrderDetail } from '../../../lib/supabase/types'

interface OrderDetailSheetProps {
  order: SalesOrderDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailSheet({ order, open, onOpenChange }: OrderDetailSheetProps) {
  if (!order) return null

  const statusConfig = ORDER_STATUS_CONFIG[order.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle>{order.order_number}</SheetTitle>
          <SheetDescription>Detalhes do pedido</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Status + Channel */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <Badge variant="secondary">{CHANNEL_LABELS[order.channel]}</Badge>
          </div>

          {/* Customer */}
          {order.customer_name && (
            <div className="p-3 rounded-md bg-[hsl(var(--muted))]/50">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Cliente</p>
              <p className="text-sm font-medium">{order.customer_name}</p>
              {order.customer_phone && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{order.customer_phone}</p>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Itens</p>
            <div className="space-y-1">
              {order.sales_order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm p-2 rounded bg-[hsl(var(--muted))]/50"
                >
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
              <span>R$ {order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>- R$ {order.discount.toFixed(2)}</span>
              </div>
            )}
            {order.coupon_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Cupom ({order.coupon_code})</span>
                <span>- R$ {order.coupon_discount.toFixed(2)}</span>
              </div>
            )}
            {order.service_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Taxa de serviço</span>
                <span>R$ {order.service_fee.toFixed(2)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Frete</span>
                <span>R$ {order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>R$ {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payments */}
          {order.sales_payments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
                Pagamentos
              </p>
              <div className="space-y-1">
                {order.sales_payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm p-2 rounded bg-[hsl(var(--muted))]/50"
                  >
                    <span>{PAYMENT_METHOD_LABELS[p.method]}</span>
                    <span className="font-medium">R$ {p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
            <p>Aberto: {new Date(order.opened_at).toLocaleString('pt-BR')}</p>
            {order.confirmed_at && (
              <p>Confirmado: {new Date(order.confirmed_at).toLocaleString('pt-BR')}</p>
            )}
            {order.completed_at && (
              <p>Concluído: {new Date(order.completed_at).toLocaleString('pt-BR')}</p>
            )}
            {order.cancelled_at && (
              <p>Cancelado: {new Date(order.cancelled_at).toLocaleString('pt-BR')}</p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
                Observações
              </p>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
