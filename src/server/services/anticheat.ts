import 'server-only'
import { cleanText, normId, normName, toE164 } from '@/lib/normalize'
import { audit, PUBLIC_ACTOR, type Actor } from '../audit'
import { referenceCode } from '../crypto'
import { db, type Db } from '../db'
import { cleanClipUrl, reportRule, type EvidenceKind } from '@/lib/report-rules'
import { inspectImage, storeImage, UploadError, type InspectedImage } from '../files'
import { getSettings } from '../settings'
import { enqueue } from '../notify'
import { getGame } from './catalog'
import { addMembership, linkPhone, upsertPlayer, upsertTeam } from './identity'

const EVIDENCE_MAX_BYTES = 4 * 1024 * 1024
/** Evidence of unapproved reports is kept for review and appeal, then purged. */
const EVIDENCE_RETENTION_DAYS = 180

export type ReportStatus = 'pending' | 'needs_clarification' | 'approved' | 'rejected' | 'withdrawn'
export type AlertStatus = 'open' | 'acknowledged' | 'dismissed' | 'resolved'
export type Confidence = 'confirmed' | 'strong' | 'indicator'

// ─── public reports ─────────────────────────────────────────────────────────

export async function submitReport(input: {
  gameId: string
  uid: string
  ign?: string
  explanation?: string
  contact?: string
  clipUrl?: string
  matchDetails?: string
  evidence: Partial<Record<EvidenceKind, File | null>>
  ipHash: string
  accountId?: string | null
}): Promise<{ ok: true; reference: string } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  const game = await getGame(input.gameId)
  const enabled = (await getSettings())['product.anticheat'].games
  if (!game || !enabled.includes(game.id)) return { ok: false, error: 'Reports for this game are not open yet.' }
  const rule = reportRule(game.id)
  const fe: Record<string, string> = {}
  const uidRaw = input.uid.trim()
  if (!new RegExp(game.uidPattern).test(uidRaw)) fe.uid = `Enter the player's ${game.uidLabel} exactly as shown in game.`
  const ign = cleanText(input.ign)
  if (ign.length > 40) fe.ign = 'In-game name can be at most 40 characters.'
  const explanation = (input.explanation ?? '').trim()
  if (explanation.length > 2000) fe.explanation = 'Keep the explanation under 2,000 characters.'
  const contact = cleanText(input.contact)
  if (contact.length > 120) fe.contact = 'Contact details are too long.'
  const matchDetails = rule.matchDetails ? cleanText(input.matchDetails) : ''
  if (matchDetails.length > 300) fe.matchDetails = 'Keep the match details under 300 characters.'
  const clip = rule.clip ? cleanClipUrl(input.clipUrl) : { ok: true as const, url: null }
  if (!clip.ok) fe.clipUrl = 'Paste a full https:// link to the clip, or leave it empty.'
  if (Object.keys(fe).length) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: fe }

  // Each evidence slot the game defines: required ones must be present; optional ones are kept if attached.
  const images: { kind: EvidenceKind; img: InspectedImage }[] = []
  try {
    for (const slot of rule.evidence) {
      const f = input.evidence[slot.kind]
      const attached = f && typeof f !== 'string' && f.size > 0
      if (!attached && !slot.required) continue
      images.push({ kind: slot.kind, img: await inspectImage(f, { maxBytes: EVIDENCE_MAX_BYTES, label: slot.label }) })
    }
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, error: e.message }
    throw e
  }
  if (new Set(images.map((x) => x.img.sha256)).size !== images.length) {
    return { ok: false, error: 'Two of the screenshots are identical. Upload each screenshot once.' }
  }

  const uidNorm = normId(uidRaw)!
  const reference = referenceCode('ZA')
  await db().begin(async (tx) => {
    // Duplicate detection: an open report for the same UID, or evidence seen before.
    const [dup] = await tx<{ id: string }[]>`
      select id from zenith.ac_reports
       where game_id = ${game.id} and reported_uid_norm = ${uidNorm} and status in ('pending', 'needs_clarification')
       order by created_at limit 1
    `
    const [reused] = await tx`
      select 1 from zenith.files f join zenith.ac_report_evidence e on e.file_id = f.id
       where f.sha256 = any(${images.map((x) => x.img.sha256)}::text[]) limit 1
    `
    const [r] = await tx<{ id: string }[]>`
      insert into zenith.ac_reports
        (reference, game_id, reported_uid_raw, reported_uid_norm, reported_ign, explanation, reporter_contact,
         match_details, video_url, account_id, duplicate_of, evidence_reused, retention_until, ip_hash)
      values
        (${reference}, ${game.id}, ${uidRaw}, ${uidNorm}, ${ign || null}, ${explanation || null}, ${contact || null},
         ${matchDetails || null}, ${clip.ok ? clip.url : null}, ${input.accountId ?? null},
         ${dup?.id ?? null}, ${Boolean(reused)}, now() + make_interval(days => ${EVIDENCE_RETENTION_DAYS}), ${input.ipHash})
      returning id
    `
    for (const x of images) {
      const fileId = await storeImage(tx, x.img, 'evidence', EVIDENCE_RETENTION_DAYS)
      await tx`insert into zenith.ac_report_evidence (report_id, kind, file_id) values (${r.id}, ${x.kind}, ${fileId})`
    }
    await audit(tx, { ...PUBLIC_ACTOR, surface: 'anticheat', ipHash: input.ipHash }, 'report.submitted', { type: 'ac_report', id: r.id }, {
      game: game.id,
      evidence: images.map((x) => x.kind),
      duplicate: Boolean(dup),
      evidenceReused: Boolean(reused),
      signedIn: Boolean(input.accountId),
    })
    await enqueue(tx, { channel: 'discord', subject: 'AntiCheat report received', body: `${game.name} · ${reference} · awaiting review` })
  })
  return { ok: true, reference }
}

