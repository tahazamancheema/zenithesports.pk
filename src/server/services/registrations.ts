import 'server-only'
import { validateAnswers, type Answers, type FileMeta } from '@/lib/forms/engine'
import type { FormSchema } from '@/lib/forms/schema'
import { cleanText, isEmail, maskId, maskPhone, normId, normName, toE164 } from '@/lib/normalize'
import { isTeamFormat, LEGAL_TRANSITIONS, phaseOf, STATUS_LABEL, type RegistrationStatus } from '@/lib/tournament'
import { audit, PUBLIC_ACTOR, SYSTEM_ACTOR, type Actor } from '../audit'
import { referenceCode, randomToken, sha256 } from '../crypto'
import { db, isUniqueViolation, pgError, type Db } from '../db'
import { inspectImage, storeImage, UploadError, type InspectedImage } from '../files'
import { enqueue } from '../notify'
import { getFormSchema, getGame, getPublicTournament, type Game, type PublicTournament } from './catalog'
import { addMembership, linkPhone, upsertPlayer, upsertTeam } from './identity'

export type MemberInput = {
  role: 'captain' | 'player' | 'substitute'
  ign: string
  uid: string
  phone?: string
  answers: Answers
}

export type RegistrationInput = {
  tournamentSlug: string
  teamName?: string
  contactPhone: string
  contactEmail?: string
  answers: Answers
  members: MemberInput[]
  /** keys: `entry.<fieldId>` or `m<index>.<fieldId>` */
  files: Map<string, File>
  ipHash?: string
  /** The signed-in player submitting the entry (zenith.accounts.id). */
  accountId?: string | null
}

export type RegistrationResult =
  | { ok: true; reference: string; manageToken: string; status: RegistrationStatus }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

class Rejection extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message)
  }
}

type CleanMember = MemberInput & { ignClean: string; uidRaw: string; uidNorm: string; phoneE164: string | null; values: Answers }

