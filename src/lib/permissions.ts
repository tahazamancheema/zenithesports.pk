export const ROLES = ['super_admin', 'senior_admin', 'tournament_admin', 'anticheat_reviewer'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super administrator',
  senior_admin: 'Senior administrator',
  tournament_admin: 'Tournament administrator',
  anticheat_reviewer: 'AntiCheat reviewer',
}

const TOURNAMENT = ['super_admin', 'senior_admin', 'tournament_admin'] as const
const ANTICHEAT = ['super_admin', 'senior_admin', 'anticheat_reviewer'] as const
const SENIOR = ['super_admin', 'senior_admin'] as const

/** Least privilege. Every server action checks one of these, never a role name. */
export const PERMISSIONS = {
  'tournaments.manage': TOURNAMENT,
  'forms.manage': TOURNAMENT,
  'registrations.review': TOURNAMENT,
  'registrations.export': TOURNAMENT,
  'lft.manage': TOURNAMENT,
  // Tournament admins see that a registration raised an alert; only reviewers see why.
  'anticheat.alerts.summary': ['super_admin', 'senior_admin', 'tournament_admin', 'anticheat_reviewer'],
  'anticheat.review': ANTICHEAT,
  'anticheat.flag': ANTICHEAT,
  'anticheat.manual_entry': ANTICHEAT,
  'anticheat.scan': ANTICHEAT,
  'anticheat.lift': SENIOR,
  'anticheat.evidence.purge': ['super_admin'],
  'intake.manage': SENIOR,
  'settings.manage': SENIOR,
  'content.manage': SENIOR,
  'audit.view': SENIOR,
  'staff.manage': ['super_admin'],
} as const satisfies Record<string, readonly Role[]>

export type Permission = keyof typeof PERMISSIONS

export function can(roles: readonly Role[], permission: Permission) {
  const allowed = PERMISSIONS[permission] as readonly Role[]
  return roles.some((r) => allowed.includes(r))
}

/** Which permission opens each console at all. */
export const SURFACE_GATE = {
  registrations: 'tournaments.manage',
  anticheat: 'anticheat.review',
  hq: 'intake.manage',
} as const satisfies Record<string, Permission>

export type ConsoleSurface = keyof typeof SURFACE_GATE
