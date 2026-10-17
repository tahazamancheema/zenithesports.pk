import { lftAdminAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { adminListLft } from '@/server/services/lft'

export const metadata = { title: 'Looking for team' }

export default async function LftAdmin() {
  const rows = await adminListLft()
  return (
    <>
      <ConsoleTitle title="Looking for team" sub="Moderate listings and help match players. Contact details are only released by the player." />
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Game</th>
              <th>Roles</th>
              <th>Requests</th>
              <th>Status</th>
              <th>Listed</th>
              <th>Moderate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-fg-3">
                  No listings yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.ign}
                  <p className="font-mono text-xs text-fg-3">{r.reference}</p>
                  {r.openAlerts > 0 && <span className="chip chip-bad mt-1">alert</span>}
                </td>
                <td className="text-fg-2">{r.gameId}</td>
                <td className="text-xs text-fg-2">{r.roles.join(', ')}</td>
                <td className="font-mono">{r.pendingRequests}</td>
                <td>
                  <StatusChip value={r.status} />
                </td>
                <td className="font-mono text-xs text-fg-3">{fmt(r.createdAt)}</td>
                <td>
                  <ActionForm action={lftAdminAction} inline submit="Set">
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status} className="input !min-h-8 w-auto text-xs" aria-label="Status">
                      <option value="active">active</option>
                      <option value="matched">matched</option>
                      <option value="withdrawn">withdrawn</option>
                      <option value="hidden">hidden</option>
                    </select>
                    <input name="note" defaultValue={r.adminNote ?? ''} placeholder="Matching note" className="input !min-h-8 w-40 text-xs" aria-label="Note" />
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
