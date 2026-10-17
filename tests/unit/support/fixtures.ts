import sharp from 'sharp'
import postgres from 'postgres'
import type { Actor } from '@/server/audit'

export const sql = () => postgres(process.env.DATABASE_URL!, { max: 2, prepare: false, onnotice: () => {} })

export const ADMIN: Actor = { id: null, label: 'test-admin', surface: 'registrations' }

/** A real staff row, for operations the database requires a named reviewer for. */
export async function staffActor(surface = 'anticheat'): Promise<Actor> {
  const s = sql()
  const email = `reviewer-${uniq()}@test.local`
  const [u] = await s<{ id: string }[]>`
    insert into zenith.staff_users (email, display_name, password_hash) values (${email}, 'Reviewer', 'scrypt$x') returning id
  `
  await s`insert into zenith.staff_roles (user_id, role) values (${u.id}, 'anticheat_reviewer')`
  await s.end()
  return { id: u.id, label: email, surface }
}

let seq = 0
export const uniq = () => `${Date.now().toString(36)}${(seq++).toString(36)}`

/** 10-digit PUBG Mobile style UID that is unique per call. */
let uidSeq = 5_100_000_000
export const pubgUid = () => String(uidSeq++)

let phoneSeq = 0
export const pkPhone = () => `0300${String(1_000_000 + phoneSeq++).padStart(7, '0')}`

export async function png(seed: number, size = 96) {
  const buf = await sharp({
    create: { width: size, height: size, channels: 3, background: { r: seed % 255, g: (seed * 7) % 255, b: (seed * 13) % 255 } },
  })
    .png()
    .toBuffer()
  return new File([new Uint8Array(buf)], `shot-${seed}.png`, { type: 'image/png' })
}

export async function formatId(game: string, code: string) {
  const s = sql()
  const [row] = await s<{ id: string }[]>`select id from zenith.game_formats where game_id = ${game} and code = ${code}`
  await s.end()
  return row.id
}

/** A published tournament with registration open now. */
export async function openTournament(
  saveTournament: typeof import('@/server/services/admin-tournaments').saveTournament,
  setTournamentStatus: typeof import('@/server/services/admin-tournaments').setTournamentStatus,
  over: Record<string, string> = {},
) {
  const name = `Test Cup ${uniq()}`
  const res = await saveTournament(
    null,
    {
      name,
      formatId: await formatId('pubg-mobile', 'squad'),
      startsAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
      registrationOpensAt: new Date(Date.now() - 86400_000).toISOString(),
      registrationClosesAt: new Date(Date.now() + 5 * 86400_000).toISOString(),
      requiresApproval: 'on',
      waitlistEnabled: 'on',
      uniquePhone: 'on',
      ...over,
    },
    ADMIN,
  )
  if (!res.ok) throw new Error(`${res.error} ${JSON.stringify(res.fieldErrors)}`)
  await setTournamentStatus(res.id, 'published', null, ADMIN)
  const s = sql()
  const [t] = await s<{ slug: string }[]>`select slug from zenith.tournaments where id = ${res.id}`
  await s.end()
  return { id: res.id, slug: t.slug }
}

export function squad(prefix: string, uids = [pubgUid(), pubgUid(), pubgUid(), pubgUid()]) {
  return uids.map((uid, i) => ({ role: (i === 0 ? 'captain' : 'player') as 'captain' | 'player', ign: `${prefix}${i + 1}`, uid, answers: {} }))
}
