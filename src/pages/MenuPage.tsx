import { useState } from 'react'
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed, ScrollText } from 'lucide-react'
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
import { useCategories, useDeleteCategory } from '../features/menu/hooks/useCategories'
import {
  useProducts,
  useDeleteProduct,
  useToggleProductAvailability,
} from '../features/menu/hooks/useProducts'
import { CategoryDialog } from '../features/menu/components/CategoryDialog'
import { ProductDialog } from '../features/menu/components/ProductDialog'
import { RecipeEditor } from '../features/recipes/components/RecipeEditor'
import { useCurrentOrganization } from '../features/auth/context'
import { toast } from 'sonner'
import type { MenuCategory, ProductWithCategory } from '../lib/supabase/types'

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MenuPage() {
  const { role } = useCurrentOrganization()
  const isAdmin = role === 'owner' || role === 'admin' || role === 'manager'

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null)
  const [recipeEditorOpen, setRecipeEditorOpen] = useState(false)
  const [recipeProduct, setRecipeProduct] = useState<ProductWithCategory | null>(null)

  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const deleteCategory = useDeleteCategory()
  const deleteProduct = useDeleteProduct()
  const toggleAvailability = useToggleProductAvailability()

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || p.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  function getCategoryName(id: string | null): string {
    if (!id) return 'Sem categoria'
    return categories.find((c) => c.id === id)?.name ?? '—'
  }

  function handleToggleAvailability(product: ProductWithCategory) {
    toggleAvailability.mutate(
      { id: product.id, current: product.is_available },
      {
        onSuccess: () =>
          toast.success(product.is_available ? 'Produto desativado' : 'Produto ativado'),
        onError: () => toast.error('Erro ao alterar disponibilidade'),
      }
    )
  }

  function handleDeleteCategory(cat: MenuCategory) {
    if (!confirm(`Excluir categoria "${cat.name}"? Produtos ficarão sem categoria.`)) return
    deleteCategory.mutate(cat.id, {
      onSuccess: () => toast.success('Categoria excluída'),
      onError: () => toast.error('Erro ao excluir categoria'),
    })
  }

  function handleDeleteProduct(prod: ProductWithCategory) {
    if (!confirm(`Excluir produto "${prod.name}"?`)) return
    deleteProduct.mutate(prod.id, {
      onSuccess: () => toast.success('Produto excluído'),
      onError: () => toast.error('Erro ao excluir produto'),
    })
  }

  function openRecipeEditor(product: ProductWithCategory) {
    setRecipeProduct(product)
    setRecipeEditorOpen(true)
  }

  if (categoriesLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 rounded bg-[hsl(var(--muted))]" />
            <div className="h-4 w-48 mt-2 rounded bg-[hsl(var(--muted))]" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-24 rounded-full bg-[hsl(var(--muted))]" />
          ))}
        </div>
        <div className="border rounded-lg">
          <div className="h-64" />
        </div>
      </div>
    )
  }

  const isEmpty = categories.length === 0 && products.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cardápio</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Gerencie categorias e produtos
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingCategory(null)
                setCategoryDialogOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Nova categoria
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(null)
                setProductDialogOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Novo produto
            </Button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[hsl(var(--muted))] p-4 mb-4">
            <UtensilsCrossed size={32} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Cardápio vazio</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-sm">
            Cadastre categorias e produtos para começar a usar o cardápio do seu restaurante.
          </p>
          {isAdmin && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryDialogOpen(true)
                }}
              >
                <Plus size={16} className="mr-2" />
                Criar primeira categoria
              </Button>
              <Button
                onClick={() => {
                  setEditingProduct(null)
                  setProductDialogOpen(true)
                }}
              >
                <Plus size={16} className="mr-2" />
                Cadastrar produto
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
              />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter(null)}
                className="rounded-full"
              >
                <Badge variant={categoryFilter === null ? 'default' : 'secondary'}>
                  Todas ({products.length})
                </Badge>
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category_id === cat.id).length
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                    className="group relative"
                  >
                    <Badge variant={categoryFilter === cat.id ? 'default' : 'secondary'}>
                      {cat.name} ({count})
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-28">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 7 : 6}
                      className="text-center py-8 text-[hsl(var(--muted-foreground))]"
                    >
                      {products.length === 0
                        ? 'Nenhum produto cadastrado'
                        : 'Nenhum produto encontrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{getCategoryName(product.category_id)}</TableCell>
                      <TableCell className="font-mono text-xs">{product.sku ?? '—'}</TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => openRecipeEditor(product)}
                          className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline underline-offset-2 flex items-center gap-1"
                        >
                          <ScrollText size={12} />
                          Ficha técnica
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_available ? 'success' : 'secondary'}>
                          {product.is_available ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(product)
                                setProductDialogOpen(true)
                              }}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleAvailability(product)}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded"
                              title={product.is_available ? 'Desativar' : 'Ativar'}
                            >
                              {product.is_available ? (
                                <ToggleRight size={14} className="text-emerald-500" />
                              ) : (
                                <ToggleLeft size={14} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded text-[hsl(var(--destructive))]"
                              title="Excluir"
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

          {categories.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Categorias</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {products.filter((p) => p.category_id === cat.id).length} produtos
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat)
                            setCategoryDialogOpen(true)
                          }}
                          className="p-1 hover:bg-[hsl(var(--muted))] rounded"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 hover:bg-[hsl(var(--muted))] rounded text-[hsl(var(--destructive))]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
      />
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={categories}
      />
      <RecipeEditor
        open={recipeEditorOpen}
        onOpenChange={setRecipeEditorOpen}
        product={recipeProduct}
      />
    </div>
  )
}
