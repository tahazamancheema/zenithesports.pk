import { ProductIcon } from '@/components/brand/product-logos'
import { can, ROLE_LABEL, type ConsoleSurface, type Permission } from '@/lib/permissions'
import { formatInZone } from '@/lib/tournament'
import type { StaffProfile } from '@/server/services/account'
import { registrationsDashboard } from '@/server/services/admin-tournaments'
import { anticheatOverview } from '@/server/services/anticheat'
import { hqOverview } from '@/server/services/intake'
import { listAudit } from '@/server/services/staff'

type Hrefs = Record<ConsoleSurface, string>

const CONSOLE: Record<ConsoleSurface, { name: string; product: 'registrations' | 'anticheat' | 'zenith'; blurb: string }> = {
  registrations: { name: 'Registrations console', product: 'registrations', blurb: 'Tournaments, entries, forms and Looking for Team.' },
  anticheat: { name: 'AntiCheat console', product: 'anticheat', blurb: 'Reports, alerts, flags and scans.' },
  hq: { name: 'HQ console', product: 'zenith', blurb: 'Inquiries, bookings, messages, site settings and staff.' },
}

const ACTIONS: { surface: ConsoleSurface; permission: Permission; to: string; label: string }[] = [
  { surface: 'registrations', permission: 'tournaments.manage', to: '/tournaments/new', label: 'Create a tournament' },
  { surface: 'registrations', permission: 'registrations.review', to: '/registrations?status=pending', label: 'Review registrations' },
  { surface: 'registrations', permission: 'forms.manage', to: '/forms', label: 'Registration forms' },
  { surface: 'anticheat', permission: 'anticheat.review', to: '/reports?status=pending', label: 'Review reports' },
  { surface: 'anticheat', permission: 'anticheat.flag', to: '/flags/new', label: 'Record a decision' },
  { surface: 'hq', permission: 'intake.manage', to: '/bookings', label: 'Production bookings' },
  { surface: 'hq', permission: 'settings.manage', to: '/settings', label: 'Site settings' },
  { surface: 'hq', permission: 'staff.manage', to: '/staff', label: 'Staff & roles' },
]

/** Counts for one console; a failing count never fails the page. */
async function countsFor(surface: ConsoleSurface): Promise<{ label: string; value: number; tone?: 'warn' | 'bad' }[]> {
  try {
    if (surface === 'registrations') {
      const d = await registrationsDashboard()
      return [
        { label: 'Pending review', value: d.pending, tone: d.pending ? 'warn' : undefined },
        { label: 'Waitlisted', value: d.waitlisted },
        { label: 'Published events', value: d.liveTournaments },
      ]
    }
    if (surface === 'anticheat') {
      const o = await anticheatOverview()
      return [
        { label: 'Reports pending', value: o.pendingReports, tone: o.pendingReports ? 'warn' : undefined },
        { label: 'Open alerts', value: o.openAlerts, tone: o.openAlerts ? 'bad' : undefined },
        { label: 'Active flags', value: o.activeFlags },
      ]
    }
    const o = await hqOverview()
    return [
      { label: 'New inquiries', value: o.inquiries, tone: o.inquiries ? 'warn' : undefined },
      { label: 'Bookings to review', value: o.bookings, tone: o.bookings ? 'warn' : undefined },
      { label: 'New messages', value: o.messages },
    ]
  } catch {
    return []
  }
}

/**
 * The account page for staff: their consoles with what is waiting in each, shortcuts to
 * the common jobs and recent activity. Numbers appear only once this sign-in is linked to
 * the staff record (first console entry with Google); before that, only the links.
 */
export async function AdminHome({ staff, hrefs }: { staff: StaffProfile; hrefs: Hrefs }) {
  const [counts, activity] = await Promise.all([
    staff.linked ? Promise.all(staff.consoles.map(countsFor)) : Promise.resolve(staff.consoles.map(() => [])),
    staff.linked && can(staff.roles, 'audit.view') ? listAudit({}).then((r) => r.slice(0, 8)).catch(() => []) : Promise.resolve([]),
  ])
  const actions = ACTIONS.filter((a) => staff.consoles.includes(a.surface) && can(staff.roles, a.permission))

  return (
    <div className="mt-10 grid gap-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip chip-accent">Admin</span>
        {staff.roles.map((r) => (
          <span key={r} className="chip">
            {ROLE_LABEL[r]}
          </span>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {staff.consoles.map((c, i) => (
          <a key={c} href={hrefs[c]} className="panel-raised group flex flex-col gap-5 p-6 transition-colors hover:border-line-3">
            <span className="flex items-center gap-3">
              <ProductIcon product={CONSOLE[c].product} size={40} />
              <span>
                <span className="t-title block text-lg">{CONSOLE[c].name}</span>
                <span className="block text-[13px] text-fg-2">{CONSOLE[c].blurb}</span>
              </span>
            </span>
            {counts[i].length > 0 && (
              <span className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
                {counts[i].map((x) => (
                  <span key={x.label} className="bg-ink-1 p-3">
                    <span className={`block font-mono text-2xl tabular-nums ${x.tone === 'warn' ? 'text-warn' : x.tone === 'bad' ? 'text-bad' : 'text-fg'}`}>{x.value}</span>
                    <span className="mt-1 block text-[12px] leading-tight text-fg-3">{x.label}</span>
                  </span>
                ))}
              </span>
            )}
            <span className="mt-auto text-[14px] font-medium text-fg-2 group-hover:text-fg">
              Open <span className="arrow">→</span>
            </span>
          </a>
        ))}
      </div>

      {actions.length > 0 && (
        <div>
          <h2 className="t-label mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <a key={a.label} href={`${hrefs[a.surface]}${a.to}`} className="btn btn-sm btn-ghost">
                {a.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {activity.length > 0 && (
        <div>
          <h2 className="t-label mb-4">Recent activity</h2>
          <ul className="divide-y divide-line rounded-md border border-line">
            {activity.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <span className="font-mono text-[12px] text-fg-3">{formatInZone(e.at, 'Asia/Karachi', { year: undefined })}</span>
                <span className="font-mono text-[13px]">{e.action}</span>
                <span className="truncate text-fg-2">{e.actorLabel}</span>
              </li>
            ))}
          </ul>
          {hrefs.hq && (
            <a href={`${hrefs.hq}/audit`} className="t-label mt-3 inline-block hover:text-fg">
              Full audit log →
            </a>
          )}
        </div>
      )}

      {!staff.linked && (
        <p className="text-sm text-fg-3">Open any console once to link this sign-in to your staff account. Its numbers then appear here.</p>
      )}
    </div>
  )
}
