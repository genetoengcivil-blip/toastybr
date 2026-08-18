import { useState } from 'react'
import { usePayAccountPayable } from '../hooks'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

interface PayAccountPayableDialogProps {
  apId: string
  defaultAmount?: number
  onClose?: () => void
}

export function PayAccountPayableDialog({ apId, defaultAmount, onClose }: PayAccountPayableDialogProps) {
  const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : '')
  const pay = usePayAccountPayable()
  const isPending = pay.isPending

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return
    try {
      await pay.mutateAsync({ apId, amount: value })
      onClose?.()
    } catch {
      /* error surfaced via toast in hook */
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="pay-ap-form">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="pay-amount">Valor do pagamento</label>
        <Input
          id="pay-amount"
          type="number"
          step="0.01"
          aria-label="Valor do pagamento"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending || !amount}>
          {isPending ? 'Pagando...' : 'Confirmar pagamento'}
        </Button>
      </div>
    </form>
  )
}
