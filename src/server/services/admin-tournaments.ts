import 'server-only'
import { z } from 'zod'
import { formSchemaSchema, type FormSchema } from '@/lib/forms/schema'
import { safeUrl, slugify } from '@/lib/normalize'
import { zonedToUtc } from '@/lib/zoned'
import { audit, type Actor } from '../audit'
import { db, isUniqueViolation } from '../db'
import { getFormats } from './catalog'
import { transition } from './registrations'

const optDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Invalid date' })
      return z.NEVER
    }
    return d
  })
const optInt = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v.trim() === '') return null
    const n = Number(v)
    if (!Number.isInteger(n) || n < 0) {
      ctx.addIssue({ code: 'custom', message: 'Enter a whole number' })
      return z.NEVER
    }
    return n
  })
const bool = z.string().optional().transform((v) => v === 'on' || v === 'true')

export const tournamentInput = z
  .object({
    name: z.string().trim().min(3, 'At least 3 characters').max(120),
    slug: z.string().trim().max(80).optional(),
    formatId: z.string().uuid('Choose a game and format'),
    summary: z.string().trim().max(280).default(''),
    description: z.string().trim().max(20000).default(''),
    rules: z.string().trim().max(20000).default(''),
    eligibility: z.string().trim().max(5000).default(''),
    prizeInfo: z.string().trim().max(2000).default(''),
    timezone: z.string().default('Asia/Karachi'),
    startsAt: optDate,
    endsAt: optDate,
    registrationOpensAt: optDate,
    registrationClosesAt: optDate,
    capacity: optInt,
    rosterMin: optInt,
    rosterMax: optInt,
    substitutesMax: optInt,
    substitutesRequired: optInt,
    entryFeePkr: optInt,
    feeNotes: z.string().trim().max(500).default(''),
    requiresApproval: bool,
    waitlistEnabled: bool,
    uniquePhone: bool,
    formVersionId: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
    communicationLinks: z.string().max(4000).default(''),
    broadcastUrl: z.string().max(500).optional().transform((v) => safeUrl(v)),
    resultsNotes: z.string().trim().max(5000).default(''),
    adminNotes: z.string().trim().max(5000).default(''),
  })
  .superRefine((t, ctx) => {
    if (t.startsAt && t.endsAt && t.endsAt < t.startsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Ends before it starts' })
    if (t.registrationOpensAt && t.registrationClosesAt && t.registrationClosesAt <= t.registrationOpensAt) {
      ctx.addIssue({ code: 'custom', path: ['registrationClosesAt'], message: 'Closes before it opens' })
    }
    if (t.registrationClosesAt && t.startsAt && t.registrationClosesAt > t.startsAt) {
      ctx.addIssue({ code: 'custom', path: ['registrationClosesAt'], message: 'Registration should close before the start' })
    }
    if (!Intl.supportedValuesOf('timeZone').includes(t.timezone) && t.timezone !== 'UTC') {
      ctx.addIssue({ code: 'custom', path: ['timezone'], message: 'Unknown timezone' })
    }
  })

/** "Label | https://url" per line → validated list. */
export function parseLinks(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((l) => {
      const [label, url] = l.includes('|') ? l.split('|').map((s) => s.trim()) : ['Link', l]
      return { label: label.slice(0, 60) || 'Link', url: safeUrl(url) }
    })
    .filter((l): l is { label: string; url: string } => Boolean(l.url))
}

export type TournamentSaveResult = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function saveTournament(id: string | null, rawIn: Record<string, string>, actor: Actor): Promise<TournamentSaveResult> {
  // Form inputs are wall-clock times in the tournament's timezone; ISO strings pass through.
  const tz = rawIn.timezone || 'Asia/Karachi'
  const raw = { ...rawIn }
  for (const k of ['startsAt', 'endsAt', 'registrationOpensAt', 'registrationClosesAt']) {
    const v = raw[k]
    if (v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) raw[k] = zonedToUtc(v, tz)?.toISOString() ?? v
  }
  const parsed = tournamentInput.safeParse(raw)
  if (!parsed.success) {
    const fe: Record<string, string> = {}
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: fe }
  }
  const t = parsed.data
  const format = (await getFormats()).find((f) => f.id === t.formatId)
  if (!format || format.code === 'lft') return { ok: false, error: 'Choose a registrable format.', fieldErrors: { formatId: 'Choose a format' } }
  const rosterMin = t.rosterMin ?? format.minPlayers
  const rosterMax = t.rosterMax ?? format.maxPlayers
  const subsMax = t.substitutesMax ?? format.maxSubstitutes
  const subsReq = t.substitutesRequired ?? 0
  if (rosterMax < rosterMin) return { ok: false, error: 'Roster maximum is below the minimum.', fieldErrors: { rosterMax: 'Below minimum' } }
  if (subsReq > subsMax) return { ok: false, error: 'Required substitutes exceed the maximum.', fieldErrors: { substitutesRequired: 'Above maximum' } }
  if (t.formVersionId) {
    const [fv] = await db()<{ status: string }[]>`select status from zenith.form_versions where id = ${t.formVersionId}`
    if (fv?.status !== 'published') return { ok: false, error: 'Attach a published form version.', fieldErrors: { formVersionId: 'Not published' } }
  }
  const slug = slugify(t.slug || t.name)
  if (!slug) return { ok: false, error: 'Add a URL slug.', fieldErrors: { slug: 'Required' } }
  const links = parseLinks(t.communicationLinks)
  try {
    const sql = db()
    const values = {
      slug,
      game_id: format.gameId,
      format_id: format.id,
      name: t.name,
      summary: t.summary,
      description: t.description,
      rules: t.rules,
      eligibility: t.eligibility,
      prize_info: t.prizeInfo,
      timezone: t.timezone,
      starts_at: t.startsAt,
      ends_at: t.endsAt,
      registration_opens_at: t.registrationOpensAt,
      registration_closes_at: t.registrationClosesAt,
      capacity: t.capacity,
      roster_min: rosterMin,
      roster_max: rosterMax,
      substitutes_max: subsMax,
      substitutes_required: subsReq,
      entry_fee_pkr: t.entryFeePkr,
      fee_notes: t.feeNotes,
      requires_approval: t.requiresApproval,
      waitlist_enabled: t.waitlistEnabled,
      unique_phone: t.uniquePhone,
      form_version_id: t.formVersionId,
      communication_links: sql.json(links),
      broadcast_url: t.broadcastUrl,
      results_notes: t.resultsNotes,
      admin_notes: t.adminNotes,
    }
    const saved = await sql.begin(async (tx) => {
      let rowId = id
      if (rowId) {
        const [cur] = await tx<{ status: string; gameId: string }[]>`select status, game_id from zenith.tournaments where id = ${rowId} for update`
        if (!cur) throw new Error('Tournament not found.')
        const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from zenith.registrations where tournament_id = ${rowId}`
        if (n > 0 && cur.gameId !== format.gameId) throw new Error('The game cannot change once teams have registered.')
        await tx`update zenith.tournaments set ${tx(values as never)} where id = ${rowId}`
      } else {
        const [row] = await tx<{ id: string }[]>`insert into zenith.tournaments ${tx({ ...values, created_by: actor.id } as never)} returning id`
        rowId = row.id
      }
      await audit(tx, actor, id ? 'tournament.updated' : 'tournament.created', { type: 'tournament', id: rowId })
      await tx`select zenith.emit('registrations', 'tournament.saved', ${rowId}::uuid, '{}'::jsonb)`
      return rowId!
    })
    return { ok: true, id: saved }
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: 'That URL slug is already used.', fieldErrors: { slug: 'Already used' } }
    return { ok: false, error: (e as Error).message }
  }
}

export async function setTournamentStatus(id: string, to: 'draft' | 'published' | 'archived' | 'cancelled', reason: string | null, actor: Actor) {
  await db().begin(async (tx) => {
    const [t] = await tx<{ status: string; startsAt: Date | null; formVersionId: string | null }[]>`
      select status, starts_at, form_version_id from zenith.tournaments where id = ${id} for update
    `
    if (!t) throw new Error('Tournament not found.')
    if (t.status === 'cancelled' && to !== 'archived') throw new Error('A cancelled tournament can only be archived.')
    if (to === 'published' && !t.startsAt) throw new Error('Set a start time before publishing.')
    if (to === 'cancelled' && !reason?.trim()) throw new Error('Give a reason for the cancellation; registrants will see it.')
    await tx`
      update zenith.tournaments
         set status = ${to},
             published_at = case when ${to} = 'published' then coalesce(published_at, now()) else published_at end,
             cancel_reason = case when ${to} = 'cancelled' then ${reason} else cancel_reason end
       where id = ${id}
    `
    if (to === 'cancelled') {
      const regs = await tx<{ id: string }[]>`select id from zenith.registrations where tournament_id = ${id} and status in ('pending', 'approved', 'waitlisted')`
      for (const r of regs) await transition(r.id, 'cancelled', actor, `Tournament cancelled: ${reason}`, tx)
    }
    await audit(tx, actor, `tournament.${to}`, { type: 'tournament', id }, { from: t.status })
    await tx`select zenith.emit('registrations', 'tournament.status', ${id}::uuid, ${tx.json({ status: to })})`
  })
}

// ─── forms ──────────────────────────────────────────────────────────────────

export async function listTemplates() {
  return db()<
    { id: string; name: string; description: string; gameId: string | null; createdAt: Date; latestPublished: number | null; hasDraft: boolean; usedBy: number }[]
  >`
    select ft.id, ft.name, ft.description, ft.game_id, ft.created_at,
           (select max(version) from zenith.form_versions v where v.template_id = ft.id and v.status = 'published') as latest_published,
           exists (select 1 from zenith.form_versions v where v.template_id = ft.id and v.status = 'draft') as has_draft,
           (select count(*)::int from zenith.tournaments t join zenith.form_versions v on v.id = t.form_version_id where v.template_id = ft.id) as used_by
      from zenith.form_templates ft where ft.archived_at is null order by ft.created_at desc
  `
}

export async function publishedVersions() {
  return db()<{ id: string; templateName: string; version: number; gameId: string | null }[]>`
    select v.id, ft.name as template_name, v.version, ft.game_id
      from zenith.form_versions v join zenith.form_templates ft on ft.id = v.template_id
     where v.status = 'published' and ft.archived_at is null order by ft.name, v.version desc
  `
}

export async function createTemplate(name: string, description: string, gameId: string | null, copyFromVersion: string | null, actor: Actor) {
  if (name.trim().length < 1) throw new Error('Name the template.')
  return db().begin(async (tx) => {
    let schema: FormSchema = { version: 1, fields: [] }
    if (copyFromVersion) {
      const [src] = await tx<{ schema: FormSchema }[]>`select schema from zenith.form_versions where id = ${copyFromVersion}`
      if (src) schema = src.schema
    }
    const [ft] = await tx<{ id: string }[]>`
      insert into zenith.form_templates (name, description, game_id, created_by) values (${name.trim()}, ${description.trim()}, ${gameId}, ${actor.id}) returning id
    `
    await tx`insert into zenith.form_versions (template_id, version, schema, created_by) values (${ft.id}, 1, ${tx.json(schema as never)}, ${actor.id})`
    await audit(tx, actor, 'form.template_created', { type: 'form_template', id: ft.id })
    return ft.id
  })
}

export async function getTemplateEditor(templateId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(templateId)) return null
  const sql = db()
  const [ft] = await sql<{ id: string; name: string; description: string; gameId: string | null }[]>`
    select id, name, description, game_id from zenith.form_templates where id = ${templateId}
  `
  if (!ft) return null
  const versions = await sql<{ id: string; version: number; status: string; schema: FormSchema; publishedAt: Date | null; createdAt: Date }[]>`
    select id, version, status, schema, published_at, created_at from zenith.form_versions where template_id = ${templateId} order by version desc
  `
  return { template: ft, versions }
}

/** Saves the draft (creating one from the latest version if needed). Published versions are never edited. */
export async function saveDraft(templateId: string, schemaInput: unknown, actor: Actor) {
  const parsed = formSchemaSchema.safeParse(schemaInput)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map((i) => i.message).slice(0, 5).join(' · ') }
  }
  await db().begin(async (tx) => {
    const [draft] = await tx<{ id: string }[]>`select id from zenith.form_versions where template_id = ${templateId} and status = 'draft' for update`
    if (draft) {
      await tx`update zenith.form_versions set schema = ${tx.json(parsed.data as never)} where id = ${draft.id}`
    } else {
      const [{ next }] = await tx<{ next: number }[]>`select coalesce(max(version), 0) + 1 as next from zenith.form_versions where template_id = ${templateId}`
      await tx`insert into zenith.form_versions (template_id, version, schema, created_by) values (${templateId}, ${next}, ${tx.json(parsed.data as never)}, ${actor.id})`
    }
    await audit(tx, actor, 'form.draft_saved', { type: 'form_template', id: templateId }, { fields: parsed.data.fields.length })
  })
  return { ok: true as const }
}

/** Freezes the draft as a new published version. Tournaments keep the version they were attached to. */
export async function publishDraft(templateId: string, actor: Actor) {
  return db().begin(async (tx) => {
    const [draft] = await tx<{ id: string; version: number; schema: unknown }[]>`
      select id, version, schema from zenith.form_versions where template_id = ${templateId} and status = 'draft' for update
    `
    if (!draft) throw new Error('There is no draft to publish.')
    formSchemaSchema.parse(draft.schema)
    await tx`update zenith.form_versions set status = 'superseded' where template_id = ${templateId} and status = 'published'`
    await tx`update zenith.form_versions set status = 'published', published_at = now() where id = ${draft.id}`
    await audit(tx, actor, 'form.published', { type: 'form_version', id: draft.id }, { version: draft.version })
    return draft.id
  })
}

export async function setGameAvailability(gameId: string, availability: 'active' | 'upcoming' | 'planned' | 'paused', actor: Actor) {
  await db()`update zenith.games set availability = ${availability} where id = ${gameId}`
  await audit(db(), actor, 'game.availability', { type: 'game', id: gameId }, { availability })
}

export async function setFormatEnabled(formatId: string, enabled: boolean, actor: Actor) {
  await db()`update zenith.game_formats set enabled = ${enabled} where id = ${formatId}`
  await audit(db(), actor, 'format.enabled', { type: 'game_format', id: formatId }, { enabled })
}

export async function updateGameRules(gameId: string, d: { uidLabel: string; uidHint: string; uidPattern: string }, actor: Actor) {
  try {
    new RegExp(d.uidPattern)
  } catch {
    throw new Error('The UID pattern is not a valid regular expression.')
  }
  await db()`update zenith.games set uid_label = ${d.uidLabel.trim()}, uid_hint = ${d.uidHint.trim()}, uid_pattern = ${d.uidPattern} where id = ${gameId}`
  await audit(db(), actor, 'game.rules', { type: 'game', id: gameId })
}

export async function registrationsDashboard() {
  const [row] = await db()<{ pending: number; waitlisted: number; approvedToday: number; openAlerts: number; liveTournaments: number }[]>`
    select (select count(*)::int from zenith.registrations where status = 'pending') as pending,
           (select count(*)::int from zenith.registrations where status = 'waitlisted') as waitlisted,
           (select count(*)::int from zenith.registrations where status = 'approved' and decided_at > now() - interval '1 day') as approved_today,
           (select count(*)::int from zenith.ac_alerts where status = 'open' and registration_id is not null) as open_alerts,
           (select count(*)::int from zenith.tournaments where status = 'published') as live_tournaments
  `
  return row
}
