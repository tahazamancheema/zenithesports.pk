/**
 * Player sign-ins end after a period without activity. The time of the last
 * request is kept in a signed cookie that the proxy checks and refreshes; the
 * signature stops anyone extending a session by editing it. Web Crypto only,
 * so the same code runs in the proxy and in server actions.
 */
export const IDLE_COOKIE = 'zx_seen'
export const IDLE_NOTICE_COOKIE = 'zx_idle'
export const PLAYER_IDLE_SECONDS = 2 * 60 * 60
/** Refresh the cookie at most this often, to avoid a Set-Cookie on every request. */
export const IDLE_TOUCH_MS = 60_000

const DEV_SECRET = 'local-development-secret-not-for-production-use'
export const idleSecret = () => process.env.APP_SECRET || DEV_SECRET

const enc = new TextEncoder()
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')

async function mac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(`idle:${value}`)))
}

export async function signSeen(at: number, secret = idleSecret()) {
  return `${at}.${await mac(String(at), secret)}`
}

/** The verified last-activity time, or null when missing or tampered with. */
export async function readSeen(cookie: string | undefined, secret = idleSecret()): Promise<number | null> {
  if (!cookie) return null
  const [at, sig] = cookie.split('.')
  if (!/^\d{13}$/.test(at ?? '') || !sig) return null
  const expected = await mac(at, secret)
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0 ? Number(at) : null
}

/** Supabase session cookies (not the short-lived PKCE verifier used during sign-in). */
export const isAuthTokenCookie = (name: string) => /^sb-[a-z0-9-]+-auth-token(\.\d+)?$/i.test(name) && !name.includes('code-verifier')
