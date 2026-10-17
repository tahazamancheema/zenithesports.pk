import { ZLink } from './link'

/** 404: the signal falls off its trajectory before reaching the apex. */
export function NotFoundView() {
  return (
    <section className="relative overflow-hidden">
      <div className="shell grid min-h-[70svh] items-center gap-10 py-20 md:grid-cols-2">
        <div>
          <p className="t-label">Error 404 · Signal lost</p>
          <h1 className="t-display mt-6 text-[clamp(1.8rem,4vw,3rem)]">
            Off the
            <br />
            trajectory
          </h1>
          <p className="t-lede mt-6 max-w-md">This page doesn’t exist, or it has moved. Head back to the ecosystem or find a tournament.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ZLink surface="hq" to="/" className="btn btn-primary">
              Back to Zenith
            </ZLink>
            <ZLink surface="registrations" to="/" className="btn btn-ghost">
              Tournaments
            </ZLink>
          </div>
        </div>
        <svg viewBox="0 0 400 300" className="w-full max-w-md justify-self-center" aria-hidden>
          <line x1="0" y1="250" x2="400" y2="250" stroke="var(--color-line-2)" />
          <line x1="300" y1="0" x2="300" y2="300" stroke="var(--color-line)" />
          <path d="M 40 250 C 120 250, 170 150, 220 120 C 250 104, 262 140, 258 300" fill="none" stroke="var(--color-gold)" strokeWidth="1.4" className="draw-path is-in" style={{ '--len': 520 } as React.CSSProperties} />
          <g transform="translate(300 60) rotate(45)">
            <rect x="-6" y="-6" width="12" height="12" fill="none" stroke="var(--color-line-3)" strokeDasharray="2 2" />
          </g>
          <circle r="3.5" fill="var(--color-gold)">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 40 250 C 120 250, 170 150, 220 120 C 250 104, 262 140, 258 300" />
          </circle>
        </svg>
      </div>
    </section>
  )
}
