export const ROLES = [
  'super_admin',
  'senior_admin',
  'tournament_admin',
  'game_manager',
  'registration_reviewer',
  'anticheat_reviewer',
  'inbox_manager',
  'production_manager',
  'website_developer',
  'app_manager',
] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Owner',
  senior_admin: 'Administrator',
  tournament_admin: 'Tournament manager',
  game_manager: 'Game manager',
  registration_reviewer: 'Registration reviewer',
  anticheat_reviewer: 'AntiCheat reviewer',
  inbox_manager: 'Inbox manager',
  production_manager: 'Production manager',
  website_developer: 'Website developer',
  app_manager: 'App manager',
}

/** What each role is for, shown when staff are added or edited. */
export const ROLE_DESCRIPTION: Record<Role, string> = {
  super_admin: 'Everything, including adding staff and changing roles.',
  senior_admin: 'Everything except staff and roles, and permanently deleting evidence.',
  tournament_admin: 'Tournaments, forms, games, registrations and Looking for Team, for every game.',
  game_manager: 'Tournaments, forms and registrations for the games assigned to them only.',
  registration_reviewer: 'Approves, rejects and waitlists registrations, and moderates Looking for Team.',
  anticheat_reviewer: 'Reports, alerts, flags, manual entries and scans.',
  inbox_manager: 'Contact messages, production bookings and inquiries, and the ZenithPoints waitlist.',
  production_manager: 'ZenithProduction bookings, inquiries and its page on the site.',
  website_developer: 'Site settings, the announcement bar, media and team pages.',
  app_manager: 'ZenithPoints: the launch waitlist and its page on the site.',
}

/** Roles whose tournament work can be limited to particular games. */
export const GAME_SCOPED_ROLES: readonly Role[] = ['game_manager', 'registration_reviewer']

const OWNER = ['super_admin'] as const
const ADMIN = ['super_admin', 'senior_admin'] as const
const TOURNAMENT = [...ADMIN, 'tournament_admin', 'game_manager'] as const
const REVIEW = [...TOURNAMENT, 'registration_reviewer'] as const
const ANTICHEAT = [...ADMIN, 'anticheat_reviewer'] as const

/** Least privilege. Every server action checks one of these, never a role name. */
export const PERMISSIONS = {
  /** Open the admin panel at all (any staff role). */
  'admin.access': ROLES,
  'tournaments.manage': TOURNAMENT,
  'forms.manage': TOURNAMENT,
  'games.manage': [...ADMIN, 'tournament_admin'],
  'registrations.review': REVIEW,
  'registrations.export': TOURNAMENT,
  'lft.manage': REVIEW,
  // Tournament staff see that a registration raised an alert; only AntiCheat reviewers see why.
  'anticheat.alerts.summary': [...REVIEW, 'anticheat_reviewer'],
  'anticheat.review': ANTICHEAT,
  'anticheat.flag': ANTICHEAT,
  'anticheat.manual_entry': ANTICHEAT,
  'anticheat.scan': ANTICHEAT,
  'anticheat.lift': ADMIN,
  'anticheat.evidence.purge': OWNER,
  'inbox.messages': [...ADMIN, 'inbox_manager'],
  'inbox.production': [...ADMIN, 'inbox_manager', 'production_manager'],
  'inbox.waitlist': [...ADMIN, 'inbox_manager', 'app_manager'],
  'settings.manage': [...ADMIN, 'website_developer'],
  'settings.production': [...ADMIN, 'website_developer', 'production_manager'],
  'settings.points': [...ADMIN, 'website_developer', 'app_manager'],
  'content.manage': [...ADMIN, 'website_developer'],
  'audit.view': ADMIN,
  'staff.manage': OWNER,
} as const satisfies Record<string, readonly Role[]>

export type Permission = keyof typeof PERMISSIONS

export function can(roles: readonly Role[], permission: Permission) {
  const allowed = PERMISSIONS[permission] as readonly Role[]
  return roles.some((r) => allowed.includes(r))
}

/** True when any of the permissions is held. */
export const canAny = (roles: readonly Role[], permissions: readonly Permission[]) => permissions.some((p) => can(roles, p))

/**
 * Historical console names, kept so existing code reads naturally. There is one
 * admin panel and one session now; every surface opens with any staff role and
 * each page and action checks its own permission.
 */
export const SURFACE_GATE = {
  registrations: 'admin.access',
  anticheat: 'admin.access',
  hq: 'admin.access',
} as const satisfies Record<string, Permission>

export type ConsoleSurface = keyof typeof SURFACE_GATE
