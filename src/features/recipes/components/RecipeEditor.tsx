import { useState } from 'react'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { Separator } from '../../../components/ui/separator'
import {
  useProductRecipe,
  useAddRecipeItem,
  useUpdateRecipeItem,
  useRemoveRecipeItem,
} from '../hooks/useRecipe'
import { useIngredients } from '../../ingredients/hooks/useIngredients'
import {
  calculateProductCost,
  calculateGrossProfit,
  calculateGrossMargin,
  getMarginLevel,
  MARGIN_LEVEL_CONFIG,
} from '../lib/cost-engine'
import type { ProductWithCategory } from '../../../lib/supabase/types'
import { toast } from 'sonner'

interface RecipeEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductWithCategory | null
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function RecipeEditor({ open, onOpenChange, product }: RecipeEditorProps) {
  const productId = product?.id ?? ''
  const { data: recipeItems = [], isLoading } = useProductRecipe(productId)
  const { data: ingredients = [] } = useIngredients()
  const addRecipeItem = useAddRecipeItem()
  const updateRecipeItem = useUpdateRecipeItem()
  const removeRecipeItem = useRemoveRecipeItem()

  const [selectedIngredientId, setSelectedIngredientId] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [wastePercent, setWastePercent] = useState<number>(0)

  const availableIngredients = ingredients.filter(
    (ing) =>
      ing.is_active &&
      !recipeItems.some((ri) => ri.ingredient_id === ing.id)
  )

  const productCost = calculateProductCost(recipeItems)
  const grossProfit = product ? calculateGrossProfit(product.price, productCost) : 0
  const grossMargin = product ? calculateGrossMargin(product.price, productCost) : 0
  const marginLevel = getMarginLevel(grossMargin)
  const marginConfig = MARGIN_LEVEL_CONFIG[marginLevel]

  function handleAddItem() {
    if (!selectedIngredientId || quantity <= 0 || !productId) return

    addRecipeItem.mutate(
      { product_id: productId, ingredient_id: selectedIngredientId, quantity, waste_percent: wastePercent },
      {
        onSuccess: () => {
          toast.success('Ingrediente adicionado')
          setSelectedIngredientId('')
          setQuantity(0)
          setWastePercent(0)
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao adicionar'),
      }
    )
  }

  function handleUpdateQuantity(id: string, newQuantity: number, productId: string) {
    if (newQuantity <= 0) return
    updateRecipeItem.mutate(
      { id, data: { quantity: newQuantity }, productId },
      {
        onError: () => toast.error('Erro ao atualizar quantidade'),
      }
    )
  }

  function handleUpdateWaste(id: string, newWaste: number, productId: string) {
    updateRecipeItem.mutate(
      { id, data: { waste_percent: newWaste }, productId },
      {
        onError: () => toast.error('Erro ao atualizar desperdício'),
      }
    )
  }

  function handleRemove(id: string, productId: string) {
    if (!confirm('Remover ingrediente da ficha técnica?')) return
    removeRecipeItem.mutate(
      { id, productId },
      {
        onSuccess: () => toast.success('Ingrediente removido'),
        onError: () => toast.error('Erro ao remover ingrediente'),
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ficha técnica</SheetTitle>
          <SheetDescription>
            {product ? `${product.name} — ${formatPrice(product.price)}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-[hsl(var(--muted))]" />
              ))}
            </div>
          ) : recipeItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Nenhum ingrediente na ficha técnica.
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Adicione ingredientes abaixo.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="w-20">Qtd</TableHead>
                    <TableHead className="w-16">Un.</TableHead>
                    <TableHead className="w-20">Desp. %</TableHead>
                    <TableHead className="w-24">Custo</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeItems.map((item) => {
                    const effectiveQty = item.quantity * (1 + item.waste_percent / 100)
                    const itemCost = effectiveQty * item.ingredients.cost_per_unit
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">
                          {item.ingredients.name}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(item.id, parseFloat(e.target.value) || 0, productId)
                            }
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-[hsl(var(--muted-foreground))]">
                          {item.ingredients.unit}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.waste_percent}
                            onChange={(e) =>
                              handleUpdateWaste(item.id, parseFloat(e.target.value) || 0, productId)
                            }
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {formatPrice(itemCost)}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleRemove(item.id, productId)}
                            className="p-1 hover:bg-[hsl(var(--muted))] rounded text-[hsl(var(--destructive))]"
                          >
                            <Trash2 size={12} />
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Adicionar ingrediente</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[hsl(var(--muted-foreground))]">Ingrediente</label>
                <select
                  className="w-full h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {availableIngredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[hsl(var(--muted-foreground))]">Quantidade</label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[hsl(var(--muted-foreground))]">Desperdício %</label>
                <Input
                  type="number"
                  step="0.01"
                  value={wastePercent || ''}
                  onChange={(e) => setWastePercent(parseFloat(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddItem}
              disabled={!selectedIngredientId || quantity <= 0 || addRecipeItem.isPending}
            >
              <Plus size={14} className="mr-1" />
              Adicionar
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Resumo de custo</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Custo total</p>
                <p className="text-lg font-semibold">{formatPrice(productCost)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Preço de venda</p>
                <p className="text-lg font-semibold">{product ? formatPrice(product.price) : '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Lucro bruto estimado</p>
                <p className={`text-lg font-semibold ${grossProfit < 0 ? 'text-red-600' : ''}`}>
                  {formatPrice(grossProfit)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Margem bruta</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-semibold ${marginConfig.color}`}>
                    {grossMargin.toFixed(1)}%
                  </p>
                  <Badge variant={marginConfig.variant}>{marginConfig.label}</Badge>
                </div>
              </div>
            </div>
            {marginLevel === 'negative' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md p-2">
                <AlertTriangle size={14} />
                Margem negativa — o custo supera o preço de venda.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
