import type { ReactNode } from 'react'

/**
 * Inner-page opener: label, title, lede, and a single trajectory rising to a
 * node on the right — the Meridian signature at page scale.
 */
export function PageIntro({
  eyebrow,
  title,
  lede,
  children,
  compact = false,
  image,
  top,
}: {
  eyebrow: ReactNode
  title: ReactNode
  lede?: ReactNode
  children?: ReactNode
  compact?: boolean
  /** Optional backdrop render, faded in from the right. */
  image?: string
  /** Optional element above the eyebrow, e.g. a product lockup. */
  top?: ReactNode
}) {
  return (
    <section className={`relative isolate overflow-hidden border-b border-line ${compact ? 'py-16' : 'py-20 md:py-28'}`}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- static, pre-optimised render
        <img src={image} alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55 [mask-image:linear-gradient(90deg,transparent_15%,#000_75%)]" />
      )}
      <div aria-hidden className="grid-field absolute inset-0 -z-10 opacity-40" />
      <svg aria-hidden viewBox="0 0 400 240" className="pointer-events-none absolute right-0 bottom-0 -z-10 hidden h-full w-[42%] md:block" preserveAspectRatio="xMaxYMax meet">
        <path d="M 20 236 C 140 236, 250 170, 330 40" fill="none" stroke="var(--accent)" strokeOpacity="0.55" className="draw-path is-in" style={{ '--len': 420, '--d': 300 } as React.CSSProperties} />
        <path d="M 120 236 C 200 236, 290 160, 330 40" fill="none" stroke="var(--color-line-3)" className="draw-path is-in" style={{ '--len': 360, '--d': 500 } as React.CSSProperties} />
        <line x1="330" y1="0" x2="330" y2="240" stroke="var(--color-line-2)" />
        <g transform="translate(330 40) rotate(45)">
          <rect x="-5" y="-5" width="10" height="10" fill="var(--accent)" style={{ animation: 'fade 600ms 1.4s both' }} />
        </g>
      </svg>
      <div className="shell">
        {top && <div className="mb-8" style={{ animation: 'fade 700ms var(--ease-out-expo) both' }}>{top}</div>}
        <p className="t-label flex items-center gap-3" style={{ animation: 'fade 700ms var(--ease-out-expo) both' }}>
          <span className="node node-fill" />
          {eyebrow}
        </p>
        <h1 className="t-display mt-6 max-w-4xl text-[clamp(1.7rem,4vw,3.1rem)]" style={{ animation: 'rise 900ms var(--ease-out-expo) 80ms both' }}>
          {title}
        </h1>
        {lede && (
          <p className="t-lede mt-6 max-w-2xl" style={{ animation: 'rise 900ms var(--ease-out-expo) 180ms both' }}>
            {lede}
          </p>
        )}
        {children && (
          <div className="mt-9 flex flex-wrap gap-3" style={{ animation: 'rise 900ms var(--ease-out-expo) 280ms both' }}>
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
