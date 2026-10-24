'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AdminNavGroup } from '@/config/admin-nav'

/** The admin sidebar: sections grouped by area, already filtered to this person's roles. */
export function NavLinks({ nav, base }: { nav: AdminNavGroup[]; base: string }) {
  const pathname = usePathname()
  const here = (pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/admin/, '')) || '/'
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:gap-4 lg:overflow-y-auto">
      {nav.map((g) => (
        <div key={g.title ?? 'main'} className="flex shrink-0 gap-1 lg:flex-col">
          {g.title && <p className="t-label hidden px-3 pb-1 lg:block">{g.title}</p>}
          {g.items.map((n) => {
            const active = n.to === '/' ? here === '/' : here === n.to || here.startsWith(`${n.to}/`)
            return (
              <Link
                key={n.to}
                href={`${base}${n.to === '/' ? '' : n.to}`}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-sm px-3 py-1.5 text-sm transition-colors ${active ? 'bg-ink-3 text-fg' : 'text-fg-2 hover:bg-ink-2 hover:text-fg'}`}
              >
                <span aria-hidden className="h-1.5 w-1.5 rotate-45" style={{ background: active ? 'var(--color-gold)' : 'var(--color-line-3)' }} />
                {n.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