export async function listReports(f: { status?: string; page?: number }) {
  const page = Math.max(1, f.page ?? 1)
  const sql = db()
  const rows = await sql<
    {
      id: string
      reference: string
      gameId: string
      reportedUidRaw: string
      reportedIgn: string | null
      status: ReportStatus
      createdAt: Date
      duplicateOf: string | null
      evidenceReused: boolean
      priorFlags: number
      sameUidReports: number
    }[]
  >`
    select r.id, r.reference, r.game_id, r.reported_uid_raw, r.reported_ign, r.status, r.created_at, r.duplicate_of, r.evidence_reused,
           (select count(*)::int from zenith.ac_flag_identifiers i join zenith.ac_flags fl on fl.id = i.flag_id
             where i.kind = 'game_uid' and i.value_norm = r.reported_uid_norm and fl.status = 'active') as prior_flags,
           (select count(*)::int from zenith.ac_reports o where o.reported_uid_norm = r.reported_uid_norm and o.game_id = r.game_id) as same_uid_reports
      from zenith.ac_reports r
     where (${f.status ?? null}::text is null or r.status = ${f.status ?? null})
     order by case r.status when 'pending' then 0 when 'needs_clarification' then 1 else 2 end, r.created_at
     limit 50 offset ${(page - 1) * 50}
  `
  return rows
}

export async function getReport(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const sql = db()
  const [r] = await sql<
    {
      id: string
      reference: string
      gameId: string
      reportedUidRaw: string
      reportedUidNorm: string
      reportedIgn: string | null
      explanation: string | null
      reporterContact: string | null
      matchDetails: string | null
      videoUrl: string | null
      status: ReportStatus
      uidMatchVerified: boolean | null
      duplicateOf: string | null
      evidenceReused: boolean
      reviewerId: string | null
      reviewedAt: Date | null
      decisionReason: string | null
      flagId: string | null
      createdAt: Date
      retentionUntil: Date | null
      reviewerEmail: string | null
    }[]
  >`
    select r.*, u.email as reviewer_email from zenith.ac_reports r
      left join zenith.staff_users u on u.id = r.reviewer_id where r.id = ${id}
  `
  if (!r) return null
  const evidence = await sql<{ kind: string; fileId: string; purgedAt: Date | null; width: number; height: number }[]>`
    select e.kind, e.file_id, f.purged_at, f.width, f.height
      from zenith.ac_report_evidence e join zenith.files f on f.id = e.file_id where e.report_id = ${id}
  `
  // Existing records for the same identifier, to help the reviewer.
  const known = await sql<{ playerId: string; displayIgn: string; registrations: number; flags: number }[]>`
    select p.id as player_id, p.display_ign,
           (select count(*)::int from zenith.registration_members m where m.player_id = p.id) as registrations,
           (select count(*)::int from zenith.ac_flags fl where fl.player_id = p.id and fl.status = 'active') as flags
      from zenith.player_identifiers pi join zenith.players p on p.id = pi.player_id
     where pi.game_id = ${r.gameId} and pi.value_norm = ${r.reportedUidNorm}
  `
  const related = await sql<{ id: string; reference: string; status: string; createdAt: Date }[]>`
    select id, reference, status, created_at from zenith.ac_reports
     where game_id = ${r.gameId} and reported_uid_norm = ${r.reportedUidNorm} and id <> ${id} order by created_at desc limit 20
  `
  const notes = await notesFor('report', id)
  return { ...r, evidence, known, related, notes }
}

