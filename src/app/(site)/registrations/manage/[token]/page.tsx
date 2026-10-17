import type { Metadata } from 'next'
import { ZLink } from '@/components/link'
import { WithdrawForm } from '@/components/registrations/withdraw-form'
import { formatInZone, LEGAL_TRANSITIONS, STATUS_LABEL, tzAbbrev, type RegistrationStatus } from '@/lib/tournament'
import { getRegistrationByToken } from '@/server/services/registrations'

export const metadata: Metadata = { title: 'Your registration', robots: { index: false, follow: false }, referrer: 'no-referrer' }

const TONE: Record<RegistrationStatus, string> = {
  pending: 'chip chip-info',
  approved: 'chip chip-ok',
  waitlisted: 'chip chip-warn',
  rejected: 'chip chip-bad',
  withdrawn: 'chip',
  disqualified: 'chip chip-bad',
  cancelled: 'chip',
}

/** The captain's private view. Authorised by possession of the unguessable link. */
export default async function ManagePage(props: PageProps<'/registrations/manage/[token]'>) {
  const { token } = await props.params
  const r = await getRegistrationByToken(token)
  if (!r) {
    return (
      <section className="shell max-w-xl py-24">
        <h1 className="t-display text-2xl">Link not recognised</h1>
        <p className="mt-4 text-fg-2">This status link is not valid. Check that you copied the whole link from your confirmation.</p>
      </section>
    )
  }
  const tz = tzAbbrev(r.tournament.timezone)
  return (
    <section className="shell max-w-3xl py-14 md:py-20">
      <p className="t-label">Private status page · do not share</p>
      <h1 className="t-display mt-6 text-[clamp(1.4rem,3vw,2.2rem)]">{r.teamName ?? r.members[0]?.ign}</h1>
      <p className="mt-3 text-fg-2">
        <ZLink to={`/t/${r.tournament.slug}`} className="underline decoration-line-3 underline-offset-4 hover:text-fg">
          {r.tournament.name}
        </ZLink>{' '}
        · starts {formatInZone(r.tournament.startsAt, r.tournament.timezone)} {r.tournament.startsAt ? tz : ''}
      </p>

      <div className="panel-raised mt-10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="t-label">Status</p>
            <span className={`${TONE[r.status]} mt-2`}>{STATUS_LABEL[r.status]}</span>
          </div>
          <div className="text-right">
            <p className="t-label">Reference</p>
            <p className="mt-2 font-mono">{r.reference}</p>
          </div>
        </div>
        {r.decisionReason && <p className="mt-5 rounded-sm border border-line-2 px-4 py-3 text-sm text-fg-2">Reason: {r.decisionReason}</p>}
        {r.tournament.communicationLinks.length > 0 && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="t-label mb-3">Event links</p>
            <ul className="flex flex-wrap gap-2">
              {r.tournament.communicationLinks.map((l) => (
                <li key={l.url}>
                  <a href={l.url} rel="noopener noreferrer" target="_blank" className="btn btn-sm btn-ghost">
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <p className="t-label mb-3">Roster</p>
          <ul className="divide-y divide-line border-y border-line">
            {r.members.map((m) => (
              <li key={m.slot} className="flex justify-between gap-3 py-3 text-sm">
                <span>
                  {m.ign} <span className="text-fg-3">· {m.role}</span>
                </span>
                <span className="font-mono text-fg-3">{m.uidMasked}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-fg-3">Contact {r.contactMasked}. To change a player, contact the organisers before registration closes.</p>
        </div>
        <div>
          <p className="t-label mb-3">History</p>
          <ol className="border-l border-line-2">
            {r.history.map((h, i) => (
              <li key={i} className="relative pb-4 pl-5 last:pb-0">
                <span aria-hidden className="absolute top-1.5 -left-[4.5px] h-2 w-2 rotate-45 bg-[var(--accent)]" />
                <p className="text-sm">{STATUS_LABEL[h.toStatus]}</p>
                <p className="font-mono text-xs text-fg-3">{formatInZone(h.at, r.tournament.timezone)}</p>
                {h.reason && <p className="mt-1 text-xs text-fg-2">{h.reason}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {LEGAL_TRANSITIONS[r.status].includes('withdrawn') && (
        <div className="mt-12 border-t border-line pt-8">
          <WithdrawForm token={token} />
        </div>
      )}
    </section>
  )
}
