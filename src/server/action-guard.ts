import 'server-only'
import { checkFormToken, issueFormToken } from './crypto'
import { DatabaseUnavailableError } from './db'
import { consume, RateLimitError } from './rate-limit'
import { assertSameOrigin, ipHash, OriginError } from './request'

export type ActionState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  data?: Record<string, string>
  /** Echo of submitted text values so a failed submit never wipes the form. */
  values?: Record<string, string>
}
export const IDLE: ActionState = { status: 'idle' }

export { issueFormToken }

export class GuardError extends Error {}

/**
 * Every public form passes through here: same-origin check, honeypot,
 * signed timing token (rejects instant bot submits and stale pages), and a
 * per-IP rate limit stored in Postgres.
 */
export async function guardPublic(form: string, fd: FormData, limit: { max: number; windowSeconds: number }) {
  await assertSameOrigin()
  if (String(fd.get('website') ?? '') !== '') throw new GuardError('Your submission could not be accepted.')
  const token = checkFormToken(String(fd.get('_ft') ?? ''), form)
  // "Too fast" keeps what was typed: waiting a moment and submitting again is enough.
  if (token === 'too_fast') throw new GuardError('That was sent a little too quickly. Wait a moment and submit again.')
  if (token !== 'ok') throw new GuardError('This form has expired. Copy anything you typed, reload the page and try again.')
  const ip = await ipHash()
  await consume(`form:${form}:${ip}`, limit.max, limit.windowSeconds)
  return ip
}

/** Turn guard/infrastructure failures into a user-facing state; rethrow anything unexpected. */
export function failure(e: unknown, values?: Record<string, string>): ActionState {
  if (e instanceof GuardError || e instanceof OriginError) return { status: 'error', message: e.message, values }
  if (e instanceof RateLimitError) {
    const mins = Math.ceil(e.retryAfterSeconds / 60)
    return { status: 'error', message: `Too many submissions. Please try again in about ${mins} minute${mins === 1 ? '' : 's'}.`, values }
  }
  if (e instanceof DatabaseUnavailableError) return { status: 'error', message: 'This form is temporarily unavailable. Please try again later.', values }
  console.error('action failed', e instanceof Error ? e.message : e)
  return { status: 'error', message: 'Something went wrong on our side. Nothing was saved — please try again.', values }
}

/** Text fields only (files excluded), trimmed to a sane size, for re-populating forms. */
export function textValues(fd: FormData, skip: string[] = []) {
  const out: Record<string, string> = {}
  for (const [k, v] of fd.entries()) {
    if (typeof v === 'string' && !k.startsWith('$') && !k.startsWith('_') && !skip.includes(k)) out[k] = v.slice(0, 5000)
  }
  return out
}
