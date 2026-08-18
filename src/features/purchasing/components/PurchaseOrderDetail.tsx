import { Button } from '../../../components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../../../components/ui/sheet'
import { PoStatusBadge } from './PoStatusBadge'
import type { PurchaseOrderWithSupplier } from '../../../lib/supabase/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Send, XCircle, Truck } from 'lucide-react'

interface PurchaseOrderDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: PurchaseOrderWithSupplier
  onSend: (orderId: string) => void
  onCancel: (orderId: string) => void
  onReceive: () => void
  isUpdating: boolean
}

export function PurchaseOrderDetail({
  open,
  onOpenChange,
  order,
  onSend,
  onCancel,
  onReceive,
  isUpdating,
}: PurchaseOrderDetailProps) {
  const subtotal = order.purchase_order_items.reduce(
    (acc, item) => acc + item.quantity_ordered * item.unit_cost,
    0
  )
  const total = subtotal - order.discount + order.shipping

  const canSend = order.status === 'draft'
  const canCancel = order.status === 'draft' || order.status === 'sent'
  const canReceive = order.status === 'draft' || order.status === 'sent' || order.status === 'partially_received'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            {order.po_number}
            <PoStatusBadge status={order.status} />
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[hsl(var(--muted-foreground))]">Fornecedor</span>
              <p className="font-medium">{order.suppliers?.name ?? '—'}</p>
            </div>
            <div>
              <span className="text-[hsl(var(--muted-foreground))]">Criado em</span>
              <p className="font-medium">
                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            {order.suppliers?.phone && (
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">Telefone</span>
                <p className="font-medium">{order.suppliers.phone}</p>
              </div>
            )}
            {order.suppliers?.email && (
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">Email</span>
                <p className="font-medium">{order.suppliers.email}</p>
              </div>
            )}
          </div>

          {order.notes && (
            <div>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Observações</span>
              <p className="text-sm mt-1">{order.notes}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Itens</h4>
            <div className="border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Ingrediente</th>
                    <th className="text-right p-2 font-medium">Qtd</th>
                    <th className="text-right p-2 font-medium">Recebido</th>
                    <th className="text-right p-2 font-medium">Custo/un</th>
                    <th className="text-right p-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.purchase_order_items.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="p-2">{item.ingredients.name}</td>
                      <td className="p-2 text-right tabular-nums">
                        {item.quantity_ordered.toFixed(4)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {item.quantity_received.toFixed(4)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        R$ {item.unit_cost.toFixed(2)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        R$ {(item.quantity_ordered * item.unit_cost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
              <span className="tabular-nums">R$ {subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Desconto</span>
                <span className="text-[hsl(var(--destructive))] tabular-nums">
                  -R$ {order.discount.toFixed(2)}
                </span>
              </div>
            )}
            {order.shipping > 0 && (
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Frete</span>
                <span className="tabular-nums">R$ {order.shipping.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-base border-t pt-2 mt-2">
              <span>Total</span>
              <span className="tabular-nums">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          {canSend && (
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => onSend(order.id)}
            >
              <Send size={14} className="mr-1" />
              Enviar
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => onCancel(order.id)}
            >
              <XCircle size={14} className="mr-1" />
              Cancelar
            </Button>
          )}
          {canReceive && (
            <Button
              size="sm"
              disabled={isUpdating}
              onClick={onReceive}
            >
              <Truck size={14} className="mr-1" />
              Receber
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
