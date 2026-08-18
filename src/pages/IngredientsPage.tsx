import { useState } from 'react'
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Wheat } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { useIngredients, useDeleteIngredient, useToggleIngredientActive } from '../features/ingredients/hooks/useIngredients'
import { IngredientDialog } from '../features/ingredients/components/IngredientDialog'
import { useCurrentOrganization } from '../features/auth/context'
import { toast } from 'sonner'
import type { Ingredient } from '../lib/supabase/types'
import { INGREDIENT_UNITS } from '../lib/supabase/types'

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getUnitLabel(unit: string): string {
  return INGREDIENT_UNITS.find((u) => u.value === unit)?.label ?? unit
}

export default function IngredientsPage() {
  const { role } = useCurrentOrganization()
  const isAdmin = role === 'owner' || role === 'admin' || role === 'manager'

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)

  const { data: ingredients = [], isLoading } = useIngredients()
  const deleteIngredient = useDeleteIngredient()
  const toggleActive = useToggleIngredientActive()

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleToggle(ing: Ingredient) {
    toggleActive.mutate(
      { id: ing.id, current: ing.is_active },
      {
        onSuccess: () =>
          toast.success(ing.is_active ? 'Ingrediente desativado' : 'Ingrediente ativado'),
        onError: () => toast.error('Erro ao alterar status'),
      }
    )
  }

  function handleDelete(ing: Ingredient) {
    if (!confirm(`Excluir ingrediente "${ing.name}"?`)) return
    deleteIngredient.mutate(ing.id, {
      onSuccess: () => toast.success('Ingrediente excluído'),
      onError: (err) => {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('foreign key') || msg.includes('product_recipe_items')) {
          toast.error('Este ingrediente está sendo usado em fichas técnicas. Desative-o em vez de excluir.')
        } else {
          toast.error('Erro ao excluir ingrediente')
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 rounded bg-[hsl(var(--muted))]" />
            <div className="h-4 w-48 mt-2 rounded bg-[hsl(var(--muted))]" />
          </div>
        </div>
        <div className="border rounded-lg">
          <div className="h-64" />
        </div>
      </div>
    )
  }

  const isEmpty = ingredients.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ingredientes</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Gerencie ingredientes e custos unitários
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus size={16} className="mr-2" />
            Novo ingrediente
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[hsl(var(--muted))] p-4 mb-4">
            <Wheat size={32} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Nenhum ingrediente</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-sm">
            Cadastre ingredientes para começar a controlar estoque e custos.
          </p>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Cadastrar primeiro ingrediente
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <Input
              placeholder="Buscar ingrediente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Custo/un</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 5 : 4}
                      className="text-center py-8 text-[hsl(var(--muted-foreground))]"
                    >
                      Nenhum ingrediente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium">{ing.name}</TableCell>
                      <TableCell>{getUnitLabel(ing.unit)}</TableCell>
                      <TableCell>{formatPrice(ing.cost_per_unit)}</TableCell>
                      <TableCell>
                        <Badge variant={ing.is_active ? 'success' : 'secondary'}>
                          {ing.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditing(ing)
                                setDialogOpen(true)
                              }}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleToggle(ing)}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded"
                            >
                              {ing.is_active ? (
                                <ToggleRight size={14} className="text-emerald-500" />
                              ) : (
                                <ToggleLeft size={14} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(ing)}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded text-[hsl(var(--destructive))]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <IngredientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ingredient={editing}
      />
    </div>
  )
}
