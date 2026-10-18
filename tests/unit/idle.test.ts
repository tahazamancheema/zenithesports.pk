import { describe, expect, it } from 'vitest'
import { isAuthTokenCookie, readSeen, signSeen } from '@/lib/idle'

describe('inactivity cookie', () => {
  it('round-trips a signed timestamp', async () => {
    const at = Date.now()
    expect(await readSeen(await signSeen(at, 's1'), 's1')).toBe(at)
  })

  it('rejects edits, other secrets and junk', async () => {
    const cookie = await signSeen(Date.now() - 3 * 3600_000, 's1')
    const [, sig] = cookie.split('.')
    // Moving the time forward to dodge the timeout breaks the signature.
    expect(await readSeen(`${Date.now()}.${sig}`, 's1')).toBeNull()
    expect(await readSeen(cookie, 's2')).toBeNull()
    expect(await readSeen('garbage', 's1')).toBeNull()
    expect(await readSeen(undefined, 's1')).toBeNull()
  })

  it('treats only Supabase session cookies as a sign-in', () => {
    expect(isAuthTokenCookie('sb-abcd-auth-token')).toBe(true)
    expect(isAuthTokenCookie('sb-abcd-auth-token.0')).toBe(true)
    expect(isAuthTokenCookie('sb-abcd-auth-token-code-verifier')).toBe(false)
    expect(isAuthTokenCookie('zx_seen')).toBe(false)
  })
})
