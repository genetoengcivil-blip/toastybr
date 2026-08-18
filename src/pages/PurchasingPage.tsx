import { useState, useMemo } from 'react'
import { Plus, Search, Eye, Truck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { usePurchaseOrders, useUpdateOrderStatus } from '../features/purchasing/hooks/usePurchaseOrders'
import { useSuppliers, useDeleteSupplier } from '../features/purchasing/hooks/useSuppliers'
import { getActiveIngredients } from '../features/purchasing/services/purchase-order'
import { useCurrentOrganization } from '../features/auth/context'
import { SupplierDialog } from '../features/purchasing/components/SupplierDialog'
import { PurchaseOrderForm } from '../features/purchasing/components/PurchaseOrderForm'
import { PurchaseOrderDetail } from '../features/purchasing/components/PurchaseOrderDetail'
import { ReceiveDialog } from '../features/purchasing/components/ReceiveDialog'
import { PoStatusBadge } from '../features/purchasing/components/PoStatusBadge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PurchaseOrderWithSupplier, Supplier } from '../lib/supabase/types'
import { useQuery } from '@tanstack/react-query'

export default function PurchasingPage() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  const [tab, setTab] = useState('orders')
  const [searchOrders, setSearchOrders] = useState('')
  const [searchSuppliers, setSearchSuppliers] = useState('')
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [orderFormOpen, setOrderFormOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<PurchaseOrderWithSupplier | null>(null)
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrderWithSupplier | null>(null)

  const { data: orders, isLoading: loadingOrders } = usePurchaseOrders()
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers()
  const deleteSupplier = useDeleteSupplier()
  const updateStatus = useUpdateOrderStatus()

  const { data: ingredients } = useQuery({
    queryKey: ['purchasing', orgId, 'ingredients'],
    queryFn: () => getActiveIngredients(orgId!),
    enabled: !!orgId,
  })

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    const q = searchOrders.toLowerCase()
    return orders.filter(
      (o) =>
        o.po_number.toLowerCase().includes(q) ||
        o.suppliers?.name?.toLowerCase().includes(q)
    )
  }, [orders, searchOrders])

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return []
    const q = searchSuppliers.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contact_name?.toLowerCase().includes(q)
    )
  }, [suppliers, searchSuppliers])

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (!confirm(`Excluir fornecedor "${supplier.name}"?`)) return
    deleteSupplier.mutate(supplier.id, {
      onSuccess: () => toast.success('Fornecedor excluído'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const handleSend = (orderId: string) => {
    updateStatus.mutate(
      { orderId, status: 'sent' },
      {
        onSuccess: () => {
          toast.success('Pedido marcado como enviado')
          setDetailOrder(null)
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleCancel = (orderId: string) => {
    if (!confirm('Cancelar este pedido?')) return
    updateStatus.mutate(
      { orderId, status: 'cancelled' },
      {
        onSuccess: () => {
          toast.success('Pedido cancelado')
          setDetailOrder(null)
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Pedidos de compra e fornecedores
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={searchOrders}
                onChange={(e) => setSearchOrders(e.target.value)}
                placeholder="Buscar por PO# ou fornecedor..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => setOrderFormOpen(true)}>
              <Plus size={16} className="mr-2" />
              Novo pedido
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      {searchOrders ? 'Nenhum pedido encontrado' : 'Nenhum pedido de compra'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {order.po_number}
                      </TableCell>
                      <TableCell>{order.suppliers?.name ?? '—'}</TableCell>
                      <TableCell>{order.purchase_order_items.length}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        R$ {order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <PoStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailOrder(order)}
                          >
                            <Eye size={14} />
                          </Button>
                          {(order.status === 'draft' ||
                            order.status === 'sent' ||
                            order.status === 'partially_received') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReceiveOrder(order)}
                            >
                              <Truck size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={searchSuppliers}
                onChange={(e) => setSearchSuppliers(e.target.value)}
                placeholder="Buscar fornecedor..."
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                setEditingSupplier(null)
                setSupplierDialogOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Novo fornecedor
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSuppliers ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      {searchSuppliers ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_name ?? '—'}</TableCell>
                      <TableCell>{supplier.phone ?? '—'}</TableCell>
                      <TableCell>{supplier.email ?? '—'}</TableCell>
                      <TableCell className="text-sm">{supplier.cnpj ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                          {supplier.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSupplier(supplier)
                              setSupplierDialogOpen(true)
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={editingSupplier}
      />

      <PurchaseOrderForm
        open={orderFormOpen}
        onOpenChange={setOrderFormOpen}
        ingredients={ingredients ?? []}
      />

      {detailOrder && (
        <PurchaseOrderDetail
          open={!!detailOrder}
          onOpenChange={() => setDetailOrder(null)}
          order={detailOrder}
          onSend={handleSend}
          onCancel={handleCancel}
          onReceive={() => {
            setReceiveOrder(detailOrder)
            setDetailOrder(null)
          }}
          isUpdating={updateStatus.isPending}
        />
      )}

      {receiveOrder && (
        <ReceiveDialog
          open={!!receiveOrder}
          onOpenChange={() => setReceiveOrder(null)}
          order={receiveOrder}
        />
      )}
    </div>
  )
}