/** Validation that needs no database writes. Exported for tests. */
export function validateRegistration(
  input: Omit<RegistrationInput, 'files'> & { fileMeta?: Map<string, FileMeta> },
  t: Pick<PublicTournament, 'rosterMin' | 'rosterMax' | 'substitutesMax' | 'substitutesRequired' | 'formatCode'>,
  game: Pick<Game, 'uidPattern' | 'uidLabel'>,
  schema: FormSchema,
) {
  const errors: Record<string, string> = {}
  const fileMeta = input.fileMeta ?? new Map()
  const withFiles = (prefix: string, answers: Answers) => {
    const out: Answers = { ...answers }
    for (const [k, meta] of fileMeta) if (k.startsWith(`${prefix}.`)) out[k.slice(prefix.length + 1)] = meta
    return out
  }

  const team = isTeamFormat(t.formatCode)
  const teamName = cleanText(input.teamName)
  if (team && (teamName.length < 2 || teamName.length > 40)) errors.teamName = 'Team name must be 2–40 characters.'

  const contactPhone = toE164(input.contactPhone)
  if (!contactPhone) errors.contactPhone = 'Enter a valid WhatsApp number, e.g. 03XX XXXXXXX.'
  const contactEmail = input.contactEmail?.trim().toLowerCase() || null
  if (contactEmail && !isEmail(contactEmail)) errors.contactEmail = 'Enter a valid email address or leave it empty.'

  const entry = validateAnswers(schema, withFiles('entry', input.answers), {
    scope: 'entry',
    uidPattern: game.uidPattern,
    uidLabel: game.uidLabel,
  })
  for (const [k, v] of Object.entries(entry.errors)) errors[`entry.${k}`] = v
  let disqualified = entry.disqualified

  const members = input.members.slice(0, t.rosterMax + t.substitutesMax)
  const starters = members.filter((m) => m.role !== 'substitute')
  const subs = members.filter((m) => m.role === 'substitute')
  if (starters.length < t.rosterMin || starters.length > t.rosterMax) {
    errors.roster = t.rosterMin === t.rosterMax ? `This format needs exactly ${t.rosterMin} player(s).` : `This format needs ${t.rosterMin}–${t.rosterMax} players.`
  }
  if (subs.length > t.substitutesMax) errors.roster = `At most ${t.substitutesMax} substitute(s) are allowed.`
  if (subs.length < t.substitutesRequired) errors.roster = `This tournament requires ${t.substitutesRequired} substitute(s).`
  if (members.filter((m) => m.role === 'captain').length !== 1 || members[0]?.role !== 'captain') {
    errors.roster = 'The first player must be the captain.'
  }

  const uidRe = new RegExp(game.uidPattern)
  const seen = new Map<string, number>()
  const clean: CleanMember[] = members.map((m, i) => {
    const ign = cleanText(m.ign)
    const uidRaw = (m.uid ?? '').trim()
    const uidNorm = normId(uidRaw) ?? ''
    if (ign.length < 2 || ign.length > 40) errors[`m${i}.ign`] = 'In-game name must be 2–40 characters.'
    if (!uidRe.test(uidRaw)) errors[`m${i}.uid`] = `Enter a valid ${game.uidLabel}.`
    else if (seen.has(uidNorm)) errors[`m${i}.uid`] = `This ${game.uidLabel} is already used by player ${seen.get(uidNorm)! + 1}.`
    seen.set(uidNorm, i)
    let phoneE164: string | null = null
    if (m.phone?.trim()) {
      phoneE164 = toE164(m.phone)
      if (!phoneE164) errors[`m${i}.phone`] = 'Enter a valid number or leave it empty.'
    }
    const res = validateAnswers(schema, withFiles(`m${i}`, m.answers), {
      scope: 'player',
      entryAnswers: entry.values,
      uidPattern: game.uidPattern,
      uidLabel: game.uidLabel,
    })
    for (const [k, v] of Object.entries(res.errors)) errors[`m${i}.${k}`] = v
    disqualified ??= res.disqualified
    return { ...m, ignClean: ign, uidRaw, uidNorm, phoneE164, values: res.values }
  })

  return { errors, disqualified, teamName: team ? teamName : null, contactPhone, contactEmail, entryValues: entry.values, members: clean }
}

