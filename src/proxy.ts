import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IDLE_COOKIE, IDLE_NOTICE_COOKIE, IDLE_TOUCH_MS, isAuthTokenCookie, PLAYER_IDLE_SECONDS, readSeen, signSeen } from '@/lib/idle'
import { hqHost, PRODUCT_SURFACES, SURFACES, surfaceForHost, surfaceForPath, type Surface } from '@/lib/surfaces'

/**
 * Host → surface routing, canonical redirects and the per-request CSP nonce.
 *
 * Production (ROOT_DOMAIN and its subdomains):
 *   registrations.zenithesports.pk/t/x   → rewrite → /registrations/t/x
 *   www.zenithesports.pk/registrations/x → 308     → registrations.zenithesports.pk/x
 *   zenithesports.pk/*                   → 308     → www.zenithesports.pk/*  (the main site lives on www)
 *   hisaab.zenithesports.pk/*            → 307     → www.zenithesports.pk/hisaab/admin
 * Anywhere else (localhost, previews): path mode, no rewriting.
 *
 * The ZenithHisaab ledger at /hisaab/admin is never rewritten or given this
 * CSP: its own headers (next.config.ts) reproduce its existing deployment.
 */

const ROOT = process.env.ROOT_DOMAIN || 'zenithesports.pk'
const isDev = process.env.NODE_ENV === 'development'
const hasExtension = (p: string) => /\.[a-z0-9]{2,5}$/i.test(p)
/** Account pages are shared by every host, so one sign-in works on every subdomain. */
const isShared = (p: string) => p === '/login' || p === '/account' || p.startsWith('/account/') || p.startsWith('/auth/')

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
/** Parent-domain cookies only on the production domain; host-only on localhost and previews. */
const cookieDomainFor = (host: string) => {
  const h = host.split(':')[0]
  if (process.env.AUTH_COOKIE_DOMAIN) return process.env.AUTH_COOKIE_DOMAIN
  return h === ROOT || h.endsWith(`.${ROOT}`) ? `.${ROOT}` : undefined
}

type CookieSet = { name: string; value: string; options: Record<string, unknown> }[]

/**
 * Signed-in visitors: ends the session after PLAYER_IDLE_SECONDS without a
 * request, otherwise keeps the Supabase token fresh (server components cannot
 * write cookies) and stamps the activity time. Anonymous traffic pays nothing.
 */
async function authGate(req: NextRequest, host: string): Promise<CookieSet> {
  const SB_DOMAIN = cookieDomainFor(host)
  const sbSession = req.cookies.getAll().some((c) => isAuthTokenCookie(c.name))
  const localSession = req.cookies.has('zx_local_auth')
  if (!sbSession && !localSession) return []
  const out: CookieSet = []
  const base = { path: '/', sameSite: 'lax', secure: !isDev, httpOnly: true, ...(SB_DOMAIN ? { domain: SB_DOMAIN } : {}) }
  const sb =
    sbSession && SB_URL && SB_KEY
      ? createServerClient(SB_URL, SB_KEY, {
          cookieOptions: { domain: SB_DOMAIN, path: '/', sameSite: 'lax', secure: !isDev },
          cookies: {
            getAll: () => req.cookies.getAll(),
            setAll: (list) => {
              for (const c of list) {
                // The page rendering this request sees the fresh (or removed) token.
                if (c.value) req.cookies.set(c.name, c.value)
                else req.cookies.delete(c.name)
                out.push({ name: c.name, value: c.value, options: c.options as Record<string, unknown> })
              }
            },
          },
        })
      : null

  const now = Date.now()
  const seen = await readSeen(req.cookies.get(IDLE_COOKIE)?.value)
  if (seen === null || now - seen > PLAYER_IDLE_SECONDS * 1000) {
    // Idle too long (or no valid activity stamp): sign out here, before anything renders.
    try {
      await sb?.auth.signOut({ scope: 'local' })
    } catch {
      // Even if Supabase is unreachable the cookies below are removed.
    }
    for (const c of req.cookies.getAll()) {
      if (isAuthTokenCookie(c.name) || c.name === 'zx_local_auth') {
        req.cookies.delete(c.name)
        out.push({ name: c.name, value: '', options: { path: '/', maxAge: 0, ...(SB_DOMAIN && c.name !== 'zx_local_auth' ? { domain: SB_DOMAIN } : {}) } })
      }
    }
    out.push({ name: IDLE_COOKIE, value: '', options: { ...base, maxAge: 0 } })
    if (seen !== null) out.push({ name: IDLE_NOTICE_COOKIE, value: '1', options: { ...base, maxAge: 600 } })
    return out
  }
  if (sb) {
    try {
      await sb.auth.getClaims()
    } catch {
      // Auth outage or a malformed cookie: render signed-out rather than failing the page.
    }
  }
  if (now - seen > IDLE_TOUCH_MS) out.push({ name: IDLE_COOKIE, value: await signSeen(now), options: { ...base, maxAge: PLAYER_IDLE_SECONDS } })
  return out
}

