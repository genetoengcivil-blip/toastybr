import { useState } from 'react'
import { Search, Plus, Settings2, PackageOpen } from 'lucide-react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { useInventoryBalances } from '../features/inventory/hooks/useInventoryBalances'
import { useInventoryMovements } from '../features/inventory/hooks/useInventoryMovements'
import { MovementDialog } from '../features/inventory/components/MovementDialog'
import { MinimumQuantityDialog } from '../features/inventory/components/MinimumQuantityDialog'
import { DetailDrawer } from '../features/inventory/components/DetailDrawer'
import { getStockStatus, STOCK_STATUS_CONFIG, formatMovementType, getMovementTypeColor } from '../features/inventory/lib/stock-status'
import { useCurrentOrganization } from '../features/auth/context'
import { INGREDIENT_UNITS } from '../lib/supabase/types'
import type { InventoryBalanceWithIngredient } from '../lib/supabase/types'

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getUnitLabel(unit: string): string {
  return INGREDIENT_UNITS.find((u) => u.value === unit)?.label ?? unit
}

export default function InventoryPage() {
  const { role } = useCurrentOrganization()
  const isAdmin = role === 'owner' || role === 'admin' || role === 'manager'

  const [tab, setTab] = useState<'all' | 'normal' | 'low' | 'critical' | 'out'>('all')
  const [search, setSearch] = useState('')
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [minQtyDialog, setMinQtyDialog] = useState<{
    open: boolean
    ingredientId: string
    ingredientName: string
    current: number
  }>({ open: false, ingredientId: '', ingredientName: '', current: 0 })
  const [detailDrawer, setDetailDrawer] = useState<{
    open: boolean
    balance: InventoryBalanceWithIngredient | null
  }>({ open: false, balance: null })

  const { data: balances = [], isLoading: balancesLoading } = useInventoryBalances()
  const { data: movements = [], isLoading: movementsLoading } = useInventoryMovements()

  const balancesWithStatus = balances.map((b) => ({
    ...b,
    status: getStockStatus(b.quantity, b.minimum_quantity),
    stockValue: b.quantity * b.ingredients.cost_per_unit,
  }))

  const filtered = balancesWithStatus.filter((b) =>
    b.ingredients.name.toLowerCase().includes(search.toLowerCase())
  )

  const kpis = {
    total: balances.length,
    low: balancesWithStatus.filter((b) => b.status === 'low').length,
    critical: balancesWithStatus.filter((b) => b.status === 'critical').length,
    out: balancesWithStatus.filter((b) => b.status === 'out').length,
    totalValue: balancesWithStatus.reduce((sum, b) => sum + b.stockValue, 0),
  }

  function handleOpenMinQty(balance: InventoryBalanceWithIngredient) {
    setMinQtyDialog({
      open: true,
      ingredientId: balance.ingredient_id,
      ingredientName: balance.ingredients.name,
      current: balance.minimum_quantity,
    })
  }

  function handleOpenDetail(balance: InventoryBalanceWithIngredient) {
    setDetailDrawer({ open: true, balance })
  }

  // Loading state
  if (balancesLoading || movementsLoading) {
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} variant="elevated" padding="lg" className="hover-lift">
              <div className="h-24 rounded bg-[hsl(var(--muted))]/20" />
            </Card>
          ))}
        </div>
        <div className="border rounded-lg bg-[hsl(var(--background))]">
          <div className="h-64 rounded bg-[hsl(var(--muted))]/20" />
        </div>
      </div>
    )
  }

  const isEmpty = balances.length === 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-display">Estoque</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Saldos e movimentações de ingredientes
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setMovementDialogOpen(true)} variant="default" className="hover-lift">
            <Plus size={16} className="mr-2 h-4 w-4" />
            Movimentar estoque
          </Button>
        )}
      </div>

      {!isEmpty && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <Card variant="elevated" padding="lg" className="hover-lift transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Itens em estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-metric">{kpis.total}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" padding="lg" className="hover-lift transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Estoque baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-metric text-amber-600">{kpis.low}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" padding="lg" className="hover-lift transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Sem estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-metric text-red-600">{kpis.out}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" padding="lg" className="hover-lift transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Valor total estimado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-metric">{formatPrice(kpis.totalValue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-48 h-48 rounded-full bg-[hsl(var(--muted))]/20 flex items-center justify-center mb-6">
            <PackageOpen size={32} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <h2 className="text-heading">Estoque vazio</h2>
          <p className="text-body text-[hsl(var(--muted-foreground))] mb-6 max-w-xl">
            Registre uma movimentação de entrada para iniciar o controle de estoque.
          </p>
          {isAdmin && (
            <div className="flex items-center gap-4">
              <Button onClick={() => setMovementDialogOpen(true)} variant="outline" className="hover-lift">
                <Plus size={16} className="mr-2 h-4 w-4" />
                Registrar primeira entrada
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="grid w-full grid-cols-[repeat(5,minmax(0,1fr))] text-sm font-medium">
              <TabsTrigger value="all" className={cn(
                'px-4 py-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200',
                'all' === 'all'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                  : ''
              )}>Todos ({balances.length})</TabsTrigger>
              <TabsTrigger value="normal" className={cn(
                'px-4 py-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200',
                'all' === 'normal'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                  : ''
              )}>Normal</TabsTrigger>
              <TabsTrigger value="low" className={cn(
                'px-4 py-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200',
                'all' === 'low'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                  : ''
              )}>Baixo ({kpis.low})</TabsTrigger>
              <TabsTrigger value="critical" className={cn(
                'px-4 py-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200',
                'all' === 'critical'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                  : ''
              )}>Crítico</TabsTrigger>
              <TabsTrigger value="out" className={cn(
                'px-4 py-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200',
                'all' === 'out'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                  : ''
              )}>Sem estoque ({kpis.out})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 pt-4">
              <div className="border rounded-lg bg-[hsl(var(--card))]">
                <BalanceTable
                  balances={filtered}
                  isAdmin={isAdmin}
                  onOpenDetail={handleOpenDetail}
                  onOpenMinQty={handleOpenMinQty}
                />
              </div>
            </TabsContent>
            <TabsContent value="normal" className="space-y-4 pt-4">
              <div className="border rounded-lg bg-[hsl(var(--card))]">
                <BalanceTable
                  balances={filtered.filter((b) => b.status === 'normal')}
                  isAdmin={isAdmin}
                  onOpenDetail={handleOpenDetail}
                  onOpenMinQty={handleOpenMinQty}
                />
              </div>
            </TabsContent>
            <TabsContent value="low" className="space-y-4 pt-4">
              <div className="border rounded-lg bg-[hsl(var(--card))]">
                <BalanceTable
                  balances={filtered.filter((b) => b.status === 'low')}
                  isAdmin={isAdmin}
                  onOpenDetail={handleOpenDetail}
                  onOpenMinQty={handleOpenMinQty}
                />
              </div>
            </TabsContent>
            <TabsContent value="critical" className="space-y-4 pt-4">
              <div className="border rounded-lg bg-[hsl(var(--card))]">
                <BalanceTable
                  balances={filtered.filter((b) => b.status === 'critical')}
                  isAdmin={isAdmin}
                  onOpenDetail={handleOpenDetail}
                  onOpenMinQty={handleOpenMinQty}
                />
              </div>
            </TabsContent>
            <TabsContent value="out" className="space-y-4 pt-4">
              <div className="border rounded-lg bg-[hsl(var(--card))]">
                <BalanceTable
                  balances={filtered.filter((b) => b.status === 'out')}
                  isAdmin={isAdmin}
                  onOpenDetail={handleOpenDetail}
                  onOpenMinQty={handleOpenMinQty}
                />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <div className="border rounded-lg bg-[hsl(var(--card))] mb-6">
        <Tabs defaultValue="balances" className="mb-4">
          <TabsList className="flex items-center gap-2">
            <TabsTrigger value="balances" className={cn(
              'px-3 py-1 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200',
              'balances' === 'balances'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                : ''
            )}>Saldos</TabsTrigger>
            <TabsTrigger value="movements" className={cn(
              'px-3 py-1 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200',
              'balances' === 'movements'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                : ''
            )}>Movimentações</TabsTrigger>
          </TabsList>
          <TabsContent value="balances" className="pt-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Tabela de saldos acima.
            </p>
          </TabsContent>
          <TabsContent value="movements" className="pt-4">
            {movements.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Nenhuma movimentação registrada.
              </p>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Data
                      </TableHead>
                      <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Ingrediente
                      </TableHead>
                      <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Tipo
                      </TableHead>
                      <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Quantidade
                      </TableHead>
                      <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Saldo anterior
                      </TableHead>
                      <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Novo saldo
                      </TableHead>
                      <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Motivo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id} className="hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200">
                        <TableCell className="px-6 py-3 text-xs whitespace-nowrap">{formatDate(m.created_at)}</TableCell>
                        <TableCell className="px-6 py-3 font-medium whitespace-nowrap">{m.ingredients.name}</TableCell>
                        <TableCell className="px-6 py-3 text-xs whitespace-nowrap">
                          <span className={`text-xs font-medium ${getMovementTypeColor(m.type)}`}>
                            {formatMovementType(m.type)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-xs whitespace-nowrap">{m.quantity}</TableCell>
                        <TableCell className="px-6 py-3 text-xs whitespace-nowrap">{m.previous_quantity}</TableCell>
                        <TableCell className="px-6 py-3 text-xs whitespace-nowrap">{m.new_quantity}</TableCell>
                        <TableCell className="px-6 py-2 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                          {m.reason ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MovementDialog
        open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
      />
      <MinimumQuantityDialog
        open={minQtyDialog.open}
        onOpenChange={(open) => setMinQtyDialog((prev) => ({ ...prev, open }))}
        ingredientId={minQtyDialog.ingredientId}
        ingredientName={minQtyDialog.ingredientName}
        currentMinimum={minQtyDialog.current}
      />
      <DetailDrawer
        open={detailDrawer.open}
        onOpenChange={(open) => setDetailDrawer((prev) => ({ ...prev, open }))}
        balance={detailDrawer.balance}
      />
    </div>
  )
}

function BalanceTable({
  balances,
  isAdmin,
  onOpenDetail,
  onOpenMinQty,
}: {
  balances: (InventoryBalanceWithIngredient & { status: string; stockValue: number })[]
  isAdmin: boolean
  onOpenDetail: (b: InventoryBalanceWithIngredient) => void
  onOpenMinQty: (b: InventoryBalanceWithIngredient) => void
}) {
  if (balances.length === 0) {
    return (
      <div className="border rounded-lg mt-4">
        <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
          Nenhum item encontrado
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg mt-4">
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
              Saldo
            </TableHead>
            <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Mínimo
            </TableHead>
            <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Custo/un
            </TableHead>
            <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Valor
            </TableHead>
            {isAdmin && (
              <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-16">
                Ações
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((b) => {
            const statusConfig = STOCK_STATUS_CONFIG[b.status as keyof typeof STOCK_STATUS_CONFIG]
            return (
              <TableRow key={b.id} className="hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200">
                <TableCell className="px-6 py-3">
                  <button
                    onClick={() => onOpenDetail(b)}
                    className="font-medium hover:underline underline-offset-2"
                  >
                    {b.ingredients.name}
                  </button>
                </TableCell>
                <TableCell className="px-6 py-3 text-xs">{getUnitLabel(b.ingredients.unit)}</TableCell>
                <TableCell className="px-6 py-3 text-xs">{b.quantity}</TableCell>
                <TableCell className="px-6 py-3 text-xs">{b.minimum_quantity}</TableCell>
                <TableCell className="px-6 py-3 text-sm">
                  <Badge variant={statusConfig?.variant ?? 'secondary'} className="text-xs font-medium">
                    {statusConfig?.label ?? b.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-3 text-xs font-metric">{formatPrice(b.ingredients.cost_per_unit)}</TableCell>
                <TableCell className="px-6 py-3 text-xs font-metric">{formatPrice(b.stockValue)}</TableCell>
                {isAdmin && (
                  <TableCell className="px-6 py-3 text-sm whitespace-nowrap flex items-center gap-2">
                    <button
                      onClick={() => onOpenMinQty(b)}
                      className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                      title="Editar estoque mínimo"
                    >
                      <Settings2 size={14} className="h-4 w-4" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}