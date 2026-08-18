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
import { customerSchema, type CustomerFormValues } from '../types'
import type { Customer } from '../../../lib/supabase/types'
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers'
import { toast } from 'sonner'

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
}

export function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
  const isEditing = !!customer
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      document: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
              name: customer.name,
              email: customer.email ?? '',
              phone: customer.phone ?? '',
              document: customer.document ?? '',
            }
          : {
              name: '',
              email: '',
              phone: '',
              document: '',
            }
      )
    }
  }, [open, customer, reset])

  const onSubmit = (data: CustomerFormValues) => {
    if (isEditing) {
      updateCustomer.mutate(
        { id: customer.id, values: data },
        {
          onSuccess: () => {
            toast.success('Cliente atualizado')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    } else {
      createCustomer.mutate(data, {
        onSuccess: () => {
          toast.success('Cliente criado')
          onOpenChange(false)
        },
        onError: (err: Error) => toast.error(err.message),
      })
    }
  }

  const isLoading = createCustomer.isPending || updateCustomer.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <Input {...register('name')} placeholder="Nome do cliente" />
            {errors.name && <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input {...register('email')} type="email" placeholder="email@exemplo.com" />
              {errors.email && <p className="text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input {...register('phone')} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CPF/CNPJ</label>
            <Input {...register('document')} placeholder="000.000.000-00" />
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
