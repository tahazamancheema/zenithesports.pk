import Link from 'next/link'
import { adminPage } from '@/components/console/entry-points'
import { ConsoleTitle, Stat } from '@/components/console/shell'
import { navFor } from '@/config/admin-nav'
import { ROLE_LABEL } from '@/lib/permissions'
import { consoleBase } from '@/server/console-base'
import { integrations } from '@/server/env'
import { adminSummary } from '@/server/services/admin-overview'

export default async function Overview(props: { searchParams: Promise<{ denied?: string }> }) {
  const me = await adminPage('admin.access')
  const [groups, base, sp] = await Promise.all([adminSummary(me), consoleBase(), props.searchParams])
  const sections = navFor(me.roles).filter((g) => g.title)
  return (
    <>
      <ConsoleTitle title={`Welcome, ${me.displayName.split(' ')[0]}`} sub={me.roles.map((r) => ROLE_LABEL[r]).join(' · ')} />
      {sp.denied === '1' && (
        <p role="alert" className="mb-8 rounded-sm border border-warn/40 bg-ink-2 px-4 py-3 text-sm text-warn">
          That section is not part of your role. Ask an Owner if you need access.
        </p>
      )}

      {groups.length === 0 && <p className="text-fg-2">Nothing is waiting for you. Use the sections on the left to get started.</p>}
      <div className="grid gap-10">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="t-label mb-3">{g.title}</h2>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
              {g.tiles.map((t) => (
                <Stat key={t.label} label={t.label} value={t.value} tone={t.tone} href={`${base}${t.to}`} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="panel p-5">
          <p className="t-label mb-3">Your sections</p>
          <ul className="grid gap-3 text-sm">
            {sections.map((g) => (
              <li key={g.title}>
                <span className="text-fg-3">{g.title}: </span>
                {g.items.map((i, n) => (
                  <span key={i.to}>
                    {n > 0 && ' · '}
                    <Link href={`${base}${i.to}`} className="text-fg-2 underline-offset-4 hover:text-fg hover:underline">
                      {i.label}
                    </Link>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-5">
          <p className="t-label mb-3">Notifications</p>
          <ul className="grid gap-2 text-sm">
            <li className="flex justify-between">
              Email delivery <span className={integrations.email ? 'chip chip-ok' : 'chip chip-warn'}>{integrations.email ? 'configured' : 'not configured'}</span>
            </li>
            <li className="flex justify-between">
              Discord staff alerts <span className={integrations.discord ? 'chip chip-ok' : 'chip chip-warn'}>{integrations.discord ? 'configured' : 'not configured'}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-fg-3">When a provider is not configured, notifications are recorded but marked “skipped”; nothing pretends to send.</p>
        </div>
      </section>
    </>
  )
}
