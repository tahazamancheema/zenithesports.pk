'use client'

import { useId } from 'react'
import { MARK_VIEWBOX } from './mark-path'

export type ProductKey = 'zenith' | 'registrations' | 'production' | 'anticheat' | 'points'

/** The Zenith mark as a vector, at any size. */
export function ZenithGlyph({ fill = '#fff', className = '', title }: { fill?: string; className?: string; title?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <use href="#zx-mark" fill={fill} />
    </svg>
  )
}

const NAME: Record<ProductKey, string> = {
  zenith: 'Zenith Esports',
  registrations: 'ZenithRegistrations',
  production: 'ZenithProduction',
  anticheat: 'ZenithAntiCheat',
  points: 'ZenithPoints',
}

/**
 * The platform icon family: the real ZenithProduction app icon (white mark on
 * a rounded square) with each platform on its own colour. Every tile is dark
 * enough for the white mark to stand out.
 */
const TILE: Record<ProductKey, [string, string]> = {
  zenith: ['#171a21', '#030405'],
  production: ['#0d0d0d', '#030405'],
  registrations: ['#b07c1c', '#5a3d0a'],
  anticheat: ['#12927f', '#05433b'],
  points: ['#14a06c', '#064a31'],
}

export function ProductIcon({ product, size = 48, className = '' }: { product: ProductKey; size?: number; className?: string }) {
  // Unique per instance: the same icon can appear twice on a page (one copy hidden), and SVG
  // gradient ids must not collide or the hidden copy's definitions win.
  const id = `zi-${product}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [top, bottom] = TILE[product]
  const w = 256 * 0.66
  const h = (w * 1082) / 1228
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={className} role="img" aria-label={NAME[product]}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c9cfd9" />
          <stop offset="1" stopColor="#7d8490" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="248" height="248" rx="58" fill={`url(#${id}-bg)`} />
      <rect x="4.5" y="4.5" width="247" height="247" rx="57.5" fill="none" stroke="rgba(255,255,255,0.12)" />
      <svg x={(256 - w) / 2} y={(256 - h) / 2} width={w} height={h} viewBox={MARK_VIEWBOX}>
        <use href="#zx-mark" fill={product === 'zenith' ? `url(#${id}-chrome)` : '#ffffff'} />
      </svg>
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
