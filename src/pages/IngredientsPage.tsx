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
import { Card } from '../components/ui/card'

function getUnitLabel(unit: string): string {
  return INGREDIENT_UNITS.find((u) => u.value === unit)?.label ?? unit
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-32 h-8 rounded bg-[hsl(var(--muted))] animate-pulse" />
            <div className="w-48 h-4 rounded bg-[hsl(var(--muted))] animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-6 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
            <div className="w-32 h-6 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
            <div className="w-20 h-6 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
          </div>
        </div>
        <div className="border rounded-lg bg-[hsl(var(--background))]">
          <div className="h-64 rounded bg-[hsl(var(--muted))]/20" />
        </div>
      </div>
    )
  }

  const isEmpty = ingredients.length === 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-display">Ingredientes</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Gerencie ingredientes e custos unitários
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            variant="default"
            className="hover-lift"
          >
            <Plus size={16} className="mr-2 h-4 w-4" />
            Novo ingrediente
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-48 h-48 rounded-full bg-[hsl(var(--muted))]/20 flex items-center justify-center mb-6">
            <Wheat size={32} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <h2 className="text-heading">Nenhum ingrediente</h2>
          <p className="text-body text-[hsl(var(--muted-foreground))] mb-6 max-w-xl">
            Cadastre ingredientes para começar a controlar estoque e custos.
          </p>
          {isAdmin && (
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
                variant="outline"
                className="hover-lift"
              >
                <Plus size={16} className="mr-2 h-4 w-4" />
                Cadastrar primeiro ingrediente
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="relative w-64 mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
            />
            <Input
              placeholder="Buscar ingrediente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-lg bg-[hsl(var(--card))]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Ingrediente
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Unidade
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Custo/un
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </TableHead>
                  {isAdmin && (
                    <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-16">
                      Ações
                    </TableHead>
                  )}
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
                    <TableRow
                      key={ing.id}
                      className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                    >
                      <TableCell className="px-6 py-4 text-font-medium whitespace-nowrap">
                        {ing.name}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {getUnitLabel(ing.unit)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-metric whitespace-nowrap">
                        R$ {ing.cost_per_unit.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <Badge
                          variant={ing.is_active ? 'success' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {ing.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditing(ing)
                              setDialogOpen(true)
                            }}
                            className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                            title="Editar"
                          >
                            <Edit size={14} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(ing)}
                            className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                          >
                            {ing.is_active ? (
                              <ToggleRight size={14} className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <ToggleLeft size={14} className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(ing)}
                            className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200 text-[hsl(var(--destructive))]"
                            title="Excluir"
                          >
                            <Trash2 size={14} className="h-4 w-4" />
                          </button>
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