export async function submitRegistration(input: RegistrationInput): Promise<RegistrationResult> {
  const t = await getPublicTournament(input.tournamentSlug)
  if (!t) return { ok: false, error: 'This tournament could not be found.' }
  const phase = phaseOf(t)
  if (phase !== 'registration_open') {
    return {
      ok: false,
      error:
        phase === 'announced'
          ? 'Registration has not opened yet.'
          : phase === 'cancelled'
            ? 'This tournament has been cancelled.'
            : 'Registration for this tournament is closed.',
    }
  }
  if (t.formatCode === 'lft') return { ok: false, error: 'Use the Looking for Team form for this listing.' }
  const game = await getGame(t.gameId)
  if (!game) return { ok: false, error: 'This game is not available.' }
  const schema = await getFormSchema(t.formVersionId)

  const fileMeta = new Map<string, FileMeta>()
  for (const [k, f] of input.files) if (f && f.size > 0) fileMeta.set(k, { name: f.name, size: f.size, type: f.type })

  const v = validateRegistration({ ...input, fileMeta }, t, game, schema)
  if (Object.keys(v.errors).length) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: v.errors }
  if (v.disqualified) return { ok: false, error: v.disqualified }

  // Server-side content check of every upload, before any write.
  const images = new Map<string, InspectedImage>()
  try {
    for (const [k, f] of input.files) {
      if (!f || f.size === 0) continue
      const [scope, fieldId] = k.split('.')
      const answers = scope === 'entry' ? v.entryValues : v.members[Number(scope.slice(1))]?.values
      if (!answers || !(fieldId in answers)) continue // hidden or unknown field: ignore the file
      const field = schema.fields.find((x) => x.id === fieldId)
      images.set(k, await inspectImage(f, { maxBytes: (field?.maxSizeMB ?? 4) * 1048576, accept: field?.accept, label: field?.label ?? 'Upload' }))
    }
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, error: e.message }
    throw e
  }

  const manageToken = randomToken(24)
  try {
    const result = await db().begin(async (tx) => {
      const [locked] = await tx<{ status: string; capacity: number | null; registrationClosesAt: Date | null; startsAt: Date | null }[]>`
        select status, capacity, registration_closes_at, starts_at from zenith.tournaments where id = ${t.id} for update
      `
      const closes = locked.registrationClosesAt ?? locked.startsAt
      if (locked.status !== 'published' || (closes && new Date(closes) <= new Date())) {
        throw new Rejection('Registration for this tournament has just closed.')
      }

      const uids = v.members.map((m) => m.uidNorm)
      const taken = await tx<{ gameUidNorm: string }[]>`
        select game_uid_norm from zenith.registration_members
         where tournament_id = ${t.id} and active and game_uid_norm = any(${uids})
      `
      if (taken.length) {
        const fe: Record<string, string> = {}
        v.members.forEach((m, i) => {
          if (taken.some((x) => x.gameUidNorm === m.uidNorm)) fe[`m${i}.uid`] = 'This player is already registered in this tournament.'
        })
        throw new Rejection('One or more players are already registered in this tournament.', fe)
      }
      const teamNorm = v.teamName ? normName(v.teamName) : null
      if (teamNorm) {
        const [dup] = await tx`
          select 1 from zenith.registrations
           where tournament_id = ${t.id} and team_name_norm = ${teamNorm} and status in ('pending', 'approved', 'waitlisted')
        `
        if (dup) throw new Rejection('A team with this name is already registered.', { teamName: 'This team name is taken in this tournament.' })
      }
      if (t.uniquePhone) {
        const [dup] = await tx`
          select 1 from zenith.registrations
           where tournament_id = ${t.id} and phone_unique_key = ${v.contactPhone} and status in ('pending', 'approved', 'waitlisted')
        `
        if (dup) {
          throw new Rejection('This WhatsApp number has already been used to register in this tournament.', {
            contactPhone: 'Already used for another entry in this tournament.',
          })
        }
      }

      const [{ active }] = await tx<{ active: number }[]>`
        select count(*)::int as active from zenith.registrations
         where tournament_id = ${t.id} and status in ('pending', 'approved')
      `
      const full = locked.capacity !== null && active >= locked.capacity
      if (full && !t.waitlistEnabled) throw new Rejection('This tournament is full.')

      // Store uploads, then point the answers at the stored file ids.
      const entryAnswers: Answers = { ...v.entryValues }
      const memberAnswers = v.members.map((m) => ({ ...m.values }))
      for (const [k, img] of images) {
        const id = await storeImage(tx, img, 'registration')
        const [scope, fieldId] = k.split('.')
        if (scope === 'entry') entryAnswers[fieldId] = id
        else memberAnswers[Number(scope.slice(1))][fieldId] = id
      }

      const teamId = v.teamName ? await upsertTeam(tx, t.gameId, v.teamName, 'registration') : null
      const reference = referenceCode('ZR')
      const initial: RegistrationStatus = full ? 'waitlisted' : 'pending'
      const [reg] = await tx<{ id: string }[]>`
        insert into zenith.registrations
          (reference, tournament_id, team_id, team_name, team_name_norm, status, form_version_id, answers,
           contact_phone_e164, contact_email, phone_unique_key, manage_token_hash, ip_hash, account_id)
        values
          (${reference}, ${t.id}, ${teamId}, ${v.teamName}, ${teamNorm}, ${initial}, ${t.formVersionId},
           ${tx.json(entryAnswers as never)}, ${v.contactPhone}, ${v.contactEmail},
           ${t.uniquePhone ? v.contactPhone : null}, ${sha256(manageToken)}, ${input.ipHash ?? null}, ${input.accountId ?? null})
        returning id
      `
      for (const [i, m] of v.members.entries()) {
        const playerId = await upsertPlayer(tx, {
          gameId: t.gameId,
          uidKind: game.uidKind,
          uidRaw: m.uidRaw,
          ign: m.ignClean,
          source: 'registration',
        })
        const phone = i === 0 ? (m.phoneE164 ?? v.contactPhone) : m.phoneE164
        if (phone) await linkPhone(tx, playerId, phone!, 'registration')
        await tx`
          insert into zenith.registration_members
            (registration_id, tournament_id, slot, role, player_id, ign, ign_norm, game_uid_raw, game_uid_norm, phone_e164, answers)
          values
            (${reg.id}, ${t.id}, ${i + 1}, ${m.role}, ${playerId}, ${m.ignClean}, ${normName(m.ignClean)}, ${m.uidRaw},
             ${m.uidNorm}, ${phone ?? null}, ${tx.json(memberAnswers[i] as never)})
        `
        if (teamId) await addMembership(tx, { teamId, playerId, role: m.role, source: 'registration', registrationId: reg.id })
      }
      await tx`
        insert into zenith.registration_status_history (registration_id, from_status, to_status, actor_label, reason)
        values (${reg.id}, null, ${initial}, 'public', ${full ? 'Capacity reached; placed on the waitlist.' : null})
      `

      // Every registration passes through the AntiCheat matching service.
      const [scan] = await tx<{ created: number; updated: number }[]>`select * from zenith.ac_scan_registration(${reg.id})`
      const flagged = scan.created + scan.updated > 0

      let status: RegistrationStatus = initial
      if (initial === 'pending' && !t.requiresApproval && !flagged) {
        await tx`update zenith.registrations set status = 'approved', decided_at = now() where id = ${reg.id}`
        await tx`
          insert into zenith.registration_status_history (registration_id, from_status, to_status, actor_label, reason)
          values (${reg.id}, 'pending', 'approved', 'system', 'Automatic approval: tournament does not require review.')
        `
        status = 'approved'
      }

      await audit(tx, { ...PUBLIC_ACTOR, surface: 'registrations', ipHash: input.ipHash }, 'registration.created', { type: 'registration', id: reg.id }, {
        tournament: t.slug,
        status,
        members: v.members.length,
        anticheatSignals: flagged,
      })
      await enqueue(tx, {
        channel: 'email',
        recipient: v.contactEmail,
        subject: `${t.name}: registration received (${reference})`,
        body: `Your registration for ${t.name} has been received.\n\nReference: ${reference}\nStatus: ${STATUS_LABEL[status]}\n\nKeep your private manage link safe; it lets you check your status and withdraw.\n\n— Zenith Esports`,
      })
      await enqueue(tx, {
        channel: 'discord',
        subject: 'New registration',
        body: `${t.name} · ${reference} · ${STATUS_LABEL[status]}${flagged ? ' · AntiCheat review needed' : ''}`,
      })
      return { reference, status }
    })
    return { ok: true, reference: result.reference, manageToken, status: result.status }
  } catch (e) {
    if (e instanceof Rejection) return { ok: false, error: e.message, fieldErrors: e.fieldErrors }
    // Backstops for a request that raced past the checks above.
    if (isUniqueViolation(e, 'registration_members_active_uid')) return { ok: false, error: 'One or more players are already registered in this tournament.' }
    if (isUniqueViolation(e, 'registrations_active_team_name')) return { ok: false, error: 'A team with this name is already registered.' }
    if (isUniqueViolation(e, 'registrations_active_phone')) return { ok: false, error: 'This WhatsApp number has already been used in this tournament.' }
    console.error('registration failed', pgError(e).code)
    return { ok: false, error: 'We could not save your registration. Nothing was submitted — please try again.' }
  }
}

