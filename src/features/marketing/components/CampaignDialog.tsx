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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select'
import { campaignSchema, type CampaignFormValues } from '../../customers/types'
import type { Campaign } from '../../../lib/supabase/types'
import { useCreateCampaign, useUpdateCampaign } from '../hooks/useCampaigns'
import { toast } from 'sonner'

interface CampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
}

export function CampaignDialog({ open, onOpenChange, campaign }: CampaignDialogProps) {
  const isEditing = !!campaign
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'in_store',
      starts_at: '',
      ends_at: '',
    },
  })

  const campaignType = watch('type')

  useEffect(() => {
    if (open) {
      reset(
        campaign
          ? {
              name: campaign.name,
              description: campaign.description ?? '',
              type: campaign.type,
              starts_at: campaign.starts_at ? campaign.starts_at.slice(0, 16) : '',
              ends_at: campaign.ends_at ? campaign.ends_at.slice(0, 16) : '',
            }
          : {
              name: '',
              description: '',
              type: 'in_store',
              starts_at: '',
              ends_at: '',
            }
      )
    }
  }, [open, campaign, reset])

  const onSubmit = (data: CampaignFormValues) => {
    if (isEditing) {
      updateCampaign.mutate(
        { id: campaign.id, values: data },
        {
          onSuccess: () => {
            toast.success('Campanha atualizada')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    } else {
      createCampaign.mutate(data, {
        onSuccess: () => {
          toast.success('Campanha criada')
          onOpenChange(false)
        },
        onError: (err: Error) => toast.error(err.message),
      })
    }
  }

  const isLoading = createCampaign.isPending || updateCampaign.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar campanha' : 'Nova campanha'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <Input {...register('name')} placeholder="Nome da campanha" />
            {errors.name && <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input {...register('description')} placeholder="Descrição da campanha" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo *</label>
            <Select
              value={campaignType}
              onValueChange={(v) => setValue('type', v as CampaignFormValues['type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_store">Na loja</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Início</label>
              <Input type="datetime-local" {...register('starts_at')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fim</label>
              <Input type="datetime-local" {...register('ends_at')} />
            </div>
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
