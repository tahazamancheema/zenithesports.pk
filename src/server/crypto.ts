import 'server-only'
import { createHash, createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { appSecret } from './env'

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>

export const sha256 = (v: string | Buffer) => createHash('sha256').update(v).digest('hex')
export const hmac = (v: string) => createHmac('sha256', appSecret()).update(v).digest('hex')
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// No 0/O/1/I/L so references survive being read aloud or copied by hand.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export function referenceCode(prefix: 'ZR' | 'ZL' | 'ZA' | 'ZQ' | 'ZB' | 'ZC') {
  const pick = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `${prefix}-${pick()}-${pick()}`
}

// ─── passwords (scrypt) ─────────────────────────────────────────────────────

const N = 2 ** 15
const R = 8
const P = 1
const KEYLEN = 64
const MAXMEM = 96 * 1024 * 1024

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, n, r, p, saltB64, keyB64] = stored.split('$')
  if (alg !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64')
  const key = await scryptAsync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  })
  return timingSafeEqual(key, expected)
}

/** Burns the same time as a real verification when the account does not exist. */
let dummyHash: Promise<string> | undefined
export async function verifyAgainstDummy(password: string) {
  dummyHash ??= hashPassword('zenith-dummy-password-for-timing')
  await verifyPassword(password, await dummyHash)
  return false
}

// ─── signed form tokens (spam timing) ───────────────────────────────────────

/** Issued when a public form renders; proves the form was loaded and not instantly submitted. */
export function issueFormToken(form: string, now = Date.now()) {
  const payload = `${form}.${now}`
  return `${payload}.${hmac(payload).slice(0, 32)}`
}

export function checkFormToken(token: string | null | undefined, form: string, minMs = 2500, maxMs = 1000 * 60 * 60 * 6) {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== form) return false
  const issued = Number(parts[1])
  if (!Number.isFinite(issued)) return false
  if (!safeEqual(parts[2], hmac(`${parts[0]}.${parts[1]}`).slice(0, 32))) return false
  const age = Date.now() - issued
  return age >= minMs && age <= maxMs
}
