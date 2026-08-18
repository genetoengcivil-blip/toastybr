import { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useFinancialTransactions, useCreateManualTransaction, useFinancialCategories, useCostCenters } from '../hooks'
import { formatCurrency, formatDateTime } from '../utils'

const typeLabels: Record<string, string> = {
  sale: 'Venda',
  purchase: 'Compra',
  payment: 'Pagamento',
  receipt: 'Recebimento',
  manual: 'Manual',
  adjustment: 'Ajuste',
  reversal: 'Estorno',
}

export default function TransactionsTab() {
  const [showCreate, setShowCreate] = useState(false)

  const { data: transactions = [], isLoading } = useFinancialTransactions()
  const { data: categories = [] } = useFinancialCategories()
  const { data: costCenters = [] } = useCostCenters()
  const createTx = useCreateManualTransaction()

  const [form, setForm] = useState({
    direction: 'out' as 'in' | 'out',
    description: '',
    amount: '',
    category_id: '',
    cost_center_id: '',
  })

  const handleCreate = async () => {
    if (!form.description || !form.amount) return
    try {
      await createTx.mutateAsync({
        direction: form.direction,
        amount: parseFloat(form.amount),
        category_id: form.category_id || null,
        cost_center_id: form.cost_center_id || null,
        description: form.description,
      })
      setShowCreate(false)
      setForm({ direction: 'out', description: '', amount: '', category_id: '', cost_center_id: '' })
    } catch { /* toast handled by hook */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
          {transactions.length} lançamento{transactions.length !== 1 ? 's' : ''}
        </h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Lançamento Manual
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse bg-[hsl(var(--muted))]" />)}</div>
      ) : transactions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]">
          Nenhum lançamento financeiro encontrado
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {tx.direction === 'in' ? (
                        <ArrowDownLeft size={16} className="text-emerald-500" />
                      ) : (
                        <ArrowUpRight size={16} className="text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'reversal' ? 'destructive' : 'secondary'}>
                        {typeLabels[tx.type] || tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(tx.occurred_at)}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.direction === 'in' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lançamento Manual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={form.direction === 'in' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setForm({ ...form, direction: 'in' })}
              >
                <ArrowDownLeft size={16} className="mr-1" /> Entrada
              </Button>
              <Button
                variant={form.direction === 'out' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setForm({ ...form, direction: 'out' })}
              >
                <ArrowUpRight size={16} className="mr-1" /> Saída
              </Button>
            </div>
            <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input type="number" step="0.01" placeholder="Valor (R$)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.cost_center_id} onValueChange={(v) => setForm({ ...form, cost_center_id: v })}>
              <SelectTrigger><SelectValue placeholder="Centro de custo" /></SelectTrigger>
              <SelectContent>
                {costCenters.map((cc) => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createTx.isPending}>
              {createTx.isPending ? 'Criando...' : 'Lançar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