/** Is this file evidence of some report? Used by the evidence route. */
export async function isEvidenceFile(fileId: string) {
  const [row] = await db()`select 1 from zenith.ac_report_evidence where file_id = ${fileId}`
  return Boolean(row)
}

export class ReviewError extends Error {}

export async function reviewReport(
  id: string,
  d: {
    decision: 'approve' | 'reject' | 'needs_clarification'
    uidMatch: boolean
    reason: string
    note?: string
    severity?: 'watch' | 'suspended' | 'banned'
    category?: 'cheating' | 'ban_evasion' | 'account_sharing' | 'misconduct' | 'other'
  },
  actor: Actor,
) {
  const reason = d.reason.trim()
  if (reason.length < 3) throw new ReviewError('Record a reason for the decision.')
  // The core rule: no verified flag unless a reviewer confirmed the UID in the evidence.
  if (d.decision === 'approve' && !d.uidMatch) {
    throw new ReviewError('A report can only be approved after you confirm the UID matches the screenshot evidence.')
  }
  const result = await db().begin(async (tx) => {
    const [r] = await tx<{ status: ReportStatus; gameId: string; reportedUidRaw: string; reportedIgn: string | null }[]>`
      select status, game_id, reported_uid_raw, reported_ign from zenith.ac_reports where id = ${id} for update
    `
    if (!r) throw new ReviewError('Report not found.')
    if (r.status === 'approved' || r.status === 'rejected' || r.status === 'withdrawn') {
      throw new ReviewError('This report has already been decided.')
    }
    const status = d.decision === 'approve' ? 'approved' : d.decision === 'reject' ? 'rejected' : 'needs_clarification'
    let flagId: string | null = null
    if (status === 'approved') {
      // Read through the open transaction; never a second pooled connection mid-transaction.
      const [game] = await tx<{ uidKind: string }[]>`select uid_kind from zenith.games where id = ${r.gameId}`
      const playerId = await upsertPlayer(tx, {
        gameId: r.gameId,
        uidKind: game?.uidKind ?? 'game_uid',
        uidRaw: r.reportedUidRaw,
        ign: r.reportedIgn || 'Unknown',
        source: 'report',
      })
      flagId = await insertFlag(tx, {
        gameId: r.gameId,
        playerId,
        category: d.category ?? 'cheating',
        severity: d.severity ?? 'banned',
        summary: `Verified player report: ${reason}`.slice(0, 300),
        sourceReportId: id,
        identifiers: [{ kind: 'game_uid', value: r.reportedUidRaw, confidence: 'confirmed' }],
        actor,
      })
    }
    await tx`
      update zenith.ac_reports
         set status = ${status}, uid_match_verified = ${d.uidMatch}, reviewer_id = ${actor.id}, reviewed_at = now(),
             decision_reason = ${reason}, flag_id = ${flagId},
             retention_until = case when ${status} = 'approved' then null else retention_until end
       where id = ${id}
    `
    if (status === 'approved') {
      await tx`update zenith.files set retention_until = null where id in (select file_id from zenith.ac_report_evidence where report_id = ${id})`
    }
    if (d.note?.trim()) await addNote(tx, 'report', id, d.note, actor)
    await audit(tx, actor, `report.${status}`, { type: 'ac_report', id }, { uidMatch: d.uidMatch, flagId })
    await tx`select zenith.emit('anticheat', 'report.reviewed', ${id}::uuid, '{}'::jsonb)`
    return { status, flagId }
  })
  // Approval establishes a flag: scan the full history for it.
  if (result.flagId) await runScan({ trigger: 'flag_created', flagId: result.flagId, actor })
  return result
}

