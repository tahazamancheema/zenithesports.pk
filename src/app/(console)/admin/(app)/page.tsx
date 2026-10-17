import { ConsoleTitle, Stat } from '@/components/console/shell'
import { consoleBase } from '@/server/console-base'
import { integrations } from '@/server/env'
import { href } from '@/server/link'
import { hqOverview } from '@/server/services/intake'

export default async function HqOverview() {
  const [o, base, reg, ac] = await Promise.all([hqOverview(), consoleBase('hq'), href('registrations', '/admin'), href('anticheat', '/admin')])
  return (
    <>
      <ConsoleTitle title="HQ overview" sub="Intake for the ecosystem. Registrations and AntiCheat have their own consoles and sign-ins." />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
        <Stat label="New inquiries" value={o.inquiries} tone={o.inquiries ? 'warn' : undefined} href={`${base}/inquiries`} />
        <Stat label="Bookings to review" value={o.bookings} tone={o.bookings ? 'warn' : undefined} href={`${base}/bookings`} />
        <Stat label="New messages" value={o.messages} href={`${base}/messages`} />
        <Stat label="Points waitlist" value={o.waitlist} href={`${base}/waitlist`} />
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="panel p-5">
          <p className="t-label mb-3">Other consoles</p>
          <div className="flex flex-wrap gap-2">
            <a href={reg} className="btn btn-sm btn-ghost">
              Registrations console ↗
            </a>
            <a href={ac} className="btn btn-sm btn-ghost">
              AntiCheat console ↗
            </a>
          </div>
        </div>
        <div className="panel p-5">
          <p className="t-label mb-3">Integrations</p>
          <ul className="grid gap-2 text-sm">
            <li className="flex justify-between">
              Email delivery <span className={integrations.email ? 'chip chip-ok' : 'chip chip-warn'}>{integrations.email ? 'configured' : 'not configured'}</span>
            </li>
            <li className="flex justify-between">
              Discord staff alerts <span className={integrations.discord ? 'chip chip-ok' : 'chip chip-warn'}>{integrations.discord ? 'configured' : 'not configured'}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-fg-3">When a provider is not configured, notifications are recorded but marked “skipped” — nothing pretends to send.</p>
        </div>
      </div>
    </>
  )
}
