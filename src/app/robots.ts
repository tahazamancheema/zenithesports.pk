import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { surfaceForHost } from '@/lib/surfaces'

/**
 * Host-aware. Consoles and private token pages are disallowed.
 * The private ledger path is deliberately NOT listed: robots.txt is public and
 * would advertise it; it is kept out of search by its own noindex headers.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').toLowerCase()
  const root = process.env.ROOT_DOMAIN || 'zenithesports.pk'
  const surface = surfaceForHost(host, root)
  const production = surface !== null
  return {
    rules: production
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/manage/', '/lft/manage/', '/lft/request/', '/leave'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: production ? `https://${host}/sitemap.xml` : undefined,
  }
}
