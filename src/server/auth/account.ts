import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { db, hasDatabase } from '../db'
import { appSecret, env, isProd } from '../env'

/**
 * Player (and staff) identity through Supabase Auth — Google or email.
 *
 * Every Supabase call runs on the server (server actions and the /auth/callback
 * route), so the browser never talks to Supabase directly and the strict CSP
 * stays unchanged. Session cookies are scoped to the parent domain so one
 * sign-in works on every Zenith subdomain. Console access is still a separate,
 * per-console session (see ./session.ts) that a signed-in staff member opts
 * into explicitly.
 *
 * Local development without a Supabase project can use a signed test cookie
 * (LOCAL_DEV_AUTH=1) — only when Supabase is not configured and the database is
 * on this machine, so it can never be enabled against a real deployment.
 */

export type Account = {
  id: string
  email: string
  emailVerified: boolean
  displayName: string | null
  avatarUrl: string | null
  provider: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY)

export function localAuthEnabled() {
  if (supabaseConfigured() || process.env.LOCAL_DEV_AUTH !== '1' || !env.DATABASE_URL) return false
  try {
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(new URL(env.DATABASE_URL).hostname)
  } catch {
    return false
  }
}

/** Parent-domain cookies in production (`.zenithesports.pk`); host-only elsewhere. */
function cookieDomain() {
  if (process.env.AUTH_COOKIE_DOMAIN) return process.env.AUTH_COOKIE_DOMAIN
  return isProd ? `.${env.ROOT_DOMAIN}` : undefined
}

export async function supabaseServer() {
  if (!supabaseConfigured()) throw new Error('Sign-in is not configured.')
  const jar = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: { domain: cookieDomain(), path: '/', sameSite: 'lax', secure: isProd },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const c of list) jar.set(c.name, c.value, c.options)
        } catch {
          // Server components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  })
}

// ─── local test sign-in ─────────────────────────────────────────────────────

const LOCAL_COOKIE = 'zx_local_auth'
const sign = (v: string) => createHmac('sha256', appSecret()).update(`local-auth:${v}`).digest('base64url')

/** Deterministic UUID for a local test email (never collides with Supabase ids in practice). */
function localId(email: string) {
  const h = createHash('sha256').update(`zenith-local:${email}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export async function localSignIn(emailRaw: string, name: string) {
  if (!localAuthEnabled()) throw new Error('Local sign-in is disabled.')
  const email = emailRaw.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  const payload = Buffer.from(JSON.stringify({ email, name: name.trim().slice(0, 80) || null, exp: Date.now() + 7 * 86400_000 })).toString('base64url')
  ;(await cookies()).set(LOCAL_COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: 'lax', path: '/', secure: false, maxAge: 7 * 86400 })
}

async function readLocal(): Promise<Account | null> {
  const raw = (await cookies()).get(LOCAL_COOKIE)?.value
  if (!raw) return null
  const [payload, sig] = raw.split('.')
  if (!payload || !sig) return null
  const a = Buffer.from(sig)
  const b = Buffer.from(sign(payload))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const d = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email: string; name: string | null; exp: number }
  if (d.exp < Date.now()) return null
  return { id: localId(d.email), email: d.email, emailVerified: true, displayName: d.name, avatarUrl: null, provider: 'local' }
}

// ─── the signed-in account ──────────────────────────────────────────────────

async function sync(a: Account): Promise<Account | null> {
  if (!hasDatabase()) return a
  const [row] = await db()<{ status: string }[]>`
    insert into zenith.accounts (id, email, email_verified, display_name, avatar_url, provider)
    values (${a.id}, ${a.email}, ${a.emailVerified}, ${a.displayName}, ${a.avatarUrl}, ${a.provider})
    on conflict (id) do update
       set email = excluded.email,
           email_verified = excluded.email_verified,
           display_name = coalesce(excluded.display_name, zenith.accounts.display_name),
           avatar_url = coalesce(excluded.avatar_url, zenith.accounts.avatar_url),
           provider = excluded.provider,
           last_seen_at = now()
    returning status
  `
  return row?.status === 'active' ? a : null
}

const safeAvatar = (v: unknown) => (typeof v === 'string' && v.startsWith('https://') && v.length <= 500 ? v : null)

/** The verified account for this request, or null. Cached per request. */
export const getAccount = cache(async (): Promise<Account | null> => {
  if (supabaseConfigured()) {
    const sb = await supabaseServer()
    // getUser() asks Supabase Auth to validate the token — never trust the cookie alone.
    const { data } = await sb.auth.getUser()
    const u = data.user
    if (!u?.email) return null
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>
    const name = [meta.full_name, meta.name].find((x) => typeof x === 'string' && x.trim()) as string | undefined
    return sync({
      id: u.id,
      email: u.email.toLowerCase(),
      emailVerified: Boolean(u.email_confirmed_at),
      displayName: name?.trim().slice(0, 80) ?? null,
      avatarUrl: safeAvatar(meta.avatar_url ?? meta.picture),
      provider: typeof u.app_metadata?.provider === 'string' ? u.app_metadata.provider : null,
    })
  }
  if (localAuthEnabled()) {
    const a = await readLocal()
    return a ? sync(a) : null
  }
  return null
})

export const authAvailable = () => supabaseConfigured() || localAuthEnabled()

/** Same-site relative path only — never an open redirect. */
export function safeNext(v: string | null | undefined, fallback = '/account') {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || v.length > 300) return fallback
  return v
}

/** For pages that need a signed-in player: bounce to /login and come back. */
export async function requireAccount(next: string) {
  const a = await getAccount()
  if (!a) redirect(`/login?next=${encodeURIComponent(safeNext(next))}`)
  return a
}

export async function signOutEverywhere() {
  if (supabaseConfigured()) await (await supabaseServer()).auth.signOut({ scope: 'local' })
  ;(await cookies()).delete(LOCAL_COOKIE)
}
