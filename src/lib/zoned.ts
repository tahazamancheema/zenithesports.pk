/** Wall-clock time in an IANA zone ⇄ UTC, without a date library. */

function offsetMinutes(utcMs: number, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return (asUtc - utcMs) / 60000
}

/** "2026-11-02T18:30" understood as wall-clock time in `tz` → Date (UTC). */
export function zonedToUtc(local: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!m) return null
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  // Two passes handle DST boundaries.
  let utc = guess - offsetMinutes(guess, tz) * 60000
  utc = guess - offsetMinutes(utc, tz) * 60000
  return new Date(utc)
}

/** Date → "YYYY-MM-DDTHH:mm" in `tz`, for <input type="datetime-local">. */
export function utcToZonedInput(d: Date | string | null | undefined, tz: string): string {
  if (!d) return ''
  const ms = new Date(d).getTime()
  const local = new Date(ms + offsetMinutes(ms, tz) * 60000)
  return local.toISOString().slice(0, 16)
}
