import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet'
import { useCustomerAddresses } from '../hooks/useAddresses'
import { useCustomerNotes, useCreateNote } from '../hooks/useNotes'
import { useSetDefaultAddress, useDeleteAddress } from '../hooks/useAddresses'
import { AddressDialog } from './AddressDialog'
import type { Customer } from '../../../lib/supabase/types'
import { toast } from 'sonner'
import { Plus, MapPin, Trash2, Star, StickyNote } from 'lucide-react'

interface CustomerDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
}

export function CustomerDetailSheet({ open, onOpenChange, customer }: CustomerDetailSheetProps) {
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [noteContent, setNoteContent] = useState('')

  const { data: addresses } = useCustomerAddresses(customer?.id ?? null)
  const { data: notes } = useCustomerNotes(customer?.id ?? null)
  const createNote = useCreateNote()
  const setDefaultAddress = useSetDefaultAddress()
  const deleteAddress = useDeleteAddress()

  const handleAddNote = () => {
    if (!noteContent.trim() || !customer) return
    createNote.mutate(
      { customerId: customer.id, content: noteContent.trim() },
      {
        onSuccess: () => {
          setNoteContent('')
          toast.success('Nota adicionada')
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleSetDefault = (addressId: string) => {
    setDefaultAddress.mutate(
      { addressId, customerId: customer!.id },
      {
        onSuccess: () => toast.success('Endereço padrão atualizado'),
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleDeleteAddress = (addressId: string) => {
    if (!confirm('Excluir este endereço?')) return
    deleteAddress.mutate(
      { addressId, customerId: customer!.id },
      {
        onSuccess: () => toast.success('Endereço excluído'),
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  if (!customer) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{customer.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[hsl(var(--muted-foreground))]">Email</span>
              <p className="font-medium">{customer.email ?? '—'}</p>
            </div>
            <div>
              <span className="text-[hsl(var(--muted-foreground))]">Telefone</span>
              <p className="font-medium">{customer.phone ?? '—'}</p>
            </div>
            <div>
              <span className="text-[hsl(var(--muted-foreground))]">CPF/CNPJ</span>
              <p className="font-medium">{customer.document ?? '—'}</p>
            </div>
            <div>
              <span className="text-[hsl(var(--muted-foreground))]">Status</span>
              <p>
                <Badge variant={customer.is_active ? 'success' : 'secondary'}>
                  {customer.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-md bg-[hsl(var(--muted))]/50">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Pedidos</p>
              <p className="text-lg font-semibold">{customer.total_orders}</p>
            </div>
            <div className="p-3 rounded-md bg-[hsl(var(--muted))]/50">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Total gasto</p>
              <p className="text-lg font-semibold">R$ {customer.total_spent.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-md bg-[hsl(var(--muted))]/50">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Último pedido</p>
              <p className="text-lg font-semibold">
                {customer.last_order_at
                  ? new Date(customer.last_order_at).toLocaleDateString('pt-BR')
                  : '—'}
              </p>
            </div>
          </div>

          {/* Addresses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Endereços</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAddress(null)
                  setAddressDialogOpen(true)
                }}
              >
                <Plus size={14} className="mr-1" />
                Adicionar
              </Button>
            </div>
            {addresses && addresses.length > 0 ? (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-[hsl(var(--muted-foreground))]" />
                      <div className="text-sm">
                        <p className="font-medium">{addr.label}</p>
                        <p className="text-[hsl(var(--muted-foreground))]">
                          {addr.street}{addr.number ? `, ${addr.number}` : ''}
                          {addr.complement ? ` - ${addr.complement}` : ''}
                        </p>
                        <p className="text-[hsl(var(--muted-foreground))]">
                          {addr.neighborhood ? `${addr.neighborhood} - ` : ''}{addr.city}/{addr.state}
                        </p>
                        {addr.zip_code && (
                          <p className="text-[hsl(var(--muted-foreground))]">CEP: {addr.zip_code}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!addr.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(addr.id)}
                        >
                          <Star size={14} />
                        </Button>
                      )}
                      {addr.is_default && (
                        <Badge variant="success">Padrão</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum endereço cadastrado</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-sm font-medium mb-2">Notas</h4>
            <div className="flex gap-2 mb-3">
              <Input
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Adicionar nota..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!noteContent.trim() || createNote.isPending}
              >
                <Plus size={14} />
              </Button>
            </div>
            {notes && notes.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-start gap-2 p-2 rounded-md bg-[hsl(var(--muted))]/50">
                    <StickyNote size={14} className="mt-0.5 text-[hsl(var(--muted-foreground))]" />
                    <div className="text-sm flex-1">
                      <p>{note.content}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(note.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma nota</p>
            )}
          </div>
        </div>

        <AddressDialog
          open={addressDialogOpen}
          onOpenChange={setAddressDialogOpen}
          customerId={customer.id}
          address={editingAddress}
        />
      </SheetContent>
    </Sheet>
  )
}
