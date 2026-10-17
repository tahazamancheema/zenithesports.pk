import type { Metadata } from 'next'
import { getRequestByToken } from '@/server/services/lft'

export const metadata: Metadata = { title: 'Your request', robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function LftRequestView(props: PageProps<'/registrations/lft/request/[token]'>) {
  const r = await getRequestByToken((await props.params).token)
  if (!r) {
    return (
      <section className="shell max-w-xl py-24">
        <h1 className="t-display text-2xl">Link not recognised</h1>
      </section>
    )
  }
  return (
    <section className="shell max-w-xl py-24">
      <p className="t-label">Private request page</p>
      <h1 className="t-display mt-6 text-2xl">Request to {r.ign}</h1>
      <p className="mt-4">
        <span className="chip">{r.status}</span>
      </p>
      {r.status === 'accepted' ? (
        <div className="panel-raised mt-8 p-6">
          <p className="t-label">Contact shared by the player</p>
          {r.phone && <p className="mt-3 font-mono">WhatsApp {r.phone}</p>}
          {r.discord && <p className="mt-2 font-mono">Discord {r.discord}</p>}
          <p className="mt-4 text-sm text-fg-3">Use these details only to discuss joining your team.</p>
        </div>
      ) : (
        <p className="mt-6 text-fg-2">{r.status === 'pending' ? 'Waiting for the player to respond. Check this page again later.' : 'The player declined this request.'}</p>
      )}
    </section>
  )
}
