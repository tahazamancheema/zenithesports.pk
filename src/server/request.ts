import 'server-only'
import { headers } from 'next/headers'
import { hmac } from './crypto'

export class OriginError extends Error {
  constructor() {
    super('This request did not come from this site.')
  }
}

/** First hop of x-forwarded-for (set by Vercel), falling back to x-real-ip. */
export async function clientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return fwd || h.get('x-real-ip') || '0.0.0.0'
}

/** IPs are never stored raw: a keyed hash is enough for rate limiting and abuse correlation. */
export async function ipHash(): Promise<string> {
  return hmac(`ip:${await clientIp()}`).slice(0, 40)
}

/**
 * Next.js rejects cross-origin Server Actions but lets requests with no Origin
 * header through. Every mutation calls this so a missing or foreign Origin fails.
 */
export async function assertSameOrigin() {
  const h = await headers()
  const origin = h.get('origin')
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!origin || !host) throw new OriginError()
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    throw new OriginError()
  }
  if (originHost !== host) throw new OriginError()
}

export async function requestHost(): Promise<string> {
  const h = await headers()
  return (h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost').toLowerCase()
}

export async function userAgent(): Promise<string> {
  return ((await headers()).get('user-agent') ?? '').slice(0, 200)
}
