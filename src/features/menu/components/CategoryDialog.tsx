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
import { categorySchema, type CategoryFormData } from '../types'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import type { MenuCategory } from '../../../lib/supabase/types'
import { toast } from 'sonner'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: MenuCategory | null
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEdit = !!category
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: null,
      sort_order: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (category) {
        reset({
          name: category.name,
          description: category.description,
          sort_order: category.sort_order,
          is_active: category.is_active,
        })
      } else {
        reset({ name: '', description: null, sort_order: 0, is_active: true })
      }
    }
  }, [open, category, reset])

  const isPending = createCategory.isPending || updateCategory.isPending

  async function onSubmit(data: CategoryFormData) {
    try {
      if (isEdit && category) {
        await updateCategory.mutateAsync({ id: category.id, data })
        toast.success('Categoria atualizada')
      } else {
        await createCategory.mutateAsync(data)
        toast.success('Categoria criada')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar categoria')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input placeholder="Ex: Lanches" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Input placeholder="Descrição curta da categoria" {...register('description')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ordem</label>
            <Input type="number" {...register('sort_order', { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="cat-active" {...register('is_active')} className="rounded" />
            <label htmlFor="cat-active" className="text-sm font-medium">Ativa</label>
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
