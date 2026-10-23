import type { ReactNode } from 'react'

/**
 * Inner-page opener: label, title, lede, and an optional backdrop or visual.
 */
export function PageIntro({
  eyebrow,
  title,
  lede,
  children,
  compact = false,
  image,
  imageStyle,
  top,
  aside,
}: {
  eyebrow: ReactNode
  title: ReactNode
  lede?: ReactNode
  children?: ReactNode
  compact?: boolean
  /** Optional backdrop render, faded in from the right (from the top on phones). */
  image?: string
  /** Crop and orientation for the backdrop (see artCrop). */
  imageStyle?: React.CSSProperties
  /** Optional element above the eyebrow, e.g. a product lockup. */
  top?: ReactNode
  /** Optional visual for the right-hand side. */
  aside?: ReactNode
}) {
  return (
    <section className={`relative isolate overflow-hidden border-b border-line ${compact ? 'py-16' : 'py-20 md:py-28'}`}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- static, pre-optimised render
        <img src={image} alt="" aria-hidden style={imageStyle} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55 [mask-image:linear-gradient(180deg,#000_30%,transparent_100%)] md:[mask-image:linear-gradient(90deg,transparent_15%,#000_75%)]" />
      )}
      <div aria-hidden className="grid-field absolute inset-0 -z-10 opacity-40" />
      <div className={`shell ${aside ? 'grid items-center gap-10 lg:grid-cols-12' : ''}`}>
        <div className={aside ? 'lg:col-span-7' : ''}>
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
        {aside && <div className="lg:col-span-5">{aside}</div>}
      </div>
    </section>
  )
}
