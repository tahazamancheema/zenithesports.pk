import 'server-only'
import { headers } from 'next/headers'
import { hrefFor, type LinkMode, type Surface } from '@/lib/surfaces'
import { env } from './env'

/** How links should be written for the current request (set by src/proxy.ts). */
export async function getLinkMode(): Promise<LinkMode> {
  const h = await headers()
  const current = (h.get('x-zenith-surface') as Surface | null) ?? 'hq'
  return h.get('x-zenith-mode') === 'subdomain' ? { mode: 'subdomain', rootDomain: env.ROOT_DOMAIN, current } : { mode: 'path', current }
}

export async function href(surface: Surface, path = '/') {
  return hrefFor(await getLinkMode(), surface, path)
}

/** Absolute URL for emails and canonical tags. */
export async function absoluteUrl(surface: Surface, path = '/') {
  const mode = await getLinkMode()
  const rel = hrefFor(mode, surface, path)
  if (/^https?:/.test(rel)) return rel
  if (mode.mode === 'subdomain') return `https://${surface === 'hq' ? 'www.' : `${surface}.`}${env.ROOT_DOMAIN}${rel}`
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}${rel}`
}

export async function nonce() {
  return (await headers()).get('x-nonce') ?? undefined
}
