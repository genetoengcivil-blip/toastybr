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
import { cn } from '../lib/utils'
import { Card } from '../components/ui/card'
import { Separator } from '../components/ui/separator'

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

  // Loading state
  if (categoriesLoading || productsLoading) {
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

  const isEmpty = categories.length === 0 && products.length === 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-display">Cardápio</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Gerencie categorias e produtos
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditingCategory(null)
                setCategoryDialogOpen(true)
              }}
              className="hover-lift"
            >
              <Plus size={16} className="mr-2 h-4 w-4" />
              Nova categoria
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(null)
                setProductDialogOpen(true)
              }}
              variant="default"
              className="hover-lift"
            >
              <Plus size={16} className="mr-2 h-4 w-4" />
              Novo produto
            </Button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-48 h-48 rounded-full bg-[hsl(var(--muted))]/20 flex items-center justify-center mb-6">
            <UtensilsCrossed size={32} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <h2 className="text-heading">Cardápio vazio</h2>
          <p className="text-body text-[hsl(var(--muted-foreground))] mb-6 max-w-xl">
            Cadastre categorias e produtos para começar a usar o cardápio do seu restaurante.
          </p>
          {isAdmin && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryDialogOpen(true)
                }}
                className="hover-lift"
              >
                <Plus size={16} className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </Button>
              <Button
                onClick={() => {
                  setEditingProduct(null)
                  setProductDialogOpen(true)
                }}
                variant="default"
                className="hover-lift"
              >
                <Plus size={16} className="mr-2 h-4 w-4" />
                Cadastrar produto
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
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
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setCategoryFilter(null)}
                className="group relative"
              >
                <Badge
                  variant={categoryFilter === null ? 'secondary' : 'outline'}
                  className="text-xs font-medium hover-lift transition-all duration-200"
                >
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
                    <Badge
                      variant={categoryFilter === cat.id ? 'default' : 'outline'}
                      className="text-xs font-medium hover-lift transition-all duration-200"
                    >
                      {cat.name} ({count})
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}

          <div className="border rounded-lg bg-[hsl(var(--card))]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Produto
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Categoria
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    SKU
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Preço
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Ficha
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </TableHead>
                  {isAdmin && (
                    <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-20">
                      Ações
                    </TableHead>
                  )}
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
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                      onClick={() => openRecipeEditor(product)}
                    >
                      <TableCell className="px-6 py-4 text-font-medium whitespace-nowrap">
                        {product.name}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {getCategoryName(product.category_id)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-metric whitespace-nowrap">
                        {product.sku ?? '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-metric whitespace-nowrap">
                        R$ {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <button className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline underline-offset-2 flex items-center gap-2">
                          <ScrollText size={12} className="h-4 w-4" />
                          Ficha técnica
                        </button>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <Badge
                          variant={product.is_available ? 'success' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {product.is_available ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product)
                              setProductDialogOpen(true)
                            }}
                            className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                            title="Editar"
                          >
                            <Edit size={14} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                            title={product.is_available ? 'Desativar' : 'Ativar'}
                          >
                            {product.is_available ? (
                              <ToggleRight size={14} className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <ToggleLeft size={14} className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
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

          {categories.length > 0 && (
            <div className="mt-8">
              <h2 className="text-heading mb-4">Categorias</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category_id === cat.id).length
                  return (
                    <Card
                      key={cat.id}
                      variant="elevated"
                      padding="lg"
                      className="hover-lift transition-all duration-200 border-l-4"
                      style={{ borderColor: 'hsl(var(--primary))' }}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-heading">{cat.name}</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                              {count} produtos
                            </p>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingCategory(cat)
                                  setCategoryDialogOpen(true)
                                }}
                                className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                              >
                                <Edit size={14} className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200 text-[hsl(var(--destructive))]"
                              >
                                <Trash2 size={14} className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
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