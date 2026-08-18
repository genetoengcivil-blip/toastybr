import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, Power, PowerOff, Eye } from 'lucide-react'
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
import { Card } from '../components/ui/card'
import { cn } from '../lib/utils'

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
  const [couponDialogOpen, setCouponDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns()
  const { data: coupons = [], isLoading: couponsLoading } = useCoupons()
  const deleteCampaign = useDeleteCampaign()
  const updateCampaignStatus = useUpdateCampaignStatus()
  const deleteCoupon = useDeleteCoupon()
  const toggleCouponActive = useToggleCouponActive()

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return []
    const q = searchCampaigns.toLowerCase()
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.type && TYPE_LABELS[c.type]?.toLowerCase().includes(q)) ||
        c.status.toLowerCase().includes(q)
    )
  }, [campaigns, searchCampaigns])

  const filteredCoupons = useMemo(() => {
    if (!coupons) return []
    const q = searchCoupons.toLowerCase()
    return coupons.filter(
      (cp) =>
        cp.code.toLowerCase().includes(q) ||
        cp.description?.toLowerCase().includes(q) ||
        cp.type?.toLowerCase().includes(q)
    )
  }, [coupons, searchCoupons])

  const handleUpdateStatus = (campaign: Campaign, status: CampaignStatus) => {
    updateCampaignStatus.mutate(
      { id: campaign.id, status },
      {
        onSuccess: () => {
          toast.success(`Campanha ${STATUS_CONFIG[status].label.toLowerCase()}`)
          setEditingCampaign(null)
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleToggleCouponActive = (coupon: Coupon) => {
    toggleCouponActive.mutate(
      { id: coupon.id, current: coupon.is_active },
      {
        onSuccess: () =>
          toast.success(coupon.is_active ? 'Cupom desativado' : 'Cupom ativado'),
        onError: () => toast.error('Erro ao alterar status'),
      }
    )
  }

  const handleDeleteCampaign = (campaign: Campaign) => {
    if (!confirm(`Excluir campanha "${campaign.name}"?`)) return
    deleteCampaign.mutate(campaign.id, {
      onSuccess: () => toast.success('Campanha excluída'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const handleDeleteCoupon = (coupon: Coupon) => {
    if (!confirm(`Excluir cupom "${coupon.code}"?`)) return
    deleteCoupon.mutate(coupon.id, {
      onSuccess: () => toast.success('Cupom excluído'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  // Loading state
  if (campaignsLoading || couponsLoading) {
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
          <h1 className="text-display">Marketing</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Gerencie campanhas e cupons promocionais
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCampaign(null)
              setCampaignDialogOpen(true)
            }}
            className="hover-lift"
          >
            <Plus size={16} className="mr-2 h-4 w-4" />
            Nova campanha
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingCoupon(null)
              setCouponDialogOpen(true)
            }}
            className="hover-lift"
          >
            <Plus size={16} className="mr-2 h-4 w-4" />
            Novo cupom
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-[repeat(2,minmax(0,1fr))]">
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="relative w-64 mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
            />
            <Input
              placeholder="Buscar campanha..."
              value={searchCampaigns}
              onChange={(e) => setSearchCampaigns(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Campanha
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Tipo
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Data início
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Data fim
                  </TableHead>
                  <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-[hsl(var(--muted-foreground))]"
                    >
                      {searchCampaigns ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha cadastrada'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                    >
                      <TableCell className="px-6 py-4 text-font-medium whitespace-nowrap">
                        {campaign.name}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {campaign.type ? TYPE_LABELS[campaign.type] : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <Badge variant={STATUS_CONFIG[campaign.status]?.variant ?? 'secondary'}>
                          {STATUS_CONFIG[campaign.status]?.label ?? campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {campaign.starts_at ? format(new Date(campaign.starts_at), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {campaign.ends_at ? format(new Date(campaign.ends_at), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCampaign(campaign)
                            setCampaignDialogOpen(true)
                          }}
                          className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                          title="Editar"
                        >
                          <Eye size={14} className="h-4 w-4" />
                        </button>
                        {campaign.status !== 'completed' && campaign.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => {
                                const newStatus =
                                  campaign.status === 'active' ? 'completed' : 'active'
                                handleUpdateStatus(campaign, newStatus as CampaignStatus)
                              }}
                              className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                            >
                              {campaign.status === 'active' ? (
                                <PowerOff size={14} className="h-4 w-4" />
                              ) : (
                                <Power size={14} className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(campaign, 'cancelled')}
                              className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200 text-[hsl(var(--destructive))]"
                            >
                              <Trash2 size={14} className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </TableRow>
                    ))}
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          <div className="relative w-64 mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
            />
            <Input
              placeholder="Buscupom..."
              value={searchCoupons}
              onChange={(e) => setSearchCoupons(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Código
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Descrição
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Tipo
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Valor
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Válido até
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-20">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-[hsl(var(--muted-foreground))]"
                    >
                      {searchCoupons ? 'Nenhum cupom encontrado' : 'Nenhum cupom cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <TableRow
                      key={coupon.id}
                      className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                    >
                      <TableCell className="px-6 py-4 text-font-medium whitespace-nowrap">
                        {coupon.code}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {coupon.description ?? '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {coupon.type?.toUpperCase() ?? '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-metric text-right whitespace-nowrap">
                        R$ {coupon.value.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {coupon.valid_until ? format(new Date(coupon.valid_until), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <Badge
                          variant={coupon.is_active ? 'success' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {coupon.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCoupon(coupon)
                            setCouponDialogOpen(true)
                          }}
                          className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                          title="Editar"
                        >
                          <Eye size={14} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleCouponActive(coupon)}
                          className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                        >
                          {coupon.is_active ? (
                            <PowerOff size={14} className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Power size={14} className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon)}
                          className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200 text-[hsl(var(--destructive))]"
                          title="Excluir"
                        >
                          <Trash2 size={14} className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                )}
              </TableBody>
            </Table>
          </Card>
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