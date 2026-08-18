import { useState } from 'react'
import { Search, Eye, XCircle } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { useSalesOrders, useCancelSalesOrder } from '../features/sales/hooks/useSalesOrders'
import { useCurrentOrganization } from '../features/auth/context'
import { useOrdersRealtime } from '../features/sales/realtime/useOrdersRealtime'
import { ORDER_STATUS_CONFIG, CHANNEL_LABELS } from '../features/sales/utils/status'
import { OrderDetailSheet } from '../features/sales/components/OrderDetailSheet'
import { useSalesOrder } from '../features/sales/hooks/useSalesOrders'
import { toast } from 'sonner'

const TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abertos' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'preparing', label: 'Em preparo' },
  { value: 'ready', label: 'Prontos' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { organization } = useCurrentOrganization()
  useOrdersRealtime(organization?.id, { channelPrefix: 'orders' })

  const { data: orders, isLoading } = useSalesOrders(activeTab)
  const { data: selectedOrder } = useSalesOrder(selectedOrderId)
  const cancelOrder = useCancelSalesOrder()

  const filtered = (orders ?? []).filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q))
    )
  })

  function handleCancel(orderId: string) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return
    cancelOrder.mutate(
      { orderId },
      {
        onSuccess: () => toast.success('Pedido cancelado'),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Gerencie todos os pedidos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <Input
              placeholder="Buscar pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <TabsContent value={activeTab}>
          <div className="border rounded-lg mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const st = ORDER_STATUS_CONFIG[order.status]
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell className="text-sm">
                          {order.customer_name ?? <span className="text-[hsl(var(--muted-foreground))]">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">{CHANNEL_LABELS[order.channel]}</TableCell>
                        <TableCell>{order.sales_order_items.length}</TableCell>
                        <TableCell className="font-medium">R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                          {new Date(order.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded"
                            >
                              <Eye size={14} />
                            </button>
                            {!['completed', 'cancelled'].includes(order.status) && (
                              <button
                                onClick={() => handleCancel(order.id)}
                                className="p-1 hover:bg-red-100 text-red-500 rounded"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <OrderDetailSheet
        order={selectedOrder ?? null}
        open={!!selectedOrderId}
        onOpenChange={() => setSelectedOrderId(null)}
      />
    </div>
  )
}
