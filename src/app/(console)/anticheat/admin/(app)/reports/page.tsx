import Link from 'next/link'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { consoleBase } from '@/server/console-base'
import { listReports } from '@/server/services/anticheat'

export const metadata = { title: 'Report queue' }
const STATUSES = ['pending', 'needs_clarification', 'approved', 'rejected']

export default async function Reports(props: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await props.searchParams
  const status = STATUSES.includes(sp.status ?? '') ? sp.status : undefined
  const base = await consoleBase('anticheat')
  const rows = await listReports({ status, page: Number(sp.page) || 1 })
  return (
    <>
      <ConsoleTitle title="Report queue" sub="Pending first, oldest first. Approval requires a confirmed UID match." />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter">
        <Link href={`${base}/reports`} className={`btn btn-sm ${!status ? 'btn-primary' : 'btn-ghost'}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`${base}/reports?status=${s}`} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s.replace('_', ' ')}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Reported UID</th>
              <th>Signals</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-fg-3">
                  No reports.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">
                  <Link href={`${base}/reports/${r.id}`} className="hover:text-[var(--accent)]">
                    {r.reference}
                  </Link>
                </td>
                <td>
                  <span className="font-mono">{r.reportedUidRaw}</span>
                  {r.reportedIgn && <span className="text-fg-3"> · {r.reportedIgn}</span>}
                </td>
                <td className="flex flex-wrap gap-1.5">
                  {r.sameUidReports > 1 && <span className="chip">{r.sameUidReports} reports for UID</span>}
                  {r.duplicateOf && <span className="chip">duplicate</span>}
                  {r.evidenceReused && <span className="chip chip-warn">evidence reused</span>}
                  {r.priorFlags > 0 && <span className="chip chip-bad">already flagged</span>}
                </td>
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
