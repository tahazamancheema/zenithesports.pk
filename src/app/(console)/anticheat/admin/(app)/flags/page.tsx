import Link from 'next/link'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { consoleBase } from '@/server/console-base'
import { listFlags } from '@/server/services/anticheat'

export const metadata = { title: 'Flags' }

export default async function Flags(props: { searchParams: Promise<{ status?: string }> }) {
  const sp = await props.searchParams
  const status = ['active', 'lifted', 'expired', 'all'].includes(sp.status ?? '') ? sp.status! : 'active'
  const base = await consoleBase('anticheat')
  const flags = await listFlags(status)
  return (
    <>
      <ConsoleTitle title="Flags" sub="Private disciplinary records. Never shown publicly.">
        <Link href={`${base}/flags/new`} className="btn btn-sm btn-primary">
          Record a decision
        </Link>
      </ConsoleTitle>
      <nav className="mb-5 flex gap-2">
        {['active', 'lifted', 'expired', 'all'].map((s) => (
          <Link key={s} href={`${base}/flags?status=${s}`} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Summary</th>
              <th>Severity</th>
              <th>Identifiers</th>
              <th>Open alerts</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-fg-3">
                  No flags.
                </td>
              </tr>
            )}
            {flags.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link href={`${base}/flags/${f.id}`} className="hover:text-[var(--accent)]">
                    {f.playerIgn ?? f.teamName ?? 'Identifiers only'}
                  </Link>
                  <p className="font-mono text-xs text-fg-3">{f.gameId}</p>
                </td>
                <td className="max-w-xs text-sm text-fg-2">{f.summary}</td>
                <td>
                  <StatusChip value={f.severity === 'banned' ? 'confirmed' : f.severity === 'suspended' ? 'strong' : 'indicator'} />
                  <span className="ml-2 text-xs">{f.severity}</span>
                </td>
                <td className="text-xs text-fg-2">{f.identifiers.map((i) => `${i.kind.replace('_', ' ')} (${i.confidence})`).join(', ')}</td>
                <td className="font-mono">{f.openAlerts}</td>
                <td>
                  <StatusChip value={f.status} />
                </td>
                <td className="font-mono text-xs text-fg-3">{fmt(f.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
