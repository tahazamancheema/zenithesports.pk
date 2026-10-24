import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ROLE_LABEL } from '@/lib/permissions'
import type { AdminNavGroup } from '@/config/admin-nav'
import type { Staff } from '@/server/auth/session'
import { ZLink } from '../link'
import { LiveUpdates } from './live'
import { NavLinks } from './nav-links'
import { SignOutButton } from './sign-out'

export type ConsoleNav = AdminNavGroup[]

export function ConsoleShell({ staff, nav, base, children }: { staff: Staff; nav: ConsoleNav; base: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="flex flex-col border-b border-line bg-ink-1 lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center gap-3 border-b border-line px-5">
          <Image src="/brand/zenith-mark-160.webp" alt="" width={26} height={26} unoptimized />
          <div className="leading-tight">
            <p className="font-display text-[12px] tracking-[0.28em]">ZENITH</p>
            <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-[var(--color-gold)]">Admin</p>
          </div>
        </div>
        <NavLinks nav={nav} base={base} />
        <div className="mt-auto hidden border-t border-line p-5 lg:block">
          <p className="truncate text-sm">{staff.displayName}</p>
          <p className="t-label mt-1 truncate">{staff.roles.map((r) => ROLE_LABEL[r]).join(', ')}</p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-line bg-void/85 px-5 backdrop-blur-xl md:px-8">
          <LiveUpdates src={`${base}/live`} />
          <div className="flex items-center gap-3">
            <ZLink surface="hq" to="/" className="t-label hidden hover:text-fg sm:block">
              View site ↗
            </ZLink>
            <SignOutButton surface={staff.surface} />
          </div>
        </header>
        <main id="main" className="px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}

export function ConsoleTitle({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="t-display text-xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-fg-2">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, tone, href }: { label: string; value: number | string; tone?: 'warn' | 'bad' | 'ok'; href?: string }) {
  const color = tone === 'warn' ? 'text-warn' : tone === 'bad' ? 'text-bad' : tone === 'ok' ? 'text-ok' : 'text-fg'
  const body = (
    <>
      <p className="t-label">{label}</p>
      <p className={`mt-3 font-mono text-3xl tabular-nums ${color}`}>{value}</p>
    </>
  )
  return href ? (
    <Link href={href} className="block bg-ink-1 p-5 transition-colors hover:bg-ink-2">
      {body}
    </Link>
  ) : (
    <div className="bg-ink-1 p-5">{body}</div>
  )
}
