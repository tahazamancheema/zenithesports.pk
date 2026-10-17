import type { ReactNode } from 'react'

/** Two-column intake layout: what happens next on the left, the form on the right. */
export function FormPage({ eyebrow, title, intro, steps, children }: { eyebrow: string; title: ReactNode; intro: ReactNode; steps: string[]; children: ReactNode }) {
  return (
    <section className="relative">
      <div className="shell grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="t-label flex items-center gap-3">
              <span className="node node-fill" />
              {eyebrow}
            </p>
            <h1 className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">{title}</h1>
            <div className="mt-5 text-fg-2">{intro}</div>
            <ol className="mt-10 border-l border-line-2">
              {steps.map((s, i) => (
                <li key={s} className="relative pb-6 pl-6 last:pb-0">
                  <span aria-hidden className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rotate-45 border border-[var(--accent)] bg-void" />
                  <span className="t-label">Step {i + 1}</span>
                  <p className="mt-1 text-sm text-fg-2">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
        <div className="lg:col-span-7 lg:col-start-6">{children}</div>
      </div>
    </section>
  )
}
