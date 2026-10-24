import { can } from '@/lib/permissions'
import { adminPage } from '@/components/console/entry-points'
import Link from 'next/link'
import { alertStatusAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { consoleBase } from '@/server/console-base'
import { ALERT_TRANSITIONS, listAlerts, type AlertStatus } from '@/server/services/anticheat'

export const metadata = { title: 'Alerts' }
const STATUSES: AlertStatus[] = ['open', 'acknowledged', 'dismissed', 'resolved']

export default async function Alerts(props: { searchParams: Promise<{ status?: string }> }) {
  const me = await adminPage('anticheat.review')
  const sp = await props.searchParams
  const status = STATUSES.includes(sp.status as AlertStatus) ? sp.status : 'open'
  const base = await consoleBase()
  const regBase = can(me.roles, 'registrations.review') ? `${base}/registrations` : null
  const alerts = await listAlerts({ status })
  return (
    <>
      <ConsoleTitle title="Alerts" sub="A match is a reason to look closer, not a verdict. Record the outcome when you dismiss or resolve." />
      <nav className="mb-5 flex gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`${base}/alerts?status=${s}`} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s}
          </Link>
        ))}
      </nav>
      <ul className="grid gap-3">
        {alerts.length === 0 && <li className="rounded-md border border-line px-4 py-10 text-center text-fg-3">No {status} alerts.</li>}
        {alerts.map((a) => (
          <li key={a.id} className="panel grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip value={a.confidence} />
                <span className="font-medium">{a.matchKind.replace('_', ' ')} match</span>
                <span className="text-fg-3">on {a.entityType.replace('_', ' ')}</span>
                <span className="font-mono text-xs text-fg-2">{a.matchedValue}</span>
              </div>
              <p className="text-sm text-fg-2">
                Flag:{' '}
                <Link href={`${base}/flags/${a.flagId}`} className="underline underline-offset-4 hover:text-fg">
                  {a.flagSummary}
                </Link>{' '}
                ({a.flagSeverity})
              </p>
              {a.registrationId && (
                <p className="text-sm text-fg-2">
                  Registration{' '}
                  {regBase ? (
                    <a href={`${regBase}/${a.registrationId}`} className="font-mono underline underline-offset-4 hover:text-fg">
                      {a.registrationRef}
                    </a>
                  ) : (
                    <span className="font-mono">{a.registrationRef}</span>
                  )}{' '}
                  {a.teamName && `· ${a.teamName}`} {a.tournamentName && `· ${a.tournamentName}`}
                </p>
              )}
              <p className="font-mono text-[12px] text-fg-3">
                first {fmt(a.firstDetectedAt)} · last {fmt(a.lastDetectedAt)} · detected ×{a.detectionCount}
              </p>
            </div>
            <ActionForm action={alertStatusAction} inline className="self-start">
              <input type="hidden" name="id" value={a.id} />
              <select name="to" className="input !min-h-9 w-auto" aria-label="New status">
                {ALERT_TRANSITIONS[a.status].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input name="note" className="input !min-h-9 w-56" placeholder="Outcome note" aria-label="Note" />
              <button className="btn btn-sm btn-primary">Update</button>
            </ActionForm>
          </li>
        ))}
      </ul>
    </>
  )
}
