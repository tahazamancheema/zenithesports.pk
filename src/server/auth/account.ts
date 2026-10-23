import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { db, hasDatabase } from '../db'
import { requestHost } from '../request'
import { IDLE_COOKIE, IDLE_NOTICE_COOKIE, PLAYER_IDLE_SECONDS, signSeen } from '@/lib/idle'
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
  /** Identity providers on this account (e.g. ['google', 'email']). */
  providers: string[]
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

/** Parent-domain cookies on the production domain (one sign-in for every subdomain); host-only elsewhere. */
async function cookieDomain() {
  if (process.env.AUTH_COOKIE_DOMAIN) return process.env.AUTH_COOKIE_DOMAIN
  const host = (await requestHost()).split(':')[0]
  return host === env.ROOT_DOMAIN || host.endsWith(`.${env.ROOT_DOMAIN}`) ? `.${env.ROOT_DOMAIN}` : undefined
}

export async function supabaseServer() {
  if (!supabaseConfigured()) throw new Error('Sign-in is not configured.')
  const jar = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: { domain: await cookieDomain(), path: '/', sameSite: 'lax', secure: isProd },
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
  await markActive()
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
  return { id: localId(d.email), email: d.email, emailVerified: true, displayName: d.name, avatarUrl: null, provider: 'local', providers: ['local'] }
}

// ─── the signed-in account ──────────────────────────────────────────────────

async function sync(a: Account): Promise<Account | null> {
  if (!hasDatabase()) return a
  const [row] = await db()<{ status: string }[]>`
    insert into zenith.accounts (id, email, email_verified, display_name, avatar_url, provider)
    values (${a.id}, ${a.email}, ${a.emailVerified}, ${a.displayName}, ${a.avatarUrl}, ${a.provider})
    on conflict (id) do update
       set email = excluded.email,
           email_verified = zenith.accounts.email_verified or excluded.email_verified,
           display_name = coalesce(excluded.display_name, zenith.accounts.display_name),
           avatar_url = coalesce(excluded.avatar_url, zenith.accounts.avatar_url),
           provider = excluded.provider,
           last_seen_at = now()
    returning status
  `
  return row?.status === 'active' ? a : null
}

const safeAvatar = (v: unknown) => (typeof v === 'string' && v.startsWith('https://') && v.length <= 500 ? v : null)

const providersOf = (appMeta: Record<string, unknown> | undefined, extra: string[] = []) => [
  ...new Set([...(Array.isArray(appMeta?.providers) ? (appMeta.providers as unknown[]).filter((x): x is string => typeof x === 'string') : []), ...extra]),
]

function fromMetadata(id: string, email: string, emailVerified: boolean, meta: Record<string, unknown>, appMeta: Record<string, unknown> | undefined, extraProviders: string[] = []): Account {
  const name = [meta.full_name, meta.name].find((x) => typeof x === 'string' && x.trim()) as string | undefined
  return {
    id,
    email: email.toLowerCase(),
    emailVerified,
    displayName: name?.trim().slice(0, 80) ?? null,
    avatarUrl: safeAvatar(meta.avatar_url ?? meta.picture),
    provider: typeof appMeta?.provider === 'string' ? appMeta.provider : null,
    providers: providersOf(appMeta, extraProviders),
  }
}

/**
 * The signed-in account for this request, or null. Cached per request.
 * The session token's signature is checked locally against the project's
 * published (asymmetric) signing keys, so pages pay no network round trip;
 * getClaims falls back to asking Supabase Auth if the keys are symmetric.
 */
export const getAccount = cache(async (): Promise<Account | null> => {
  if (supabaseConfigured()) {
    const sb = await supabaseServer()
    const { data, error } = await sb.auth.getClaims()
    const c = data?.claims
    if (error || !c?.sub || typeof c.email !== 'string' || !c.email) return null
    const meta = (c.user_metadata ?? {}) as Record<string, unknown>
    return sync(fromMetadata(c.sub, c.email, meta.email_verified === true, meta, c.app_metadata as Record<string, unknown> | undefined))
  }
  if (localAuthEnabled()) {
    const a = await readLocal()
    return a ? sync(a) : null
  }
  return null
})

/**
 * Like getAccount, but asks Supabase Auth itself (current email-confirmation
 * state, linked identities, revoked sessions). Used before granting anything.
 */
export const getVerifiedAccount = cache(async (): Promise<Account | null> => {
  if (supabaseConfigured()) {
    const { data } = await (await supabaseServer()).auth.getUser()
    const u = data.user
    if (!u?.email) return null
    return sync(
      fromMetadata(u.id, u.email, Boolean(u.email_confirmed_at), (u.user_metadata ?? {}) as Record<string, unknown>, u.app_metadata, (u.identities ?? []).map((i) => i.provider)),
    )
  }
  return getAccount()
})

/** Stamps the activity cookie when a session starts (the proxy keeps it fresh afterwards). */
export async function markActive() {
  const jar = await cookies()
  jar.set(IDLE_COOKIE, await signSeen(Date.now()), { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: PLAYER_IDLE_SECONDS, domain: await cookieDomain() })
  jar.delete(IDLE_NOTICE_COOKIE)
}

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
  const jar = await cookies()
  jar.delete(LOCAL_COOKIE)
  jar.delete(IDLE_COOKIE)
}
