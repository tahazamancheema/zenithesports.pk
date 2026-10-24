import 'server-only'
import { can, canAny, type Role } from '@/lib/permissions'
import { registrationsDashboard } from './admin-tournaments'
import { anticheatOverview } from './anticheat'
import { hqOverview } from './intake'

export type OverviewTile = { label: string; value: number; tone?: 'warn' | 'bad' | 'ok'; to: string }
export type OverviewGroup = { title: string; tiles: OverviewTile[] }

/**
 * What is waiting for this person, grouped by area: only areas their roles
 * cover, and tournament numbers counted within their games. A failing count
 * hides its group rather than failing the page.
 */
export async function adminSummary(staff: { roles: Role[]; gameScope: string[] | null }): Promise<OverviewGroup[]> {
  const { roles } = staff
  const [reg, ac, hq] = await Promise.all([
    canAny(roles, ['registrations.review', 'tournaments.manage']) ? registrationsDashboard(staff.gameScope).catch(() => null) : null,
    can(roles, 'anticheat.review') ? anticheatOverview().catch(() => null) : null,
    canAny(roles, ['inbox.messages', 'inbox.production', 'inbox.waitlist']) ? hqOverview().catch(() => null) : null,
  ])
  const groups: OverviewGroup[] = []
  if (reg) {
    const tiles: OverviewTile[] = []
    if (can(roles, 'registrations.review')) {
      tiles.push({ label: 'Registrations to review', value: reg.pending, tone: reg.pending ? 'warn' : undefined, to: '/registrations?status=pending' })
      tiles.push({ label: 'Waitlisted', value: reg.waitlisted, to: '/registrations?status=waitlisted' })
      tiles.push({ label: 'Approved today', value: reg.approvedToday, tone: 'ok', to: '/registrations?status=approved' })
    }
    if (can(roles, 'tournaments.manage')) tiles.push({ label: 'Published tournaments', value: reg.liveTournaments, to: '/tournaments' })
    groups.push({ title: 'Tournaments', tiles })
  }
  if (ac) {
    groups.push({
      title: 'AntiCheat',
      tiles: [
        { label: 'Reports to review', value: ac.pendingReports, tone: ac.pendingReports ? 'warn' : undefined, to: '/reports?status=pending' },
        { label: 'Open alerts', value: ac.openAlerts, tone: ac.openAlerts ? 'bad' : undefined, to: '/alerts' },
        { label: 'Waiting for clarification', value: ac.clarification, to: '/reports?status=needs_clarification' },
        { label: 'Active flags', value: ac.activeFlags, to: '/flags' },
      ],
    })
  }
  if (hq) {
    const tiles: OverviewTile[] = []
    if (can(roles, 'inbox.production')) {
      tiles.push({ label: 'Bookings to review', value: hq.bookings, tone: hq.bookings ? 'warn' : undefined, to: '/bookings' })
      tiles.push({ label: 'New inquiries', value: hq.inquiries, tone: hq.inquiries ? 'warn' : undefined, to: '/inquiries' })
    }
    if (can(roles, 'inbox.messages')) tiles.push({ label: 'New messages', value: hq.messages, tone: hq.messages ? 'warn' : undefined, to: '/messages' })
    if (can(roles, 'inbox.waitlist')) tiles.push({ label: 'Points waitlist', value: hq.waitlist, to: '/waitlist' })
    groups.push({ title: 'Inbox', tiles })
  }
  return groups.filter((g) => g.tiles.length)
}
