import { describe, expect, it } from 'vitest'
import { utcToZonedInput, zonedToUtc } from '@/lib/zoned'

describe('timezone conversion', () => {
  it('reads wall-clock time in Pakistan (UTC+5)', () => {
    expect(zonedToUtc('2026-11-02T18:30', 'Asia/Karachi')?.toISOString()).toBe('2026-11-02T13:30:00.000Z')
  })
  it('handles a DST zone on both sides of the change', () => {
    expect(zonedToUtc('2026-07-01T12:00', 'Europe/London')?.toISOString()).toBe('2026-07-01T11:00:00.000Z')
    expect(zonedToUtc('2026-12-01T12:00', 'Europe/London')?.toISOString()).toBe('2026-12-01T12:00:00.000Z')
  })
  it('round-trips for the editor', () => {
    const d = zonedToUtc('2026-11-02T18:30', 'Asia/Karachi')!
    expect(utcToZonedInput(d, 'Asia/Karachi')).toBe('2026-11-02T18:30')
  })
  it('rejects malformed input', () => expect(zonedToUtc('tomorrow', 'Asia/Karachi')).toBeNull())
})
