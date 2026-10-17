import type { Metadata } from 'next'
import { LeaveForm } from '@/components/points/waitlist'

export const metadata: Metadata = { title: 'Leave the launch list', robots: { index: false } }

export default async function LeavePage(props: PageProps<'/points/leave'>) {
  const { t } = await props.searchParams
  const token = typeof t === 'string' ? t : ''
  return (
    <section className="shell max-w-xl py-24">
      <p className="t-label">ZenithPoints · Launch list</p>
      <h1 className="t-display mt-6 text-2xl">Leave the list</h1>
      <div className="mt-8">{token ? <LeaveForm token={token} /> : <p className="text-fg-2">Open the removal link from your ZenithPoints email to remove your address.</p>}</div>
    </section>
  )
}
