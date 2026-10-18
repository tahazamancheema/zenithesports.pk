import 'server-only'
import { cache } from 'react'
import { parseFormSchema, type FormSchema, EMPTY_FORM } from '@/lib/forms/schema'
import { db, hasDatabase } from '../db'

export type Game = {
  id: string
  name: string
  shortName: string
  availability: 'active' | 'upcoming' | 'planned' | 'paused'
  uidLabel: string
  uidHint: string
  uidPattern: string
  uidKind: 'game_uid' | 'riot_id' | 'platform_id'
  description: string
  sortOrder: number
  logoFileId: string | null
  coverFileId: string | null
  accent: string | null
}

export type Format = {
  id: string
  gameId: string
  code: 'solo' | 'duo' | 'squad' | 'team5' | 'lft'
  label: string
  minPlayers: number
  maxPlayers: number
  maxSubstitutes: number
  enabled: boolean
}

export type Tournament = {
  id: string
  slug: string
  gameId: string
  formatId: string
  name: string
  summary: string
  description: string
  rules: string
  eligibility: string
  prizeInfo: string
  timezone: string
  startsAt: Date | null
  endsAt: Date | null
  registrationOpensAt: Date | null
  registrationClosesAt: Date | null
  capacity: number | null
  rosterMin: number
  rosterMax: number
  substitutesMax: number
  substitutesRequired: number
  entryFeePkr: number | null
  feeNotes: string
  requiresApproval: boolean
  waitlistEnabled: boolean
  uniquePhone: boolean
  formVersionId: string | null
  communicationLinks: { label: string; url: string }[]
  broadcastUrl: string | null
  status: 'draft' | 'published' | 'archived' | 'cancelled'
  cancelReason: string | null
  resultsNotes: string
  adminNotes: string
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  posterFileId: string | null
  logoFileId: string | null
  organizerName: string
  organizerLogoFileId: string | null
  featured: boolean
  formatCode: Format['code']
  formatLabel: string
  gameName: string
  activeCount: number
  approvedCount: number
}

/** Public projection: no admin notes, no private fields. */
export type PublicTournament = Omit<Tournament, 'adminNotes'>

export const getGames = cache(async (): Promise<Game[]> => {
  if (!hasDatabase()) return []
  return db()<Game[]>`select * from zenith.games order by sort_order, name`
})

export const getFormats = cache(async (): Promise<Format[]> => {
  if (!hasDatabase()) return []
  return db()<Format[]>`select * from zenith.game_formats order by game_id, min_players`
})

export async function getGame(id: string) {
  return (await getGames()).find((g) => g.id === id) ?? null
}

const TOURNAMENT_SELECT = (sql: ReturnType<typeof db>) => sql`
  select t.*, f.code as format_code, f.label as format_label, g.name as game_name,
         (select count(*)::int from zenith.registrations r where r.tournament_id = t.id and r.status in ('pending', 'approved')) as active_count,
         (select count(*)::int from zenith.registrations r where r.tournament_id = t.id and r.status = 'approved') as approved_count
    from zenith.tournaments t
    join zenith.game_formats f on f.id = t.format_id
    join zenith.games g on g.id = t.game_id
`

function toPublic(t: Tournament): PublicTournament {
  const { adminNotes: _omit, ...rest } = t
  void _omit
  return rest
}

/** Everything a visitor may see: published or archived, newest-first by start. */
export const listPublicTournaments = cache(async (gameId?: string): Promise<PublicTournament[]> => {
  if (!hasDatabase()) return []
  const sql = db()
  const rows = await sql<Tournament[]>`
    ${TOURNAMENT_SELECT(sql)}
     where t.status in ('published', 'cancelled')
       and (${gameId ?? null}::text is null or t.game_id = ${gameId ?? null})
     order by coalesce(t.starts_at, t.created_at) desc
     limit 200
  `
  return rows.map(toPublic)
})

export const getPublicTournament = cache(async (slug: string): Promise<PublicTournament | null> => {
  if (!hasDatabase() || !/^[a-z0-9-]{1,80}$/.test(slug)) return null
  const sql = db()
  const [row] = await sql<Tournament[]>`
    ${TOURNAMENT_SELECT(sql)} where t.slug = ${slug} and t.status in ('published', 'cancelled')
  `
  return row ? toPublic(row) : null
})

export async function getTournamentForAdmin(id: string): Promise<Tournament | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const sql = db()
  const [row] = await sql<Tournament[]>`${TOURNAMENT_SELECT(sql)} where t.id = ${id}`
  return row ?? null
}

export async function listTournamentsForAdmin(): Promise<Tournament[]> {
  const sql = db()
  return sql<Tournament[]>`${TOURNAMENT_SELECT(sql)} order by t.created_at desc limit 500`
}

export async function getFormSchema(versionId: string | null): Promise<FormSchema> {
  if (!versionId) return EMPTY_FORM
  const [row] = await db()<{ schema: unknown }[]>`select schema from zenith.form_versions where id = ${versionId}`
  if (!row) return EMPTY_FORM
  try {
    return parseFormSchema(row.schema)
  } catch {
    return EMPTY_FORM
  }
}

export type Sponsor = { id: string; tournamentId: string; name: string; tier: 'title' | 'presenting' | 'partner' | 'media'; url: string | null; logoFileId: string | null; sortOrder: number }

/** Sponsors for a set of tournaments, grouped by tournament id. */
export async function getSponsors(tournamentIds: string[]): Promise<Record<string, Sponsor[]>> {
  if (!hasDatabase() || !tournamentIds.length) return {}
  const rows = await db()<Sponsor[]>`
    select * from zenith.tournament_sponsors where tournament_id = any(${tournamentIds}::uuid[]) order by sort_order, created_at
  `
  const out: Record<string, Sponsor[]> = {}
  for (const r of rows) (out[r.tournamentId] ??= []).push(r)
  return out
}

/** Public URL for an image attached to published content (see isPublicFile). */
export const mediaUrl = (id: string | null | undefined) => (id ? `/media/${id}` : null)
