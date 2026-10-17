import 'server-only'
import { normId, normName } from '@/lib/normalize'
import type { Db } from '../db'

type Source = 'registration' | 'manual' | 'report' | 'lft'

/**
 * One canonical player per (game, UID). Re-registrations, manual entries and
 * reports all resolve to the same row, so history accumulates in one place.
 */
export async function upsertPlayer(
  tx: Db,
  p: { gameId: string; uidKind: string; uidRaw: string; ign: string | null; source: Source },
): Promise<string> {
  const uidNorm = normId(p.uidRaw)!
  // Reports and flags may not know the name; a placeholder must never overwrite a real one.
  const knownIgn = p.ign && p.ign !== 'Unknown' ? p.ign : null
  const [existing] = await tx<{ playerId: string }[]>`
    select player_id from zenith.player_identifiers
     where game_id = ${p.gameId} and kind = ${p.uidKind} and value_norm = ${uidNorm}
     for update
  `
  let playerId = existing?.playerId
  if (!playerId) {
    const [row] = await tx<{ id: string }[]>`
      insert into zenith.players (game_id, display_ign, source) values (${p.gameId}, ${knownIgn ?? 'Unknown'}, ${p.source}) returning id
    `
    playerId = row.id
    await tx`
      insert into zenith.player_identifiers (player_id, game_id, kind, value_raw, value_norm)
      values (${playerId}, ${p.gameId}, ${p.uidKind}, ${p.uidRaw.trim()}, ${uidNorm})
    `
  } else {
    await tx`update zenith.player_identifiers set last_seen_at = now() where player_id = ${playerId} and value_norm = ${uidNorm}`
    if (knownIgn) await tx`update zenith.players set display_ign = ${knownIgn} where id = ${playerId}`
  }
  const ignNorm = knownIgn ? normName(knownIgn) : null
  if (ignNorm) {
    await tx`
      insert into zenith.player_ign_history (player_id, ign, ign_norm) values (${playerId}, ${knownIgn}, ${ignNorm})
      on conflict (player_id, ign_norm) do update set seen_at = now()
    `
  }
  return playerId
}

export async function linkPhone(tx: Db, playerId: string, e164: string, source: 'registration' | 'manual' | 'lft') {
  const [phone] = await tx<{ id: string }[]>`
    insert into zenith.phone_numbers (e164) values (${e164})
    on conflict (e164) do update set e164 = excluded.e164
    returning id
  `
  await tx`
    insert into zenith.player_phone_links (player_id, phone_id, source) values (${playerId}, ${phone.id}, ${source})
    on conflict (player_id, phone_id) do update set last_seen_at = now()
  `
}

export async function upsertTeam(tx: Db, gameId: string, name: string, source: 'registration' | 'manual') {
  const nameNorm = normName(name)!
  const [row] = await tx<{ id: string }[]>`
    insert into zenith.teams (game_id, name, name_norm, source) values (${gameId}, ${name}, ${nameNorm}, ${source})
    on conflict (game_id, name_norm) do update set name = excluded.name
    returning id
  `
  return row.id
}

export async function addMembership(
  tx: Db,
  m: { teamId: string; playerId: string; role: 'captain' | 'player' | 'substitute'; source: 'registration' | 'manual'; registrationId?: string },
) {
  await tx`
    insert into zenith.team_memberships (team_id, player_id, role, source, registration_id)
    values (${m.teamId}, ${m.playerId}, ${m.role}, ${m.source}, ${m.registrationId ?? null})
  `
}
