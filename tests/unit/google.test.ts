import { describe, expect, it } from 'vitest'
import { finalUrl, redirectUri } from '@/server/auth/google'

const pending = (origin: string, next = '/account') => ({ state: 's', nonce: 'n', verifier: 'v', next, origin, exp: Date.now() + 60_000 })

describe('Google sign-in on our own domain', () => {
  it('uses one registered redirect URI for every production host', () => {
    for (const o of ['https://zenithesports.pk', 'https://www.zenithesports.pk', 'https://registrations.zenithesports.pk', 'https://anticheat.zenithesports.pk']) {
      expect(redirectUri(o)).toBe('https://www.zenithesports.pk/auth/google')
    }
    expect(redirectUri('http://localhost:3000')).toBe('http://localhost:3000/auth/google')
  })

  it('returns to the page and host the person started from', () => {
    expect(finalUrl(pending('https://registrations.zenithesports.pk', '/t/cup/register'))).toBe('https://registrations.zenithesports.pk/t/cup/register')
    expect(finalUrl(pending('https://www.zenithesports.pk'))).toBe('https://www.zenithesports.pk/account')
  })

  it('never sends anyone to a host that is not ours', () => {
    expect(finalUrl(pending('https://zenithesports.pk.evil.example', '/account'))).toBe('/account')
    expect(finalUrl(pending('https://evilzenithesports.pk', '/account'))).toBe('/account')
  })
})
