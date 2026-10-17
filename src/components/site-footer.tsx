import { LEGAL_LINKS, PRODUCTS } from '@/config/products'
import { getSettings } from '@/server/settings'
import { ZenithMark } from './brand'
import { ZLink } from './link'
import { SocialLinks } from './social'

export async function SiteFooter() {
  const s = await getSettings()
  const year = new Date().getFullYear()
  return (
    <footer className="relative mt-32 border-t border-line" data-surface="hq">
      <div className="shell grid gap-14 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-4">
            <ZenithMark size={44} />
            <div>
              <p className="font-display text-sm tracking-[0.3em]">ZENITH ESPORTS</p>
              <p className="t-label mt-1">Multi-gaming organisation · Pakistan</p>
            </div>
          </div>
          <p className="mt-8 max-w-sm text-fg-2">
            Competition, production, integrity and scoring — the systems esports runs on, built in one connected ecosystem.
          </p>
          <div className="mt-8">
            <SocialLinks social={s.social} />
          </div>
          {s.contact.email && (
            <a href={`mailto:${s.contact.email}`} className="mt-6 inline-block font-mono text-sm text-fg-2 hover:text-fg">
              {s.contact.email}
            </a>
          )}
        </div>

        <FooterCol title="Platforms" className="md:col-span-3">
          {PRODUCTS.map((p) => (
            <li key={p.surface}>
              <ZLink surface={p.surface} to="/" className="group flex items-center gap-3 py-1.5 text-fg-2 hover:text-fg">
                <span className="node" style={{ '--accent': p.color } as React.CSSProperties} />
                {p.name}
              </ZLink>
            </li>
          ))}
          <li className="pt-3">
            <ZLink surface="anticheat" to="/report" className="py-1.5 text-fg-2 hover:text-fg">
              Report a banned player
            </ZLink>
          </li>
        </FooterCol>

        <FooterCol title="Zenith" className="md:col-span-2">
          {[
            ['/about', 'About'],
            ['/games', 'Games'],
            ['/faq', 'FAQ'],
            ['/contact', 'Contact'],
          ].map(([to, label]) => (
            <li key={to}>
              <ZLink surface="hq" to={to} className="block py-1.5 text-fg-2 hover:text-fg">
                {label}
              </ZLink>
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Policies" className="md:col-span-2">
          {LEGAL_LINKS.map((l) => (
            <li key={l.to}>
              <ZLink surface="hq" to={l.to} className="block py-1.5 text-fg-2 hover:text-fg">
                {l.label}
              </ZLink>
            </li>
          ))}
        </FooterCol>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-label">© {year} Zenith Esports</p>
          <p className="t-label">Elevation · Precision · Focus</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <p className="t-label mb-4">{title}</p>
      <ul className="text-[15px]">{children}</ul>
    </div>
  )
}
