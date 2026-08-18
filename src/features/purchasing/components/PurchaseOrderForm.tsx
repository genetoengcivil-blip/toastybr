import { useState } from 'react'
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
import { useSuppliers } from '../hooks/useSuppliers'
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import type { Ingredient } from '../../../lib/supabase/types'

interface PurchaseOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients: Ingredient[]
}

interface OrderItem {
  ingredient_id: string
  quantity: number
  unit_cost: number
}

export function PurchaseOrderForm({ open, onOpenChange, ingredients }: PurchaseOrderFormProps) {
  const { data: suppliers } = useSuppliers()
  const createOrder = useCreatePurchaseOrder()

  const [supplierId, setSupplierId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItem[]>([
    { ingredient_id: '', quantity: 1, unit_cost: 0 },
  ])

  const addItem = () => {
    setItems([...items, { ingredient_id: '', quantity: 1, unit_cost: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updated = [...items]
    if (field === 'ingredient_id') {
      updated[index].ingredient_id = value as string
      // Auto-fill cost from ingredient
      const ing = ingredients.find((i) => i.id === value)
      if (ing) updated[index].unit_cost = ing.cost_per_unit
    } else {
      updated[index][field] = value as number
    }
    setItems(updated)
  }

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unit_cost, 0)

  const handleSubmit = () => {
    const validItems = items.filter((item) => item.ingredient_id && item.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item válido')
      return
    }

    createOrder.mutate(
      {
        supplierId: supplierId || null,
        notes: notes || null,
        items: validItems,
      },
      {
        onSuccess: () => {
          toast.success('Pedido de compra criado')
          onOpenChange(false)
          resetForm()
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const resetForm = () => {
    setSupplierId('')
    setNotes('')
    setItems([{ ingredient_id: '', quantity: 1, unit_cost: 0 }])
  }

  const isLoading = createOrder.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo pedido de compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações do pedido"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Itens</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus size={14} className="mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Ingrediente</th>
                    <th className="text-right p-2 font-medium w-24">Qtd</th>
                    <th className="text-right p-2 font-medium w-28">Custo/un</th>
                    <th className="text-right p-2 font-medium w-28">Subtotal</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="p-2">
                        <Select
                          value={item.ingredient_id}
                          onValueChange={(v) => updateItem(index, 'ingredient_id', v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="text-right"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) =>
                            updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)
                          }
                          className="text-right"
                        />
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        R$ {(item.quantity * item.unit_cost).toFixed(2)}
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end text-sm font-medium">
              Subtotal: R$ {subtotal.toFixed(2)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
