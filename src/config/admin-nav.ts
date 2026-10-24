import { canAny, type Permission, type Role } from '@/lib/permissions'

/**
 * The admin panel's sections. Each entry lists the permissions that unlock it
 * (any one is enough); the sidebar shows only what a person's roles allow, and
 * each page checks the same permissions on the server.
 */
export type AdminNavItem = { to: string; label: string; permissions: Permission[] }
export type AdminNavGroup = { title: string | null; items: AdminNavItem[] }

export const ADMIN_NAV: AdminNavGroup[] = [
  { title: null, items: [{ to: '/', label: 'Overview', permissions: ['admin.access'] }] },
  {
    title: 'Tournaments',
    items: [
      { to: '/tournaments', label: 'Tournaments', permissions: ['tournaments.manage'] },
      { to: '/registrations', label: 'Registrations', permissions: ['registrations.review'] },
      { to: '/forms', label: 'Registration forms', permissions: ['forms.manage'] },
      { to: '/lft', label: 'Looking for team', permissions: ['lft.manage'] },
      { to: '/games', label: 'Games', permissions: ['games.manage'] },
    ],
  },
  {
    title: 'AntiCheat',
    items: [
      { to: '/reports', label: 'Reports', permissions: ['anticheat.review'] },
      { to: '/alerts', label: 'Alerts', permissions: ['anticheat.review'] },
      { to: '/flags', label: 'Flags', permissions: ['anticheat.review'] },
      { to: '/entry', label: 'Manual entry', permissions: ['anticheat.manual_entry'] },
      { to: '/scans', label: 'Scans', permissions: ['anticheat.scan'] },
    ],
  },
  {
    title: 'Inbox',
    items: [
      { to: '/bookings', label: 'Production bookings', permissions: ['inbox.production'] },
      { to: '/inquiries', label: 'Product inquiries', permissions: ['inbox.production'] },
      { to: '/messages', label: 'Messages', permissions: ['inbox.messages'] },
      { to: '/waitlist', label: 'Points waitlist', permissions: ['inbox.waitlist'] },
    ],
  },
  {
    title: 'Website',
    items: [
      { to: '/settings', label: 'Site settings', permissions: ['settings.manage', 'settings.production', 'settings.points'] },
      { to: '/content', label: 'Media & team', permissions: ['content.manage'] },
    ],
  },
  {
    title: 'Team',
    items: [
      { to: '/staff', label: 'Staff & roles', permissions: ['staff.manage'] },
      { to: '/audit', label: 'Audit log', permissions: ['audit.view'] },
    ],
  },
]

/** The sections this person can open, empty groups removed. */
export function navFor(roles: readonly Role[]): AdminNavGroup[] {
  return ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => canAny(roles, i.permissions)) })).filter((g) => g.items.length)
}
