import { MARK_PATH, MARK_VIEWBOX } from './mark-path'

export type ProductKey = 'zenith' | 'registrations' | 'production' | 'anticheat' | 'points'

/** The Zenith mark as a vector, at any size. */
export function ZenithGlyph({ fill = '#fff', className = '', title }: { fill?: string; className?: string; title?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d={MARK_PATH} fill={fill} fillRule="evenodd" />
    </svg>
  )
}

const NAME: Record<ProductKey, string> = {
  zenith: 'Zenith Esports',
  registrations: 'Zenith Registrations',
  production: 'ZenithProduction',
  anticheat: 'ZenithAntiCheat',
  points: 'ZenithPoints',
}

/**
 * The platform icon family. Same base as the real ZenithProduction app icon
 * (white mark on a black rounded square); each platform adds one accent in
 * its own frequency colour so they read as siblings.
 */
export function ProductIcon({ product, size = 48, className = '' }: { product: ProductKey; size?: number; className?: string }) {
  const id = `zi-${product}`
  // The mark occupies the centre; badges sit bottom-right.
  const mark = (fill: string, s = 0.62, dy = 0) => {
    const w = 256 * s
    const h = (w * 1082) / 1228
    return <svg x={(256 - w) / 2} y={(256 - h) / 2 + dy} width={w} height={h} viewBox={MARK_VIEWBOX}><path d={MARK_PATH} fill={fill} fillRule="evenodd" /></svg>
  }
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={className} role="img" aria-label={NAME[product]}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={product === 'production' ? '#0d0d0d' : '#171a21'} />
          <stop offset="1" stopColor="#030405" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e3ad" />
          <stop offset="0.45" stopColor="#d9b25f" />
          <stop offset="1" stopColor="#8e7236" />
        </linearGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c9cfd9" />
          <stop offset="1" stopColor="#7d8490" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="248" height="248" rx="58" fill={`url(#${id}-bg)`} />
      <rect x="4.5" y="4.5" width="247" height="247" rx="57.5" fill="none" stroke="rgba(255,255,255,0.09)" />

      {product === 'zenith' && mark(`url(#${id}-chrome)`, 0.66)}
      {product === 'production' && mark('#ffffff', 0.66)}

      {product === 'registrations' && (
        <>
          {mark(`url(#${id}-gold)`, 0.58, -8)}
          {/* bracket rails: the path to a final */}
          <path d="M34 196h26v-26M222 196h-26v-26M60 196h136" fill="none" stroke="#d9b25f" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        </>
      )}

      {product === 'anticheat' && (
        <>
          {mark('#ffffff', 0.5, -6)}
          {/* scan ring with a verification notch */}
          <circle cx="128" cy="124" r="92" fill="none" stroke="#3fd8c0" strokeWidth="8" strokeDasharray="460 118" strokeLinecap="round" transform="rotate(-20 128 124)" />
          <g transform="translate(188 186)">
            <circle r="34" fill="#3fd8c0" />
            <path d="M-15 1l10 10 20-22" fill="none" stroke="#04110f" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </>
      )}

      {product === 'points' && (
        <>
          {mark('#ffffff', 0.54, -14)}
          {/* rising standings */}
          <g transform="translate(70 214)" fill="#9d8cff">
            <rect x="0" y="-22" width="30" height="22" rx="5" opacity="0.55" />
            <rect x="43" y="-40" width="30" height="40" rx="5" opacity="0.8" />
            <rect x="86" y="-58" width="30" height="58" rx="5" />
          </g>
        </>
      )}
    </svg>
  )
}

const WORD: Record<ProductKey, { top: string; bottom: string; color: string }> = {
  zenith: { top: 'ZENITH', bottom: 'ESPORTS', color: 'var(--color-chrome)' },
  registrations: { top: 'ZENITH', bottom: 'REGISTRATIONS', color: 'var(--color-reg)' },
  production: { top: 'ZENITH', bottom: 'PRODUCTION', color: 'var(--color-prod)' },
  anticheat: { top: 'ZENITH', bottom: 'ANTICHEAT', color: 'var(--color-ac)' },
  points: { top: 'ZENITH', bottom: 'POINTS', color: 'var(--color-pts)' },
}

/** Icon + two-line wordmark, following the ZenithProduction app's own lockup. */
export function ProductLockup({ product, size = 44, className = '' }: { product: ProductKey; size?: number; className?: string }) {
  const w = WORD[product]
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <ProductIcon product={product} size={size} />
      <span className="leading-none">
        <span className="font-display block tracking-[0.16em]" style={{ fontSize: Math.max(14, size * 0.4) }}>
          {w.top}
        </span>
        <span className="mt-1.5 block font-mono font-semibold tracking-[0.28em]" style={{ fontSize: Math.max(12, size * 0.25), color: w.color }}>
          {w.bottom}
        </span>
      </span>
    </span>
  )
}
