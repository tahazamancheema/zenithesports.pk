import { bookingStatusAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { BOOKING_TRANSITIONS, listBookings } from '@/server/services/intake'

export const metadata = { title: 'Production bookings' }

export default async function Bookings() {
  const rows = await listBookings()
  return (
    <>
      <ConsoleTitle title="Production bookings" sub="Requests become bookings only when you confirm them. Confirming, declining or asking for info emails the customer (if email is configured)." />
      <ul className="grid gap-3">
        {rows.length === 0 && <li className="rounded-md border border-line px-4 py-10 text-center text-fg-3">No booking requests yet.</li>}
        {rows.map((b) => {
          const next = BOOKING_TRANSITIONS[b.status] as readonly string[]
          return (
            <li key={b.id} className="panel grid gap-4 p-5 lg:grid-cols-[1fr_20rem]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusChip value={b.status} />
                  <span className="font-medium">{b.tournamentName}</span>
                  <span className="text-fg-2">· {b.game}</span>
                  <span className="ml-auto font-mono text-xs text-fg-3">{b.reference}</span>
                </div>
                <p className="mt-2 font-mono text-sm">
                  {new Date(b.eventDate).toISOString().slice(0, 10)} · {String(b.startTime).slice(0, 5)} {b.timezone}
                </p>
                <p className="mt-1 text-sm text-fg-2">
                  {b.contactName}
                  {b.organization && ` · ${b.organization}`} · <span className="font-mono">{[b.email, b.phoneE164].filter(Boolean).join(' · ')}</span>
                </p>
                <p className="whitespace-pre-line-safe mt-3 text-sm">{b.broadcastRequirements}</p>
                {b.eventScope && <p className="whitespace-pre-line-safe mt-2 text-sm text-fg-2">Scope: {b.eventScope}</p>}
                {b.notes && <p className="whitespace-pre-line-safe mt-2 text-sm text-fg-2">Notes: {b.notes}</p>}
                <p className="mt-3 font-mono text-[11px] text-fg-3">
                  received {fmt(b.createdAt)}
                  {b.decidedAt && ` · decided ${fmt(b.decidedAt)}`}
                </p>
              </div>
              {next.length > 0 ? (
                <ActionForm action={bookingStatusAction} submit="Update" submitClass="btn btn-sm btn-primary justify-self-start">
                  <input type="hidden" name="id" value={b.id} />
                  <select name="to" className="input" aria-label="New status">
                    {next.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <textarea name="note" rows={2} className="input" defaultValue={b.adminNote ?? ''} placeholder="Internal note" aria-label="Internal note" />
                </ActionForm>
              ) : (
                <p className="text-sm text-fg-3">{b.adminNote ?? 'Closed.'}</p>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
