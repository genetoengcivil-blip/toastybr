import { useState } from 'react'
import { Users, UserPlus, Search, Shield, ShieldCheck, ShieldAlert, User, MoreHorizontal, Trash2, Settings, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { useCurrentOrganization, useAuth } from '../features/auth/context'
import {
  useOrganizationMembers,
  useOrganizationInvites,
  useInviteMember,
  useCancelInvite,
  useChangeMemberRole,
  useRemoveMember,
} from '../features/staff/hooks'
import type { MemberWithProfile } from '../features/staff/services'
import type { OrganizationRole } from '../lib/supabase/types'

const ROLE_CONFIG: Record<OrganizationRole, { label: string; icon: typeof Shield; color: string }> = {
  owner: { label: 'Owner', icon: ShieldCheck, color: 'text-yellow-500' },
  admin: { label: 'Admin', icon: ShieldAlert, color: 'text-blue-500' },
  manager: { label: 'Manager', icon: Shield, color: 'text-green-500' },
  staff: { label: 'Staff', icon: User, color: 'text-gray-500' },
}

const ROLE_OPTIONS: OrganizationRole[] = ['owner', 'admin', 'manager', 'staff']

export default function StaffPage() {
  const { organization, role } = useCurrentOrganization()
  const { user } = useAuth()
  const orgId = organization?.id

  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(orgId ?? null)
  const { data: invites = [], isLoading: invitesLoading } = useOrganizationInvites(orgId ?? null)

  const inviteMember = useInviteMember(orgId ?? '')
  const cancelInvite = useCancelInvite(orgId ?? '')
  const changeRole = useChangeMemberRole(orgId ?? '')
  const removeMember = useRemoveMember(orgId ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<OrganizationRole | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null)
  const [newRole, setNewRole] = useState<OrganizationRole>('staff')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('staff')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const canManage = role === 'owner' || role === 'admin'
  const isOwner = role === 'owner'

  const filteredMembers = members.filter((m) => {
    const matchesSearch = !searchQuery ||
      m.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || m.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: members.length,
    owners: members.filter((m) => m.role === 'owner').length,
    admins: members.filter((m) => m.role === 'admin').length,
    managers: members.filter((m) => m.role === 'manager').length,
    staff: members.filter((m) => m.role === 'staff').length,
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole })
    setInviteEmail('')
    setInviteRole('staff')
    setInviteDialogOpen(false)
  }

  const handleChangeRole = async () => {
    if (!selectedMember) return
    await changeRole.mutateAsync({ memberId: selectedMember.id, newRole })
    setChangeRoleDialogOpen(false)
  }

  const handleRemove = async () => {
    if (!selectedMember) return
    await removeMember.mutateAsync(selectedMember.id)
    setRemoveDialogOpen(false)
  }

  const handleCopyToken = (tokenHash: string) => {
    navigator.clipboard.writeText(tokenHash)
    setCopiedToken(tokenHash)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (!orgId) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Gerenciar membros e permissões</p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus size={16} className="mr-2" />
            Convidar
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[hsl(var(--primary))]/10 p-2">
                <Users size={16} className="text-[hsl(var(--primary))]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-500/10 p-2">
                <ShieldCheck size={16} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.owners}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Owners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <ShieldAlert size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <Shield size={16} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.managers}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-500/10 p-2">
                <User size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.staff}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Membros</CardTitle>
              <CardDescription>{members.length} membro(s) na organização</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <select
                value={roleFilter || ''}
                onChange={(e) => setRoleFilter(e.target.value as OrganizationRole || null)}
                className="px-3 py-2 text-sm border rounded-md bg-[hsl(var(--background))]"
              >
                <option value="">Todos</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-[hsl(var(--muted))] rounded animate-pulse" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-[hsl(var(--muted-foreground))] mb-2" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {searchQuery || roleFilter ? 'Nenhum membro encontrado' : 'Nenhum membro'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const RoleIcon = ROLE_CONFIG[member.role].icon
                const isCurrentUser = member.user_id === user?.id
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-[hsl(var(--card))]/50 hover:bg-[hsl(var(--muted))]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-sm font-medium">
                        {member.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.profiles?.full_name || 'Usuário'}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                          )}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="gap-1">
                        <RoleIcon size={12} className={ROLE_CONFIG[member.role].color} />
                        {ROLE_CONFIG[member.role].label}
                      </Badge>
                      {canManage && !isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member)
                                setNewRole(member.role)
                                setChangeRoleDialogOpen(true)
                              }}
                            >
                              <Settings size={14} className="mr-2" />
                              Alterar role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member)
                                setRemoveDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convites Pendentes</CardTitle>
            <CardDescription>{invites.length} convite(s) aguardando aceite</CardDescription>
          </CardHeader>
          <CardContent>
            {invitesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-[hsl(var(--muted))] rounded animate-pulse" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus size={32} className="mx-auto text-[hsl(var(--muted-foreground))] mb-2" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum convite pendente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-[hsl(var(--card))]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-sm font-medium">
                        {invite.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          Enviado {new Date(invite.created_at).toLocaleDateString('pt-BR')} ·
                          Expira {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {ROLE_CONFIG[invite.role].label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyToken(invite.token_hash)}
                      >
                        {copiedToken === invite.token_hash ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => cancelInvite.mutateAsync(invite.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>Envie um convite para ingressar na organização</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-[hsl(var(--background))]"
              >
                {isOwner && ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                ))}
                {!isOwner && ROLE_OPTIONS.filter((r) => r !== 'owner').map((r) => (
                  <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteMember.isPending}>
              {inviteMember.isPending ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar role</DialogTitle>
            <DialogDescription>
              Alterar a role de {selectedMember?.profiles?.full_name || 'membro'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nova role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as OrganizationRole)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-[hsl(var(--background))]"
            >
              {isOwner && ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
              {!isOwner && ROLE_OPTIONS.filter((r) => r !== 'owner').map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangeRole} disabled={changeRole.isPending}>
              {changeRole.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {selectedMember?.profiles?.full_name || 'este membro'} da organização?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removeMember.isPending}>
              {removeMember.isPending ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
