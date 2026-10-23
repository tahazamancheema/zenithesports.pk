import 'server-only'
import { cookies } from 'next/headers'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { appSecret, env, isProd } from '../env'
import { cookieDomain, safeNext } from './account'

/**
 * Google sign-in that returns to our own domain, so Google's account chooser
 * says "continue to zenithesports.pk" (or the app name, once the consent
 * screen's branding is verified) instead of the sign-in project's
 * supabase.co address. We run the OAuth code flow (state, nonce and PKCE),
 * then hand Google's ID token to Supabase, which verifies it and opens the
 * same session as before.
 *
 * Needs GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (the OAuth client already set
 * on the Supabase Google provider) and this redirect URI on that client:
 *   https://www.<ROOT_DOMAIN>/auth/google
 */

const COOKIE = 'zx_google'
const TTL_SECONDS = 600

export const googleDirect = () => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

const b64url = (b: Buffer) => b.toString('base64url')
const sign = (v: string) => createHmac('sha256', appSecret()).update(`google-oauth:${v}`).digest('base64url')

/** Production hosts share one redirect URI on www; anything else (previews, local) uses its own origin. */
export function redirectUri(origin: string) {
  const host = new URL(origin).hostname
  const ours = host === env.ROOT_DOMAIN || host.endsWith(`.${env.ROOT_DOMAIN}`)
  return ours ? `https://www.${env.ROOT_DOMAIN}/auth/google` : `${origin}/auth/google`
}

type Pending = { state: string; nonce: string; verifier: string; next: string; origin: string; exp: number }

/** Starts sign-in: remembers the attempt in a signed, short-lived cookie and returns Google's URL. */
export async function googleAuthUrl(origin: string, nextRaw: string) {
  const pending: Pending = {
    state: b64url(randomBytes(24)),
    nonce: b64url(randomBytes(24)),
    verifier: b64url(randomBytes(48)),
    next: safeNext(nextRaw),
    origin,
    exp: Date.now() + TTL_SECONDS * 1000,
  }
  const payload = b64url(Buffer.from(JSON.stringify(pending)))
  ;(await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax', // sent on Google's top-level redirect back to us
    path: '/auth/google',
    maxAge: TTL_SECONDS,
    domain: await cookieDomain(),
  })
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state: pending.state,
    // Google puts the hashed nonce in the ID token; Supabase is given the raw one and compares.
    nonce: createHash('sha256').update(pending.nonce).digest('hex'),
    code_challenge: b64url(createHash('sha256').update(pending.verifier).digest()),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

/** Reads and clears the pending attempt; null when missing, forged, expired or for another state. */
export async function takePending(state: string | null): Promise<Pending | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  jar.set(COOKIE, '', { path: '/auth/google', maxAge: 0, domain: await cookieDomain() })
  if (!raw || !state) return null
  const [payload, sig] = raw.split('.')
  if (!payload || !sig) return null
  const a = Buffer.from(sig)
  const b = Buffer.from(sign(payload))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const p = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Pending
  if (p.exp < Date.now()) return null
  const s1 = Buffer.from(p.state)
  const s2 = Buffer.from(state)
  if (s1.length !== s2.length || !timingSafeEqual(s1, s2)) return null
  return p
}

/** Exchanges the authorisation code for Google's ID token. */
export async function exchangeCode(code: string, p: Pending): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(p.origin),
      grant_type: 'authorization_code',
      code_verifier: p.verifier,
    }),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const body = (await res.json()) as { id_token?: string }
  return body.id_token ?? null
}

/** Where to land after sign-in: the page on the host the person started from (ours only). */
export function finalUrl(p: Pending) {
  const host = new URL(p.origin).hostname
  const ours = host === env.ROOT_DOMAIN || host.endsWith(`.${env.ROOT_DOMAIN}`) || host === 'localhost' || host === '127.0.0.1'
  return ours ? new URL(p.next, p.origin).toString() : p.next
}