// ─── captain self-service (private manage link) ─────────────────────────────

export type ManagedRegistration = {
  id: string
  reference: string
  status: RegistrationStatus
  teamName: string | null
  createdAt: Date
  decisionReason: string | null
  tournament: { name: string; slug: string; timezone: string; startsAt: Date | null; communicationLinks: { label: string; url: string }[] }
  members: { slot: number; role: string; ign: string; uidMasked: string }[]
  contactMasked: string
  history: { toStatus: RegistrationStatus; at: Date; reason: string | null }[]
}

export async function getRegistrationByToken(token: string): Promise<ManagedRegistration | null> {
  if (!token || token.length < 20 || token.length > 64) return null
  const sql = db()
  const [r] = await sql<
    {
      id: string
      reference: string
      status: RegistrationStatus
      teamName: string | null
      createdAt: Date
      decisionReason: string | null
      contactPhoneE164: string
      tName: string
      tSlug: string
      tTimezone: string
      tStartsAt: Date | null
      tLinks: { label: string; url: string }[]
      tStatus: string
    }[]
  >`
    select r.id, r.reference, r.status, r.team_name, r.created_at, r.decision_reason, r.contact_phone_e164,
           t.name as t_name, t.slug as t_slug, t.timezone as t_timezone, t.starts_at as t_starts_at,
           t.communication_links as t_links, t.status as t_status
      from zenith.registrations r join zenith.tournaments t on t.id = r.tournament_id
     where r.manage_token_hash = ${sha256(token)}
  `
  if (!r) return null
  const members = await sql<{ slot: number; role: string; ign: string; gameUidRaw: string }[]>`
    select slot, role, ign, game_uid_raw from zenith.registration_members where registration_id = ${r.id} order by slot
  `
  const history = await sql<{ toStatus: RegistrationStatus; at: Date; reason: string | null }[]>`
    select to_status, at, case when actor_label in ('public', 'system') then reason else null end as reason
      from zenith.registration_status_history where registration_id = ${r.id} order by at
  `
  return {
    id: r.id,
    reference: r.reference,
    status: r.status,
    teamName: r.teamName,
    createdAt: r.createdAt,
    decisionReason: r.status === 'rejected' || r.status === 'disqualified' ? r.decisionReason : null,
    tournament: {
      name: r.tName,
      slug: r.tSlug,
      timezone: r.tTimezone,
      startsAt: r.tStartsAt,
      // Private event links are only shown once a team is approved.
      communicationLinks: r.status === 'approved' ? r.tLinks : [],
    },
    members: members.map((m) => ({ slot: m.slot, role: m.role, ign: m.ign, uidMasked: maskId(m.gameUidRaw) })),
    contactMasked: maskPhone(r.contactPhoneE164),
    history,
  }
}

