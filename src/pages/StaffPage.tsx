import { useState, useMemo } from 'react'
import { Users, UserPlus, Search, Shield, ShieldCheck, ShieldAlert, User, MoreHorizontal, Trash2, Settings, Copy, Check } from 'lucide-react'
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
import { Card } from '../components/ui/card'
import { cn } from '../lib/utils'
import { toast } from 'sonner'

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
  const [tab, setTab] = useState('members')
  const [searchMembers, setSearchMembers] = useState('')
  const [searchInvites, setSearchInvites] = useState('')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [invitingEmail, setInvitingEmail] = useState('')
  const [invitingRole, setInvitingRole] = useState<OrganizationRole>('staff')
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null)
  const [roleOptionsOpen, setRoleOptionsOpen] = useState(false)

  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(orgId ?? null)
  const { data: invites = [], isLoading: invitesLoading } = useOrganizationInvites(orgId ?? null)
  const inviteMemberMutate = useInviteMember()
  const cancelInviteMutate = useCancelInvite()
  const changeMemberRoleMutate = useChangeMemberRole()
  const removeMemberMutate = useRemoveMember()

  const isAdmin = role === 'owner' || role === 'admin'
  const canManageRoles = role === 'owner'

  const filteredMembers = useMemo(() => {
    if (!members) return []
    const q = searchMembers.toLowerCase()
    return members.filter(
      (m) =>
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    )
  }, [members, searchMembers])

  const filteredInvites = useMemo(() => {
    if (!invites) return []
    const q = searchInvites.toLowerCase()
    return invites.filter(
      (i) =>
        i.email?.toLowerCase().includes(q) ||
        i.role?.toLowerCase().includes(q)
    )
  }, [invites, searchInvites])

  const handleInviteMember = () => {
    if (!invitingEmail || !invitingRole) return
    inviteMemberMutate.mutate(
      { email: invitingEmail, role: invitingRole },
      {
        onSuccess: () => {
          setInvitingEmail('')
          setInvitingRole('staff')
          setInviteDialogOpen(false)
          toast.success('Convite enviado')
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleCancelInvite = (inviteId: string) => {
    if (!confirm('Cancelar este convite?')) return
    cancelInviteMutate.mutate(inviteId, {
      onSuccess: () => toast.success('Convite cancelado'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const handleChangeRole = (memberId: string, newRole: OrganizationRole) => {
    changeMemberRoleMutate.mutate(
      { memberId, role: newRole },
      {
        onSuccess: () => toast.success('Função alterada'),
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleRemoveMember = (memberId: string) => {
    if (!confirm('Remover este membro da organização?')) return
    removeMemberMutate.mutate(memberId, {
      onSuccess: () => {
        setSelectedMember(null)
        setMemberDialogOpen(false)
        toast.success('Membro removido')
      },
      onError: (err: Error) => toast.error(err.message),
    })
  }

  // Loading state
  if (membersLoading || invitesLoading) {
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
          <h1 className="text-display">Equipe</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Gerencie membros da organização e permissões
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setInvitingEmail('')
                setInvitingRole('staff')
                setInviteDialogOpen(true)
              }}
              className="hover-lift"
            >
              <Plus size={16} className="mr-2 h-4 w-4" />
              Convidar membro
            </Button>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-[repeat(2,minmax(0,1fr))]">
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="invites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="relative w-64 mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
            />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchMembers}
              onChange={(e) => setSearchMembers(e.target.value)}
              className="pl-9"
            />
          </div>

          {members.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]/50" />
                <h2 className="text-heading">Nenhum membro</h2>
                <p className="text-body text-[hsl(var(--muted-foreground))]">
                  Nenhum membro encontrado na organização
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Membro
                    </TableHead>
                    <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Função
                    </TableHead>
                    <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Status
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-24">
                        Ações
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                      onClick={() => {
                        setSelectedMember(member)
                        setMemberDialogOpen(true)
                      }}
                    >
                      <TableCell className="px-6 py-4 text-font-medium whitespace-nowrap flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-[hsl(var(--muted))]/20 flex items-center justify-center">
                          {member.user?.image ? (
                            <img
                              src={member.user.image}
                              alt={member.user?.name ?? 'Usuário'}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <User size={16} className="text-[hsl(var(--muted-foreground))]" />
                          )}
                        </div>
                        <span className="text-body truncate max-w-[150px]">{member.user?.name ?? 'Usuário sem nome'}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {member.user?.email ?? '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className={`font-medium ${ROLE_CONFIG[member.role as OrganizationRole]?.color}`}>
                          {ROLE_CONFIG[member.role as OrganizationRole]?.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <Badge
                          variant={member.is_active ? 'success' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap flex items-center gap-2">
                          <button
                            onClick={() => {
                              setRoleOptionsOpen(!roleOptionsOpen)
                            }}
                            className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200"
                          >
                            {member.role === 'owner' ? (
                              <ShieldCheck size={14} className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <MoreHorizontal size={14} className="h-4 w-4" />
                            )}
                          </button>
                          {roleOptionsOpen && (
                            <DropdownMenu
                              sideOffset={4}
                              className="w-48"
                            >
                              <DropdownMenuContent className="p-1">
                                {ROLE_OPTIONS.map((option) => {
                                  if (
                                    (option === 'owner' && !canManageRoles) ||
                                    (option === member.role)
                                  )
                                    return null
                                  return (
                                    <DropdownMenuItem
                                      key={option}
                                      onSelect={() => handleChangeRole(member.id, option)}
                                    >
                                      {ROLE_CONFIG[option].label}
                                    </DropdownMenuItem>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 hover:bg-[hsl(var(--muted))]/50 rounded hover-lift transition-all duration-200 text-[hsl(var(--destructive))]"
                          >
                            <Trash2 size={14} className="h-4 w-4" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <div className="relative w-64 mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
            />
            <Input
              placeholder="Buscar por email..."
              value={searchInvites}
              onChange={(e) => setSearchInvites(e.target.value)}
              className="pl-9"
            />
          </div>

          {invites.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <UserPlus size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]/50" />
                <h2 className="text-heading">Nenhum convite pendente</h2>
                <p className="text-body text-[hsl(var(--muted-foreground))]">
                  Nenhum convite aguardando aceitação
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Função
                    </TableHead>
                    <TableHead className="text-left px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Enviado em
                    </TableHead>
                    <TableHead className="text-right px-6 py-3 text-label text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-20">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        {invite.email ?? '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className={`font-medium ${ROLE_CONFIG[invite.role as OrganizationRole]?.color}`}>
                          {ROLE_CONFIG[invite.role as OrganizationRole]?.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        {invite.created_at ? (
                          new Date(invite.created_at).toLocaleDateString('pt-BR')
                        ) : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm whitespace-nowrap">
                        <DropdownMenu
                          sideOffset={4}
                          className="w-36"
                        >
                          <DropdownMenuContent className="p-1">
                            <DropdownMenuItem
                              onSelect={() => handleCancelInvite(invite.id)}
                              destructive
                            >
                              Cancelar convite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="w-96">
          <DialogHeader><DialogTitle>Convidar membro</DialogTitle></DialogHeader>
          <DialogDescription>
            Convite para novos membros da organização
          </DialogDescription>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email do membro"
              value={invitingEmail}
              onChange={(e) => setInvitingEmail(e.target.value)}
            />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield size={16} className="text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm font-medium">Função na organização</span>
              </div>
              <Select
                value={invitingRole}
                onValueChange={(value) => setInvitingRole(value as OrganizationRole)}
                className="w-40"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                    >
                      {ROLE_CONFIG[option].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={inviteMemberMutate.isPending}
            >
              {inviteMemberMutate.isPending ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="w-96">
          <DialogHeader><DialogTitle>Detalhes do membro</DialogTitle></DialogHeader>
          {selectedMember && (
            <>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-md bg-[hsl(var(--muted))]/20 flex items-center justify-center">
                    {selectedMember.user?.image ? (
                      <img
                        src={selectedMember.user.image}
                        alt={selectedMember.user?.name ?? 'Usuário'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-[hsl(var(--muted-foreground))]" />
                    )}
                  </div>
                  <div>
                    <p className="text-heading">{selectedMember.user?.name ?? 'Usuário sem nome'}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {selectedMember.user?.email ?? 'Sem email'}
                    </p>
                  </div>
                </div>
                <div className="divider"></div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-[hsl(var(--muted-foreground))]" />
                    <span className="text-sm font-medium">Função</span>
                  </div>
                  <p className="text-sm font-medium">
                    {ROLE_CONFIG[selectedMember.role as OrganizationRole]?.label}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedMember.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[hsl(var(--muted-foreground))]" />
                    <span className="text-sm font-medium">Organização</span>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedMember.organization?.name ?? '—'}
                  </span>
                </div>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}