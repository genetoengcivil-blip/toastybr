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
import { minimumQuantitySchema, type MinimumQuantityFormData } from '../types'
import { useUpdateMinimumQuantity } from '../hooks/useInventoryMovements'
import { toast } from 'sonner'

interface MinimumQuantityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredientId: string
  ingredientName: string
  currentMinimum: number
}

export function MinimumQuantityDialog({
  open,
  onOpenChange,
  ingredientId,
  ingredientName,
  currentMinimum,
}: MinimumQuantityDialogProps) {
  const updateMinimum = useUpdateMinimumQuantity()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MinimumQuantityFormData>({
    resolver: zodResolver(minimumQuantitySchema),
    defaultValues: { minimum_quantity: currentMinimum },
  })

  useEffect(() => {
    if (open) {
      reset({ minimum_quantity: currentMinimum })
    }
  }, [open, currentMinimum, reset])

  const isPending = updateMinimum.isPending

  async function onSubmit(data: MinimumQuantityFormData) {
    try {
      await updateMinimum.mutateAsync({
        ingredientId,
        minimum: data.minimum_quantity,
      })
      toast.success('Estoque mínimo atualizado')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar estoque mínimo')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Estoque mínimo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {ingredientName}
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantidade mínima</label>
            <Input type="number" step="0.01" {...register('minimum_quantity', { valueAsNumber: true })} />
            {errors.minimum_quantity && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {errors.minimum_quantity.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