// ─── flags ──────────────────────────────────────────────────────────────────

type IdentifierInput = { kind: 'game_uid' | 'phone' | 'team_name' | 'ign'; value: string; confidence: Confidence; note?: string }

export function normaliseIdentifier(kind: IdentifierInput['kind'], value: string): string | null {
  if (kind === 'phone') return toE164(value)
  if (kind === 'game_uid') return normId(value)
  return normName(value)
}

async function insertFlag(
  tx: Db,
  f: {
    gameId: string
    playerId?: string | null
    teamId?: string | null
    category: string
    severity: string
    summary: string
    recordId?: string | null
    sourceReportId?: string | null
    expiresAt?: Date | null
    identifiers: IdentifierInput[]
    actor: Actor
  },
) {
  const [flag] = await tx<{ id: string }[]>`
    insert into zenith.ac_flags (game_id, player_id, team_id, category, severity, summary, record_id, source_report_id, expires_at, created_by)
    values (${f.gameId}, ${f.playerId ?? null}, ${f.teamId ?? null}, ${f.category}, ${f.severity}, ${f.summary},
            ${f.recordId ?? null}, ${f.sourceReportId ?? null}, ${f.expiresAt ?? null}, ${f.actor.id})
    returning id
  `
  for (const i of f.identifiers) {
    const norm = normaliseIdentifier(i.kind, i.value)
    if (!norm) throw new ReviewError(`"${i.value}" is not a valid ${i.kind.replace('_', ' ')}.`)
    await tx`
      insert into zenith.ac_flag_identifiers (flag_id, kind, value_norm, confidence, note)
      values (${flag.id}, ${i.kind}, ${norm}, ${i.confidence}, ${i.note ?? null})
      on conflict (flag_id, kind, value_norm) do nothing
    `
  }
  await audit(tx, f.actor, 'flag.created', { type: 'ac_flag', id: flag.id }, {
    severity: f.severity,
    category: f.category,
    identifiers: f.identifiers.map((i) => ({ kind: i.kind, confidence: i.confidence })),
  })
  return flag.id
}

export async function createFlag(
  input: {
    gameId: string
    subjectUid?: string
    subjectIgn?: string
    teamName?: string
    category: 'cheating' | 'ban_evasion' | 'account_sharing' | 'misconduct' | 'other'
    severity: 'watch' | 'suspended' | 'banned'
    summary: string
    decision?: { title: string; text: string }
    expiresAt?: Date | null
    identifiers: IdentifierInput[]
  },
  actor: Actor,
) {
  const game = await getGame(input.gameId)
  if (!game) throw new ReviewError('Unknown game.')
  if (input.summary.trim().length < 3) throw new ReviewError('Add a short summary of the decision.')
  // A decision about a named player always matches on that player's UID.
  const subjectUid = input.subjectUid?.trim()
  if (subjectUid && !input.identifiers.some((i) => i.kind === 'game_uid' && i.value.trim() === subjectUid)) {
    input = { ...input, identifiers: [{ kind: 'game_uid', value: subjectUid, confidence: 'confirmed' }, ...input.identifiers] }
  }
  if (!input.identifiers.length) throw new ReviewError('Add at least one identifier to match on.')
  const flagId = await db().begin(async (tx) => {
    let playerId: string | null = null
    if (input.subjectUid?.trim()) {
      if (!new RegExp(game.uidPattern).test(input.subjectUid.trim())) throw new ReviewError(`Enter a valid ${game.uidLabel}.`)
      playerId = await upsertPlayer(tx, {
        gameId: game.id,
        uidKind: game.uidKind,
        uidRaw: input.subjectUid,
        ign: cleanText(input.subjectIgn) || 'Unknown',
        source: 'manual',
      })
    }
    const teamId = input.teamName?.trim() ? await upsertTeam(tx, game.id, cleanText(input.teamName), 'manual') : null
    let recordId: string | null = null
    if (input.decision?.title.trim()) {
      const [rec] = await tx<{ id: string }[]>`
        insert into zenith.ac_disciplinary_records (game_id, title, decision, decided_by, team_id)
        values (${game.id}, ${input.decision.title.trim()}, ${input.decision.text.trim()}, ${actor.id}, ${teamId})
        returning id
      `
      recordId = rec.id
    }
    return insertFlag(tx, { ...input, gameId: game.id, playerId, teamId, recordId, actor })
  })
  await runScan({ trigger: 'flag_created', flagId, actor })
  return flagId
}

