import { useState, useMemo } from 'react'
import { Plus, Search, Eye, Power, PowerOff } from 'lucide-react'
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
import {
  useCustomers,
  useDeactivateCustomer,
  useActivateCustomer,
} from '../features/customers/hooks/useCustomers'
import { useCustomerTags, useCreateTag, useDeleteTag } from '../features/customers/hooks/useTags'
import { CustomerDialog } from '../features/customers/components/CustomerDialog'
import { CustomerDetailSheet } from '../features/customers/components/CustomerDetailSheet'
import { toast } from 'sonner'
import type { Customer, CustomerTag } from '../lib/supabase/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CustomersPage() {
  const [tab, setTab] = useState('customers')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [tagName, setTagName] = useState('')

  const { data: customers, isLoading } = useCustomers()
  const { data: tags } = useCustomerTags()
  const deactivateCustomer = useDeactivateCustomer()
  const activateCustomer = useActivateCustomer()
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()

  const filtered = useMemo(() => {
    if (!customers) return []
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    )
  }, [customers, search])

  const handleDeactivate = (customer: Customer) => {
    if (!confirm(`Desativar cliente "${customer.name}"?`)) return
    deactivateCustomer.mutate(customer.id, {
      onSuccess: () => toast.success('Cliente desativado'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const handleActivate = (customer: Customer) => {
    activateCustomer.mutate(customer.id, {
      onSuccess: () => toast.success('Cliente ativado'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const handleCreateTag = () => {
    if (!tagName.trim()) return
    createTag.mutate(
      { name: tagName.trim() },
      {
        onSuccess: () => {
          setTagName('')
          toast.success('Tag criada')
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleDeleteTag = (tag: CustomerTag) => {
    if (!confirm(`Excluir tag "${tag.name}"?`)) return
    deleteTag.mutate(tag.id, {
      onSuccess: () => toast.success('Tag excluída'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const getCustomerTags = (customer: Customer) => {
    const assignments = (customer as any).customer_tag_assignments || []
    return assignments.map((a: any) => a.customer_tags).filter(Boolean)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">CRM e gestão de clientes</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou telefone..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setEditingCustomer(null); setDialogOpen(true) }}>
              <Plus size={16} className="mr-2" />
              Novo cliente
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Total gasto</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((customer) => {
                    const customerTags = getCustomerTags(customer)
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email ?? '—'}</TableCell>
                        <TableCell>{customer.phone ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{customer.total_orders}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          R$ {customer.total_spent.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {customerTags.slice(0, 2).map((tag: CustomerTag) => (
                              <Badge key={tag.id} variant="secondary" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                            {customerTags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{customerTags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.is_active ? 'success' : 'secondary'}>
                            {customer.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailCustomer(customer)}
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCustomer(customer)
                                setDialogOpen(true)
                              }}
                            >
                              Editar
                            </Button>
                            {customer.is_active ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivate(customer)}
                              >
                                <PowerOff size={14} />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActivate(customer)}
                              >
                                <Power size={14} />
                              </Button>
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

        <TabsContent value="tags" className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Nome da nova tag..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              className="max-w-sm"
            />
            <Button onClick={handleCreateTag} disabled={!tagName.trim()}>
              <Plus size={16} className="mr-2" />
              Criar tag
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags && tags.length > 0 ? (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">{tag.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(tag.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag)}
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      Nenhuma tag criada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
      />

      <CustomerDetailSheet
        open={!!detailCustomer}
        onOpenChange={() => setDetailCustomer(null)}
        customer={detailCustomer}
      />
    </div>
  )
}
