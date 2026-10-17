import Link from 'next/link'
import { ConsoleTitle, Stat } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { consoleBase } from '@/server/console-base'
import { anticheatOverview, listAlerts, listReports } from '@/server/services/anticheat'

export default async function AcOverview() {
  const base = await consoleBase('anticheat')
  const [o, reports, alerts] = await Promise.all([anticheatOverview(), listReports({ status: 'pending' }), listAlerts({ status: 'open' })])
  return (
    <>
      <ConsoleTitle title="Overview" sub="Reports and alerts appear here as they arrive." />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
        <Stat label="Reports pending" value={o.pendingReports} tone={o.pendingReports ? 'warn' : undefined} href={`${base}/reports`} />
        <Stat label="Awaiting clarification" value={o.clarification} href={`${base}/reports?status=needs_clarification`} />
        <Stat label="Open alerts" value={o.openAlerts} tone={o.openAlerts ? 'bad' : undefined} href={`${base}/alerts`} />
        <Stat label="Active flags" value={o.activeFlags} href={`${base}/flags`} />
      </div>
      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="t-label mb-3">Oldest pending reports</h2>
          <ul className="divide-y divide-line rounded-md border border-line">
            {reports.slice(0, 8).map((r) => (
              <li key={r.id}>
                <Link href={`${base}/reports/${r.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-ink-2">
                  <span className="font-mono text-xs">{r.reference}</span>
                  <span className="font-mono text-fg-2">{r.reportedUidRaw}</span>
                  {r.duplicateOf && <span className="chip">duplicate</span>}
                  {r.priorFlags > 0 && <span className="chip chip-bad">already flagged</span>}
                  <span className="ml-auto font-mono text-xs text-fg-3">{fmt(r.createdAt)}</span>
                </Link>
              </li>
            ))}
            {reports.length === 0 && <li className="px-4 py-8 text-center text-sm text-fg-3">Queue is clear.</li>}
          </ul>
        </section>
        <section>
          <h2 className="t-label mb-3">Highest-confidence open alerts</h2>
          <ul className="divide-y divide-line rounded-md border border-line">
            {alerts.slice(0, 8).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <StatusChip value={a.confidence} />
                <span>{a.matchKind.replace('_', ' ')}</span>
                <span className="text-fg-2">{a.teamName ?? a.registrationRef ?? a.entityType}</span>
                <span className="ml-auto font-mono text-xs text-fg-3">{fmt(a.lastDetectedAt)}</span>
              </li>
            ))}
            {alerts.length === 0 && <li className="px-4 py-8 text-center text-sm text-fg-3">No open alerts.</li>}
          </ul>
        </section>
      </div>
    </>
  )
}
