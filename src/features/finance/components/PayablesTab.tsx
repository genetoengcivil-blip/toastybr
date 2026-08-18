import { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Plus, DollarSign } from 'lucide-react'
import { useAccountsPayable, useCreateAccountPayable, usePayAccountPayable, useFinancialCategories, useCostCenters } from '../hooks'
import { formatCurrency, formatDate, getDueDateStatus } from '../utils'

function statusBadge(status: string, dueDate: string) {
  const due = getDueDateStatus(dueDate)
  const isOverdue = due === 'overdue' && status !== 'paid' && status !== 'cancelled'

  if (isOverdue) return <Badge variant="destructive">Vencido</Badge>
  switch (status) {
    case 'paid': return <Badge variant="success">Pago</Badge>
    case 'partially_paid': return <Badge variant="warning">Parcial</Badge>
    case 'cancelled': return <Badge variant="secondary">Cancelado</Badge>
    default: return <Badge variant="outline">Pendente</Badge>
  }
}

export default function PayablesTab() {
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [payItem, setPayItem] = useState<{ id: string; description: string; amount: number; paid: number } | null>(null)
  const [payAmount, setPayAmount] = useState('')

  const { data: payables = [], isLoading } = useAccountsPayable(filter === 'all' ? undefined : filter)
  const { data: categories = [] } = useFinancialCategories('expense')
  const { data: costCenters = [] } = useCostCenters()
  const createAP = useCreateAccountPayable()
  const payAP = usePayAccountPayable()

  const [form, setForm] = useState({
    description: '',
    amount: '',
    due_date: '',
    supplier_id: '',
    category_id: '',
    cost_center_id: '',
    notes: '',
  })

  const handleCreate = async () => {
    if (!form.description || !form.amount || !form.due_date) return
    try {
      await createAP.mutateAsync({
        description: form.description,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        supplier_id: form.supplier_id || null,
        category_id: form.category_id || null,
        cost_center_id: form.cost_center_id || null,
        notes: form.notes || null,
      })
      setShowCreate(false)
      setForm({ description: '', amount: '', due_date: '', supplier_id: '', category_id: '', cost_center_id: '', notes: '' })
    } catch { /* toast handled by hook */ }
  }

  const handlePay = async () => {
    if (!payItem || !payAmount) return
    const amount = parseFloat(payAmount)
    if (amount <= 0 || amount > (payItem.amount - payItem.paid)) return
    try {
      await payAP.mutateAsync({ apId: payItem.id, amount })
      setPayItem(null)
      setPayAmount('')
    } catch { /* toast handled by hook */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="partially_paid">Parciais</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Novo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse bg-[hsl(var(--muted))]" />)}</div>
      ) : payables.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]">
          Nenhuma conta a pagar encontrada
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map((ap) => {
                  const remaining = ap.amount - ap.paid_amount
                  return (
                    <TableRow key={ap.id}>
                      <TableCell className="font-medium">{ap.description}</TableCell>
                      <TableCell>{formatDate(ap.due_date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ap.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ap.paid_amount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(remaining)}</TableCell>
                      <TableCell>{statusBadge(ap.status, ap.due_date)}</TableCell>
                      <TableCell className="text-right">
                        {ap.status !== 'paid' && ap.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPayItem({ id: ap.id, description: ap.description, amount: ap.amount, paid: ap.paid_amount })
                              setPayAmount(String(Math.min(remaining, 100)))
                            }}
                          >
                            <DollarSign size={14} className="mr-1" /> Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta a Pagar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input type="number" step="0.01" placeholder="Valor (R$)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
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
            <Input placeholder="Notas (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createAP.isPending}>
              {createAP.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={!!payItem} onOpenChange={() => setPayItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Conta</DialogTitle>
          </DialogHeader>
          {payItem && (
            <div className="space-y-3">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{payItem.description}</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-[hsl(var(--muted-foreground))]">Original</span><p className="font-medium">{formatCurrency(payItem.amount)}</p></div>
                <div><span className="text-[hsl(var(--muted-foreground))]">Pago</span><p className="font-medium">{formatCurrency(payItem.paid)}</p></div>
                <div><span className="text-[hsl(var(--muted-foreground))]">Restante</span><p className="font-medium">{formatCurrency(payItem.amount - payItem.paid)}</p></div>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder="Valor a pagar"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                max={payItem.amount - payItem.paid}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayItem(null)}>Cancelar</Button>
            <Button onClick={handlePay} disabled={payAP.isPending || !payAmount}>
              {payAP.isPending ? 'Pagando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
