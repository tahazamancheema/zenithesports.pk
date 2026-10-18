'use client'

import { useId } from 'react'
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
  // Unique per instance: the same icon can appear twice on a page (one copy hidden), and SVG
  // gradient ids must not collide or the hidden copy's definitions win.
  const id = `zi-${product}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
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
          {/* An entry pass: the mark printed on a gold tournament ticket, with punched notches,
              a perforation and a barcode stub. */}
          <defs>
            <linearGradient id={`${id}-pass`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a2c12" />
              <stop offset="1" stopColor="#15110a" />
            </linearGradient>
            <mask id={`${id}-notch`}>
              <rect width="256" height="256" fill="#fff" />
              <circle cx="170" cy="64" r="14" fill="#000" />
              <circle cx="170" cy="192" r="14" fill="#000" />
            </mask>
          </defs>
          <g transform="rotate(-9 128 128)">
            <rect x="30" y="64" width="196" height="128" rx="18" fill={`url(#${id}-pass)`} stroke={`url(#${id}-gold)`} strokeWidth="6" mask={`url(#${id}-notch)`} />
            <path d="M156 64a14 14 0 0 0 28 0M156 192a14 14 0 0 1 28 0" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="6" />
            <path d="M170 84v88" stroke="#d9b25f" strokeWidth="4" strokeDasharray="7 7" strokeLinecap="round" opacity="0.8" />
            <svg x="44" y="84" width="104" height="92" viewBox={MARK_VIEWBOX}>
              <path d={MARK_PATH} fill={`url(#${id}-gold)`} fillRule="evenodd" />
            </svg>
            <g fill="#e9c97f">
              <rect x="186" y="98" width="5" height="60" rx="1" />
              <rect x="195" y="98" width="9" height="60" rx="1" />
              <rect x="208" y="98" width="4" height="60" rx="1" />
            </g>
          </g>
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
          {/* The podium: first, second and third, with the mark standing on the top step. */}
          <defs>
            <linearGradient id={`${id}-step`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b9adff" />
              <stop offset="1" stopColor="#5b47d6" />
            </linearGradient>
            <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#9d8cff" stopOpacity="0.75" />
              <stop offset="1" stopColor="#9d8cff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="128" cy="92" r="70" fill={`url(#${id}-glow)`} />
          <g>
            <rect x="42" y="160" width="58" height="56" rx="6" fill={`url(#${id}-step)`} opacity="0.85" />
            <rect x="99" y="132" width="58" height="84" rx="6" fill={`url(#${id}-step)`} />
            <rect x="156" y="178" width="58" height="38" rx="6" fill={`url(#${id}-step)`} opacity="0.7" />
            <rect x="42" y="160" width="58" height="7" rx="3" fill="#ddd6ff" opacity="0.7" />
            <rect x="99" y="132" width="58" height="7" rx="3" fill="#ece8ff" />
            <rect x="156" y="178" width="58" height="7" rx="3" fill="#ddd6ff" opacity="0.6" />
            <g fill="#241a63" fontFamily="Arial, sans-serif" fontWeight="800" textAnchor="middle">
              <text x="71" y="199" fontSize="26">2</text>
              <text x="128" y="186" fontSize="34">1</text>
              <text x="185" y="208" fontSize="22">3</text>
            </g>
          </g>
          {mark(`url(#${id}-chrome)`, 0.4, -50)}
          <g fill="#e2dcff">
            <path d="M52 70l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" />
            <path d="M205 52l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" opacity="0.8" />
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
