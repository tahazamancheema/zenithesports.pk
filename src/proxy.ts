import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PRODUCT_SURFACES, SURFACES, surfaceForHost, surfaceForPath, type Surface } from '@/lib/surfaces'

/**
 * Host → surface routing, canonical redirects and the per-request CSP nonce.
 *
 * Production (ROOT_DOMAIN and its subdomains):
 *   registrations.zenithesports.pk/t/x   → rewrite → /registrations/t/x
 *   zenithesports.pk/registrations/t/x   → 308     → registrations.zenithesports.pk/t/x
 *   hisaab.zenithesports.pk/*            → 307     → zenithesports.pk/hisaab/admin
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
const SB_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || (isDev ? undefined : `.${ROOT}`)

type CookieSet = { name: string; value: string; options: Record<string, unknown> }[]

/**
 * Keeps a Supabase session fresh: when the access token has expired it is
 * refreshed once here (server components cannot write cookies). Runs only
 * when an auth cookie is present, so anonymous traffic pays nothing.
 */
async function refreshAuth(req: NextRequest): Promise<CookieSet> {
  if (!SB_URL || !SB_KEY || !req.cookies.getAll().some((c) => c.name.startsWith('sb-'))) return []
  const out: CookieSet = []
  const sb = createServerClient(SB_URL, SB_KEY, {
    cookieOptions: { domain: SB_DOMAIN, path: '/', sameSite: 'lax', secure: !isDev },
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const c of list) {
          req.cookies.set(c.name, c.value) // the page rendering this request sees the fresh token
          out.push({ name: c.name, value: c.value, options: c.options as Record<string, unknown> })
        }
      },
    },
  })
  try {
    await sb.auth.getClaims()
  } catch {
    // Auth outage or a malformed cookie: render signed-out rather than failing the page.
  }
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
    return NextResponse.redirect(`https://${ROOT}/hisaab/admin`, 307)
  }

  if (pathname === '/hisaab' || pathname.startsWith('/hisaab/')) {
    // Serve the ledger only from the root domain, untouched.
    if (target && target !== 'hq') return NextResponse.redirect(`https://${ROOT}/hisaab/admin`, 307)
    return NextResponse.next()
  }

  const auth = hasExtension(pathname) ? [] : await refreshAuth(req)

  // Not the production domain: path mode.
  if (target === null) return withCookies(withCsp(req, 'path', surfaceForPath(pathname)), auth)

  if (host.startsWith('www.')) return NextResponse.redirect(`https://${ROOT}${pathname}${search}`, 308)

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
