import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { supabase } from '../../../lib/supabase/client'
import type { Coupon } from '../../../lib/supabase/types'

interface CouponInputProps {
  organizationId: string
  orderSubtotal: number
  appliedCoupon: Coupon | null
  onApply: (coupon: Coupon, discount: number) => void
  onRemove: () => void
}

export function CouponInput({
  organizationId,
  orderSubtotal,
  appliedCoupon,
  onApply,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleApply() {
    if (!code.trim()) return
    setError(null)
    setLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('organization_id', organizationId)
        .ilike('code', code.trim())
        .eq('is_active', true)
        .single()

      if (fetchError || !data) {
        setError('Cupom inválido')
        return
      }

      const coupon = data as Coupon

      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        setError('Cupom ainda não está ativo')
        return
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setError('Cupom expirado')
        return
      }

      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        setError('Limite de uso atingido')
        return
      }

      if (orderSubtotal < coupon.min_order) {
        setError(`Pedido abaixo do valor mínimo (R$ ${coupon.min_order.toFixed(2)})`)
        return
      }

      let discount = 0
      if (coupon.type === 'percentage') {
        discount = Math.round(orderSubtotal * coupon.value) / 100
      } else {
        discount = coupon.value
      }

      if (discount > orderSubtotal) {
        discount = orderSubtotal
      }

      onApply(coupon, discount)
      setCode('')
    } catch {
      setError('Erro ao validar cupom')
    } finally {
      setLoading(false)
    }
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <Tag size={14} className="text-green-600" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-green-700 dark:text-green-300">
            {appliedCoupon.code}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {appliedCoupon.type === 'percentage'
              ? `${appliedCoupon.value}% de desconto`
              : `R$ ${appliedCoupon.value.toFixed(2)} de desconto`}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          placeholder="Código do cupom"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCode(e.target.value.toUpperCase())
            setError(null)
          }}
          className="h-8 text-xs uppercase"
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleApply()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={handleApply}
          disabled={!code.trim() || loading}
        >
          {loading ? '...' : 'Aplicar'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
