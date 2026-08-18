import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
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
import { useInventoryMovements } from '../hooks/useInventoryMovements'
import { getStockStatus, STOCK_STATUS_CONFIG, formatMovementType, getMovementTypeColor } from '../lib/stock-status'
import { INGREDIENT_UNITS } from '../../../lib/supabase/types'
import type { InventoryBalanceWithIngredient } from '../../../lib/supabase/types'

interface DetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance: InventoryBalanceWithIngredient | null
}

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

export function DetailDrawer({ open, onOpenChange, balance }: DetailDrawerProps) {
  const { data: movements = [] } = useInventoryMovements()

  if (!balance) return null

  const ing = balance.ingredients
  const stockValue = balance.quantity * ing.cost_per_unit
  const status = getStockStatus(balance.quantity, balance.minimum_quantity)
  const statusConfig = STOCK_STATUS_CONFIG[status]
  const recentMovements = movements
    .filter((m) => m.ingredient_id === balance.ingredient_id)
    .slice(0, 10)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{ing.name}</SheetTitle>
          <SheetDescription>{getUnitLabel(ing.unit)}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Saldo atual</p>
              <p className="text-2xl font-semibold">{balance.quantity}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{ing.unit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Estoque mínimo</p>
              <p className="text-2xl font-semibold">{balance.minimum_quantity}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{ing.unit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Status</p>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Custo unitário</p>
              <p className="text-lg font-semibold">{formatPrice(ing.cost_per_unit)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Valor em estoque</p>
              <p className="text-lg font-semibold">{formatPrice(stockValue)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-3">Últimas movimentações</h3>
            {recentMovements.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Nenhuma movimentação registrada.
              </p>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">
                          {formatDate(m.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${getMovementTypeColor(m.type)}`}>
                            {formatMovementType(m.type)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{m.quantity}</TableCell>
                        <TableCell className="text-xs">{m.new_quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
