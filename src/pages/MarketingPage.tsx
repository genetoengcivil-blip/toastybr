import { useState } from 'react'
import { Plus, Search, Trash2, Power, PowerOff } from 'lucide-react'
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
  useCampaigns,
  useDeleteCampaign,
  useUpdateCampaignStatus,
} from '../features/marketing/hooks/useCampaigns'
import {
  useCoupons,
  useDeleteCoupon,
  useToggleCouponActive,
} from '../features/marketing/hooks/useCoupons'
import { CampaignDialog } from '../features/marketing/components/CampaignDialog'
import { CouponDialog } from '../features/marketing/components/CouponDialog'
import { toast } from 'sonner'
import type { Campaign, Coupon, CampaignStatus } from '../lib/supabase/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_CONFIG: Record<CampaignStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  scheduled: { label: 'Agendada', variant: 'info' },
  active: { label: 'Ativa', variant: 'success' },
  completed: { label: 'Concluída', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

const TYPE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  in_store: 'Na loja',
}

export default function MarketingPage() {
  const [tab, setTab] = useState('campaigns')
  const [searchCampaigns, setSearchCampaigns] = useState('')
  const [searchCoupons, setSearchCoupons] = useState('')
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [couponDialogOpen, setCouponDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const { data: campaigns, isLoading: loadingCampaigns } = useCampaigns()
  const { data: coupons, isLoading: loadingCoupons } = useCoupons()
  const deleteCampaign = useDeleteCampaign()
  const updateCampaignStatus = useUpdateCampaignStatus()
  const deleteCoupon = useDeleteCoupon()
  const toggleCouponActive = useToggleCouponActive()

  const filteredCampaigns = campaigns?.filter(
    (c) => c.name.toLowerCase().includes(searchCampaigns.toLowerCase())
  ) || []

  const filteredCoupons = coupons?.filter(
    (c) => c.code.toLowerCase().includes(searchCoupons.toLowerCase())
  ) || []

  const handleDeleteCampaign = (campaign: Campaign) => {
    if (!confirm(`Excluir campanha "${campaign.name}"?`)) return
    deleteCampaign.mutate(campaign.id, {
      onSuccess: () => toast.success('Campanha excluída'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const handleStatusChange = (campaign: Campaign, newStatus: string) => {
    updateCampaignStatus.mutate(
      { id: campaign.id, status: newStatus },
      {
        onSuccess: () => toast.success('Status atualizado'),
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleDeleteCoupon = (coupon: Coupon) => {
    if (!confirm(`Excluir cupom "${coupon.code}"?`)) return
    deleteCoupon.mutate(coupon.id, {
      onSuccess: () => toast.success('Cupom excluído'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const handleToggleCoupon = (coupon: Coupon) => {
    toggleCouponActive.mutate(
      { id: coupon.id, isActive: !coupon.is_active },
      {
        onSuccess: () => toast.success(coupon.is_active ? 'Cupom desativado' : 'Cupom ativado'),
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const getNextStatus = (status: CampaignStatus): string | null => {
    switch (status) {
      case 'draft': return 'scheduled'
      case 'scheduled': return 'active'
      case 'active': return 'completed'
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Campanhas e cupons</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={searchCampaigns}
                onChange={(e) => setSearchCampaigns(e.target.value)}
                placeholder="Buscar campanha..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setEditingCampaign(null); setCampaignDialogOpen(true) }}>
              <Plus size={16} className="mr-2" />
              Nova campanha
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Alcance</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCampaigns ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      {searchCampaigns ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha criada'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const nextStatus = getNextStatus(campaign.status)
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{TYPE_LABELS[campaign.type]}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[campaign.status].variant}>
                            {STATUS_CONFIG[campaign.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{campaign.reach}</TableCell>
                        <TableCell className="text-right tabular-nums">{campaign.conversions}</TableCell>
                        <TableCell>
                          {campaign.starts_at
                            ? format(new Date(campaign.starts_at), 'dd/MM/yyyy', { locale: ptBR })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {campaign.ends_at
                            ? format(new Date(campaign.ends_at), 'dd/MM/yyyy', { locale: ptBR })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingCampaign(campaign); setCampaignDialogOpen(true) }}
                            >
                              Editar
                            </Button>
                            {nextStatus && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(campaign, nextStatus)}
                              >
                                {nextStatus === 'scheduled' && 'Agendar'}
                                {nextStatus === 'active' && 'Ativar'}
                                {nextStatus === 'completed' && 'Concluir'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign)}
                            >
                              <Trash2 size={14} />
                            </Button>
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

        <TabsContent value="coupons" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={searchCoupons}
                onChange={(e) => setSearchCoupons(e.target.value)}
                placeholder="Buscar cupom..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setEditingCoupon(null); setCouponDialogOpen(true) }}>
              <Plus size={16} className="mr-2" />
              Novo cupom
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pedido mínimo</TableHead>
                  <TableHead className="text-right">Usos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCoupons ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      {searchCoupons ? 'Nenhum cupom encontrado' : 'Nenhum cupom criado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-medium font-mono">{coupon.code}</TableCell>
                      <TableCell>{coupon.type === 'percentage' ? 'Porcentagem' : 'Fixo'}</TableCell>
                      <TableCell>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {coupon.min_order > 0 ? `R$ ${coupon.min_order.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? 'success' : 'secondary'}>
                          {coupon.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingCoupon(coupon); setCouponDialogOpen(true) }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCoupon(coupon)}
                          >
                            {coupon.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon)}
                          >
                            <Trash2 size={14} />
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

      <CampaignDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        campaign={editingCampaign}
      />

      <CouponDialog
        open={couponDialogOpen}
        onOpenChange={setCouponDialogOpen}
        coupon={editingCoupon}
      />
    </div>
  )
}
