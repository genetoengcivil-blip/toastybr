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
import { ingredientSchema, type IngredientFormData } from '../types'
import { useCreateIngredient, useUpdateIngredient } from '../hooks/useIngredients'
import { INGREDIENT_UNITS } from '../../../lib/supabase/types'
import type { Ingredient } from '../../../lib/supabase/types'
import { toast } from 'sonner'

interface IngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient?: Ingredient | null
}

export function IngredientDialog({ open, onOpenChange, ingredient }: IngredientDialogProps) {
  const isEdit = !!ingredient
  const createIngredient = useCreateIngredient()
  const updateIngredient = useUpdateIngredient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      description: null,
      unit: 'un',
      cost_per_unit: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (ingredient) {
        reset({
          name: ingredient.name,
          description: ingredient.description,
          unit: ingredient.unit,
          cost_per_unit: ingredient.cost_per_unit,
          is_active: ingredient.is_active,
        })
      } else {
        reset({ name: '', description: null, unit: 'un', cost_per_unit: 0, is_active: true })
      }
    }
  }, [open, ingredient, reset])

  const isPending = createIngredient.isPending || updateIngredient.isPending

  async function onSubmit(data: IngredientFormData) {
    try {
      if (isEdit && ingredient) {
        await updateIngredient.mutateAsync({ id: ingredient.id, data })
        toast.success('Ingrediente atualizado')
      } else {
        await createIngredient.mutateAsync(data)
        toast.success('Ingrediente criado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar ingrediente')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar ingrediente' : 'Novo ingrediente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <Input placeholder="Ex: Farinha de trigo" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Input placeholder="Descrição do ingrediente" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unidade *</label>
              <select
                className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
                {...register('unit')}
              >
                {INGREDIENT_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="text-sm text-[hsl(var(--destructive))]">{errors.unit.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Custo por unidade (R$) *</label>
              <Input type="number" step="0.0001" {...register('cost_per_unit', { valueAsNumber: true })} />
              {errors.cost_per_unit && (
                <p className="text-sm text-[hsl(var(--destructive))]">{errors.cost_per_unit.message}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ing-active" {...register('is_active')} className="rounded" />
            <label htmlFor="ing-active" className="text-sm font-medium">Ativo</label>
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
