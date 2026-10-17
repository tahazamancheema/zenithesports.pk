import type { Metadata } from 'next'
import { LftManageButton } from '@/components/registrations/lft'
import { formatInZone } from '@/lib/tournament'
import { getLftByToken } from '@/server/services/lft'

export const metadata: Metadata = { title: 'Your listing', robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function LftManage(props: PageProps<'/registrations/lft/manage/[token]'>) {
  const { token } = await props.params
  const p = await getLftByToken(token)
  if (!p) {
    return (
      <section className="shell max-w-xl py-24">
        <h1 className="t-display text-2xl">Link not recognised</h1>
        <p className="mt-4 text-fg-2">Check that you copied the whole link.</p>
      </section>
    )
  }
  return (
    <section className="shell max-w-3xl py-14 md:py-20">
      <p className="t-label">Private listing page · do not share</p>
      <h1 className="t-display mt-6 text-2xl">{p.ign}</h1>
      <p className="mt-3 text-fg-2">
        {p.reference} · <span className="chip">{p.status}</span>
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {p.status === 'active' && <LftManageButton token={token} op="matched" label="I found a team" />}
        {p.status !== 'active' && p.status !== 'hidden' && <LftManageButton token={token} op="active" label="List me again" />}
        {p.status !== 'withdrawn' && p.status !== 'hidden' && <LftManageButton token={token} op="withdrawn" label="Remove my listing" danger />}
      </div>
      <h2 className="t-label mt-12 mb-4">Requests · {p.requests.length}</h2>
      {p.requests.length === 0 ? (
        <p className="text-fg-2">No requests yet.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {p.requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
              <div>
                <p className="font-medium">
                  {r.requesterName}
                  {r.teamName && <span className="text-fg-3"> · {r.teamName}</span>}
                </p>
                {r.message && <p className="mt-1 text-sm text-fg-2">{r.message}</p>}
                <p className="mt-1 font-mono text-xs text-fg-3">{formatInZone(r.createdAt, 'Asia/Karachi')}</p>
              </div>
              {r.status === 'pending' ? (
                <div className="flex gap-2">
                  <LftManageButton token={token} op="accept" requestId={r.id} label="Share my contact" />
                  <LftManageButton token={token} op="decline" requestId={r.id} label="Decline" />
                </div>
              ) : (
                <span className="chip">{r.status}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
