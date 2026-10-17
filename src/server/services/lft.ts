import 'server-only'
import { cleanText, normId, toE164 } from '@/lib/normalize'
import { audit, PUBLIC_ACTOR, type Actor } from '../audit'
import { randomToken, referenceCode, sha256 } from '../crypto'
import { db, isUniqueViolation } from '../db'
import { getGame, getFormats } from './catalog'
import { linkPhone, upsertPlayer } from './identity'

export type LftPublic = {
  id: string
  ign: string
  roles: string[]
  rankLabel: string | null
  city: string | null
  availability: string | null
  bio: string | null
  createdAt: Date
}

export const LFT_ROLES: Record<string, string[]> = {
  valorant: ['duelist', 'initiator', 'controller', 'sentinel', 'flex', 'igl'],
  'honor-of-kings': ['clash-lane', 'jungle', 'mid-lane', 'farm-lane', 'roam', 'flex'],
}

/** Public board: no UID, no contact details, no player id. */
export async function listLft(gameId: string): Promise<LftPublic[]> {
  return db()<LftPublic[]>`
    select id, ign, roles, rank_label, city, availability, bio, created_at
      from zenith.lft_profiles where game_id = ${gameId} and status = 'active'
     order by created_at desc limit 200
  `
}

export async function createLftProfile(raw: Record<string, string | string[]>, ipHash: string) {
  const s = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '')
  const game = await getGame(s('gameId'))
  const formats = await getFormats()
  if (!game || !formats.some((f) => f.gameId === game.id && f.code === 'lft' && f.enabled)) {
    return { ok: false as const, error: 'Looking for Team is not open for this game.' }
  }
  const fe: Record<string, string> = {}
  const ign = cleanText(s('ign'))
  if (ign.length < 2 || ign.length > 40) fe.ign = 'In-game name must be 2–40 characters.'
  const uid = s('uid').trim()
  if (!new RegExp(game.uidPattern).test(uid)) fe.uid = `Enter a valid ${game.uidLabel}.`
  const allowed = LFT_ROLES[game.id] ?? []
  const roles = (Array.isArray(raw.roles) ? raw.roles : [raw.roles]).filter((r): r is string => typeof r === 'string' && allowed.includes(r))
  if (!roles.length) fe.roles = 'Pick at least one role.'
  const phone = s('phone').trim() ? toE164(s('phone')) : null
  if (s('phone').trim() && !phone) fe.phone = 'Enter a valid number or leave it empty.'
  const discord = cleanText(s('discord')).slice(0, 40) || null
  if (!phone && !discord) fe.phone = 'Add a WhatsApp number or Discord so teams can reach you once you accept.'
  if (s('consent') !== 'on') fe.consent = 'You need to agree to be listed.'
  if (Object.keys(fe).length) return { ok: false as const, error: 'Please fix the highlighted fields.', fieldErrors: fe }

  const token = randomToken(24)
  const reference = referenceCode('ZL')
  try {
    await db().begin(async (tx) => {
      const playerId = await upsertPlayer(tx, { gameId: game.id, uidKind: game.uidKind, uidRaw: uid, ign, source: 'lft' })
      if (phone) await linkPhone(tx, playerId, phone, 'lft')
      const [row] = await tx<{ id: string }[]>`
        insert into zenith.lft_profiles
          (reference, game_id, player_id, ign, game_uid_raw, game_uid_norm, roles, rank_label, city, availability, bio,
           contact_phone_e164, contact_discord, consent_listing, manage_token_hash, ip_hash)
        values
          (${reference}, ${game.id}, ${playerId}, ${ign}, ${uid}, ${normId(uid)}, ${roles},
           ${cleanText(s('rank')).slice(0, 40) || null}, ${cleanText(s('city')).slice(0, 60) || null},
           ${cleanText(s('availability')).slice(0, 120) || null}, ${s('bio').trim().slice(0, 400) || null},
           ${phone}, ${discord}, true, ${sha256(token)}, ${ipHash})
        returning id
      `
      // LFT listings are matched against flags too.
      const flags = await tx<{ flagId: string }[]>`
        select distinct i.flag_id from zenith.ac_flag_identifiers i join zenith.ac_flags f on f.id = i.flag_id and f.status = 'active'
         where f.game_id = ${game.id} and ((i.kind = 'game_uid' and i.value_norm = ${normId(uid)}) or (i.kind = 'phone' and i.value_norm = ${phone}))
      `
      for (const f of flags) await tx`select * from zenith.ac_scan_flag(${f.flagId}, null, null)`
      await audit(tx, { ...PUBLIC_ACTOR, surface: 'registrations', ipHash }, 'lft.created', { type: 'lft_profile', id: row.id })
      await tx`select zenith.emit('registrations', 'lft.created', ${row.id}::uuid, '{}'::jsonb)`
    })
  } catch (e) {
    if (isUniqueViolation(e, 'lft_profiles_active_uid')) return { ok: false as const, error: 'This player already has an active listing.' }
    throw e
  }
  return { ok: true as const, reference, token }
}

