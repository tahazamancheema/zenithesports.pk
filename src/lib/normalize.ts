/** Normalisation shared by browser and server. The server is authoritative. */

export const normId = (v: string | null | undefined) => (v ?? '').replace(/\s+/g, '').toLowerCase() || null
export const normName = (v: string | null | undefined) => (v ?? '').trim().replace(/\s+/g, ' ').toLowerCase() || null
export const cleanText = (v: string | null | undefined) => (v ?? '').trim().replace(/\s+/g, ' ')

/**
 * Phone → E.164. Pakistani formats (03xx…, 3xx…, 92…, 0092…) are normalised to +92;
 * other numbers must be written with their country code.
 */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  let digits = trimmed.replace(/[^\d]/g, '')
  const hadPlus = trimmed.startsWith('+')
  if (!digits) return null
  if (!hadPlus) {
    if (digits.startsWith('00')) digits = digits.slice(2)
    else if (/^03\d{9}$/.test(digits)) digits = `92${digits.slice(1)}`
    else if (/^3\d{9}$/.test(digits)) digits = `92${digits}`
  }
  if (digits.startsWith('92') && !/^923\d{9}$/.test(digits) && !/^92[1-9]\d{7,9}$/.test(digits)) return null
  const e164 = `+${digits}`
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null
}

/** For admin screens that should not reveal a full number. */
export function maskPhone(e164: string | null | undefined) {
  if (!e164) return ''
  return `${e164.slice(0, 4)} ••• ${e164.slice(-3)}`
}

export function maskId(v: string | null | undefined) {
  if (!v) return ''
  if (v.length <= 4) return '••••'
  return `${v.slice(0, 2)}•••${v.slice(-3)}`
}

export const isEmail = (v: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(v)

export function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '')
}

/** Only http(s) links may be stored for public rendering. */
export function safeUrl(v: string | null | undefined): string | null {
  if (!v) return null
  try {
    const u = new URL(v.trim())
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}
