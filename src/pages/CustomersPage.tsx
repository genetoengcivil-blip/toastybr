import { useState, useMemo } from 'react'
import { Plus, Search, Eye, Power, PowerOff, Trash2 } from 'lucide-react'
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
import {
  useCustomerTags,
  useCreateTag,
  useDeleteTag,
} from '../features/customers/hooks/useTags'
import { CustomerDialog } from '../features/customers/components/CustomerDialog'
import { CustomerDetailSheet } from '../features/customers/components/CustomerDetailSheet'
import { toast } from 'sonner'
import type { Customer, CustomerTag } from '../lib/supabase/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '../components/ui/card'
import { cn } from '../lib/utils'

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

  // Loading state
  if (isLoading) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display">Clientes</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            CRM e gestão de clientes
          </p>
        </div>
        <div className="flex items-center gap-4">
          {tabs.length > 0 && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTagName('')
                  setEditingCustomer(null)
                  setDialogOpen(true)
                }}
                className="hover-lift"
              >
                <Plus size={16} className="mr-2 h-4 w-4" />
                Novo cliente
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCustomer(null)
                  setDialogOpen(true)
                }}
                className="hover-lift"
                disabled={tags.length === 0}
              >
                <Plus size={16} className="mr-2 h-4 w-4" />
                Nova tag
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-[repeat(2,minmax(0,1fr))]">
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <div className="relative w-64 mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
            />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Cliente
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Email
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Telefone
                  </TableHead>
                  <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Pedidos
                  </TableHead>
                  <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Total gasto
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Tags
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-24">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-[hsl(var(--muted-foreground))]"
                    >
                      {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((customer) => {
                    const customerTags = getCustomerTags(customer)
                    return (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                        onClick={() => setDetailCustomer(customer)}
                      >
                        <TableCell className="px-6 py-4 text-font-medium whitespace-nowrap">
                          {customer.name}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                          {customer.email ?? '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                          {customer.phone ?? '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm font-metric text-right whitespace-nowrap">
                          {customer.total_orders}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm font-metric text-right whitespace-nowrap">
                          R$ {customer.total_spent.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap flex gap-1 flex-wrap">
                          {customerTags.slice(0, 2).map((tag: CustomerTag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {customerTags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{customerTags.length - 2}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                          <Badge
                            variant={customer.is_active ? 'success' : 'secondary'}
                            className="text-xs font-medium"
                          >
                            {customer.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCustomer(customer)
                              setDialogOpen(true)
                            }}
                            className="p-1 hover-lift"
                            title="Editar"
                          >
                            <Plus size={14} className="h-4 w-4" />
                          </Button>
                          {customer.is_active ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeactivate(customer)}
                              className="p-1 hover-lift"
                            >
                              <PowerOff size={14} className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleActivate(customer)}
                              className="p-1 hover-lift"
                            >
                              <Power size={14} className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Excluir cliente "${customer.name}"?`)) {
                                // Note: We don't have a delete customer hook, but we can add one if needed.
                                // For now, we'll just show a toast.
                                toast.error('Funcionalidade de exclusão não implementada')
                              }
                            }
                            className="p-1 hover-lift"
                          >
                            <Trash2 size={14} className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
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

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Nome
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Criada em
                  </TableHead>
                  <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-20">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags && tags.length > 0 ? (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <Badge variant="secondary">{tag.name}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {format(new Date(tag.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
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
          </Card>
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