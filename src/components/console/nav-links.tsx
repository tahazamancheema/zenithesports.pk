'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks({ nav, base }: { nav: { to: string; label: string }[]; base: string }) {
  const pathname = usePathname()
  // On a subdomain the browser path has no prefix; compare against both forms.
  const rel = (p: string) => (p.startsWith(base) ? p.slice(base.length) || '/' : p.replace(/^\/(registrations|anticheat)\/admin/, '').replace(/^\/admin/, '') || '/')
  const here = rel(pathname)
  return (
    <nav aria-label="Console" className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
      {nav.map((n) => {
        const active = n.to === '/' ? here === '/' : here === n.to || here.startsWith(`${n.to}/`)
        return (
          <Link
            key={n.to}
            href={`${base}${n.to === '/' ? '' : n.to}`}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${active ? 'bg-ink-3 text-fg' : 'text-fg-2 hover:bg-ink-2 hover:text-fg'}`}
          >
            <span aria-hidden className="h-1.5 w-1.5 rotate-45" style={{ background: active ? 'var(--accent)' : 'var(--color-line-3)' }} />
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}
