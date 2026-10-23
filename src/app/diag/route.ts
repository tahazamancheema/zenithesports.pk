import { headers } from 'next/headers'
import { createHash, timingSafeEqual } from 'node:crypto'
import { db } from '@/server/db'
import { getSettings } from '@/server/settings'
import { getFormats, getGames, listPublicTournaments } from '@/server/services/catalog'

/** Temporary timing probe, protected by DIAG_TOKEN. Removed after the performance pass. */
export async function GET(req: Request) {
  const token = process.env.DIAG_TOKEN
  const given = new URL(req.url).searchParams.get('t') ?? ''
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(token ?? '').digest()
  if (!token || !timingSafeEqual(a, b)) return new Response('Not found', { status: 404 })
  const h = await headers()
  const t = async (fn: () => Promise<unknown>) => {
    const s = performance.now()
    await fn()
    return Math.round(performance.now() - s)
  }
  const out: Record<string, unknown> = {
    functionRegion: process.env.VERCEL_REGION,
    proxyRegion: h.get('x-zenith-proxy-region'),
    firstQueryMs: await t(() => db()`select 1`),
    secondQueryMs: await t(() => db()`select 1`),
    thirdQueryMs: await t(() => db()`select 1`),
    settingsMs: await t(() => getSettings()),
    gamesMs: await t(() => getGames()),
    formatsMs: await t(() => getFormats()),
    tournamentsMs: await t(() => listPublicTournaments()),
  }
  const sb = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (sb) {
    out.supabaseAuthRoundTripMs = await t(() => fetch(`${sb}/auth/v1/health`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '' } }))
    out.supabaseAuthRoundTrip2Ms = await t(() => fetch(`${sb}/auth/v1/health`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '' } }))
    const jwks = await fetch(`${sb}/auth/v1/.well-known/jwks.json`).then((r) => r.json()).catch(() => null)
    out.jwtSigning = jwks?.keys?.length ? jwks.keys.map((k: { alg?: string }) => k.alg) : 'symmetric (getClaims calls the auth server)'
  }
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } })
}
