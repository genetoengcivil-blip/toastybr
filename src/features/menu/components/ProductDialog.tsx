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
import { productSchema, type ProductFormData } from '../types'
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import type { MenuCategory, ProductWithCategory } from '../../../lib/supabase/types'
import { toast } from 'sonner'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ProductWithCategory | null
  categories: MenuCategory[]
}

export function ProductDialog({ open, onOpenChange, product, categories }: ProductDialogProps) {
  const isEdit = !!product
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: null,
      description: null,
      price: 0,
      image_url: null,
      sku: null,
      is_active: true,
      is_available: true,
      sort_order: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          category_id: product.category_id,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          sku: product.sku,
          is_active: product.is_active,
          is_available: product.is_available,
          sort_order: product.sort_order,
        })
      } else {
        reset({
          name: '',
          category_id: categories[0]?.id ?? null,
          description: null,
          price: 0,
          image_url: null,
          sku: null,
          is_active: true,
          is_available: true,
          sort_order: 0,
        })
      }
    }
  }, [open, product, categories, reset])

  const isPending = createProduct.isPending || updateProduct.isPending

  async function onSubmit(data: ProductFormData) {
    try {
      if (isEdit && product) {
        await updateProduct.mutateAsync({ id: product.id, data })
        toast.success('Produto atualizado')
      } else {
        await createProduct.mutateAsync(data)
        toast.success('Produto criado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar produto')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input placeholder="Nome do produto" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Input placeholder="Descrição curta do produto" {...register('description')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <select
              className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
              {...register('category_id')}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço (R$)</label>
              <Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
              {errors.price && (
                <p className="text-sm text-[hsl(var(--destructive))]">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU</label>
              <Input placeholder="Ex: LCH-001" {...register('sku')} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL da imagem (opcional)</label>
            <Input placeholder="https://..." {...register('image_url')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="prod-active" {...register('is_active')} className="rounded" />
              <label htmlFor="prod-active" className="text-sm font-medium">Ativo</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="prod-available" {...register('is_available')} className="rounded" />
              <label htmlFor="prod-available" className="text-sm font-medium">Disponível</label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ordem</label>
            <Input type="number" {...register('sort_order', { valueAsNumber: true })} />
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
