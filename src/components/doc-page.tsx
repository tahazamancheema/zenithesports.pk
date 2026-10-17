import type { ReactNode } from 'react'
import { ZLink } from './link'

/** Long-form policy layout: sticky contents on the left, readable measure on the right. */
export function DocPage({
  eyebrow,
  title,
  updated,
  sections,
  intro,
}: {
  eyebrow: string
  title: string
  updated: string
  intro?: ReactNode
  sections: { id: string; title: string; body: ReactNode }[]
}) {
  return (
    <div className="shell grid gap-12 py-14 md:py-20 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <nav aria-label="On this page" className="lg:sticky lg:top-24">
          <p className="t-label">{eyebrow}</p>
          <ol className="mt-5 hidden space-y-2 border-l border-line lg:block">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-sm text-fg-3 hover:border-[var(--accent)] hover:text-fg">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
      <article className="lg:col-span-8 lg:col-start-5">
        <h1 className="t-display text-[clamp(1.6rem,3.6vw,2.6rem)]">{title}</h1>
        <p className="t-label mt-4">Last updated {updated}</p>
        {intro && <div className="t-lede mt-8">{intro}</div>}
        <div className="prose-zenith mt-6">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </div>
        <p className="mt-14 text-sm text-fg-3">
          Questions about this page?{' '}
          <ZLink surface="hq" to="/contact" className="underline underline-offset-4 hover:text-fg">
            Contact us
          </ZLink>
          .
        </p>
      </article>
    </div>
  )
}
