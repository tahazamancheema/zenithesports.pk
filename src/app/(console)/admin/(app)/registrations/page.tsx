import { inScope } from '@/server/scope'
import { adminPage } from '@/components/console/entry-points'
import Link from 'next/link'
import { registrationStatusAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { REGISTRATION_STATUSES, STATUS_LABEL } from '@/lib/tournament'
import { consoleBase } from '@/server/console-base'
import { listTournamentsForAdmin } from '@/server/services/catalog'
import { listRegistrations } from '@/server/services/registrations'

export const metadata = { title: 'Registrations' }

type SP = { tournament?: string; status?: string; q?: string; sort?: string; page?: string }

export default async function Registrations(props: { searchParams: Promise<SP> }) {
  const me = await adminPage('registrations.review')
  const sp = await props.searchParams
  const base = await consoleBase()
  const status = REGISTRATION_STATUSES.includes(sp.status as never) ? sp.status : undefined
  const tournamentId = /^[0-9a-f-]{36}$/i.test(sp.tournament ?? '') ? sp.tournament : undefined
  const sort = (['newest', 'oldest', 'team'].includes(sp.sort ?? '') ? sp.sort : 'newest') as 'newest'
  const page = Math.max(1, Number(sp.page) || 1)
  const [res, tournaments] = await Promise.all([listRegistrations({ tournamentId, status, q: sp.q, sort, page, games: me.gameScope }), listTournamentsForAdmin().then((l) => inScope(me, l, (t) => t.gameId))])
  const pages = Math.max(1, Math.ceil(res.total / res.pageSize))
  const qs = (over: Partial<SP>) => {
    const p = new URLSearchParams()
    const merged = { tournament: tournamentId, status, q: sp.q, sort, page: String(page), ...over }
    for (const [k, v] of Object.entries(merged)) if (v && !(k === 'sort' && v === 'newest') && !(k === 'page' && v === '1')) p.set(k, v)
    const s = p.toString()
    return s ? `?${s}` : ''
  }
  const exportQs = new URLSearchParams(Object.entries({ tournament: tournamentId ?? '', status: status ?? '' }).filter(([, v]) => v)).toString()

  return (
    <>
      <ConsoleTitle title="Registrations" sub={`${res.total} result${res.total === 1 ? '' : 's'}`}>
        <a href={`${base}/export${exportQs ? `?${exportQs}` : ''}`} className="btn btn-sm btn-ghost">
          Export CSV
        </a>
      </ConsoleTitle>

      <form className="mb-6 grid gap-3 md:grid-cols-[2fr_1.4fr_1fr_1fr_auto]" role="search">
        <input name="q" defaultValue={sp.q} className="input" placeholder="Search reference, team, IGN or exact UID" aria-label="Search" />
        <select name="tournament" defaultValue={tournamentId ?? ''} className="input" aria-label="Tournament">
          <option value="">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ''} className="input" aria-label="Status">
          <option value="">Any status</option>
          {REGISTRATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="input" aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="team">Team name</option>
        </select>
        <button className="btn btn-ghost">Apply</button>
      </form>

      <ActionForm action={registrationStatusAction} confirm="Apply this status to the selected registrations?">
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="table">
            <thead>
              <tr>
                <th className="w-8">
                  <span className="sr-only">Select</span>
                </th>
                <th>Reference</th>
                <th>Team / captain</th>
                <th>Tournament</th>
                <th>Players</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {res.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-fg-3">
                    Nothing matches these filters.
                  </td>
                </tr>
              )}
              {res.rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input type="checkbox" name="ids" value={r.id} aria-label={`Select ${r.reference}`} className="h-4 w-4 accent-[var(--accent)]" />
                  </td>
                  <td className="font-mono text-xs">
                    <Link href={`${base}/registrations/${r.id}`} className="hover:text-[var(--accent)]">
                      {r.reference}
                    </Link>
                  </td>
                  <td>
                    <Link href={`${base}/registrations/${r.id}`} className="hover:text-[var(--accent)]">
                      {r.teamName ?? r.captainIgn}
                    </Link>
                    {r.openAlerts > 0 && <span className="chip chip-bad ml-2">{r.openAlerts} alert</span>}
                  </td>
                  <td className="text-fg-2">{r.tournamentName}</td>
                  <td className="font-mono">{r.memberCount}</td>
                  <td>
                    <StatusChip value={r.status} />
                  </td>
                  <td className="font-mono text-xs text-fg-3">{fmt(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel flex flex-wrap items-center gap-3 p-4">
          <span className="t-label">Selected →</span>
          <select name="to" className="input !min-h-9 w-auto" aria-label="New status" defaultValue="approved">
            <option value="approved">Approve</option>
            <option value="waitlisted">Waitlist</option>
            <option value="rejected">Reject</option>
            <option value="pending">Back to pending</option>
            <option value="disqualified">Disqualify</option>
          </select>
          <input name="reason" className="input !min-h-9 flex-1" placeholder="Reason (required to reject or disqualify; shown to the team)" aria-label="Reason" maxLength={300} />
          <button type="submit" className="btn btn-sm btn-primary">
            Apply
          </button>
        </div>
      </ActionForm>

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-between">
          <Link aria-disabled={page <= 1} href={`${base}/registrations${qs({ page: String(page - 1) })}`} className="btn btn-sm btn-ghost">
            ← Previous
          </Link>
          <span className="t-label">
            Page {page} of {pages}
          </span>
          <Link aria-disabled={page >= pages} href={`${base}/registrations${qs({ page: String(page + 1) })}`} className="btn btn-sm btn-ghost">
            Next →
          </Link>
        </nav>
      )}
    </>
  )
}
