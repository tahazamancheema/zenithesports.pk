import { describe, expect, it } from 'vitest'
import { checkFormToken, issueFormToken } from '@/server/crypto'

describe('anti-spam form tokens', () => {
  it('accepts a human-paced submission', () => expect(checkFormToken(issueFormToken('contact', Date.now() - 5000), 'contact')).toBe('ok'))
  it('flags instant submissions as too fast (recoverable)', () => expect(checkFormToken(issueFormToken('contact'), 'contact')).toBe('too_fast'))
  it('expires stale pages', () => expect(checkFormToken(issueFormToken('contact', Date.now() - 7 * 3600_000), 'contact')).toBe('expired'))
  it('rejects tampering and form mix-ups', () => {
    const t = issueFormToken('contact', Date.now() - 5000)
    expect(checkFormToken(t.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a')), 'contact')).toBe('invalid')
    expect(checkFormToken(t, 'report')).toBe('invalid')
    expect(checkFormToken('', 'contact')).toBe('invalid')
  })
})
