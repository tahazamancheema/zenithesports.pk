import Link from 'next/link'
import { notFound } from 'next/navigation'
import { flagOpAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { IdentifierRows } from '@/components/console/identifier-rows'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { can } from '@/lib/permissions'
import { getStaff } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { getFlag, listAlerts } from '@/server/services/anticheat'

export const metadata = { title: 'Flag' }

export default async function FlagDetail(props: { params: Promise<{ id: string }> }) {
  const id = (await props.params).id
  const data = await getFlag(id)
  if (!data) notFound()
  const f = data.flag as Record<string, string | null>
  const [base, staff, alerts] = await Promise.all([consoleBase('anticheat'), getStaff('anticheat'), listAlerts({ flagId: id })])
  const mine = alerts
  return (
    <>
      <ConsoleTitle
        title={String(f.playerIgn ?? f.teamName ?? 'Flag')}
        sub={
          <span className="flex flex-wrap items-center gap-3">
            <StatusChip value={String(f.status)} /> {f.severity} · {f.category} · created {fmt(f.createdAt)} by {f.createdByEmail ?? '—'}
          </span>
        }
      >
        {f.sourceReportId && (
          <Link href={`${base}/reports/${f.sourceReportId}`} className="btn btn-sm btn-ghost">
            Source report
          </Link>
        )}
      </ConsoleTitle>
      <div className="grid gap-8 xl:grid-cols-[1fr_24rem]">
        <div className="grid content-start gap-6">
          <div className="panel p-5">
            <p className="t-label">Summary</p>
            <p className="mt-2">{f.summary}</p>
            {f.recordTitle && (
              <>
                <p className="t-label mt-5">Disciplinary record</p>
                <p className="mt-2 font-medium">{f.recordTitle}</p>
                <p className="whitespace-pre-line-safe mt-1 text-sm text-fg-2">{f.recordDecision}</p>
              </>
            )}
            {f.liftReason && <p className="mt-4 text-sm text-fg-2">Lifted: {f.liftReason}</p>}
          </div>
          <div className="panel p-5">
            <p className="t-label mb-3">Identifiers</p>
            <ul className="divide-y divide-line">
              {data.identifiers.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="w-28 text-fg-3">{i.kind.replace('_', ' ')}</span>
                  <span className="font-mono">{i.valueNorm}</span>
                  <StatusChip value={i.confidence} />
                  {i.note && <span className="text-xs text-fg-3">{i.note}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="t-label mb-3">Alerts from this flag · {mine.length}</p>
            <ul className="divide-y divide-line rounded-md border border-line">
              {mine.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                  <StatusChip value={a.status} />
                  <span>{a.matchKind.replace('_', ' ')}</span>
                  <span className="text-fg-2">{a.teamName ?? a.registrationRef ?? a.entityType}</span>
                  {a.tournamentName && <span className="text-fg-3">· {a.tournamentName}</span>}
                  <span className="ml-auto font-mono text-xs text-fg-3">×{a.detectionCount}</span>
                </li>
              ))}
              {mine.length === 0 && <li className="px-4 py-6 text-center text-sm text-fg-3">No matches found.</li>}
            </ul>
          </div>
        </div>
        <aside className="grid content-start gap-6">
          {f.status === 'active' && (
            <>
              <div className="panel p-5">
                <ActionForm action={flagOpAction} submit="Rescan history" submitClass="btn btn-sm btn-ghost justify-self-start">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="op" value="rescan" />
                  <p className="text-sm text-fg-2">Re-check every record against this flag. Existing alerts are updated, never duplicated.</p>
                </ActionForm>
              </div>
              <div className="panel p-5">
                <ActionForm action={flagOpAction} submit="Add & rescan" submitClass="btn btn-sm btn-primary justify-self-start">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="op" value="identifier" />
                  <IdentifierRows />
                  <input name="note" className="input" placeholder="Evidence for this association" aria-label="Note" />
                </ActionForm>
              </div>
              {staff && can(staff.roles, 'anticheat.lift') && (
                <div className="panel p-5">
                  <ActionForm action={flagOpAction} submit="Lift flag" submitClass="btn btn-sm btn-danger justify-self-start" confirm="Lift this flag and resolve its open alerts?">
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="op" value="lift" />
                    <input name="reason" className="input" placeholder="Reason (e.g. appeal upheld)" aria-label="Reason" required />
                  </ActionForm>
                </div>
              )}
            </>
          )}
          <div className="panel p-5">
            <p className="t-label mb-3">Investigation notes</p>
            {data.notes.map((n) => (
              <div key={n.id} className="mb-3 border-l border-line-2 pl-3 text-sm">
                <p className="whitespace-pre-line-safe">{n.body}</p>
                <p className="mt-1 font-mono text-[11px] text-fg-3">
                  {n.email} · {fmt(n.createdAt)}
                </p>
              </div>
            ))}
            <ActionForm action={flagOpAction} submit="Add note" submitClass="btn btn-sm btn-ghost justify-self-start">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="op" value="note" />
              <textarea name="body" className="input" rows={3} aria-label="Note" required />
            </ActionForm>
          </div>
        </aside>
      </div>
    </>
  )
}
