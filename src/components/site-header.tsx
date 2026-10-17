'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PRODUCTS } from '@/config/products'
import { useLinkMode, ZLink } from './link'
import { Node } from './brand'
import { surfaceForPath, type Surface } from '@/lib/surfaces'
import Image from 'next/image'

export function SiteHeader() {
  const mode = useLinkMode()
  const pathname = usePathname()
  const current: Surface = mode.mode === 'subdomain' ? mode.current : surfaceForPath(pathname)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const product = PRODUCTS.find((p) => p.surface === current)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color] duration-500 ${
        scrolled || open ? 'border-b border-line bg-void/80 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 btn btn-sm btn-primary">
        Skip to content
      </a>
      <div className="shell flex h-16 items-center justify-between gap-6">
        <ZLink surface="hq" to="/" className="group flex items-center gap-3" aria-label="Zenith Esports — home">
          <Image src="/brand/zenith-mark-160.webp" alt="" width={30} height={30} unoptimized priority className="transition-transform duration-500 group-hover:-translate-y-0.5" />
          <span className="font-display text-[13px] tracking-[0.32em]">ZENITH</span>
          {product && (
            <span className="t-label hidden sm:inline" style={{ color: product.color }} aria-hidden>
              / {product.nav}
            </span>
          )}
        </ZLink>

        <nav aria-label="Ecosystem" className="hidden items-center gap-1 lg:flex">
          <NavItem surface="hq" to="/" label="Ecosystem" active={current === 'hq'} color="var(--color-chrome)" />
          {PRODUCTS.map((p) => (
            <NavItem key={p.surface} surface={p.surface} to="/" label={p.nav} active={current === p.surface} color={p.color} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ZLink surface="registrations" to="/" className="btn btn-sm btn-primary hidden sm:inline-flex" style={{ '--accent': 'var(--color-gold)', '--accent-hi': 'var(--color-gold-hi)' } as React.CSSProperties}>
            Enter a tournament
          </ZLink>
          <button
            type="button"
            className="relative -mr-2 grid h-11 w-11 place-items-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`absolute h-px w-6 bg-fg transition-transform duration-300 ${open ? 'rotate-45' : '-translate-y-[4px]'}`} />
            <span className={`absolute h-px w-6 bg-fg transition-transform duration-300 ${open ? '-rotate-45' : 'translate-y-[4px]'}`} />
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-void lg:hidden ${open ? 'visible' : 'invisible'}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="meridian" style={{ '--meridian-x': '24px' } as React.CSSProperties} />
        <nav aria-label="Ecosystem" className="shell flex flex-col pt-6 pb-16">
          {[{ surface: 'hq' as const, nav: 'Ecosystem', role: 'Zenith Esports', color: 'var(--color-chrome)', index: '00' }, ...PRODUCTS].map((p, i) => (
            <ZLink
              key={p.surface}
              surface={p.surface}
              to="/"
              className="group flex items-baseline gap-4 border-b border-line py-5 pl-6"
              style={{
                transition: 'opacity 500ms var(--ease-out-expo), transform 500ms var(--ease-out-expo)',
                transitionDelay: open ? `${80 + i * 55}ms` : '0ms',
                opacity: open ? 1 : 0,
                transform: open ? 'none' : 'translateY(14px)',
              }}
            >
              <span className="t-label w-6">{p.index}</span>
              <span className="flex-1">
                <span className="font-display block text-xl uppercase">{p.nav}</span>
                <span className="mt-1 block text-sm text-fg-3">{p.role}</span>
              </span>
              <Node color={p.color} filled={current === p.surface} />
            </ZLink>
          ))}
          <ZLink surface="registrations" to="/" className="btn btn-primary mt-8 self-start" style={{ '--accent': 'var(--color-gold)' } as React.CSSProperties}>
            Enter a tournament <span className="arrow">→</span>
          </ZLink>
        </nav>
      </div>
    </header>
  )
}

function NavItem({ surface, to, label, active, color }: { surface: Surface; to: string; label: string; active: boolean; color: string }) {
  return (
    <ZLink
      surface={surface}
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-2 rounded-sm px-3 py-2 font-mono text-[11.5px] uppercase tracking-[0.14em] transition-colors ${
        active ? 'text-fg' : 'text-fg-3 hover:text-fg'
      }`}
    >
      <span
        aria-hidden
        className="node transition-all duration-300"
        style={{ '--accent': color, background: active ? color : 'transparent', boxShadow: active ? `0 0 12px ${color}` : 'none' } as React.CSSProperties}
      />
      {label}
      <span
        aria-hidden
        className={`absolute inset-x-3 -bottom-px h-px origin-left transition-transform duration-500 ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
        style={{ background: color, transitionTimingFunction: 'var(--ease-out-expo)' }}
      />
    </ZLink>
  )
}