export async function liftFlag(id: string, reason: string, actor: Actor) {
  if (reason.trim().length < 3) throw new ReviewError('Record why the flag is being lifted.')
  await db().begin(async (tx) => {
    const [f] = await tx<{ status: string }[]>`select status from zenith.ac_flags where id = ${id} for update`
    if (!f) throw new ReviewError('Flag not found.')
    if (f.status !== 'active') throw new ReviewError('This flag is not active.')
    await tx`update zenith.ac_flags set status = 'lifted', lifted_at = now(), lifted_by = ${actor.id}, lift_reason = ${reason.trim()} where id = ${id}`
    const open = await tx<{ id: string; status: string }[]>`
      update zenith.ac_alerts set status = 'resolved', reviewed_by = ${actor.id}, reviewed_at = now(), resolution_note = 'Flag lifted'
       where flag_id = ${id} and status in ('open', 'acknowledged')
      returning id, 'open' as status
    `
    for (const a of open) {
      await tx`insert into zenith.ac_alert_history (alert_id, from_status, to_status, changed_by, note) values (${a.id}, ${a.status}, 'resolved', ${actor.id}, 'Flag lifted')`
    }
    await audit(tx, actor, 'flag.lifted', { type: 'ac_flag', id }, { alertsResolved: open.length })
  })
}

export async function listFlags(status = 'active') {
  return db()<
    {
      id: string
      gameId: string
      category: string
      severity: string
      summary: string
      status: string
      createdAt: Date
      playerIgn: string | null
      teamName: string | null
      identifiers: { kind: string; confidence: string }[]
      openAlerts: number
    }[]
  >`
    select fl.id, fl.game_id, fl.category, fl.severity, fl.summary, fl.status, fl.created_at,
           p.display_ign as player_ign, tm.name as team_name,
           coalesce((select json_agg(json_build_object('kind', i.kind, 'confidence', i.confidence))
                       from zenith.ac_flag_identifiers i where i.flag_id = fl.id), '[]') as identifiers,
           (select count(*)::int from zenith.ac_alerts a where a.flag_id = fl.id and a.status = 'open') as open_alerts
      from zenith.ac_flags fl
      left join zenith.players p on p.id = fl.player_id
      left join zenith.teams tm on tm.id = fl.team_id
     where (${status}::text = 'all' or fl.status = ${status})
     order by fl.created_at desc limit 200
  `
}

export async function getFlag(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const sql = db()
  const [f] = await sql<Record<string, unknown>[]>`
    select fl.*, p.display_ign as player_ign, tm.name as team_name, rec.title as record_title, rec.decision as record_decision,
           u.email as created_by_email
      from zenith.ac_flags fl
      left join zenith.players p on p.id = fl.player_id
      left join zenith.teams tm on tm.id = fl.team_id
      left join zenith.ac_disciplinary_records rec on rec.id = fl.record_id
      left join zenith.staff_users u on u.id = fl.created_by
     where fl.id = ${id}
  `
  if (!f) return null
  const identifiers = await sql<{ id: string; kind: string; valueNorm: string; confidence: string; note: string | null }[]>`
    select id, kind, value_norm, confidence, note from zenith.ac_flag_identifiers where flag_id = ${id} order by created_at
  `
  const notes = await notesFor('flag', id)
  return { flag: f, identifiers, notes }
}

/** Add an identifier to an active flag (e.g. a phone number confirmed later) and rescan. */
export async function addFlagIdentifier(flagId: string, i: IdentifierInput, actor: Actor) {
  const norm = normaliseIdentifier(i.kind, i.value)
  if (!norm) throw new ReviewError(`"${i.value}" is not a valid ${i.kind.replace('_', ' ')}.`)
  await db().begin(async (tx) => {
    const [f] = await tx<{ status: string }[]>`select status from zenith.ac_flags where id = ${flagId}`
    if (f?.status !== 'active') throw new ReviewError('Identifiers can only be added to an active flag.')
    await tx`
      insert into zenith.ac_flag_identifiers (flag_id, kind, value_norm, confidence, note)
      values (${flagId}, ${i.kind}, ${norm}, ${i.confidence}, ${i.note ?? null}) on conflict do nothing
    `
    await audit(tx, actor, 'flag.identifier_added', { type: 'ac_flag', id: flagId }, { kind: i.kind, confidence: i.confidence })
  })
  await runScan({ trigger: 'rule_update', flagId, actor })
}

