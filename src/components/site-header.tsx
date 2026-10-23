'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { PRODUCTS } from '@/config/products'
import { surfaceForPath, type Surface } from '@/lib/surfaces'
import { ProductIcon } from './brand/product-logos'
import { useLinkMode, ZLink } from './link'

const PAGES: { label: string; surface: Surface; to: string }[] = [
  { label: 'Tournaments', surface: 'registrations', to: '/' },
  { label: 'About', surface: 'hq', to: '/about' },
  { label: 'Contact', surface: 'hq', to: '/contact' },
]

/**
 * A floating glass bar. It steps out of the way while reading (hides on scroll
 * down, returns on scroll up), and its Platforms menu shows every product with
 * its icon and the shortcuts people look for.
 */
export function SiteHeader() {
  const mode = useLinkMode()
  const pathname = usePathname()
  const current: Surface = mode.mode === 'subdomain' ? mode.current : surfaceForPath(pathname)
  const [open, setOpen] = useState(false) // mobile sheet
  const [menu, setMenu] = useState(false) // desktop platforms menu
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close everything when the route changes (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
    setMenu(false)
  }

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 160)
        last = y
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setMenu(false)
      }
    }
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const product = PRODUCTS.find((p) => p.surface === current)
  const show = !hidden || open || menu

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] sm:px-5 ${show ? 'translate-y-0' : '-translate-y-[120%]'}`}
      >
        <a href="#main" className="btn btn-sm btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50">
          Skip to content
        </a>
        <div
          ref={menuRef}
          className={`relative mx-auto max-w-[1320px] rounded-2xl border transition-[background,border-color,box-shadow] duration-500 ${
            scrolled || menu || open
              ? 'border-line-2 bg-[rgb(10_12_16/0.82)] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl'
              : 'border-transparent bg-transparent'
          }`}
        >
          <div className="flex h-14 items-center justify-between gap-4 pl-3 pr-2 sm:pl-4">
            <ZLink surface="hq" to="/" className="group flex min-w-0 items-center gap-3" aria-label="Zenith Esports — home">
              <Image src="/brand/zenith-mark-160.webp" alt="" width={30} height={30} unoptimized priority className="transition-transform duration-500 group-hover:-translate-y-0.5" />
              <span className="font-display text-[13px] tracking-[0.32em]">ZENITH</span>
              {product && (
                <span className="hidden items-center gap-2 rounded-full border border-line-2 py-0.5 pl-0.5 pr-2.5 sm:flex" aria-hidden>
                  <ProductIcon product={product.surface} size={20} />
                  <span className="font-mono text-[11.5px] uppercase tracking-[0.12em]" style={{ color: product.color }}>
                    {product.nav}
                  </span>
                </span>
              )}
            </ZLink>

            <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                aria-expanded={menu}
                aria-controls="platforms-menu"
                onClick={() => setMenu((m) => !m)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${menu ? 'bg-white/[0.06] text-fg' : 'text-fg-2 hover:text-fg'}`}
              >
                Platforms
                <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform duration-300 ${menu ? 'rotate-180' : ''}`} aria-hidden>
                  <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              {PAGES.map((p) => (
                <ZLink key={p.label} surface={p.surface} to={p.to} className="rounded-lg px-3 py-2 text-[14px] font-medium text-fg-2 transition-colors hover:text-fg">
                  {p.label}
                </ZLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {/* /account is served on every host; it asks signed-out visitors to sign in. */}
              <a href="/account" className="grid h-10 w-10 place-items-center rounded-xl border border-line-2 text-fg-2 transition-colors hover:border-line-3 hover:text-fg" aria-label="My account">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <circle cx="12" cy="8.5" r="3.6" />
                  <path d="M4.8 19.5c1.2-3.4 4-5 7.2-5s6 1.6 7.2 5" strokeLinecap="round" />
                </svg>
              </a>
              <ZLink
                surface="registrations"
                to="/"
                className="btn btn-sm btn-primary hidden !rounded-xl sm:inline-flex"
                style={{ '--accent': 'var(--color-gold)', '--accent-hi': 'var(--color-gold-hi)' } as React.CSSProperties}
              >
                Enter a tournament
              </ZLink>
              <button
                type="button"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-line-2 lg:hidden"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((o) => !o)}
              >
                <span className={`absolute h-px w-5 bg-fg transition-transform duration-300 ${open ? 'rotate-45' : '-translate-y-[4px]'}`} />
                <span className={`absolute h-px w-5 bg-fg transition-transform duration-300 ${open ? '-rotate-45' : 'translate-y-[4px]'}`} />
              </button>
            </div>
          </div>

          {/* Platforms menu (desktop) */}
          <div
            id="platforms-menu"
            className={`hidden overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] lg:grid ${menu ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}
            inert={!menu}
          >
            <div className="min-h-0">
              <div className="grid grid-cols-4 gap-3 border-t border-line p-3">
                {PRODUCTS.map((p, i) => (
                  <div
                    key={p.surface}
                    className="group rounded-xl border border-line bg-white/[0.02] p-4 transition-[border-color,background,transform] duration-500 hover:bg-white/[0.04]"
                    style={{ transitionDelay: menu ? `${i * 40}ms` : '0ms', transform: menu ? 'none' : 'translateY(8px)' }}
                  >
                    <ZLink surface={p.surface} to="/" className="flex items-center gap-3">
                      <ProductIcon product={p.surface} size={44} />
                      <span className="min-w-0">
                        <span className="t-title block text-[15px] group-hover:text-white">{p.name}</span>
                        <span className="block font-mono text-[11.5px] uppercase tracking-[0.1em]" style={{ color: p.color }}>
                          {p.role}
                        </span>
                      </span>
                    </ZLink>
                    <p className="mt-3 text-[13.5px] leading-snug text-fg-2">{p.blurb}</p>
                    <ul className="mt-3 grid gap-0.5 border-t border-line pt-3">
                      {p.links.map((l) => (
                        <li key={l.label}>
                          <ZLink surface={l.surface ?? p.surface} to={l.to} className="flex items-center justify-between rounded-md px-2 py-1.5 text-[14px] text-fg-2 transition-colors hover:bg-white/[0.05] hover:text-fg">
                            {l.label}
                            <span aria-hidden className="text-fg-3">→</span>
                          </ZLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* A sibling of <header>, not a child: the header's backdrop-filter would make it the
          containing block for this fixed panel and shrink it to the header's height. */}
      <div
        id="mobile-nav"
        className={`fixed inset-0 z-40 overflow-y-auto bg-void/95 pt-24 backdrop-blur-xl transition-opacity duration-300 lg:hidden ${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label="Main" className="shell grid gap-3 pb-16">
          {PRODUCTS.map((p, i) => (
            <div
              key={p.surface}
              className="rounded-2xl border border-line-2 bg-white/[0.02] p-4"
              style={{
                transition: 'opacity 500ms var(--ease-out-expo), transform 500ms var(--ease-out-expo)',
                transitionDelay: open ? `${60 + i * 50}ms` : '0ms',
                opacity: open ? 1 : 0,
                transform: open ? 'none' : 'translateY(14px)',
              }}
            >
              <ZLink surface={p.surface} to="/" className="flex items-center gap-3">
                <ProductIcon product={p.surface} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="t-title block text-[17px]">{p.name}</span>
                  <span className="block font-mono text-[11.5px] uppercase tracking-[0.1em]" style={{ color: p.color }}>
                    {p.role}
                  </span>
                </span>
                {current === p.surface && <span className="chip">Here</span>}
              </ZLink>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.links.map((l) => (
                  <ZLink key={l.label} surface={l.surface ?? p.surface} to={l.to} className="rounded-lg border border-line px-3 py-1.5 text-[13.5px] text-fg-2">
                    {l.label}
                  </ZLink>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PAGES.map((p) => (
              <ZLink key={p.label} surface={p.surface} to={p.to} className="rounded-xl border border-line px-4 py-3 text-[15px] text-fg-2">
                {p.label}
              </ZLink>
            ))}
          </div>
          <ZLink surface="registrations" to="/" className="btn btn-primary mt-3" style={{ '--accent': 'var(--color-gold)' } as React.CSSProperties}>
            Enter a tournament <span className="arrow">→</span>
          </ZLink>
        </nav>
      </div>
    </>
  )
}
