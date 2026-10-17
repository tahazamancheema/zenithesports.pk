import { messageStatusAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { listMessages } from '@/server/services/intake'

export const metadata = { title: 'Messages' }

export default async function Messages() {
  const rows = await listMessages()
  return (
    <>
      <ConsoleTitle title="Contact messages" sub="Reply by email, then mark as replied." />
      <ul className="grid gap-3">
        {rows.length === 0 && <li className="rounded-md border border-line px-4 py-10 text-center text-fg-3">No messages yet.</li>}
        {rows.map((m) => (
          <li key={m.id} className="panel grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip value={m.status} />
                <span className="chip">{m.topic}</span>
                <span className="font-medium">{m.name}</span>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.reference}`)}`} className="font-mono text-sm text-fg-2 hover:text-fg">
                  {m.email}
                </a>
                <span className="ml-auto font-mono text-xs text-fg-3">
                  {m.reference} · {fmt(m.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-line-safe mt-3 text-sm">{m.message}</p>
            </div>
            <ActionForm action={messageStatusAction} inline submit="Set">
              <input type="hidden" name="id" value={m.id} />
              <select name="status" defaultValue={m.status} className="input !min-h-9 w-auto" aria-label="Status">
                {['new', 'replied', 'closed', 'spam'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </ActionForm>
          </li>
        ))}
      </ul>
    </>
  )
}