// ─── scans ──────────────────────────────────────────────────────────────────

const SCAN_BATCH = 25

/**
 * Historical scan. One flag, or every active flag in batches of 25 with a
 * resumable cursor. Alerts are deduplicated by the database.
 */
export async function runScan(opts: {
  trigger: 'flag_created' | 'manual' | 'rule_update' | 'import' | 'manual_entry'
  flagId?: string
  actor: Actor
  resumeRunId?: string
}) {
  const sql = db()
  let runId = opts.resumeRunId
  let cursor: string | null = null
  if (runId) {
    const [run] = await sql<{ cursorFlagId: string | null; status: string }[]>`select cursor_flag_id, status from zenith.ac_scan_runs where id = ${runId}`
    if (!run || run.status === 'completed') throw new ReviewError('Nothing to resume.')
    cursor = run.cursorFlagId
    await sql`update zenith.ac_scan_runs set status = 'running', error = null where id = ${runId}`
  } else {
    const [{ total }] = await sql<{ total: number }[]>`
      select count(*)::int as total from zenith.ac_flags where status = 'active' and (${opts.flagId ?? null}::uuid is null or id = ${opts.flagId ?? null}::uuid)
    `
    const [run] = await sql<{ id: string }[]>`
      insert into zenith.ac_scan_runs (trigger, flag_id, flags_total, requested_by)
      values (${opts.trigger}, ${opts.flagId ?? null}, ${total}, ${opts.actor.id}) returning id
    `
    runId = run.id
  }

  try {
    for (;;) {
      const batch = await sql<{ id: string }[]>`
        select id from zenith.ac_flags
         where status = 'active'
           and (${opts.flagId ?? null}::uuid is null or id = ${opts.flagId ?? null}::uuid)
           and (${cursor}::uuid is null or id > ${cursor}::uuid)
         order by id limit ${SCAN_BATCH}
      `
      if (!batch.length) break
      await sql.begin(async (tx) => {
        let created = 0
        let updated = 0
        for (const f of batch) {
          const [r] = await tx<{ created: number; updated: number }[]>`select * from zenith.ac_scan_flag(${f.id}, ${runId!}::uuid, null)`
          created += r.created
          updated += r.updated
        }
        cursor = batch[batch.length - 1].id
        await tx`
          update zenith.ac_scan_runs
             set flags_done = flags_done + ${batch.length}, alerts_created = alerts_created + ${created},
                 alerts_updated = alerts_updated + ${updated}, cursor_flag_id = ${cursor}
           where id = ${runId!}
        `
      })
      if (batch.length < SCAN_BATCH) break
    }
    await sql`update zenith.ac_scan_runs set status = 'completed', finished_at = now() where id = ${runId!}`
    await audit(sql, opts.actor, 'scan.completed', { type: 'ac_scan_run', id: runId! }, { trigger: opts.trigger })
  } catch (e) {
    await sql`update zenith.ac_scan_runs set status = 'failed', error = ${String((e as Error).message).slice(0, 300)}, finished_at = now() where id = ${runId!}`
    throw e
  }
  const [done] = await sql<{ alertsCreated: number; alertsUpdated: number; flagsDone: number }[]>`
    select alerts_created, alerts_updated, flags_done from zenith.ac_scan_runs where id = ${runId!}
  `
  return { runId: runId!, ...done }
}

export async function listScanRuns() {
  return db()<
    { id: string; trigger: string; status: string; flagsTotal: number; flagsDone: number; alertsCreated: number; alertsUpdated: number; startedAt: Date; finishedAt: Date | null; error: string | null }[]
  >`select * from zenith.ac_scan_runs order by started_at desc limit 20`
}

// ─── alerts ─────────────────────────────────────────────────────────────────

export const ALERT_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  open: ['acknowledged', 'dismissed', 'resolved'],
  acknowledged: ['dismissed', 'resolved', 'open'],
  dismissed: ['open'],
  resolved: ['open'],
}

