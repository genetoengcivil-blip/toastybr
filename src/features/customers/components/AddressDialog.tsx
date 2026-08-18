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
import { customerAddressSchema, type CustomerAddressFormValues } from '../types'
import type { CustomerAddress } from '../../../lib/supabase/types'
import { useCreateAddress, useUpdateAddress } from '../hooks/useAddresses'
import { toast } from 'sonner'

interface AddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  address?: CustomerAddress | null
}

export function AddressDialog({ open, onOpenChange, customerId, address }: AddressDialogProps) {
  const isEditing = !!address
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerAddressFormValues>({
    resolver: zodResolver(customerAddressSchema),
    defaultValues: {
      label: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      is_default: false,
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        address
          ? {
              label: address.label,
              street: address.street,
              number: address.number ?? '',
              complement: address.complement ?? '',
              neighborhood: address.neighborhood ?? '',
              city: address.city,
              state: address.state,
              zip_code: address.zip_code ?? '',
              is_default: address.is_default,
            }
          : {
              label: '',
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              zip_code: '',
              is_default: false,
            }
      )
    }
  }, [open, address, reset])

  const onSubmit = (data: CustomerAddressFormValues) => {
    if (isEditing) {
      updateAddress.mutate(
        { addressId: address.id, values: data, customerId },
        {
          onSuccess: () => {
            toast.success('Endereço atualizado')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    } else {
      createAddress.mutate(
        { customerId, values: data },
        {
          onSuccess: () => {
            toast.success('Endereço criado')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    }
  }

  const isLoading = createAddress.isPending || updateAddress.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar endereço' : 'Novo endereço'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Label *</label>
            <Input {...register('label')} placeholder="Ex: Casa, Trabalho" />
            {errors.label && <p className="text-xs text-[hsl(var(--destructive))]">{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Rua *</label>
              <Input {...register('street')} placeholder="Rua das Flores" />
              {errors.street && <p className="text-xs text-[hsl(var(--destructive))]">{errors.street.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número</label>
              <Input {...register('number')} placeholder="123" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Complemento</label>
              <Input {...register('complement')} placeholder="Apto 101" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bairro</label>
              <Input {...register('neighborhood')} placeholder="Centro" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Cidade *</label>
              <Input {...register('city')} placeholder="São Paulo" />
              {errors.city && <p className="text-xs text-[hsl(var(--destructive))]">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado *</label>
              <Input {...register('state')} placeholder="SP" />
              {errors.state && <p className="text-xs text-[hsl(var(--destructive))]">{errors.state.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CEP</label>
            <Input {...register('zip_code')} placeholder="01000-000" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              {...register('is_default')}
              className="rounded"
            />
            <label htmlFor="is_default" className="text-sm font-medium">
              Definir como endereço padrão
            </label>
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
