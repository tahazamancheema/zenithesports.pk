import Link from 'next/link'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt } from '@/components/console/status-chip'
import { can } from '@/lib/permissions'
import { getStaff } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { listAudit } from '@/server/services/staff'

export const metadata = { title: 'Audit log' }

export default async function Audit(props: { searchParams: Promise<{ action?: string; page?: string }> }) {
  const me = await getStaff('hq')
  if (!me || !can(me.roles, 'audit.view')) return <p className="text-fg-2">You do not have access to the audit log.</p>
  const sp = await props.searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const action = sp.action?.replace(/[^a-z_.]/g, '').slice(0, 40) || undefined
  const [rows, base] = await Promise.all([listAudit({ action, page }), consoleBase('hq')])
  return (
    <>
      <ConsoleTitle title="Audit log" sub="Append-only record of every privileged and public action. Entries cannot be edited or deleted." />
      <form className="mb-5 flex gap-2">
        <input name="action" defaultValue={action} className="input max-w-xs" placeholder="Filter by action prefix, e.g. registration." aria-label="Action prefix" />
        <button className="btn btn-sm btn-ghost">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="table text-[13px]">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Console</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs whitespace-nowrap text-fg-3">{fmt(r.at)}</td>
                <td className="font-mono text-xs">{r.actorLabel}</td>
                <td className="text-xs text-fg-3">{r.surface ?? '—'}</td>
                <td className="font-mono text-xs">{r.action}</td>
                <td className="font-mono text-[12px] text-fg-3">
                  {r.entityType ?? ''} {r.entityId?.slice(0, 8)}
                </td>
                <td className="max-w-xs truncate font-mono text-[12px] text-fg-3">{Object.keys(r.details ?? {}).length ? JSON.stringify(r.details) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="mt-6 flex justify-between">
        {page > 1 ? (
          <Link href={`${base}/audit?page=${page - 1}${action ? `&action=${action}` : ''}`} className="btn btn-sm btn-ghost">
            ← Newer
          </Link>
        ) : (
          <span />
        )}
        {rows.length === 100 && (
          <Link href={`${base}/audit?page=${page + 1}${action ? `&action=${action}` : ''}`} className="btn btn-sm btn-ghost">
            Older →
          </Link>
        )}
      </nav>
    </>
  )
}
