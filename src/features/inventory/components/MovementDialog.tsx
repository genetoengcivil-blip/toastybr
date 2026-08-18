import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { movementSchema, type MovementFormData } from '../types'
import { useApplyMovement } from '../hooks/useInventoryMovements'
import { useIngredients } from '../../ingredients/hooks/useIngredients'
import { toast } from 'sonner'

const MOVEMENT_TYPES = [
  { value: 'entry', label: 'Entrada' },
  { value: 'exit', label: 'Saída' },
  { value: 'adjustment_in', label: 'Ajuste positivo' },
  { value: 'adjustment_out', label: 'Ajuste negativo' },
]

interface MovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MovementDialog({ open, onOpenChange }: MovementDialogProps) {
  const applyMovement = useApplyMovement()
  const { data: ingredients = [] } = useIngredients()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      ingredient_id: '',
      type: 'entry',
      quantity: 0,
      reason: '',
    },
  })

  const selectedType = watch('type')
  const isExit = selectedType === 'exit' || selectedType === 'adjustment_out'

  useEffect(() => {
    if (open) {
      reset({ ingredient_id: '', type: 'entry', quantity: 0, reason: '' })
    }
  }, [open, reset])

  const isPending = applyMovement.isPending

  async function onSubmit(data: MovementFormData) {
    try {
      await applyMovement.mutateAsync({
        ingredient_id: data.ingredient_id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason || null,
      })
      toast.success('Movimentação registrada')
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao registrar movimentação'
      if (msg.includes('Saldo insuficiente')) {
        toast.error(msg)
      } else {
        toast.error(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentar estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ingrediente *</label>
            <select
              className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
              {...register('ingredient_id')}
            >
              <option value="">Selecione</option>
              {ingredients
                .filter((i) => i.is_active)
                .map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </option>
                ))}
            </select>
            {errors.ingredient_id && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.ingredient_id.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo *</label>
            <select
              className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
              {...register('type')}
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.type.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantidade *</label>
            <Input type="number" step="0.01" {...register('quantity', { valueAsNumber: true })} />
            {errors.quantity && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.quantity.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo (opcional)</label>
            <Input placeholder="Ex: Compra, Perda, Contagem..." {...register('reason')} />
          </div>
          {isExit && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              O banco de dados verificará se há saldo suficiente.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
