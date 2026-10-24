import { adminPage } from '@/components/console/entry-points'
import { waitlistDeleteAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt } from '@/components/console/status-chip'
import { listWaitlist } from '@/server/services/intake'

export const metadata = { title: 'Points waitlist' }

export default async function Waitlist() {
  await adminPage('inbox.waitlist')
  const rows = await listWaitlist()
  return (
    <>
      <ConsoleTitle title="ZenithPoints launch list" sub={`${rows.length} subscriber(s). Everyone here gave explicit consent; deletion removes the record entirely.`} />
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Platform</th>
              <th>Audience</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-fg-3">
                  Nobody yet.
                </td>
              </tr>
            )}
            {rows.map((w) => (
              <tr key={w.id}>
                <td className="font-mono text-sm">{w.email}</td>
                <td>{w.name ?? '—'}</td>
                <td>{w.platform}</td>
                <td className="text-fg-2">{w.audience ?? '—'}</td>
                <td className="font-mono text-xs text-fg-3">{fmt(w.createdAt)}</td>
                <td>
                  <ActionForm action={waitlistDeleteAction} inline submit="Delete" submitClass="btn btn-sm btn-ghost" confirm="Delete this subscriber permanently?">
                    <input type="hidden" name="id" value={w.id} />
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