export async function getLftByToken(token: string) {
  if (!token || token.length < 20 || token.length > 64) return null
  const [p] = await db()<{ id: string; reference: string; gameId: string; ign: string; status: string; roles: string[]; createdAt: Date }[]>`
    select id, reference, game_id, ign, status, roles, created_at from zenith.lft_profiles where manage_token_hash = ${sha256(token)}
  `
  if (!p) return null
  const requests = await db()<{ id: string; requesterName: string; teamName: string | null; message: string | null; status: string; createdAt: Date }[]>`
    select id, requester_name, team_name, message, status, created_at from zenith.lft_requests where profile_id = ${p.id} order by created_at desc
  `
  return { ...p, requests }
}

export async function setLftStatusByToken(token: string, status: 'active' | 'matched' | 'withdrawn') {
  const p = await getLftByToken(token)
  if (!p || p.status === 'hidden') return false
  try {
    await db()`update zenith.lft_profiles set status = ${status} where id = ${p.id}`
  } catch (e) {
    if (isUniqueViolation(e)) return false
    throw e
  }
  await audit(db(), { ...PUBLIC_ACTOR, label: 'player' }, 'lft.status', { type: 'lft_profile', id: p.id }, { status })
  return true
}

/** A captain asks to contact a listed player. The player decides; nothing is revealed until they accept. */
export async function requestContact(raw: Record<string, string>, ipHash: string) {
  const fe: Record<string, string> = {}
  const name = cleanText(raw.name)
  if (name.length < 2 || name.length > 60) fe.name = 'Tell the player your name.'
  const contact = cleanText(raw.contact)
  if (contact.length < 4 || contact.length > 80) fe.contact = 'Add a WhatsApp number, Discord or email the player can use.'
  const message = (raw.message ?? '').trim().slice(0, 500) || null
  if (Object.keys(fe).length) return { ok: false as const, error: 'Please fix the highlighted fields.', fieldErrors: fe }
  const [profile] = await db()<{ id: string }[]>`select id from zenith.lft_profiles where id = ${raw.profileId} and status = 'active'`
  if (!profile) return { ok: false as const, error: 'This player is no longer listed.' }
  const token = randomToken(24)
  try {
    await db()`
      insert into zenith.lft_requests (profile_id, requester_name, team_name, requester_contact, message, view_token_hash, ip_hash)
      values (${profile.id}, ${name}, ${cleanText(raw.teamName).slice(0, 60) || null}, ${contact}, ${message}, ${sha256(token)}, ${ipHash})
    `
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false as const, error: 'You already have a pending request with this player.' }
    throw e
  }
  return { ok: true as const, token }
}

export async function respondToRequest(profileToken: string, requestId: string, accept: boolean) {
  const p = await getLftByToken(profileToken)
  if (!p) return false
  const rows = await db()`
    update zenith.lft_requests set status = ${accept ? 'accepted' : 'declined'}, responded_at = now()
     where id = ${requestId} and profile_id = ${p.id} and status = 'pending' returning id
  `
  if (rows.length) await audit(db(), { ...PUBLIC_ACTOR, label: 'player' }, accept ? 'lft.request_accepted' : 'lft.request_declined', { type: 'lft_request', id: requestId })
  return rows.length > 0
}

/** The requester's private view. Contact details appear only after the player accepts. */
export async function getRequestByToken(token: string) {
  if (!token || token.length < 20 || token.length > 64) return null
  const [r] = await db()<
    { status: string; createdAt: Date; ign: string; gameId: string; contactPhoneE164: string | null; contactDiscord: string | null }[]
  >`
    select q.status, q.created_at, p.ign, p.game_id, p.contact_phone_e164, p.contact_discord
      from zenith.lft_requests q join zenith.lft_profiles p on p.id = q.profile_id where q.view_token_hash = ${sha256(token)}
  `
  if (!r) return null
  const accepted = r.status === 'accepted'
  return {
    status: r.status,
    createdAt: r.createdAt,
    ign: r.ign,
    gameId: r.gameId,
    phone: accepted ? r.contactPhoneE164 : null,
    discord: accepted ? r.contactDiscord : null,
  }
}

// ─── admin-assisted matching ────────────────────────────────────────────────

export async function adminListLft(gameId?: string) {
  return db()<
    (LftPublic & { reference: string; gameId: string; status: string; adminNote: string | null; openAlerts: number; pendingRequests: number })[]
  >`
    select p.id, p.reference, p.game_id, p.ign, p.roles, p.rank_label, p.city, p.availability, p.bio, p.status, p.admin_note, p.created_at,
           (select count(*)::int from zenith.ac_alerts a where a.entity_type = 'lft_profile' and a.entity_id = p.id and a.status = 'open') as open_alerts,
           (select count(*)::int from zenith.lft_requests q where q.profile_id = p.id and q.status = 'pending') as pending_requests
      from zenith.lft_profiles p
     where (${gameId ?? null}::text is null or p.game_id = ${gameId ?? null})
     order by p.created_at desc limit 300
  `
}

export async function adminSetLft(id: string, status: 'active' | 'matched' | 'withdrawn' | 'hidden', note: string | null, actor: Actor) {
  await db()`update zenith.lft_profiles set status = ${status}, admin_note = coalesce(${note}, admin_note) where id = ${id}`
  await audit(db(), actor, 'lft.admin_status', { type: 'lft_profile', id }, { status })
}
