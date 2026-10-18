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
          {/* A rank emblem: a faceted hexagonal gem holding three rank-up chevrons, with a gold
              spark at the apex. Standings are about climbing, so the icon is a climb. */}
          <defs>
            <linearGradient id={`${id}-night`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1c1450" />
              <stop offset="1" stopColor="#07051a" />
            </linearGradient>
            <radialGradient id={`${id}-halo`} cx="0.5" cy="0.52" r="0.5">
              <stop offset="0" stopColor="#8b74ff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#8b74ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#140d3a" />
              <stop offset="1" stopColor="#0a0722" />
            </linearGradient>
            <linearGradient id={`${id}-gold2`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff3c4" />
              <stop offset="1" stopColor="#f0b23a" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="248" height="248" rx="58" fill={`url(#${id}-night)`} />
          <circle cx="128" cy="134" r="112" fill={`url(#${id}-halo)`} />
          {/* gem facets, lit from the top left */}
          <g strokeLinejoin="round">
            <path d="M128 40 L208 86 L128 134 Z" fill="#7d68ff" />
            <path d="M208 86 L208 180 L128 134 Z" fill="#4c37d6" />
            <path d="M208 180 L128 226 L128 134 Z" fill="#33239f" />
            <path d="M128 226 L48 180 L128 134 Z" fill="#4430c4" />
            <path d="M48 180 L48 86 L128 134 Z" fill="#6c56f5" />
            <path d="M48 86 L128 40 L128 134 Z" fill="#a898ff" />
          </g>
          <path d="M128 40 L208 86 L208 180 L128 226 L48 180 L48 86 Z" fill="none" stroke="#ddd5ff" strokeOpacity="0.55" strokeWidth="3" strokeLinejoin="round" />
          {/* inner well */}
          <path d="M128 70 L182 101 L182 165 L128 196 L74 165 L74 101 Z" fill={`url(#${id}-core)`} stroke="#fff" strokeOpacity="0.12" strokeWidth="2" strokeLinejoin="round" />
          {/* rank-up chevrons */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="13">
            <path d="M98 170 L128 150 L158 170" stroke="#7b66ff" />
            <path d="M98 146 L128 126 L158 146" stroke="#bdb1ff" />
            <path d="M98 122 L128 102 L158 122" stroke="#ffffff" />
          </g>
          <path d="M128 66 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill={`url(#${id}-gold2)`} transform="translate(0 -40) scale(1) " />
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
