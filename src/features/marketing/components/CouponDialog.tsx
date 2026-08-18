import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select'
import { couponSchema, type CouponFormValues } from '../../customers/types'
import type { Coupon } from '../../../lib/supabase/types'
import { useCreateCoupon, useUpdateCoupon } from '../hooks/useCoupons'
import { toast } from 'sonner'

interface CouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon?: Coupon | null
}

export function CouponDialog({ open, onOpenChange, coupon }: CouponDialogProps) {
  const isEditing = !!coupon
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 0,
      min_order: 0,
      max_uses: null,
      starts_at: '',
      expires_at: '',
      is_active: true,
    },
  })

  const couponType = watch('type')

  useEffect(() => {
    if (open) {
      reset(
        coupon
          ? {
              code: coupon.code,
              type: coupon.type,
              value: coupon.value,
              min_order: coupon.min_order,
              max_uses: coupon.max_uses,
              starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
              expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
              is_active: coupon.is_active,
            }
          : {
              code: '',
              type: 'percentage',
              value: 0,
              min_order: 0,
              max_uses: null,
              starts_at: '',
              expires_at: '',
              is_active: true,
            }
      )
    }
  }, [open, coupon, reset])

  const onSubmit = (data: CouponFormValues) => {
    if (isEditing) {
      updateCoupon.mutate(
        { id: coupon.id, values: data },
        {
          onSuccess: () => {
            toast.success('Cupom atualizado')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    } else {
      createCoupon.mutate(data, {
        onSuccess: () => {
          toast.success('Cupom criado')
          onOpenChange(false)
        },
        onError: (err: Error) => toast.error(err.message),
      })
    }
  }

  const isLoading = createCoupon.isPending || updateCoupon.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar cupom' : 'Novo cupom'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Código *</label>
            <Input {...register('code')} placeholder="EXEMPLO10" className="font-mono" />
            {errors.code && <p className="text-xs text-[hsl(var(--destructive))]">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select
                value={couponType}
                onValueChange={(v) => setValue('type', v as 'percentage' | 'fixed')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('value', { valueAsNumber: true })}
                placeholder={couponType === 'percentage' ? '10' : '5.00'}
              />
              {errors.value && <p className="text-xs text-[hsl(var(--destructive))]">{errors.value.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pedido mínimo (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('min_order', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Máximo de usos</label>
              <Input
                type="number"
                min="1"
                {...register('max_uses', { valueAsNumber: true })}
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Início</label>
              <Input type="datetime-local" {...register('starts_at')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fim</label>
              <Input type="datetime-local" {...register('expires_at')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
