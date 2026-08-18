import type { OrganizationRole } from '../lib/supabase/types'

export type Role = OrganizationRole

export type Permission =
  | 'finance.view'
  | 'finance.createAP'
  | 'finance.payAP'
  | 'finance.cancelAP'
  | 'finance.createAR'
  | 'finance.receiveAR'
  | 'finance.cancelAR'
  | 'finance.manualEntry'
  | 'finance.reverse'
  | 'staff.invite'
  | 'staff.cancelInvite'
  | 'staff.changeRole'
  | 'staff.remove'
  | 'staff.viewPendingInvites'
  | 'sales.open'
  | 'sales.finalize'
  | 'sales.cancel'
  | 'sales.view'
  | 'kitchen.advance'
  | 'inventory.move'
  | 'inventory.editMinimum'
  | 'org.editSettings'
  | 'org.editHours'

const OWNER_ADMIN: readonly Role[] = ['owner', 'admin']
const OWNER_ADMIN_MANAGER: readonly Role[] = ['owner', 'admin', 'manager']
const ALL: readonly Role[] = ['owner', 'admin', 'manager', 'staff']

// Encoded from TOASTY_ROLE_MATRIX.md sections 2, 4, 5, 7, 1.
export const ROLE_PERMISSIONS: Record<Permission, readonly Role[]> = {
  'finance.view': ALL,
  'finance.createAP': OWNER_ADMIN,
  'finance.payAP': OWNER_ADMIN,
  'finance.cancelAP': OWNER_ADMIN,
  'finance.createAR': OWNER_ADMIN,
  'finance.receiveAR': OWNER_ADMIN,
  'finance.cancelAR': OWNER_ADMIN,
  'finance.manualEntry': OWNER_ADMIN,
  'finance.reverse': OWNER_ADMIN,
  'staff.invite': OWNER_ADMIN,
  'staff.cancelInvite': OWNER_ADMIN,
  'staff.changeRole': OWNER_ADMIN,
  'staff.remove': OWNER_ADMIN,
  'staff.viewPendingInvites': OWNER_ADMIN,
  'sales.open': ALL,
  'sales.finalize': ALL,
  'sales.cancel': OWNER_ADMIN_MANAGER,
  'sales.view': ALL,
  'kitchen.advance': ALL,
  'inventory.move': OWNER_ADMIN_MANAGER,
  'inventory.editMinimum': OWNER_ADMIN_MANAGER,
  'org.editSettings': OWNER_ADMIN,
  'org.editHours': OWNER_ADMIN_MANAGER,
}

export function can(role: Role | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[permission].includes(role)
}

// Escalation rules (TOASTY_ROLE_MATRIX.md — Regras de Escalação)
// - Ninguém pode promover/demover para role >= sua própria
// - Admin não toca em owner (não remove, não altera role de owner)
const ROLE_RANK: Record<Role, number> = {
  staff: 0,
  manager: 1,
  admin: 2,
  owner: 3,
}

export function canManageRole(actor: Role | null, target: Role | null): boolean {
  if (!actor || !target) return false
  // Cannot manage a role equal-or-higher than your own.
  if (ROLE_RANK[target] >= ROLE_RANK[actor]) return false
  // Admin specifically cannot touch owners.
  if (actor === 'admin' && target === 'owner') return false
  return true
}

export function canRemoveMember(actor: Role | null, target: Role | null): boolean {
  if (!actor || !target) return false
  if (!can(actor, 'staff.remove')) return false
  // Admin cannot remove an owner.
  if (actor === 'admin' && target === 'owner') return false
  return true
}
