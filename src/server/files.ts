import 'server-only'
import sharp from 'sharp'
import { sha256 } from './crypto'
import { db, type Db } from './db'

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp'

export class UploadError extends Error {}

const MAX_PIXELS = 40_000_000
const MAX_SIDE = 12_000

/** Identify the format from the bytes themselves — never the filename or the client's MIME claim. */
export function sniffImage(buf: Buffer): ImageMime | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

export type InspectedImage = { buf: Buffer; mime: ImageMime; width: number; height: number; sha256: string; size: number }

/**
 * Validates an uploaded image: allowed type by magic bytes, size cap, sane
 * dimensions, and a full decode (rejects truncated or polyglot files that
 * only look like images in their header).
 */
export async function inspectImage(
  file: File | null | undefined,
  opts: { maxBytes: number; accept?: readonly ImageMime[]; label: string },
): Promise<InspectedImage> {
  if (!file || typeof file === 'string' || file.size === 0) throw new UploadError(`${opts.label}: attach an image.`)
  if (file.size > opts.maxBytes) throw new UploadError(`${opts.label}: the file is larger than ${Math.round(opts.maxBytes / 1048576)} MB.`)
  const buf = Buffer.from(await file.arrayBuffer())
  const mime = sniffImage(buf)
  const accept = opts.accept ?? ['image/png', 'image/jpeg', 'image/webp']
  if (!mime || !accept.includes(mime)) throw new UploadError(`${opts.label}: upload a PNG, JPEG or WebP image.`)
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>
  try {
    const img = sharp(buf, { limitInputPixels: MAX_PIXELS, failOn: 'error' })
    meta = await img.metadata()
    const expected = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp' }[mime]
    if (meta.format !== expected) throw new Error('format mismatch')
    await img.clone().resize(32, 32, { fit: 'inside' }).raw().toBuffer()
  } catch {
    throw new UploadError(`${opts.label}: the image could not be read. It may be damaged.`)
  }
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (width < 64 || height < 64 || width > MAX_SIDE || height > MAX_SIDE) {
    throw new UploadError(`${opts.label}: the image dimensions are not supported.`)
  }
  return { buf, mime, width, height, sha256: sha256(buf), size: buf.length }
}

export async function storeImage(
  conn: Db,
  img: InspectedImage,
  purpose: 'evidence' | 'registration' | 'media' | 'branding',
  retentionDays?: number,
): Promise<string> {
  const [row] = await conn<{ id: string }[]>`
    insert into zenith.files (purpose, sha256, mime, size_bytes, width, height, data, retention_until)
    values (${purpose}, ${img.sha256}, ${img.mime}, ${img.size}, ${img.width}, ${img.height}, ${img.buf},
            ${retentionDays ? new Date(Date.now() + retentionDays * 86400_000) : null})
    returning id
  `
  return row.id
}

export async function readFileBytes(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const [row] = await db()<{ id: string; mime: string; data: Buffer | null; purpose: string; sha256: string }[]>`
    select id, mime, data, purpose, sha256 from zenith.files where id = ${id}
  `
  return row ?? null
}

/** Headers for serving a stored image: never sniffed, never scripted, never cached publicly. */
export function imageHeaders(mime: string, cache: 'private' | 'public' = 'private') {
  return {
    'Content-Type': mime,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    'Content-Disposition': 'inline',
    'Cache-Control': cache === 'private' ? 'private, no-store' : 'public, max-age=86400',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }
}
