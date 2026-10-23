import { LEGAL_LINKS, PRODUCTS } from '@/config/products'
import { getGames } from '@/server/services/catalog'
import { getSettings } from '@/server/settings'
import { ProductIcon } from './brand/product-logos'
import { MARK_PATH, MARK_VIEWBOX } from './brand/mark-path'
import { ZLink } from './link'
import { SocialLinks } from './social'

const FALLBACK_GAMES = [
  { id: 'pubg-mobile', name: 'PUBG Mobile' },
  { id: 'free-fire', name: 'Free Fire' },
  { id: 'valorant', name: 'VALORANT' },
  { id: 'honor-of-kings', name: 'Honor of Kings' },
  { id: 'tekken-8', name: 'TEKKEN 8' },
  { id: 'ea-fc', name: 'EA SPORTS FC' },
]

export async function SiteFooter() {
  const [s, dbGames] = await Promise.all([getSettings(), getGames()])
  const games = dbGames.length ? dbGames : FALLBACK_GAMES
  const year = new Date().getFullYear()
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-line bg-[linear-gradient(180deg,var(--color-void),#08090d)]" data-surface="hq">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-60" />

      <div className="shell grid gap-12 pb-12 pt-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
            <img src="/brand/zenith-mark-160.webp" alt="" width={52} height={52} className="h-[52px] w-[52px] drop-shadow-[0_8px_24px_rgba(217,178,95,0.25)]" />
            <div>
              <p className="font-display text-[15px] tracking-[0.28em]">ZENITH</p>
              <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-fg-3">Esports · Pakistan</p>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-fg-2">
            Tournaments, broadcast production, competitive integrity and scoring, built by one organisation and connected end to end.
          </p>
          <div className="mt-7">
            <SocialLinks social={s.social} />
          </div>
          {s.contact.email && (
            <a href={`mailto:${s.contact.email}`} className="mt-5 inline-block font-mono text-sm text-fg-2 hover:text-fg">
              {s.contact.email}
            </a>
          )}
        </div>

        <div className="lg:col-span-3">
          <p className="t-label mb-4">Platforms</p>
          <ul className="grid gap-2">
            {PRODUCTS.map((p) => (
              <li key={p.surface}>
                <ZLink surface={p.surface} to="/" className="group flex items-center gap-3 rounded-xl p-1.5 pr-3 transition-colors hover:bg-white/[0.04]">
                  <ProductIcon product={p.surface} size={36} />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium text-fg-2 group-hover:text-fg">{p.name}</span>
                    <span className="block text-[13px] text-fg-3">{p.role}</span>
                  </span>
                </ZLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-[1.35fr_1fr_1fr] lg:col-span-5">
          <div>
            <p className="t-label mb-4">Games</p>
            <ul className="flex flex-wrap gap-2">
              {games.map((g) => (
                <li key={g.id}>
                  <ZLink
                    surface="registrations"
                    to={`/games/${g.id}`}
                    className="inline-flex rounded-full border border-line-2 bg-white/[0.02] px-3 py-1.5 text-[13px] text-fg-2 transition-colors hover:border-[var(--color-gold)] hover:bg-[color-mix(in_oklab,var(--color-gold)_10%,transparent)] hover:text-fg"
                  >
                    {g.name}
                  </ZLink>
                </li>
              ))}
            </ul>
          </div>
          <FooterCol
            title="Zenith"
            links={[
              ['/about', 'About'],
              ['/rules', 'Tournament rules'],
              ['/faq', 'FAQ'],
              ['/contact', 'Contact'],
            ]}
          />
          <FooterCol title="Policies" links={LEGAL_LINKS.map((l) => [l.to, l.label])} />
        </div>
      </div>

      {/* The signature: mark and name as crisp vector art, fading into the edge of the page. */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <svg viewBox="0 0 1600 300" className="mx-auto block w-full max-w-[1320px] translate-y-[14%]" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="footer-sig" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f0d594" stopOpacity="0.55" />
              <stop offset="0.55" stopColor="#c9cfd9" stopOpacity="0.16" />
              <stop offset="1" stopColor="#c9cfd9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <svg x="40" y="20" width="300" height="264" viewBox={MARK_VIEWBOX}>
            <path d={MARK_PATH} fillRule="evenodd" fill="url(#footer-sig)" stroke="#f0d594" strokeOpacity="0.25" strokeWidth="4" />
          </svg>
          <text x="380" y="262" fill="url(#footer-sig)" stroke="#f0d594" strokeOpacity="0.2" strokeWidth="1.5" style={{ fontFamily: 'var(--ff-display), Michroma, sans-serif', fontSize: 236, letterSpacing: 18 }}>
            ZENITH
          </text>
        </svg>
      </div>

      <div className="relative border-t border-line bg-[#07080b]">
        <div className="shell flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.14em] text-fg-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
            <img src="/brand/zenith-mark-160.webp" alt="" width={20} height={20} className="h-5 w-5 opacity-80" />© {year} Zenith Esports · Made in Pakistan
          </p>
          <a href="#main" className="font-mono text-[12px] uppercase tracking-[0.14em] text-fg-3 transition-colors hover:text-fg">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="t-label mb-4">{title}</p>
      <ul className="grid gap-1.5 text-[14px]">
        {links.map(([to, label]) => (
          <li key={to}>
            <ZLink surface="hq" to={to} className="block py-0.5 text-fg-2 hover:text-fg">
              {label}
            </ZLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
