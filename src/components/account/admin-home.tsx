import { ROLE_LABEL } from '@/lib/permissions'
import type { StaffProfile } from '@/server/services/account'
import { adminSummary } from '@/server/services/admin-overview'
import { navFor } from '@/config/admin-nav'

/**
 * The account page for staff: one link into the admin panel, what is waiting
 * for them there, and their sections. Numbers appear only once this sign-in is
 * linked to the staff record (first entry with Google); before that, the link alone.
 */
export async function AdminHome({ staff, adminHref }: { staff: StaffProfile; adminHref: string }) {
  const groups = staff.linked ? await adminSummary(staff) : []
  const sections = navFor(staff.roles).filter((g) => g.title)
  return (
    <div className="mt-10 grid gap-8">
      <div className="panel-raised flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-accent">Admin</span>
            {staff.roles.map((r) => (
              <span key={r} className="chip">
                {ROLE_LABEL[r]}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[14px] text-fg-2">{sections.map((g) => g.title).join(' · ')}</p>
        </div>
        <a href={adminHref} className="btn btn-primary">
          Open the admin panel <span className="arrow">→</span>
        </a>
      </div>

      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="t-label mb-3">{g.title}</h2>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
            {g.tiles.map((t) => (
              <a key={t.label} href={`${adminHref}${t.to}`} className="block bg-ink-1 p-5 transition-colors hover:bg-ink-2">
                <span className="t-label block">{t.label}</span>
                <span className={`mt-3 block font-mono text-3xl tabular-nums ${t.tone === 'warn' ? 'text-warn' : t.tone === 'bad' ? 'text-bad' : t.tone === 'ok' ? 'text-ok' : 'text-fg'}`}>{t.value}</span>
              </a>
            ))}
          </div>
        </section>
      ))}

      {!staff.linked && <p className="text-sm text-fg-3">Open the admin panel once to link this sign-in to your staff account. Its numbers then appear here.</p>}
    </div>
  )
}