function withCookies(res: NextResponse, set: CookieSet) {
  for (const c of set) res.cookies.set(c.name, c.value, c.options)
  return res
}

function csp(nonce: string) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval'` : ''}`,
    // Inline style attributes (motion) cannot carry a nonce.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    // Without JavaScript, the Google sign-in form posts here and is redirected to Supabase Auth.
    `form-action 'self'${SB_URL ? ` ${new URL(SB_URL).origin} https://accounts.google.com` : ''}`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

function withCsp(req: NextRequest, mode: 'path' | 'subdomain', surface: Surface, rewrite?: URL) {
  const nonce = btoa(crypto.randomUUID())
  const policy = csp(nonce)
  const headers = new Headers(req.headers)
  headers.set('x-nonce', nonce)
  headers.set('x-zenith-mode', mode)
  headers.set('x-zenith-surface', surface)
  headers.set('x-zenith-proxy-region', process.env.VERCEL_REGION ?? 'local')
  headers.set('Content-Security-Policy', policy)
  const res = rewrite ? NextResponse.rewrite(rewrite, { request: { headers } }) : NextResponse.next({ request: { headers } })
  res.headers.set('Content-Security-Policy', policy)
  return res
}

export async function proxy(req: NextRequest) {
  const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').toLowerCase()
  const { pathname, search } = req.nextUrl
  const target = surfaceForHost(host, ROOT)

  if (target === 'hisaab') {
    // Alias only. The ledger itself, its login and its session stay where they are.
    return NextResponse.redirect(`https://${hqHost(ROOT)}/hisaab/admin`, 307)
  }

  if (pathname === '/hisaab' || pathname.startsWith('/hisaab/')) {
    // Serve the ledger only from the root domain, untouched.
    if (target && target !== 'hq') return NextResponse.redirect(`https://${hqHost(ROOT)}/hisaab/admin`, 307)
    return NextResponse.next()
  }

  // The sign-in callback creates the session itself; everything else passes the idle gate.
  const auth = hasExtension(pathname) || pathname === '/auth/callback' ? [] : await authGate(req, host)

  // Not the production domain: path mode.
  if (target === null) return withCookies(withCsp(req, 'path', surfaceForPath(pathname)), auth)

  if (host.split(':')[0] === ROOT) return NextResponse.redirect(`https://${hqHost(ROOT)}${pathname}${search}`, 308)

  if (target === 'hq') {
    const owner = surfaceForPath(pathname)
    if (owner !== 'hq') {
      const rest = pathname.slice(SURFACES[owner].prefix.length) || '/'
      return NextResponse.redirect(`https://${SURFACES[owner].subdomain}.${ROOT}${rest}${search}`, 308)
    }
    return withCookies(withCsp(req, 'subdomain', 'hq'), auth)
  }

  // Product subdomain.
  const prefix = SURFACES[target].prefix
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return NextResponse.redirect(`https://${host}${pathname.slice(prefix.length) || '/'}${search}`, 308)
  }
  for (const other of PRODUCT_SURFACES) {
    const p = SURFACES[other].prefix
    if (other !== target && (pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.redirect(`https://${SURFACES[other].subdomain}.${ROOT}${pathname.slice(p.length) || '/'}${search}`, 308)
    }
  }
  // Shared files (brand assets, icons, robots.txt, sitemap.xml — the last two are host-aware) pass through.
  if (hasExtension(pathname) || pathname.startsWith('/media/')) return NextResponse.next()
  if (isShared(pathname)) return withCookies(withCsp(req, 'subdomain', target), auth)
  const url = req.nextUrl.clone()
  url.pathname = `${prefix}${pathname === '/' ? '' : pathname}`
  return withCookies(withCsp(req, 'subdomain', target, url), auth)
}

export const config = {
  // Images, video and fonts are served straight from the CDN without running the proxy.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:webp|png|jpe?g|gif|svg|ico|mp4|webm|woff2?)$).*)'],
}
