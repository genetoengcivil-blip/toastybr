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
import { useAccountsReceivable, useCreateAccountReceivable, useReceiveAccountReceivable, useFinancialCategories, useCostCenters } from '../hooks'
import { formatCurrency, formatDate, getDueDateStatus } from '../utils'

function statusBadge(status: string, dueDate: string) {
  const due = getDueDateStatus(dueDate)
  const isOverdue = due === 'overdue' && status !== 'received' && status !== 'cancelled'
  if (isOverdue) return <Badge variant="destructive">Vencido</Badge>
  switch (status) {
    case 'received': return <Badge variant="success">Recebido</Badge>
    case 'partially_received': return <Badge variant="warning">Parcial</Badge>
    case 'cancelled': return <Badge variant="secondary">Cancelado</Badge>
    default: return <Badge variant="outline">Pendente</Badge>
  }
}

export default function ReceivablesTab() {
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [receiveItem, setReceiveItem] = useState<{ id: string; description: string; amount: number; received: number } | null>(null)
  const [receiveAmount, setReceiveAmount] = useState('')

  const { data: receivables = [], isLoading } = useAccountsReceivable(filter === 'all' ? undefined : filter)
  const { data: categories = [] } = useFinancialCategories('income')
  const { data: costCenters = [] } = useCostCenters()
  const createAR = useCreateAccountReceivable()
  const receiveAR = useReceiveAccountReceivable()

  const [form, setForm] = useState({
    description: '',
    amount: '',
    due_date: '',
    customer_id: '',
    category_id: '',
    cost_center_id: '',
    notes: '',
  })

  const handleCreate = async () => {
    if (!form.description || !form.amount || !form.due_date) return
    try {
      await createAR.mutateAsync({
        description: form.description,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        customer_id: form.customer_id || null,
        category_id: form.category_id || null,
        cost_center_id: form.cost_center_id || null,
        notes: form.notes || null,
      })
      setShowCreate(false)
      setForm({ description: '', amount: '', due_date: '', customer_id: '', category_id: '', cost_center_id: '', notes: '' })
    } catch { /* toast handled by hook */ }
  }

  const handleReceive = async () => {
    if (!receiveItem || !receiveAmount) return
    const amount = parseFloat(receiveAmount)
    if (amount <= 0 || amount > (receiveItem.amount - receiveItem.received)) return
    try {
      await receiveAR.mutateAsync({ arId: receiveItem.id, amount })
      setReceiveItem(null)
      setReceiveAmount('')
    } catch { /* toast handled by hook */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="partially_received">Parciais</TabsTrigger>
            <TabsTrigger value="received">Recebidos</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Novo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse bg-[hsl(var(--muted))]" />)}</div>
      ) : receivables.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]">
          Nenhuma conta a receber encontrada
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
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((ar) => {
                  const remaining = ar.amount - ar.received_amount
                  return (
                    <TableRow key={ar.id}>
                      <TableCell className="font-medium">{ar.description}</TableCell>
                      <TableCell>{formatDate(ar.due_date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ar.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ar.received_amount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(remaining)}</TableCell>
                      <TableCell>{statusBadge(ar.status, ar.due_date)}</TableCell>
                      <TableCell className="text-right">
                        {ar.status !== 'received' && ar.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReceiveItem({ id: ar.id, description: ar.description, amount: ar.amount, received: ar.received_amount })
                              setReceiveAmount(String(Math.min(remaining, 100)))
                            }}
                          >
                            <DollarSign size={14} className="mr-1" /> Receber
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
          <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
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
            <Button onClick={handleCreate} disabled={createAR.isPending}>
              {createAR.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={!!receiveItem} onOpenChange={() => setReceiveItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Receber Conta</DialogTitle></DialogHeader>
          {receiveItem && (
            <div className="space-y-3">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{receiveItem.description}</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-[hsl(var(--muted-foreground))]">Original</span><p className="font-medium">{formatCurrency(receiveItem.amount)}</p></div>
                <div><span className="text-[hsl(var(--muted-foreground))]">Recebido</span><p className="font-medium">{formatCurrency(receiveItem.received)}</p></div>
                <div><span className="text-[hsl(var(--muted-foreground))]">Restante</span><p className="font-medium">{formatCurrency(receiveItem.amount - receiveItem.received)}</p></div>
              </div>
              <Input
                type="number" step="0.01" placeholder="Valor a receber"
                value={receiveAmount} onChange={(e) => setReceiveAmount(e.target.value)}
                max={receiveItem.amount - receiveItem.received}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveItem(null)}>Cancelar</Button>
            <Button onClick={handleReceive} disabled={receiveAR.isPending || !receiveAmount}>
              {receiveAR.isPending ? 'Recebendo...' : 'Confirmar Recebimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
