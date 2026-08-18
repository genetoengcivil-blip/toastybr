import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'
import { supplierSchema, type SupplierFormValues } from '../types'
import type { Supplier } from '../../../lib/supabase/types'
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers'
import { toast } from 'sonner'

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier | null
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const isEditing = !!supplier
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      phone: '',
      email: '',
      cnpj: '',
      notes: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        supplier
          ? {
              name: supplier.name,
              contact_name: supplier.contact_name ?? '',
              phone: supplier.phone ?? '',
              email: supplier.email ?? '',
              cnpj: supplier.cnpj ?? '',
              notes: supplier.notes ?? '',
              is_active: supplier.is_active,
            }
          : {
              name: '',
              contact_name: '',
              phone: '',
              email: '',
              cnpj: '',
              notes: '',
              is_active: true,
            }
      )
    }
  }, [open, supplier, reset])

  const onSubmit = (data: SupplierFormValues) => {
    if (isEditing) {
      updateSupplier.mutate(
        { id: supplier.id, values: data },
        {
          onSuccess: () => {
            toast.success('Fornecedor atualizado')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => {
          toast.success('Fornecedor criado')
          onOpenChange(false)
        },
        onError: (err: Error) => toast.error(err.message),
      })
    }
  }

  const isLoading = createSupplier.isPending || updateSupplier.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <Input {...register('name')} placeholder="Nome do fornecedor" />
            {errors.name && <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contato</label>
              <Input {...register('contact_name')} placeholder="Pessoa de contato" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input {...register('phone')} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input {...register('email')} type="email" placeholder="contato@fornecedor.com" />
              {errors.email && <p className="text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CNPJ</label>
              <Input {...register('cnpj')} placeholder="00.000.000/0000-00" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Input {...register('notes')} placeholder="Observações sobre o fornecedor" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