export async function withdrawByToken(token: string, ipHash: string) {
  const reg = await getRegistrationByToken(token)
  if (!reg) return { ok: false as const, error: 'This link is not valid.' }
  if (!LEGAL_TRANSITIONS[reg.status].includes('withdrawn')) {
    return { ok: false as const, error: 'This registration can no longer be withdrawn.' }
  }
  await transition(reg.id, 'withdrawn', { ...PUBLIC_ACTOR, label: 'captain', surface: 'registrations', ipHash }, 'Withdrawn by the captain.')
  return { ok: true as const }
}

// ─── administration ─────────────────────────────────────────────────────────

export class TransitionError extends Error {}

export async function transition(id: string, to: RegistrationStatus, actor: Actor, reason?: string | null, conn?: Db) {
  const run = async (tx: Db) => {
    const [cur] = await tx<{ status: RegistrationStatus; tournamentId: string }[]>`
      select status, tournament_id from zenith.registrations where id = ${id} for update
    `
    if (!cur) throw new TransitionError('Registration not found.')
    if (cur.status === to) return cur.status
    if (!LEGAL_TRANSITIONS[cur.status].includes(to)) {
      throw new TransitionError(`A ${STATUS_LABEL[cur.status].toLowerCase()} registration cannot become ${STATUS_LABEL[to].toLowerCase()}.`)
    }
    if (to === 'approved' || to === 'pending') {
      // Re-activating must not collide with a player who entered meanwhile.
      const [clash] = await tx`
        select 1 from zenith.registration_members a
          join zenith.registration_members b on b.tournament_id = a.tournament_id and b.game_uid_norm = a.game_uid_norm
         where a.registration_id = ${id} and b.active and b.registration_id <> ${id}
         limit 1
      `
      if (clash && cur.status === 'rejected') throw new TransitionError('A player on this roster is now registered with another team.')
    }
    const decided = ['approved', 'rejected', 'disqualified'].includes(to)
    await tx`
      update zenith.registrations
         set status = ${to},
             decided_at = case when ${decided} then now() else decided_at end,
             decided_by = case when ${decided} then ${actor.id}::uuid else decided_by end,
             decision_reason = case when ${decided} then ${reason ?? null} else decision_reason end
       where id = ${id}
    `
    await tx`
      insert into zenith.registration_status_history (registration_id, from_status, to_status, changed_by, actor_label, reason)
      values (${id}, ${cur.status}, ${to}, ${actor.id}, ${actor.label}, ${reason ?? null})
    `
    await audit(tx, actor, 'registration.status', { type: 'registration', id }, { from: cur.status, to })
    return to
  }
  try {
    return conn ? await run(conn) : await db().begin(run)
  } catch (e) {
    if (isUniqueViolation(e)) throw new TransitionError('Re-activating would create a duplicate entry in this tournament.')
    if (pgError(e).code === '23514') throw new TransitionError('That status change is not allowed.')
    throw e
  }
}