export async function listAlerts(f: { status?: string; registrationId?: string; tournamentId?: string; flagId?: string; page?: number }) {
  const page = Math.max(1, f.page ?? 1)
  return db()<
    {
      id: string
      flagId: string
      gameId: string
      matchKind: string
      confidence: Confidence
      entityType: string
      entityId: string
      registrationId: string | null
      tournamentId: string | null
      matchedValue: string
      status: AlertStatus
      firstDetectedAt: Date
      lastDetectedAt: Date
      detectionCount: number
      flagSeverity: string
      flagSummary: string
      registrationRef: string | null
      teamName: string | null
      tournamentName: string | null
    }[]
  >`
    select a.*, fl.severity as flag_severity, fl.summary as flag_summary,
           r.reference as registration_ref, r.team_name, t.name as tournament_name
      from zenith.ac_alerts a
      join zenith.ac_flags fl on fl.id = a.flag_id
      left join zenith.registrations r on r.id = a.registration_id
      left join zenith.tournaments t on t.id = a.tournament_id
     where (${f.status ?? null}::text is null or a.status = ${f.status ?? null})
       and (${f.registrationId ?? null}::uuid is null or a.registration_id = ${f.registrationId ?? null}::uuid)
       and (${f.tournamentId ?? null}::uuid is null or a.tournament_id = ${f.tournamentId ?? null}::uuid)
       and (${f.flagId ?? null}::uuid is null or a.flag_id = ${f.flagId ?? null}::uuid)
     order by case a.status when 'open' then 0 when 'acknowledged' then 1 else 2 end,
              case a.confidence when 'confirmed' then 0 when 'strong' then 1 else 2 end,
              a.last_detected_at desc
     limit 50 offset ${(page - 1) * 50}
  `
}

export async function setAlertStatus(id: string, to: AlertStatus, note: string | null, actor: Actor) {
  await db().begin(async (tx) => {
    const [a] = await tx<{ status: AlertStatus }[]>`select status from zenith.ac_alerts where id = ${id} for update`
    if (!a) throw new ReviewError('Alert not found.')
    if (!ALERT_TRANSITIONS[a.status].includes(to)) throw new ReviewError(`An ${a.status} alert cannot become ${to}.`)
    if ((to === 'dismissed' || to === 'resolved') && !note?.trim()) throw new ReviewError('Add a note explaining the outcome.')
    await tx`
      update zenith.ac_alerts set status = ${to}, reviewed_by = ${actor.id}, reviewed_at = now(),
             resolution_note = coalesce(${note?.trim() || null}, resolution_note)
       where id = ${id}
    `
    await tx`insert into zenith.ac_alert_history (alert_id, from_status, to_status, changed_by, note) values (${id}, ${a.status}, ${to}, ${actor.id}, ${note?.trim() || null})`
    await audit(tx, actor, 'alert.status', { type: 'ac_alert', id }, { from: a.status, to })
    await tx`select zenith.emit('anticheat', 'alert.status', ${id}::uuid, '{}'::jsonb)`
  })
}

export async function getAlertHistory(id: string) {
  return db()<{ fromStatus: string | null; toStatus: string; note: string | null; at: Date; email: string | null }[]>`
    select h.from_status, h.to_status, h.note, h.at, u.email from zenith.ac_alert_history h
      left join zenith.staff_users u on u.id = h.changed_by where h.alert_id = ${id} order by h.at desc
  `
}

// ─── manual entry (same path as ingestion) ──────────────────────────────────

