import Link from 'next/link'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { phaseOf, PHASE_LABEL } from '@/lib/tournament'
import { consoleBase } from '@/server/console-base'
import { listTournamentsForAdmin } from '@/server/services/catalog'

export const metadata = { title: 'Tournaments' }

export default async function Tournaments() {
  const base = await consoleBase('registrations')
  const list = await listTournamentsForAdmin()
  return (
    <>
      <ConsoleTitle title="Tournaments" sub="Drafts are invisible to the public until published.">
        <Link href={`${base}/tournaments/new`} className="btn btn-sm btn-primary">
          New tournament
        </Link>
      </ConsoleTitle>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Game · format</th>
              <th>Status</th>
              <th>Phase</th>
              <th>Entries</th>
              <th>Starts</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-fg-3">
                  No tournaments yet. Create the first one.
                </td>
              </tr>
            )}
            {list.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={`${base}/tournaments/${t.id}`} className="font-medium hover:text-[var(--accent)]">
                    {t.name}
                  </Link>
                  <p className="font-mono text-xs text-fg-3">/{t.slug}</p>
                </td>
                <td className="text-fg-2">
                  {t.gameName} · {t.formatLabel}
                </td>
                <td>
                  <StatusChip value={t.status} />
                </td>
                <td className="text-sm text-fg-2">{PHASE_LABEL[phaseOf(t)]}</td>
                <td className="font-mono">
                  <Link href={`${base}/registrations?tournament=${t.id}`} className="hover:text-[var(--accent)]">
                    {t.activeCount}
                    {t.capacity ? ` / ${t.capacity}` : ''}
                  </Link>
                </td>
                <td className="font-mono text-xs text-fg-3">{fmt(t.startsAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
