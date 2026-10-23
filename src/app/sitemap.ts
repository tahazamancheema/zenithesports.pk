import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { GAME_RULES } from '@/config/rules'
import { surfaceForHost } from '@/lib/surfaces'
import { getGames, listPublicTournaments } from '@/server/services/catalog'

const PAGES: Record<string, string[]> = {
  hq: ['/', '/about', '/contact', '/faq', '/rules', '/tournament-rules', ...GAME_RULES.map((g) => `/tournament-rules/${g.gameId}`), '/legal/privacy', '/legal/terms', '/legal/cookies', '/legal/accessibility'],
  registrations: ['/', '/lft'],
  production: ['/', '/inquire', '/book'],
  anticheat: ['/', '/report'],
  points: ['/'],
}

/** Each host lists only its own public pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').toLowerCase()
  const surface = surfaceForHost(host, process.env.ROOT_DOMAIN || 'zenithesports.pk')
  if (!surface || surface === 'hisaab') return []
  const base = `https://${host}`
  const out: MetadataRoute.Sitemap = PAGES[surface].map((p) => ({ url: `${base}${p === '/' ? '' : p}` }))
  if (surface === 'registrations') {
    const [tournaments, games] = await Promise.all([listPublicTournaments(), getGames()])
    out.push(...games.map((g) => ({ url: `${base}/games/${g.id}` })))
    out.push(...tournaments.map((t) => ({ url: `${base}/t/${t.slug}`, lastModified: t.updatedAt })))
  }
  return out
}
