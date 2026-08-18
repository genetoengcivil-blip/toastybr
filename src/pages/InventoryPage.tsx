import { useState } from 'react'
import { Search, Plus, Settings2, PackageOpen } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
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

  if (balancesLoading || movementsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 rounded bg-[hsl(var(--muted))]" />
            <div className="h-4 w-48 mt-2 rounded bg-[hsl(var(--muted))]" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-[hsl(var(--muted))]" />
          ))}
        </div>
        <div className="border rounded-lg">
          <div className="h-64" />
        </div>
      </div>
    )
  }

  const isEmpty = balances.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Saldos e movimentações de ingredientes
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setMovementDialogOpen(true)}>
            <Plus size={16} className="mr-2" />
            Movimentar estoque
          </Button>
        )}
      </div>

      {!isEmpty && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Itens em estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Estoque baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{kpis.low}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Sem estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{kpis.out}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Valor total estimado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatPrice(kpis.totalValue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[hsl(var(--muted))] p-4 mb-4">
            <PackageOpen size={32} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Estoque vazio</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 max-w-sm">
            Registre uma movimentação de entrada para iniciar o controle de estoque.
          </p>
          {isAdmin && (
            <Button onClick={() => setMovementDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Registrar primeira entrada
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">Todos ({balances.length})</TabsTrigger>
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="low">Baixo ({kpis.low})</TabsTrigger>
              <TabsTrigger value="critical">Crítico</TabsTrigger>
              <TabsTrigger value="out">Sem estoque ({kpis.out})</TabsTrigger>
            </TabsList>
            <div className="relative w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
              />
              <Input
                placeholder="Buscar ingrediente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <TabsContent value="all">
            <BalanceTable
              balances={filtered}
              isAdmin={isAdmin}
              onOpenDetail={handleOpenDetail}
              onOpenMinQty={handleOpenMinQty}
            />
          </TabsContent>
          <TabsContent value="normal">
            <BalanceTable
              balances={filtered.filter((b) => b.status === 'normal')}
              isAdmin={isAdmin}
              onOpenDetail={handleOpenDetail}
              onOpenMinQty={handleOpenMinQty}
            />
          </TabsContent>
          <TabsContent value="low">
            <BalanceTable
              balances={filtered.filter((b) => b.status === 'low')}
              isAdmin={isAdmin}
              onOpenDetail={handleOpenDetail}
              onOpenMinQty={handleOpenMinQty}
            />
          </TabsContent>
          <TabsContent value="critical">
            <BalanceTable
              balances={filtered.filter((b) => b.status === 'critical')}
              isAdmin={isAdmin}
              onOpenDetail={handleOpenDetail}
              onOpenMinQty={handleOpenMinQty}
            />
          </TabsContent>
          <TabsContent value="out">
            <BalanceTable
              balances={filtered.filter((b) => b.status === 'out')}
              isAdmin={isAdmin}
              onOpenDetail={handleOpenDetail}
              onOpenMinQty={handleOpenMinQty}
            />
          </TabsContent>
        </Tabs>
      )}

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Saldos</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <p className="text-sm text-[hsl(var(--muted-foreground))] py-4">
            Tabela de saldos acima.
          </p>
        </TabsContent>

        <TabsContent value="movements">
          {movements.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-4">
              Nenhuma movimentação registrada.
            </p>
          ) : (
            <div className="border rounded-lg mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Saldo anterior</TableHead>
                    <TableHead>Novo saldo</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{formatDate(m.created_at)}</TableCell>
                      <TableCell className="font-medium">{m.ingredients.name}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${getMovementTypeColor(m.type)}`}>
                          {formatMovementType(m.type)}
                        </span>
                      </TableCell>
                      <TableCell>{m.quantity}</TableCell>
                      <TableCell>{m.previous_quantity}</TableCell>
                      <TableCell>{m.new_quantity}</TableCell>
                      <TableCell className="text-xs text-[hsl(var(--muted-foreground))]">
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
            <TableHead>Ingrediente</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Mínimo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Custo/un</TableHead>
            <TableHead>Valor</TableHead>
            {isAdmin && <TableHead className="w-16">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((b) => {
            const statusConfig = STOCK_STATUS_CONFIG[b.status as keyof typeof STOCK_STATUS_CONFIG]
            return (
              <TableRow key={b.id}>
                <TableCell>
                  <button
                    onClick={() => onOpenDetail(b)}
                    className="font-medium hover:underline underline-offset-2"
                  >
                    {b.ingredients.name}
                  </button>
                </TableCell>
                <TableCell className="text-xs">{getUnitLabel(b.ingredients.unit)}</TableCell>
                <TableCell>{b.quantity}</TableCell>
                <TableCell>{b.minimum_quantity}</TableCell>
                <TableCell>
                  <Badge variant={statusConfig?.variant ?? 'secondary'}>
                    {statusConfig?.label ?? b.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatPrice(b.ingredients.cost_per_unit)}</TableCell>
                <TableCell>{formatPrice(b.stockValue)}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <button
                      onClick={() => onOpenMinQty(b)}
                      className="p-1 hover:bg-[hsl(var(--muted))] rounded"
                      title="Editar estoque mínimo"
                    >
                      <Settings2 size={14} />
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
