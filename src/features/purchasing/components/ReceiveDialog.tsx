import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'
import { useReceivePurchaseOrder } from '../hooks/usePurchaseOrders'
import { toast } from 'sonner'
import type { PurchaseOrderWithSupplier } from '../../../lib/supabase/types'

interface ReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: PurchaseOrderWithSupplier
}

export function ReceiveDialog({ open, onOpenChange, order }: ReceiveDialogProps) {
  const receiveOrder = useReceivePurchaseOrder()
  const [notes, setNotes] = useState('')

  const pendingItems = order.purchase_order_items.filter(
    (item) => item.quantity_received < item.quantity_ordered
  )

  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        pendingItems.map((item) => [item.id, item.quantity_ordered - item.quantity_received])
      ) || {}
  )

  const updateQuantity = (itemId: string, value: number) => {
    setReceiveQuantities((prev) => ({ ...prev, [itemId]: value }))
  }

  const handleSubmit = () => {
    const items = pendingItems
      .filter((item) => {
        const qty = receiveQuantities[item.id] ?? 0
        return qty > 0
      })
      .map((item) => ({
        po_item_id: item.id,
        quantity: receiveQuantities[item.id] ?? 0,
      }))

    if (items.length === 0) {
      toast.error('Informe a quantidade para pelo menos um item')
      return
    }

    receiveOrder.mutate(
      {
        poId: order.id,
        items,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success('Recebimento registrado com sucesso')
          onOpenChange(false)
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const totalReceiving = pendingItems.reduce((acc, item) => {
    const qty = receiveQuantities[item.id] ?? 0
    return acc + qty * item.unit_cost
  }, 0)

  const isLoading = receiveOrder.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Receber pedido {order.po_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações do recebimento"
            />
          </div>

          <div className="border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Ingrediente</th>
                  <th className="text-right p-2 font-medium">Pendente</th>
                  <th className="text-right p-2 font-medium">Receber</th>
                  <th className="text-right p-2 font-medium">Custo/un</th>
                  <th className="text-right p-2 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pendingItems.map((item) => {
                  const qty = receiveQuantities[item.id] ?? 0
                  const pending = item.quantity_ordered - item.quantity_received
                  return (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="p-2">{item.ingredients.name}</td>
                      <td className="p-2 text-right tabular-nums">
                        {pending.toFixed(4)}
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          max={pending}
                          value={qty}
                          onChange={(e) =>
                            updateQuantity(item.id, parseFloat(e.target.value) || 0)
                          }
                          className="text-right"
                        />
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        R$ {item.unit_cost.toFixed(2)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        R$ {(qty * item.unit_cost).toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end text-sm font-medium">
            Total a receber: R$ {totalReceiving.toFixed(2)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Recebendo...' : 'Confirmar recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
