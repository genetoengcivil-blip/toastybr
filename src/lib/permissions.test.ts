import { describe, it, expect } from 'vitest'
import { can, canManageRole, canRemoveMember, ROLE_PERMISSIONS, type Permission } from './permissions'
import type { Role } from './permissions'

const ROLES: Role[] = ['owner', 'admin', 'manager', 'staff']

// Contract derived from TOASTY_ROLE_MATRIX.md
// Each entry: [permission, allowedRoles]
const EXPECTED: Array<[Permission, Role[]]> = [
  ['finance.view', ['owner', 'admin', 'manager', 'staff']],
  ['finance.createAP', ['owner', 'admin']],
  ['finance.payAP', ['owner', 'admin']],
  ['finance.cancelAP', ['owner', 'admin']],
  ['finance.createAR', ['owner', 'admin']],
  ['finance.receiveAR', ['owner', 'admin']],
  ['finance.cancelAR', ['owner', 'admin']],
  ['finance.manualEntry', ['owner', 'admin']],
  ['finance.reverse', ['owner', 'admin']],
  ['staff.invite', ['owner', 'admin']],
  ['staff.cancelInvite', ['owner', 'admin']],
  ['staff.changeRole', ['owner', 'admin']],
  ['staff.remove', ['owner', 'admin']],
  ['staff.viewPendingInvites', ['owner', 'admin']],
  ['sales.open', ['owner', 'admin', 'manager', 'staff']],
  ['sales.finalize', ['owner', 'admin', 'manager', 'staff']],
  ['sales.cancel', ['owner', 'admin', 'manager']],
  ['sales.view', ['owner', 'admin', 'manager', 'staff']],
  ['kitchen.advance', ['owner', 'admin', 'manager', 'staff']],
  ['inventory.move', ['owner', 'admin', 'manager']],
  ['inventory.editMinimum', ['owner', 'admin', 'manager']],
  ['org.editSettings', ['owner', 'admin']],
  ['org.editHours', ['owner', 'admin', 'manager']],
]

describe('ROLE MATRIX CONTRACT (vs TOASTY_ROLE_MATRIX.md)', () => {
  it('encodes every documented permission exactly', () => {
    for (const [permission, allowed] of EXPECTED) {
      expect(ROLE_PERMISSIONS[permission], `permission ${permission} missing`).toBeDefined()
      const actual = ROLES.filter(r => ROLE_PERMISSIONS[permission].includes(r)).sort()
      expect(actual).toEqual([...allowed].sort())
    }
  })

  it('owner has full access to all permissions', () => {
    const all = Object.keys(ROLE_PERMISSIONS) as Permission[]
    for (const p of all) {
      expect(can('owner', p)).toBe(true)
    }
  })

  it('staff cannot perform any finance mutation or staff management', () => {
    const denied: Permission[] = [
      'finance.createAP', 'finance.payAP', 'finance.cancelAP',
      'finance.createAR', 'finance.receiveAR', 'finance.cancelAR',
      'finance.manualEntry', 'finance.reverse',
      'staff.invite', 'staff.cancelInvite', 'staff.changeRole', 'staff.remove',
      'org.editSettings',
    ]
    for (const p of denied) {
      expect(can('staff', p), `staff should NOT have ${p}`).toBe(false)
    }
  })

  it('manager can move inventory and cancel sales but not finance mutations', () => {
    expect(can('manager', 'inventory.move')).toBe(true)
    expect(can('manager', 'sales.cancel')).toBe(true)
    expect(can('manager', 'finance.payAP')).toBe(false)
    expect(can('manager', 'staff.invite')).toBe(false)
  })

  it('staff can operate PDV but not cancel sales', () => {
    expect(can('staff', 'sales.open')).toBe(true)
    expect(can('staff', 'sales.finalize')).toBe(true)
    expect(can('staff', 'sales.cancel')).toBe(false)
  })

  it('null role grants nothing', () => {
    expect(can(null, 'finance.view')).toBe(false)
  })
})

describe('ROLE ESCALATION RULES', () => {
  it('nobody can manage a role equal or higher than their own', () => {
    expect(canManageRole('admin', 'owner')).toBe(false)
    expect(canManageRole('admin', 'admin')).toBe(false)
    expect(canManageRole('manager', 'manager')).toBe(false)
    expect(canManageRole('manager', 'owner')).toBe(false)
    expect(canManageRole('staff', 'staff')).toBe(false)
  })

  it('owner can manage any role below owner', () => {
    expect(canManageRole('owner', 'admin')).toBe(true)
    expect(canManageRole('owner', 'manager')).toBe(true)
    expect(canManageRole('owner', 'staff')).toBe(true)
  })

  it('admin can manage manager/staff but not owner', () => {
    expect(canManageRole('admin', 'manager')).toBe(true)
    expect(canManageRole('admin', 'staff')).toBe(true)
    expect(canManageRole('admin', 'owner')).toBe(false)
  })

  it('admin can remove manager/staff but not owner', () => {
    expect(canRemoveMember('admin', 'manager')).toBe(true)
    expect(canRemoveMember('admin', 'staff')).toBe(true)
    expect(canRemoveMember('admin', 'owner')).toBe(false)
  })

  it('owner can remove any non-owner role', () => {
    expect(canRemoveMember('owner', 'admin')).toBe(true)
    expect(canRemoveMember('owner', 'staff')).toBe(true)
  })

  it('null actor/target blocks management', () => {
    expect(canManageRole(null, 'staff')).toBe(false)
    expect(canManageRole('owner', null)).toBe(false)
    expect(canRemoveMember(null, 'staff')).toBe(false)
  })
})
