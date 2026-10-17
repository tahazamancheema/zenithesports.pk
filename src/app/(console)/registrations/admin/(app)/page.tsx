import Link from 'next/link'
import { ConsoleTitle, Stat } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { consoleBase } from '@/server/console-base'
import { registrationsDashboard } from '@/server/services/admin-tournaments'
import { listRegistrations } from '@/server/services/registrations'

export default async function Overview() {
  const base = await consoleBase('registrations')
  const [d, recent] = await Promise.all([registrationsDashboard(), listRegistrations({ pageSize: 10 })])
  return (
    <>
      <ConsoleTitle title="Overview" sub="Live: this page updates as registrations arrive." />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-5">
        <Stat label="Pending review" value={d.pending} tone={d.pending ? 'warn' : undefined} href={`${base}/registrations?status=pending`} />
        <Stat label="Waitlisted" value={d.waitlisted} href={`${base}/registrations?status=waitlisted`} />
        <Stat label="Approved (24h)" value={d.approvedToday} tone="ok" />
        <Stat label="AntiCheat alerts" value={d.openAlerts} tone={d.openAlerts ? 'bad' : undefined} />
        <Stat label="Published events" value={d.liveTournaments} href={`${base}/tournaments`} />
      </div>
      <h2 className="t-label mt-12 mb-4">Latest registrations</h2>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Team / player</th>
              <th>Tournament</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {recent.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-fg-3">
                  No registrations yet.
                </td>
              </tr>
            )}
            {recent.rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">
                  <Link href={`${base}/registrations/${r.id}`} className="hover:text-[var(--accent)]">
                    {r.reference}
                  </Link>
                </td>
                <td>
                  {r.teamName ?? r.captainIgn}
                  {r.openAlerts > 0 && <span className="chip chip-bad ml-2">alert</span>}
                </td>
                <td className="text-fg-2">{r.tournamentName}</td>
                <td>
                  <StatusChip value={r.status} />
                </td>
                <td className="font-mono text-xs text-fg-3">{fmt(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
