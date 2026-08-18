import { useState, useEffect } from 'react'
import { Building2, Bell, Users, Shield, Globe, Save, Clock, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { useCurrentOrganization, useAuth } from '../features/auth/context'
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useBusinessHours,
  useUpdateBusinessHours,
} from '../features/settings/hooks'
import { WEEKDAY_NAMES } from '../lib/supabase/types'
import { toast } from 'sonner'
import { Card as CardComponent } from '../components/ui/card'

const settingsSections = [
  { id: 'general', label: 'Geral', icon: Building2 },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'team', label: 'Equipe', icon: Users },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'integrations', label: 'Integrações', icon: Globe },
]

export default function SettingsPage() {
  const { organization, role } = useCurrentOrganization()
  const { user } = useAuth()
  const orgId = organization?.id
  const [activeTab, setActiveTab] = useState('general')

  const { data: settings, isLoading: settingsLoading } = useOrganizationSettings(orgId ?? null)
  const { data: businessHours = [], isLoading: hoursLoading } = useBusinessHours(orgId ?? null)
  const updateSettings = useUpdateOrganizationSettings(orgId ?? '')
  const updateHours = useUpdateBusinessHours(orgId ?? '')

  const [name, setName] = useState(organization?.name || '')
  const [phone, setPhone] = useState(settings?.phone || '')
  const [email, setEmail] = useState(settings?.email || '')
  const [address, setAddress] = useState(settings?.address || '')
  const [timezone, setTimezone] = useState(settings?.timezone || 'America/Sao_Paulo')

  const [hours, setHours] = useState<Record<number, { isOpen: boolean; openTime: string; closeTime: string }>>({})

  useEffect(() => {
    if (settings) {
      setPhone(settings.phone || '')
      setEmail(settings.email || '')
      setAddress(settings.address || '')
      setTimezone(settings.timezone || 'America/Sao_Paulo')
    }
  }, [settings])

  useEffect(() => {
    const defaultHours: Record<number, { isOpen: boolean; openTime: string; closeTime: string }> = {}
    for (let i = 0; i < 7; i++) {
      defaultHours[i] = { isOpen: true, openTime: '09:00', closeTime: '22:00' }
    }
    businessHours.forEach((h) => {
      defaultHours[h.weekday] = {
        isOpen: h.is_open,
        openTime: h.open_time,
        closeTime: h.close_time,
      }
    })
    setHours(defaultHours)
  }, [businessHours])

  const canEdit = role === 'owner' || role === 'admin'

  const handleSaveGeneral = async () => {
    await updateSettings.mutateAsync({
      name,
      phone,
      email,
      address,
      timezone,
    })
    toast.success('Configurações salvas')
  }

  const handleSaveHours = async () => {
    for (let i = 0; i < 7; i++) {
      const h = hours[i]
      if (h) {
        await updateHours.mutateAsync({
          weekday: i,
          isOpen: h.isOpen,
          openTime: h.openTime,
          closeTime: h.closeTime,
        })
      }
    }
    toast.success('Horários salvos')
  }

  if (!orgId) return null

  // Loading state
  if (settingsLoading || hoursLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-32 h-8 rounded bg-[hsl(var(--muted))] animate-pulse" />
            <div className="w-48 h-4 rounded bg-[hsl(var(--muted))] animate-pulse" />
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
          <h1 className="text-display">Configurações</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Preferências do sistema e organização
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-[repeat(5,minmax(0,1fr))]">
          {settingsSections.map((s) => {
            const Icon = s.icon
            return (
              <TabsTrigger key={s.id} value={s.id} className="flex items-center justify-center gap-2">
                <Icon size={14} />
                {s.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Dados do restaurante</CardTitle>
              <CardDescription>Informações básicas da organização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-label font-medium">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Nome do restaurante"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-label font-medium">Telefone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canEdit}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label font-medium">E-mail</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canEdit}
                    placeholder="contato@restaurante.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-label font-medium">Endereço</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Rua, número — Cidade, UF"
                />
              </div>
              <div className="space-y-2">
                <label className="text-label font-medium">Fuso horário</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-[hsl(var(--background))]"
                >
                  <option value="America/Sao_Paulo">Horário de Brasília (GMT-3)</option>
                  <option value="America/Manaus">Horário da Amazônia (GMT-4)</option>
                  <option value="America/Noronha">Horário de Fernando de Noronha (GMT-2)</option>
                </select>
              </div>
              {canEdit && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveGeneral} disabled={updateSettings.isPending}>
                    <Save size={14} className="mr-2" />
                    {updateSettings.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Horário de funcionamento</CardTitle>
              <CardDescription>Configure os dias e horários de abertura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <CardComponent
                    key={day}
                    variant="elevated"
                    padding="md"
                    className="hover-lift transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={hours[day]?.isOpen ?? true}
                          onChange={(e) =>
                            setHours((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], isOpen: e.target.checked },
                            }))
                          }
                          disabled={!canEdit}
                          className="rounded"
                        />
                        <span className="text-sm font-medium w-24">{WEEKDAY_NAMES[day]}</span>
                      </div>
                      {hours[day]?.isOpen ? (
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[hsl(var(--muted-foreground))]" />
                          <input
                            type="time"
                            value={hours[day]?.openTime || '09:00'}
                            onChange={(e) =>
                              setHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], openTime: e.target.value },
                              }))
                            }
                            disabled={!canEdit}
                            className="px-2 py-1 text-sm border rounded w-20"
                          />
                          <span className="text-sm text-[hsl(var(--muted-foreground))]">até</span>
                          <input
                            type="time"
                            value={hours[day]?.closeTime || '22:00'}
                            onChange={(e) =>
                              setHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], closeTime: e.target.value },
                              }))
                            }
                            disabled={!canEdit}
                            className="px-2 py-1 text-sm border rounded w-20"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">Fechado</span>
                      )}
                    </div>
                  </CardComponent>
                ))}
              </div>
              {canEdit && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveHours} disabled={updateHours.isPending}>
                    <Save size={14} className="mr-2" />
                    {updateHours.isPending ? 'Salvando...' : 'Salvar horários'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Preferências de notificação</CardTitle>
              <CardDescription>Controle quando e como receber alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 'new-orders', label: 'Pedidos novos', desc: 'Receber alerta ao receber um pedido', enabled: true },
                { id: 'low-stock', label: 'Estoque baixo', desc: 'Alerta quando estoque atinge mínimo', enabled: true },
                { id: 'daily-summary', label: 'Resumo diário', desc: 'Relatório de fechamento do dia', enabled: false },
                { id: 'payments', label: 'Pagamentos', desc: 'Notificação de pagamentos recebidos', enabled: true },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-[hsl(var(--card))]"
                >
                  <div>
                    <p className="text-body font-medium">{item.label}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                  </div>
                  <Badge variant={item.enabled ? 'success' : 'secondary'} className="text-sm">
                    {item.enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Gerenciar equipe</CardTitle>
              <CardDescription>Adicionar, remover ou alterar permissões dos membros</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-[hsl(var(--muted-foreground))]">
                Acesse a página
                <a href="/staff" className="underline underline-offset-2 text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80">
                  Equipe
                </a>
                para gerenciar membros e permissões da organização.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Segurança</CardTitle>
              <CardDescription>Gerenciar autenticação e acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-label font-medium">E-mail da conta</label>
                <Input
                  type="email"
                  defaultValue={user?.email}
                  disabled
                />
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Para alterar o e-mail, acesse as configurações da conta no Supabase Dashboard.
              </p>
              <Separator className="my-4" />
              <div className="space-y-2">
                <label className="text-label font-medium">Alterar senha</label>
                <Input type="password" placeholder="Nova senha" />
                <Input type="password" placeholder="Confirmar nova senha" />
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  const { supabase } = await import('../lib/supabase/client')
                  const { error } = await supabase.auth.updateUser({ password: '' })
                  if (error) {
                    toast.error(error.message)
                  } else {
                    toast.success('Senha alterada com sucesso')
                  }
                }}
              >
                Alterar senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Integrações</CardTitle>
              <CardDescription>Conectar serviços externos ao sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Supabase', desc: 'Banco de dados e autenticação', status: 'ativo' as const },
                { name: 'iFood', desc: 'Delivery via iFood', status: 'configurar' as const },
                { name: 'WhatsApp', desc: 'Notificações via WhatsApp', status: 'configurar' as const },
              ].map((int) => (
                <div
                  key={int.name}
                  className="flex items-center justify-between p-4 rounded-lg border bg-[hsl(var(--card))]"
                >
                  <div>
                    <p className="text-body font-medium">{int.name}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{int.desc}</p>
                  </div>
                  <Badge variant={int.status === 'ativo' ? 'success' : 'secondary'} className="text-sm">
                    {int.status === 'ativo' ? 'Ativo' : 'Configurar'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}