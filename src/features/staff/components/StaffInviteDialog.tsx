import { useState } from 'react'
import { useInviteMember } from '../hooks'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

interface StaffInviteDialogProps {
  orgId: string
  onClose?: () => void
}

export function StaffInviteDialog({ orgId, onClose }: StaffInviteDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('staff')
  const invite = useInviteMember(orgId)
  const isPending = invite.isPending

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await invite.mutateAsync({ email, role })
      onClose?.()
    } catch {
      /* error surfaced via toast in hook */
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="staff-invite-form">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="invite-email">Email do convidado</label>
        <Input
          id="invite-email"
          type="email"
          aria-label="Email do convidado"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="convidado@email.com"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="invite-role">Função</label>
        <select
          id="invite-role"
          aria-label="Função"
          className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending || !email}>
          {isPending ? 'Enviando...' : 'Enviar convite'}
        </Button>
      </div>
    </form>
  )
}