export type AdminRegistrationRow = {
  id: string
  reference: string
  status: RegistrationStatus
  teamName: string | null
  captainIgn: string | null
  memberCount: number
  createdAt: Date
  tournamentName: string
  tournamentId: string
  openAlerts: number
}

export async function listRegistrations(f: {
  tournamentId?: string
  status?: string
  q?: string
  sort?: 'newest' | 'oldest' | 'team'
  page?: number
  pageSize?: number
}) {
  const sql = db()
  const pageSize = Math.min(f.pageSize ?? 25, 100)
  const page = Math.max(1, f.page ?? 1)
  const q = f.q?.trim().slice(0, 60) || null
  const qNorm = q ? normName(q) : null
  const qId = q ? normId(q) : null
  const order =
    f.sort === 'oldest' ? sql`r.created_at asc` : f.sort === 'team' ? sql`r.team_name_norm asc nulls last, r.created_at desc` : sql`r.created_at desc`
  const where = sql`
    where (${f.tournamentId ?? null}::uuid is null or r.tournament_id = ${f.tournamentId ?? null}::uuid)
      and (${f.status ?? null}::text is null or r.status = ${f.status ?? null})
      and (${q}::text is null
           or r.reference ilike ${'%' + (q ?? '') + '%'}
           or r.team_name_norm like ${'%' + (qNorm ?? '') + '%'}
           or exists (select 1 from zenith.registration_members m
                       where m.registration_id = r.id and (m.ign_norm like ${'%' + (qNorm ?? '') + '%'} or m.game_uid_norm = ${qId})))
  `
  const rows = await sql<AdminRegistrationRow[]>`
    select r.id, r.reference, r.status, r.team_name, r.created_at, r.tournament_id, t.name as tournament_name,
           (select ign from zenith.registration_members m where m.registration_id = r.id and m.slot = 1) as captain_ign,
           (select count(*)::int from zenith.registration_members m where m.registration_id = r.id) as member_count,
           (select count(*)::int from zenith.ac_alerts a where a.registration_id = r.id and a.status = 'open') as open_alerts
      from zenith.registrations r join zenith.tournaments t on t.id = r.tournament_id
      ${where}
     order by ${order}
     limit ${pageSize} offset ${(page - 1) * pageSize}
  `
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from zenith.registrations r ${where}`
  return { rows, total, page, pageSize }
}

export async function getRegistrationDetail(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const sql = db()
  const [reg] = await sql<
    {
      id: string
      reference: string
      status: RegistrationStatus
      teamName: string | null
      teamId: string | null
      answers: Answers
      contactPhoneE164: string
      contactEmail: string | null
      source: string
      createdAt: Date
      decidedAt: Date | null
      decisionReason: string | null
      formVersionId: string | null
      tournamentId: string
      tournamentName: string
      gameId: string
    }[]
  >`
    select r.*, t.name as tournament_name, t.game_id
      from zenith.registrations r join zenith.tournaments t on t.id = r.tournament_id where r.id = ${id}
  `
  if (!reg) return null
  const members = await sql<
    { id: string; slot: number; role: string; ign: string; gameUidRaw: string; phoneE164: string | null; answers: Answers; playerId: string; active: boolean }[]
  >`select id, slot, role, ign, game_uid_raw, phone_e164, answers, player_id, active from zenith.registration_members where registration_id = ${id} order by slot`
  const history = await sql<{ fromStatus: string | null; toStatus: string; actorLabel: string; reason: string | null; at: Date }[]>`
    select from_status, to_status, actor_label, reason, at from zenith.registration_status_history where registration_id = ${id} order by at desc
  `
  const alerts = await sql<{ id: string; status: string; matchKind: string; confidence: string }[]>`
    select id, status, match_kind, confidence from zenith.ac_alerts where registration_id = ${id} order by last_detected_at desc
  `
  return { ...reg, members, history, alerts }
}

/** Admin roster correction: same validation, duplicate guard and AntiCheat pass as a new entry. */
export async function updateMember(
  memberId: string,
  patch: { ign: string; uid: string; phone?: string | null },
  actor: Actor,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sql = db()
  const [m] = await sql<{ registrationId: string; tournamentId: string; gameId: string; role: 'captain' | 'player' | 'substitute' }[]>`
    select m.registration_id, m.tournament_id, t.game_id, m.role
      from zenith.registration_members m join zenith.tournaments t on t.id = m.tournament_id where m.id = ${memberId}
  `
  if (!m) return { ok: false, error: 'Player not found.' }
  const game = await getGame(m.gameId)
  if (!game) return { ok: false, error: 'Game not found.' }
  const ign = cleanText(patch.ign)
  const uidRaw = patch.uid.trim()
  if (ign.length < 2 || ign.length > 40) return { ok: false, error: 'In-game name must be 2–40 characters.' }
  if (!new RegExp(game.uidPattern).test(uidRaw)) return { ok: false, error: `Enter a valid ${game.uidLabel}.` }
  const phone = patch.phone?.trim() ? toE164(patch.phone) : null
  if (patch.phone?.trim() && !phone) return { ok: false, error: 'Enter a valid phone number.' }
  try {
    await sql.begin(async (tx) => {
      await tx`select 1 from zenith.tournaments where id = ${m.tournamentId} for update`
      const playerId = await upsertPlayer(tx, { gameId: m.gameId, uidKind: game.uidKind, uidRaw, ign, source: 'manual' })
      if (phone) await linkPhone(tx, playerId, phone, 'manual')
      const [old] = await tx<{ playerId: string }[]>`select player_id from zenith.registration_members where id = ${memberId}`
      await tx`
        update zenith.registration_members
           set ign = ${ign}, ign_norm = ${normName(ign)}, game_uid_raw = ${uidRaw}, game_uid_norm = ${normId(uidRaw)},
               phone_e164 = ${phone}, player_id = ${playerId}
         where id = ${memberId}
      `
      const [reg] = await tx<{ teamId: string | null }[]>`select team_id from zenith.registrations where id = ${m.registrationId}`
      if (reg.teamId && old.playerId !== playerId) {
        await tx`update zenith.team_memberships set ended_at = now() where registration_id = ${m.registrationId} and player_id = ${old.playerId} and ended_at is null`
        await addMembership(tx, { teamId: reg.teamId, playerId, role: m.role, source: 'manual', registrationId: m.registrationId })
      }
      await tx`select * from zenith.ac_scan_registration(${m.registrationId})`
      await tx`select zenith.emit('registrations', 'registration.roster', ${m.registrationId}::uuid, '{}'::jsonb)`
      await audit(tx, actor, 'registration.member_updated', { type: 'registration', id: m.registrationId }, { slot: memberId })
    })
    return { ok: true }
  } catch (e) {
    if (isUniqueViolation(e, 'registration_members_active_uid')) return { ok: false, error: 'That player is already registered in this tournament.' }
    throw e
  }
}

export { SYSTEM_ACTOR }
