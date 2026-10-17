import { inquiryStatusAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { listInquiries } from '@/server/services/intake'

export const metadata = { title: 'Product inquiries' }

export default async function Inquiries() {
  const rows = await listInquiries()
  return (
    <>
      <ConsoleTitle title="ZenithProduction inquiries" sub="Purchase inquiries. There is no automatic checkout; follow up directly." />
      <ul className="grid gap-3">
        {rows.length === 0 && <li className="rounded-md border border-line px-4 py-10 text-center text-fg-3">No inquiries yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="panel grid gap-4 p-5 lg:grid-cols-[1fr_20rem]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip value={r.status} />
                <span className="font-medium">{r.name}</span>
                {r.organization && <span className="text-fg-2">· {r.organization}</span>}
                <span className="ml-auto font-mono text-xs text-fg-3">
                  {r.reference} · {fmt(r.createdAt)}
                </span>
              </div>
              <p className="mt-2 font-mono text-sm text-fg-2">{[r.email, r.phoneE164].filter(Boolean).join(' · ')}</p>
              <p className="mt-1 text-xs text-fg-3">{[r.game, r.intendedUse].filter(Boolean).join(' · ')}</p>
              <p className="whitespace-pre-line-safe mt-3 text-sm">{r.requirements}</p>
              {r.message && <p className="whitespace-pre-line-safe mt-2 text-sm text-fg-2">{r.message}</p>}
            </div>
            <ActionForm action={inquiryStatusAction} submit="Save" submitClass="btn btn-sm btn-ghost justify-self-start">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.status} className="input" aria-label="Status">
                {['new', 'contacted', 'qualified', 'closed', 'spam'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <textarea name="note" defaultValue={r.internalNote ?? ''} rows={2} className="input" placeholder="Internal note" aria-label="Internal note" />
            </ActionForm>
          </li>
        ))}
      </ul>
    </>
  )
}