export async function manualEntry(
  input: { gameId: string; teamName?: string; players: { ign: string; uid: string; phone?: string; role?: 'captain' | 'player' | 'substitute' }[] },
  actor: Actor,
) {
  const game = await getGame(input.gameId)
  if (!game) throw new ReviewError('Unknown game.')
  if (!input.players.length) throw new ReviewError('Add at least one player.')
  const re = new RegExp(game.uidPattern)
  for (const [i, p] of input.players.entries()) {
    if (cleanText(p.ign).length < 2) throw new ReviewError(`Player ${i + 1}: in-game name is required.`)
    if (!re.test(p.uid.trim())) throw new ReviewError(`Player ${i + 1}: enter a valid ${game.uidLabel}.`)
    if (p.phone?.trim() && !toE164(p.phone)) throw new ReviewError(`Player ${i + 1}: the phone number is not valid.`)
  }
  const touched = await db().begin(async (tx) => {
    const teamId = input.teamName?.trim() ? await upsertTeam(tx, game.id, cleanText(input.teamName), 'manual') : null
    const values: { kind: string; value: string }[] = []
    for (const [i, p] of input.players.entries()) {
      const playerId = await upsertPlayer(tx, { gameId: game.id, uidKind: game.uidKind, uidRaw: p.uid, ign: cleanText(p.ign), source: 'manual' })
      values.push({ kind: 'game_uid', value: normId(p.uid)! }, { kind: 'ign', value: normName(p.ign)! })
      const phone = p.phone?.trim() ? toE164(p.phone) : null
      if (phone) {
        await linkPhone(tx, playerId, phone, 'manual')
        values.push({ kind: 'phone', value: phone })
      }
      if (teamId) await addMembership(tx, { teamId, playerId, role: p.role ?? (i === 0 ? 'captain' : 'player'), source: 'manual' })
    }
    if (input.teamName?.trim()) values.push({ kind: 'team_name', value: normName(input.teamName)! })
    await audit(tx, actor, 'anticheat.manual_entry', { type: 'team', id: teamId }, { players: input.players.length })
    // Flags whose identifiers touch anything just entered.
    const flags = await tx<{ flagId: string }[]>`
      select distinct i.flag_id from zenith.ac_flag_identifiers i join zenith.ac_flags fl on fl.id = i.flag_id and fl.status = 'active'
       where (i.kind, i.value_norm) in (
         select * from unnest(${values.map((v) => v.kind)}::text[], ${values.map((v) => v.value)}::text[])
       )
    `
    return flags.map((f) => f.flagId)
  })
  let alerts = 0
  for (const flagId of touched) {
    const r = await runScan({ trigger: 'manual_entry', flagId, actor })
    alerts += r.alertsCreated
  }
  return { flagsMatched: touched.length, alertsCreated: alerts }
}

// ─── investigation notes ────────────────────────────────────────────────────

export async function addNote(conn: Db, subjectType: 'report' | 'flag' | 'alert' | 'player' | 'team', subjectId: string, body: string, actor: Actor) {
  const text = body.trim().slice(0, 4000)
  if (!text) return
  await conn`insert into zenith.ac_notes (subject_type, subject_id, author_id, body) values (${subjectType}, ${subjectId}, ${actor.id}, ${text})`
  await audit(conn, actor, 'note.added', { type: subjectType, id: subjectId })
}

export async function notesFor(subjectType: string, subjectId: string) {
  return db()<{ id: string; body: string; createdAt: Date; email: string | null }[]>`
    select n.id, n.body, n.created_at, u.email from zenith.ac_notes n left join zenith.staff_users u on u.id = n.author_id
     where n.subject_type = ${subjectType} and n.subject_id = ${subjectId} order by n.created_at desc
  `
}

/** Purge evidence bytes whose retention window has passed (unapproved reports only). */
export async function purgeExpiredEvidence(actor: Actor) {
  const rows = await db()<{ id: string }[]>`
    update zenith.files set data = null, purged_at = now()
     where purpose = 'evidence' and purged_at is null and retention_until is not null and retention_until < now()
    returning id
  `
  await audit(db(), actor, 'evidence.purged_expired', { type: 'files', id: null }, { count: rows.length })
  return rows.length
}

export async function purgeReportEvidence(reportId: string, actor: Actor) {
  const rows = await db()<{ id: string }[]>`
    update zenith.files set data = null, purged_at = now()
     where id in (select file_id from zenith.ac_report_evidence where report_id = ${reportId}) and purged_at is null
    returning id
  `
  await audit(db(), actor, 'evidence.purged', { type: 'ac_report', id: reportId }, { files: rows.length })
  return rows.length
}

export async function anticheatOverview() {
  const [row] = await db()<{ pendingReports: number; openAlerts: number; activeFlags: number; clarification: number }[]>`
    select (select count(*)::int from zenith.ac_reports where status = 'pending') as pending_reports,
           (select count(*)::int from zenith.ac_reports where status = 'needs_clarification') as clarification,
           (select count(*)::int from zenith.ac_alerts where status = 'open') as open_alerts,
           (select count(*)::int from zenith.ac_flags where status = 'active') as active_flags
  `
  return row
}
