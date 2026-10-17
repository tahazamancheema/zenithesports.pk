import 'server-only'
import { db, type Db } from './db'

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super('Too many attempts. Please wait a little and try again.')
  }
}

/**
 * Fixed-window counter stored in Postgres, so the limit holds across every
 * serverless instance. Returns the remaining budget; throws when exhausted.
 */
export async function consume(key: string, limit: number, windowSeconds: number, conn: Db = db()) {
  const [row] = await conn<{ count: number; window_start: Date }[]>`
    insert into zenith.rate_limits as r (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when r.window_start < now() - make_interval(secs => ${windowSeconds}) then 1 else r.count + 1 end,
      window_start = case when r.window_start < now() - make_interval(secs => ${windowSeconds}) then now() else r.window_start end
    returning count, window_start
  `
  if (row.count > limit) {
    const elapsed = (Date.now() - new Date(row.window_start).getTime()) / 1000
    throw new RateLimitError(Math.max(1, Math.ceil(windowSeconds - elapsed)))
  }
  return limit - row.count
}

export async function resetLimit(key: string, conn: Db = db()) {
  await conn`delete from zenith.rate_limits where key = ${key}`
}
