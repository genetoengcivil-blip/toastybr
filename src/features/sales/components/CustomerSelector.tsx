import { useState } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { useCustomers, useCreateCustomer } from '../../customers/hooks/useCustomers'
import type { Customer } from '../../../lib/supabase/types'

interface CustomerSelectorProps {
  selectedCustomer: Customer | null
  onSelect: (customer: Customer | null) => void
}

export function CustomerSelector({ selectedCustomer, onSelect }: CustomerSelectorProps) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const { data: customers } = useCustomers()
  const createCustomer = useCreateCustomer()

  const filtered = (customers ?? []).filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    )
  })

  function handleQuickCreate() {
    if (!newName.trim()) return

    createCustomer.mutate(
      { name: newName.trim(), phone: newPhone || null },
      {
        onSuccess: (created) => {
          onSelect(created)
          setNewName('')
          setNewPhone('')
          setShowCreate(false)
          setSearch('')
        },
      }
    )
  }

  if (selectedCustomer) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedCustomer.name}</p>
          {selectedCustomer.phone && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{selectedCustomer.phone}</p>
          )}
          <div className="flex gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>{selectedCustomer.total_orders} pedidos</span>
            <span>•</span>
            <span>R$ {selectedCustomer.total_spent.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="p-1 hover:bg-[hsl(var(--muted))] rounded"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  if (showCreate) {
    return (
      <div className="space-y-2 p-2 rounded-md border border-[hsl(var(--border))]">
        <p className="text-xs font-medium">Novo cliente</p>
        <Input
          placeholder="Nome"
          value={newName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Telefone (opcional)"
          value={newPhone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPhone(e.target.value)}
          className="h-8 text-xs"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleQuickCreate}
            disabled={!newName.trim() || createCustomer.isPending}
          >
            {createCustomer.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              setShowCreate(false)
              setNewName('')
              setNewPhone('')
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
        />
        <Input
          placeholder="Buscar cliente por nome ou telefone..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {search && filtered.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {filtered.slice(0, 5).map((customer) => (
            <button
              key={customer.id}
              onClick={() => {
                onSelect(customer)
                setSearch('')
              }}
              className="w-full text-left p-2 rounded hover:bg-[hsl(var(--muted))] text-xs"
            >
              <p className="font-medium">{customer.name}</p>
              {customer.phone && (
                <p className="text-[hsl(var(--muted-foreground))]">{customer.phone}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-xs"
        onClick={() => setShowCreate(true)}
      >
        <UserPlus size={12} className="mr-1" />
        Cadastrar novo cliente
      </Button>
    </div>
  )
}
