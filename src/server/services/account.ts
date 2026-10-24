import 'server-only'
import type { ConsoleSurface, Role } from '@/lib/permissions'
import { LEGAL_TRANSITIONS, phaseOf, type RegistrationStatus } from '@/lib/tournament'
import { PUBLIC_ACTOR } from '../audit'
import { gameScopeFor } from '../auth/session'
import { db } from '../db'
import { transition, updateMember } from './registrations'

export type MyRegistration = {
  id: string
  reference: string
  status: RegistrationStatus
  teamName: string | null
  createdAt: Date
  tournamentName: string
  tournamentSlug: string
  gameId: string
  gameName: string
  uidLabel: string
  formatLabel: string
  tournamentStatus: 'draft' | 'published' | 'archived' | 'cancelled'
  startsAt: Date | null
  endsAt: Date | null
  registrationOpensAt: Date | null
  registrationClosesAt: Date | null
  timezone: string
  members: { id: string; role: 'captain' | 'player' | 'substitute'; ign: string; uid: string; active: boolean }[]
}

/** Every entry this player submitted while signed in, newest first. */
export async function listMyRegistrations(accountId: string): Promise<MyRegistration[]> {
  return db()<MyRegistration[]>`
    select r.id, r.reference, r.status, r.team_name, r.created_at,
           t.name as tournament_name, t.slug as tournament_slug, t.game_id, g.name as game_name, g.uid_label,
           f.label as format_label, t.status as tournament_status, t.starts_at, t.ends_at,
           t.registration_opens_at, t.registration_closes_at, t.timezone,
           coalesce((
             select json_agg(json_build_object('id', m.id, 'role', m.role, 'ign', m.ign, 'uid', m.game_uid_raw, 'active', m.active)
                             order by case m.role when 'captain' then 0 when 'player' then 1 else 2 end, m.slot)
               from zenith.registration_members m where m.registration_id = r.id
           ), '[]'::json) as members
      from zenith.registrations r
      join zenith.tournaments t on t.id = r.tournament_id
      join zenith.games g on g.id = t.game_id
      join zenith.game_formats f on f.id = t.format_id
     where r.account_id = ${accountId}
     order by r.created_at desc
     limit 100
  `
}

/** The roster can be corrected only while registration is open and the entry is still live. */
export function canEditRoster(r: Pick<MyRegistration, 'status' | 'tournamentStatus' | 'startsAt' | 'endsAt' | 'registrationOpensAt' | 'registrationClosesAt'>) {
  return ['pending', 'approved', 'waitlisted'].includes(r.status) && phaseOf({ ...r, status: r.tournamentStatus }) === 'registration_open'
}

async function owned(accountId: string, registrationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(registrationId)) return null
  const rows = await listMyRegistrations(accountId)
  return rows.find((r) => r.id === registrationId) ?? null
}

export async function withdrawMine(accountId: string, registrationId: string, ipHash: string) {
  const r = await owned(accountId, registrationId)
  if (!r) return { ok: false as const, error: 'Registration not found.' }
  if (!LEGAL_TRANSITIONS[r.status].includes('withdrawn')) return { ok: false as const, error: 'This registration can no longer be withdrawn.' }
  await transition(r.id, 'withdrawn', { ...PUBLIC_ACTOR, label: `account:${accountId}`, surface: 'registrations', ipHash }, 'Withdrawn by the captain.')
  return { ok: true as const }
}

export async function updateMyMember(accountId: string, registrationId: string, memberId: string, patch: { ign: string; uid: string }, ipHash: string) {
  const r = await owned(accountId, registrationId)
  if (!r) return { ok: false as const, error: 'Registration not found.' }
  if (!canEditRoster(r)) return { ok: false as const, error: 'The roster can only be changed while registration is open.' }
  if (!r.members.some((m) => m.id === memberId && m.active)) return { ok: false as const, error: 'Player not found.' }
  return updateMember(memberId, patch, { ...PUBLIC_ACTOR, label: `account:${accountId}`, surface: 'registrations', ipHash })
}

export type StaffProfile = {
  consoles: ConsoleSurface[]
  roles: Role[]
  /** Games their tournament work is limited to; null = every game. */
  gameScope: string[] | null
  /** The staff record is linked to this exact sign-in (done on first entry with Google). */
  linked: boolean
}

/**
 * The staff side of a signed-in person, if they are on the staff list.
 * An email match alone only decides whether to show the admin panel link;
 * anything that shows staff data requires `linked`, and opening the panel still
 * goes through enterWithAccount and its own checks.
 */
export async function staffProfileFor(account: { id: string; email: string }): Promise<StaffProfile | null> {
  const [row] = await db()<{ roles: Role[]; games: string[]; linked: boolean }[]>`
    select coalesce(array_agg(distinct r.role) filter (where r.role is not null), '{}') as roles,
           coalesce((select array_agg(g.game_id) from zenith.staff_game_scopes g where g.user_id = u.id), '{}') as games,
           (u.auth_user_id = ${account.id}) as linked
      from zenith.staff_users u left join zenith.staff_roles r on r.user_id = u.id
     where u.status = 'active' and (u.auth_user_id = ${account.id} or (u.auth_user_id is null and lower(u.email) = ${account.email.toLowerCase()}))
     group by u.id limit 1
  `
  if (!row || !row.roles.length) return null
  return { roles: row.roles, gameScope: gameScopeFor(row.roles, row.games), linked: Boolean(row.linked), consoles: ['hq'] }
}

/** ['hq'] when this signed-in person is on the staff list (see staffProfileFor). */
export async function staffConsolesFor(account: { id: string; email: string }): Promise<ConsoleSurface[]> {
  return (await staffProfileFor(account))?.consoles ?? []
}
