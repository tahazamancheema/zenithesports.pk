import 'server-only'
import { audit, type Actor } from '../audit'
import { db } from '../db'
import { inspectImage, storeImage, UploadError } from '../files'

const MAX = 4 * 1024 * 1024
const UUID = /^[0-9a-f-]{36}$/i

export type TournamentImageSlot = 'poster' | 'logo' | 'organizer_logo'
const COLUMN: Record<TournamentImageSlot, string> = { poster: 'poster_file_id', logo: 'logo_file_id', organizer_logo: 'organizer_logo_file_id' }
const LABEL: Record<TournamentImageSlot, string> = { poster: 'Poster', logo: 'Tournament logo', organizer_logo: 'Organiser logo' }

const attached = (f: File | null | undefined): f is File => Boolean(f && typeof f !== 'string' && f.size > 0)

/** Replace (or, with no file, remove) one of a tournament's images. */
export async function setTournamentImage(id: string, slot: TournamentImageSlot, file: File | null, actor: Actor) {
  if (!UUID.test(id) || !(slot in COLUMN)) throw new Error('Unknown tournament image.')
  const img = attached(file) ? await inspectImage(file, { maxBytes: MAX, label: LABEL[slot] }) : null
  if (img && slot === 'poster' && img.width < img.height * 1.2) throw new UploadError('Poster: use a landscape image (16:9 works best).')
  await db().begin(async (tx) => {
    const fileId = img ? await storeImage(tx, img, 'branding') : null
    const [row] = await tx<{ id: string }[]>`update zenith.tournaments set ${tx({ [COLUMN[slot]]: fileId } as never)} where id = ${id} returning id`
    if (!row) throw new Error('Tournament not found.')
    await audit(tx, actor, fileId ? 'tournament.image_set' : 'tournament.image_removed', { type: 'tournament', id }, { slot })
  })
}

export async function setTournamentPresentation(id: string, d: { organizerName: string; featured: boolean }, actor: Actor) {
  const name = d.organizerName.trim().slice(0, 80) || 'Zenith Esports'
  await db().begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      update zenith.tournaments set organizer_name = ${name}, featured = ${d.featured} where id = ${id} returning id
    `
    if (!row) throw new Error('Tournament not found.')
    await audit(tx, actor, 'tournament.presentation_updated', { type: 'tournament', id }, { featured: d.featured })
  })
}

const TIERS = ['title', 'presenting', 'partner', 'media'] as const

export async function addSponsor(tournamentId: string, d: { name: string; tier: string; url: string; logo: File | null }, actor: Actor) {
  const name = d.name.trim()
  if (!name || name.length > 80) throw new Error('Give the sponsor a name (up to 80 characters).')
  const tier = (TIERS as readonly string[]).includes(d.tier) ? d.tier : 'partner'
  let url: string | null = null
  if (d.url.trim()) {
    try {
      const u = new URL(d.url.trim())
      if (u.protocol !== 'https:') throw new Error()
      url = u.toString().slice(0, 300)
    } catch {
      throw new Error('Sponsor link must be a full https:// address.')
    }
  }
  const img = attached(d.logo) ? await inspectImage(d.logo, { maxBytes: MAX, label: 'Sponsor logo' }) : null
  await db().begin(async (tx) => {
    const fileId = img ? await storeImage(tx, img, 'branding') : null
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from zenith.tournament_sponsors where tournament_id = ${tournamentId}`
    if (n >= 12) throw new Error('A tournament can list up to 12 sponsors.')
    const [s] = await tx<{ id: string }[]>`
      insert into zenith.tournament_sponsors (tournament_id, name, tier, url, logo_file_id, sort_order)
      values (${tournamentId}, ${name}, ${tier}, ${url}, ${fileId}, ${n}) returning id
    `
    await audit(tx, actor, 'tournament.sponsor_added', { type: 'tournament', id: tournamentId }, { sponsor: s.id, name })
  })
}

export async function removeSponsor(sponsorId: string, actor: Actor) {
  if (!UUID.test(sponsorId)) throw new Error('Unknown sponsor.')
  await db().begin(async (tx) => {
    const [s] = await tx<{ tournamentId: string; name: string }[]>`
      delete from zenith.tournament_sponsors where id = ${sponsorId} returning tournament_id, name
    `
    if (!s) throw new Error('Sponsor not found.')
    await audit(tx, actor, 'tournament.sponsor_removed', { type: 'tournament', id: s.tournamentId }, { name: s.name })
  })
}

/** Official logo / cover art and accent colour for a game. */
export async function setGameBranding(
  gameId: string,
  d: { accent: string; logo: File | null; cover: File | null; removeLogo: boolean; removeCover: boolean },
  actor: Actor,
) {
  const accent = d.accent.trim()
  if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) throw new Error('Accent must be a colour like #FFAA00.')
  const logo = attached(d.logo) ? await inspectImage(d.logo, { maxBytes: MAX, label: 'Game logo' }) : null
  const cover = attached(d.cover) ? await inspectImage(d.cover, { maxBytes: MAX, label: 'Cover art' }) : null
  await db().begin(async (tx) => {
    const set: Record<string, unknown> = { accent: accent || null }
    if (logo) set.logo_file_id = await storeImage(tx, logo, 'branding')
    else if (d.removeLogo) set.logo_file_id = null
    if (cover) set.cover_file_id = await storeImage(tx, cover, 'branding')
    else if (d.removeCover) set.cover_file_id = null
    const [row] = await tx<{ id: string }[]>`update zenith.games set ${tx(set as never)} where id = ${gameId} returning id`
    if (!row) throw new Error('Game not found.')
    await audit(tx, actor, 'game.branding_updated', { type: 'game', id: null }, { game: gameId, logo: Boolean(logo), cover: Boolean(cover) })
  })
}
