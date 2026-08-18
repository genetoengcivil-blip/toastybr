import { useState, useEffect } from 'react'
import { Building2, Bell, Users, Shield, Globe, Save } from 'lucide-react'
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

  const { data: settings } = useOrganizationSettings(orgId ?? null)
  const { data: businessHours = [] } = useBusinessHours(orgId ?? null)
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
  }

  if (!orgId) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Preferências do sistema</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          {settingsSections.map((s) => {
            const Icon = s.icon
            return (
              <TabsTrigger key={s.id} value={s.id}>
                <Icon size={14} className="mr-2" />{s.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do restaurante</CardTitle>
                <CardDescription>Informações básicas da organização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canEdit}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canEdit}
                    placeholder="contato@restaurante.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Endereço</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Rua, número — Cidade, UF"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fuso horário</label>
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
                  <Button onClick={handleSaveGeneral} disabled={updateSettings.isPending}>
                    <Save size={14} className="mr-2" />
                    {updateSettings.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Horário de funcionamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div key={day} className="flex items-center justify-between p-3 rounded-md bg-[hsl(var(--muted))]/50">
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
                        <span className="text-sm font-medium w-32">{WEEKDAY_NAMES[day]}</span>
                      </div>
                      {hours[day]?.isOpen ? (
                        <div className="flex items-center gap-2">
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
                            className="px-2 py-1 text-sm border rounded"
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
                            className="px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <Button onClick={handleSaveHours} disabled={updateHours.isPending} className="mt-4">
                    <Save size={14} className="mr-2" />
                    {updateHours.isPending ? 'Salvando...' : 'Salvar horários'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferências de notificação</CardTitle>
                <CardDescription>Controle quando e como receber alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Pedidos novos', desc: 'Receber alerta ao receber um pedido', enabled: true },
                  { label: 'Estoque baixo', desc: 'Alerta quando estoque atinge mínimo', enabled: true },
                  { label: 'Resumo diário', desc: 'Relatório de fechamento do dia', enabled: false },
                  { label: 'Pagamentos', desc: 'Notificação de pagamentos recebidos', enabled: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-[hsl(var(--muted))]/50">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                    </div>
                    <Badge variant={item.enabled ? 'success' : 'secondary'}>
                      {item.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gerenciar equipe</CardTitle>
                <CardDescription>Adicionar, remover ou alterar permissões</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Acesse a página <a href="/staff" className="underline underline-offset-2 text-[hsl(var(--primary))]">Equipe</a> para gerenciar membros e permissões.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Segurança</CardTitle>
                <CardDescription>Gerenciar senha e autenticação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    type="email"
                    defaultValue={user?.email}
                    disabled
                  />
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Para alterar o e-mail, acesse as configurações da conta Supabase.
                </p>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alterar senha</label>
                  <Input type="password" placeholder="Nova senha" />
                  <Input type="password" placeholder="Confirmar senha" />
                </div>
                <Button variant="outline" onClick={async () => {
                  const { supabase } = await import('../lib/supabase/client')
                  const { error } = await supabase.auth.updateUser({ password: '' })
                  if (error) {
                    const { toast } = await import('sonner')
                    toast.error(error.message)
                  } else {
                    const { toast } = await import('sonner')
                    toast.success('Senha alterada com sucesso')
                  }
                }}>
                  Alterar senha
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integrações</CardTitle>
                <CardDescription>Conectar serviços externos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Supabase', desc: 'Banco de dados e autenticação', status: 'ativo' },
                  { name: 'iFood', desc: 'Delivery via iFood', status: 'configurar' },
                  { name: 'WhatsApp', desc: 'Notificações via WhatsApp', status: 'configurar' },
                ].map((int) => (
                  <div key={int.name} className="flex items-center justify-between p-3 rounded-md bg-[hsl(var(--muted))]/50">
                    <div>
                      <p className="text-sm font-medium">{int.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{int.desc}</p>
                    </div>
                    <Badge variant={int.status === 'ativo' ? 'success' : 'secondary'}>
                      {int.status === 'ativo' ? 'Ativo' : 'Configurar'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
