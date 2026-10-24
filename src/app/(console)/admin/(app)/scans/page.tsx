import { adminPage } from '@/components/console/entry-points'
import { scanAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { can } from '@/lib/permissions'
import { listScanRuns } from '@/server/services/anticheat'

export const metadata = { title: 'Scans & retention' }

export default async function Scans() {
  const me = await adminPage('anticheat.scan')
  const runs = await listScanRuns()
  const staff = me
  return (
    <>
      <ConsoleTitle title="Scans & retention" sub="Full scans check every active flag against all registrations, rosters, players, teams and listings — in batches, resumable on failure." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="t-label mb-3">Full historical scan</p>
          <ActionForm action={scanAction} submit="Run full scan" confirm="Scan every active flag against all stored records?">
            <input type="hidden" name="op" value="scan" />
            <select name="trigger" className="input" aria-label="Reason" defaultValue="manual">
              <option value="manual">Routine re-check</option>
              <option value="import">After a data import</option>
              <option value="rule_update">After changing matching rules</option>
            </select>
          </ActionForm>
        </div>
        {staff && can(staff.roles, 'anticheat.evidence.purge') && (
          <div className="panel p-5">
            <p className="t-label mb-3">Evidence retention</p>
            <p className="mb-3 text-sm text-fg-2">Deletes evidence of unapproved reports older than the 180-day retention window.</p>
            <ActionForm action={scanAction} submit="Purge expired evidence" submitClass="btn btn-sm btn-danger" confirm="Permanently delete expired evidence files?">
              <input type="hidden" name="op" value="purge" />
            </ActionForm>
          </div>
        )}
      </div>
      <h2 className="t-label mt-10 mb-3">Recent runs</h2>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Flags</th>
              <th>New alerts</th>
              <th>Re-detected</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-fg-3">
                  No scans yet.
                </td>
              </tr>
            )}
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{fmt(r.startedAt)}</td>
                <td className="text-sm">{r.trigger.replace('_', ' ')}</td>
                <td>
                  <StatusChip value={r.status} />
                  {r.error && <p className="mt-1 text-xs text-bad">{r.error}</p>}
                </td>
                <td className="font-mono">
                  {r.flagsDone}/{r.flagsTotal}
                </td>
                <td className="font-mono">{r.alertsCreated}</td>
                <td className="font-mono">{r.alertsUpdated}</td>
                <td>
                  {r.status === 'failed' && (
                    <ActionForm action={scanAction} inline submit="Resume" submitClass="btn btn-sm btn-ghost">
                      <input type="hidden" name="op" value="scan" />
                      <input type="hidden" name="resume" value={r.id} />
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
