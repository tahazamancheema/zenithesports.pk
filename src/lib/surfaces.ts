/**
 * The ecosystem is one Next.js app with several surfaces. In production each
 * surface has its own subdomain; everywhere else (localhost, previews) it lives
 * under a path prefix. The proxy (src/proxy.ts) does the mapping.
 */
export const SURFACES = {
  hq: { prefix: '', subdomain: null, name: 'Zenith Esports' },
  registrations: { prefix: '/registrations', subdomain: 'registrations', name: 'Zenith Registrations' },
  production: { prefix: '/production', subdomain: 'production', name: 'ZenithProduction' },
  anticheat: { prefix: '/anticheat', subdomain: 'anticheat', name: 'ZenithAntiCheat' },
  points: { prefix: '/points', subdomain: 'points', name: 'ZenithPoints' },
} as const

export type Surface = keyof typeof SURFACES
export const PRODUCT_SURFACES = ['registrations', 'production', 'anticheat', 'points'] as const

/** The main site lives at www.<root>; the bare domain redirects there (Vercel domain setting). */
export const hqHost = (rootDomain: string) => `www.${rootDomain}`

export type LinkMode = { mode: 'subdomain'; rootDomain: string; current: Surface } | { mode: 'path'; current: Surface }

/** Host → surface, for the production root domain only. */
export function surfaceForHost(host: string, rootDomain: string): Surface | 'hisaab' | null {
  const h = host.split(':')[0].toLowerCase()
  if (h === rootDomain || h === `www.${rootDomain}`) return 'hq'
  if (!h.endsWith(`.${rootDomain}`)) return null
  const sub = h.slice(0, -(rootDomain.length + 1))
  if (sub === 'hisaab') return 'hisaab'
  for (const [key, s] of Object.entries(SURFACES)) if (s.subdomain === sub) return key as Surface
  return null
}

/** Internal path (`/registrations/t/x`) → owning surface. */
export function surfaceForPath(pathname: string): Surface {
  for (const key of PRODUCT_SURFACES) {
    const p = SURFACES[key].prefix
    if (pathname === p || pathname.startsWith(`${p}/`)) return key
  }
  return 'hq'
}

/**
 * Build an href for `path` on `surface`, relative where possible.
 * `path` is surface-relative and starts with '/'.
 */
export function hrefFor(link: LinkMode, surface: Surface, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (link.mode === 'path') {
    const prefix = SURFACES[surface].prefix
    return prefix ? (clean === '/' ? prefix : `${prefix}${clean}`) : clean
  }
  if (surface === link.current) return clean
  const sub = SURFACES[surface].subdomain
  const host = sub ? `${sub}.${link.rootDomain}` : hqHost(link.rootDomain)
  return `https://${host}${clean === '/' ? '' : clean}`
}

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href)
}
