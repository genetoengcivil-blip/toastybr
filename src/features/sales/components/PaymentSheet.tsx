import { useState } from 'react'
import { DollarSign, CreditCard, Smartphone, Banknote } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Separator } from '../../../components/ui/separator'
import { useFinalizeSalesOrder, useCreateSalesOrder } from '../hooks/useSalesOrders'
import { generateOrderNumber } from '../services/order'
import { addPayment as addPaymentService } from '../services/payment'
import { useCurrentOrganization } from '../../auth/context'
import { toast } from 'sonner'
import type { CartItem, PaymentEntry } from '../types'
import type { Customer, Coupon } from '../../../lib/supabase/types'

interface PaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  subtotal: number
  discount: number
  couponDiscount: number
  total: number
  selectedCustomer: Customer | null
  appliedCoupon: Coupon | null
  channel: string
  onSuccess: (orderNumber: string) => void
}

const PAYMENT_ICONS: Record<string, typeof DollarSign> = {
  cash: Banknote,
  pix: Smartphone,
  debit_card: CreditCard,
  credit_card: CreditCard,
  other: DollarSign,
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  debit_card: 'Débito',
  credit_card: 'Crédito',
  other: 'Outro',
}

export function PaymentSheet({
  open,
  onOpenChange,
  items,
  subtotal,
  discount,
  couponDiscount,
  total,
  selectedCustomer,
  appliedCoupon,
  channel,
  onSuccess,
}: PaymentSheetProps) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [activeMethod, setActiveMethod] = useState<string>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [finalizeError, setFinalizeError] = useState<string | null>(null)

  const createOrder = useCreateSalesOrder()
  const finalizeOrder = useFinalizeSalesOrder()

  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = Math.max(0, total - paid)
  const change = Math.max(0, paid - total)

  function addPayment() {
    if (remaining <= 0) return

    let amount = remaining
    if (activeMethod === 'cash' && cashReceived) {
      amount = parseFloat(cashReceived)
      if (isNaN(amount) || amount <= 0) return
    }

    setPayments((prev) => [
      ...prev,
      { method: activeMethod as PaymentEntry['method'], amount },
    ])
    setCashReceived('')
  }

  function removePayment(index: number) {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleFinalize() {
    if (payments.length === 0 || paid < total) {
      setFinalizeError('Pagamento insuficiente')
      return
    }

    setFinalizeError(null)

    try {
      const orderNumber = await generateOrderNumber(orgId)

      const order = await createOrder.mutateAsync({
        orderNumber,
        items,
        channel,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
      })

      for (const payment of payments) {
        await addPaymentService(orgId, order.id, payment)
      }

      const result = await finalizeOrder.mutateAsync({
        order_id: order.id,
        customer_id: selectedCustomer?.id,
        coupon_id: appliedCoupon?.id,
        coupon_code: appliedCoupon?.code,
        coupon_discount: couponDiscount,
        discount,
      })

      toast.success(`Venda ${result.order_number} finalizada!`)
      if (result.change > 0) {
        toast.info(`Troco: R$ ${result.change.toFixed(2)}`)
      }
      if (result.points_earned > 0) {
        toast.info(`${result.points_earned} pontos creditados`)
      }

      onOpenChange(false)
      onSuccess(result.order_number)
      setPayments([])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao finalizar venda'
      setFinalizeError(msg)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle>Pagamento</SheetTitle>
          <SheetDescription>Selecione as formas de pagamento</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>- R$ {discount.toFixed(2)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Cupom</span>
                <span>- R$ {couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method buttons */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PAYMENT_LABELS).map(([key, label]) => {
              const Icon = PAYMENT_ICONS[key]
              return (
                <button
                  key={key}
                  onClick={() => setActiveMethod(key)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                    activeMethod === key
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Cash input */}
          {activeMethod === 'cash' && remaining > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Valor recebido
              </label>
              <Input
                type="number"
                placeholder={`Mínimo: R$ ${remaining.toFixed(2)}`}
                value={cashReceived}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCashReceived(e.target.value)}
                min={remaining}
                step="0.01"
              />
            </div>
          )}

          {/* Add payment button */}
          {remaining > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={addPayment}
              disabled={activeMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) <= 0)}
            >
              Adicionar {PAYMENT_LABELS[activeMethod]}
            </Button>
          )}

          {/* Payment list */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Pagamentos registrados
              </p>
              {payments.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded bg-[hsl(var(--muted))]/50"
                >
                  <span className="text-sm">
                    {PAYMENT_LABELS[p.method]} — R$ {p.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removePayment(i)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Pago</span>
              <span className={paid >= total ? 'text-green-600' : ''}>
                R$ {paid.toFixed(2)}
              </span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Faltam</span>
                <span>R$ {remaining.toFixed(2)}</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between text-sm font-semibold text-green-600">
                <span>Troco</span>
                <span>R$ {change.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Finalize */}
          {finalizeError && (
            <p className="text-xs text-red-500">{finalizeError}</p>
          )}
          <Button
            className="w-full"
            disabled={paid < total || createOrder.isPending || finalizeOrder.isPending}
            onClick={handleFinalize}
          >
            {createOrder.isPending || finalizeOrder.isPending
              ? 'Finalizando...'
              : 'Finalizar venda'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
