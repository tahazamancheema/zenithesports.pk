import 'server-only'
import { cache } from 'react'
import { audit, type Actor } from '../audit'
import { db, hasDatabase } from '../db'
import { inspectImage, storeImage, UploadError } from '../files'

export type MediaItem = { id: string; product: string; title: string; caption: string | null; isAuthentic: boolean; fileId: string; published: boolean; sortOrder: number }
export type OrgMember = { id: string; name: string; roleTitle: string; bio: string | null; imageFileId: string | null; sortOrder: number; published: boolean }

export const listMedia = cache(async (product: 'production' | 'points' | 'home', includeDrafts = false): Promise<MediaItem[]> => {
  if (!hasDatabase()) return []
  return db()<MediaItem[]>`
    select id, product, title, caption, is_authentic, file_id, published, sort_order from zenith.product_media
     where product = ${product} and (${includeDrafts} or published) order by sort_order, created_at
  `
})

export const listOrgMembers = cache(async (includeDrafts = false): Promise<OrgMember[]> => {
  if (!hasDatabase()) return []
  return db()<OrgMember[]>`
    select id, name, role_title, bio, image_file_id, sort_order, published from zenith.org_members
     where ${includeDrafts} or published order by sort_order, name
  `
})

/** Public media may only be served when it is attached to published content. */
export async function isPublicFile(fileId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(fileId)) return false
  const [row] = await db()`
    select 1 where exists (select 1 from zenith.product_media where file_id = ${fileId} and published)
                or exists (select 1 from zenith.org_members where image_file_id = ${fileId} and published)
                or exists (select 1 from zenith.games where ${fileId}::uuid in (logo_file_id, cover_file_id))
                or exists (select 1 from zenith.tournaments where status in ('published', 'cancelled')
                             and ${fileId}::uuid in (poster_file_id, logo_file_id, organizer_logo_file_id))
                or exists (select 1 from zenith.tournament_sponsors s join zenith.tournaments t on t.id = s.tournament_id
                             where s.logo_file_id = ${fileId} and t.status in ('published', 'cancelled'))
  `
  return Boolean(row)
}

export async function addMedia(
  d: { product: 'production' | 'points' | 'home'; title: string; caption: string; isAuthentic: boolean; file: File | null },
  actor: Actor,
) {
  if (!d.title.trim()) throw new UploadError('Give the image a title.')
  const img = await inspectImage(d.file, { maxBytes: 4 * 1048576, label: 'Image' })
  await db().begin(async (tx) => {
    const fileId = await storeImage(tx, img, 'media')
    const [m] = await tx<{ id: string }[]>`
      insert into zenith.product_media (product, title, caption, is_authentic, file_id)
      values (${d.product}, ${d.title.trim().slice(0, 120)}, ${d.caption.trim().slice(0, 400) || null}, ${d.isAuthentic}, ${fileId}) returning id
    `
    await audit(tx, actor, 'media.added', { type: 'product_media', id: m.id }, { product: d.product, authentic: d.isAuthentic })
  })
}

export async function setMediaPublished(id: string, published: boolean, actor: Actor) {
  await db()`update zenith.product_media set published = ${published} where id = ${id}`
  await audit(db(), actor, published ? 'media.published' : 'media.unpublished', { type: 'product_media', id })
}

export async function saveOrgMember(
  id: string | null,
  d: { name: string; roleTitle: string; bio: string; published: boolean; sortOrder: number; file: File | null },
  actor: Actor,
) {
  if (!d.name.trim() || !d.roleTitle.trim()) throw new UploadError('Name and role are required.')
  await db().begin(async (tx) => {
    let imageId: string | null = null
    if (d.file && d.file.size > 0) imageId = await storeImage(tx, await inspectImage(d.file, { maxBytes: 3 * 1048576, label: 'Photo' }), 'media')
    if (id) {
      await tx`
        update zenith.org_members set name = ${d.name.trim()}, role_title = ${d.roleTitle.trim()}, bio = ${d.bio.trim() || null},
               published = ${d.published}, sort_order = ${d.sortOrder}, image_file_id = coalesce(${imageId}, image_file_id)
         where id = ${id}
      `
    } else {
      await tx`
        insert into zenith.org_members (name, role_title, bio, published, sort_order, image_file_id)
        values (${d.name.trim()}, ${d.roleTitle.trim()}, ${d.bio.trim() || null}, ${d.published}, ${d.sortOrder}, ${imageId})
      `
    }
    await audit(tx, actor, 'org_member.saved', { type: 'org_member', id })
  })
}

export async function deleteOrgMember(id: string, actor: Actor) {
  await db()`delete from zenith.org_members where id = ${id}`
  await audit(db(), actor, 'org_member.deleted', { type: 'org_member', id })
}
