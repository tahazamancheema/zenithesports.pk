import 'server-only'
import { AuthError, inGameScope, type Staff } from './auth/session'
import { db } from './db'

/**
 * Game scope: Game managers (and reviewers given specific games) only work on
 * tournaments of their games. Actions look up which game a record belongs to
 * and refuse anything outside the person's scope; pages filter their lists.
 */

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v)

async function one(query: Promise<{ gameId: string | null }[]>) {
  const [row] = await query
  return row?.gameId ?? null
}

export const gameOf = {
  tournament: (id: string) => (isUuid(id) ? one(db()<{ gameId: string }[]>`select game_id from zenith.tournaments where id = ${id}`) : Promise.resolve(null)),
  registration: (id: string) =>
    isUuid(id)
      ? one(db()<{ gameId: string }[]>`select t.game_id from zenith.registrations r join zenith.tournaments t on t.id = r.tournament_id where r.id = ${id}`)
      : Promise.resolve(null),
  member: (id: string) =>
    isUuid(id)
      ? one(db()<{ gameId: string }[]>`select t.game_id from zenith.registration_members m join zenith.tournaments t on t.id = m.tournament_id where m.id = ${id}`)
      : Promise.resolve(null),
  template: (id: string) => (isUuid(id) ? one(db()<{ gameId: string | null }[]>`select game_id from zenith.form_templates where id = ${id}`) : Promise.resolve(null)),
  lft: (id: string) => (isUuid(id) ? one(db()<{ gameId: string }[]>`select game_id from zenith.lft_profiles where id = ${id}`) : Promise.resolve(null)),
  sponsor: (id: string) =>
    isUuid(id)
      ? one(db()<{ gameId: string }[]>`select t.game_id from zenith.tournament_sponsors s join zenith.tournaments t on t.id = s.tournament_id where s.id = ${id}`)
      : Promise.resolve(null),
  format: (id: string) => one(db()<{ gameId: string }[]>`select game_id from zenith.game_formats where id = ${id}`),
}

/** Refuses unless every game is within this person's scope (unscoped staff pass). */
export async function assertGames(staff: Staff, ...games: (string | null | Promise<string | null>)[]) {
  if (staff.gameScope === null) return
  for (const g of await Promise.all(games)) {
    if (!inGameScope(staff, g)) throw new AuthError('That belongs to a game you do not manage.')
  }
}

/** Keeps only rows of games in scope. */
export function inScope<T>(staff: Pick<Staff, 'gameScope'>, rows: T[], game: (row: T) => string | null | undefined): T[] {
  return staff.gameScope === null ? rows : rows.filter((r) => inGameScope(staff, game(r)))
}
