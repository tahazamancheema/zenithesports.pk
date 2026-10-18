import { beforeAll, describe, expect, it } from 'vitest'
import { saveTournament, setTournamentStatus } from '@/server/services/admin-tournaments'
import {
  createFlag,
  liftFlag,
  listAlerts,
  manualEntry,
  reviewReport,
  runScan,
  setAlertStatus,
  submitReport,
} from '@/server/services/anticheat'
import { getRegistrationByToken, submitRegistration } from '@/server/services/registrations'
import { openTournament, pkPhone, png, pubgUid, sql, squad, staffActor, uniq } from './support/fixtures'
import type { Actor } from '@/server/audit'

let REVIEWER: Actor
beforeAll(async () => {
  REVIEWER = await staffActor()
})

async function register(slug: string, members = squad('R'), phone = pkPhone()) {
  const r = await submitRegistration({ tournamentSlug: slug, teamName: `T${Math.random().toString(36).slice(2, 7)}`, contactPhone: phone, answers: {}, members, files: new Map() })
  if (!r.ok) throw new Error(r.error)
  return r
}

async function alertsFor(registrationId: string) {
  return listAlerts({ registrationId })
}

describe('AntiCheat matching', () => {
  it('historical scan: a new flag finds registrations made before it existed', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const cheat = pubgUid()
    const r = await register(t.slug, squad('H', [pubgUid(), cheat, pubgUid(), pubgUid()]))
    const reg = (await getRegistrationByToken(r.manageToken))!
    expect(await alertsFor(reg.id)).toHaveLength(0)
    await createFlag(
      { gameId: 'pubg-mobile', subjectUid: cheat, subjectIgn: 'H2', category: 'cheating', severity: 'banned', summary: 'Confirmed aimbot', identifiers: [{ kind: 'game_uid', value: cheat, confidence: 'confirmed' }] },
      REVIEWER,
    )
    const alerts = await alertsFor(reg.id)
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].matchKind).toBe('game_uid')
    expect(alerts[0].confidence).toBe('confirmed')
  })

  it('ingestion: a flagged player registering raises an alert and is never auto-approved', async () => {
    const cheat = pubgUid()
    await createFlag(
      { gameId: 'pubg-mobile', subjectUid: cheat, category: 'ban_evasion', severity: 'banned', summary: 'Banned last season', identifiers: [{ kind: 'game_uid', value: cheat, confidence: 'confirmed' }] },
      REVIEWER,
    )
    const t = await openTournament(saveTournament, setTournamentStatus, { requiresApproval: '' })
    const r = await register(t.slug, squad('I', [pubgUid(), pubgUid(), cheat, pubgUid()]))
    expect(r.status).toBe('pending')
    const reg = (await getRegistrationByToken(r.manageToken))!
    expect((await alertsFor(reg.id)).length).toBeGreaterThan(0)
  })

  it('matches associated phone numbers as a reviewable indicator', async () => {
    const phone = pkPhone()
    const t = await openTournament(saveTournament, setTournamentStatus)
    const r = await register(t.slug, squad('Ph'), phone)
    await createFlag(
      { gameId: 'pubg-mobile', teamName: 'Banned Squad', category: 'cheating', severity: 'banned', summary: 'Team ban', identifiers: [{ kind: 'phone', value: phone, confidence: 'strong' }] },
      REVIEWER,
    )
    const reg = (await getRegistrationByToken(r.manageToken))!
    const alerts = await alertsFor(reg.id)
    expect(alerts.some((a) => a.matchKind === 'phone' && a.confidence === 'strong')).toBe(true)
  })

  it('rescans deduplicate alerts and keep reviewer decisions', async () => {
    const cheat = pubgUid()
    const t = await openTournament(saveTournament, setTournamentStatus)
    const r = await register(t.slug, squad('Dd', [cheat, pubgUid(), pubgUid(), pubgUid()]))
    const reg = (await getRegistrationByToken(r.manageToken))!
    const flagId = await createFlag(
      { gameId: 'pubg-mobile', subjectUid: cheat, category: 'cheating', severity: 'watch', summary: 'Watch', identifiers: [{ kind: 'game_uid', value: cheat, confidence: 'confirmed' }] },
      REVIEWER,
    )
    const before = await alertsFor(reg.id)
    const scan = await runScan({ trigger: 'manual', flagId, actor: REVIEWER })
    expect(scan.alertsCreated).toBe(0)
    expect(scan.alertsUpdated).toBeGreaterThan(0)
    const after = await alertsFor(reg.id)
    expect(after).toHaveLength(before.length)
    expect(after[0].detectionCount).toBe(before[0].detectionCount + 1)
    await expect(setAlertStatus(after[0].id, 'dismissed', '', REVIEWER)).rejects.toThrow(/note/)
    await setAlertStatus(after[0].id, 'dismissed', 'Different person, same UID typo', REVIEWER)
    await runScan({ trigger: 'manual', flagId, actor: REVIEWER })
    expect((await alertsFor(reg.id)).find((a) => a.id === after[0].id)?.status).toBe('dismissed')
  })

  it('manual entries go through the same matching as registrations', async () => {
    const cheat = pubgUid()
    await createFlag(
      { gameId: 'pubg-mobile', subjectUid: cheat, category: 'cheating', severity: 'banned', summary: 'Confirmed', identifiers: [{ kind: 'game_uid', value: cheat, confidence: 'confirmed' }] },
      REVIEWER,
    )
    const res = await manualEntry({ gameId: 'pubg-mobile', teamName: 'Offline Qualifier Team', players: [{ ign: 'Manual1', uid: cheat }, { ign: 'Manual2', uid: pubgUid() }] }, REVIEWER)
    expect(res.flagsMatched).toBeGreaterThan(0)
  })

  it('lifting a flag resolves its open alerts', async () => {
    const cheat = pubgUid()
    const t = await openTournament(saveTournament, setTournamentStatus)
    const r = await register(t.slug, squad('L', [cheat, pubgUid(), pubgUid(), pubgUid()]))
    const reg = (await getRegistrationByToken(r.manageToken))!
    const flagId = await createFlag(
      { gameId: 'pubg-mobile', subjectUid: cheat, category: 'other', severity: 'watch', summary: 'temp', identifiers: [{ kind: 'game_uid', value: cheat, confidence: 'indicator' }] },
      REVIEWER,
    )
    await liftFlag(flagId, 'Appeal upheld', REVIEWER)
    expect((await alertsFor(reg.id)).every((a) => a.status === 'resolved')).toBe(true)
  })
})

describe('public reports', () => {
  it('validates evidence, detects duplicates, and only approves with a confirmed UID match', async () => {
    const uid = pubgUid()
    const badFile = new File([new TextEncoder().encode('<script>alert(1)</script>')], 'x.png', { type: 'image/png' })
    const rejected = await submitReport({ gameId: 'pubg-mobile', uid, evidence: { report_confirmation: badFile }, ipHash: 'ip' })
    expect(rejected.ok).toBe(false)

    const same = await png(2)
    const identical = await submitReport({ gameId: 'pubg-mobile', uid, evidence: { report_confirmation: same, extra: await png(2) }, ipHash: 'ip' })
    expect(!identical.ok && identical.error).toMatch(/identical/)

    const first = await submitReport({ gameId: 'pubg-mobile', uid, ign: 'Sus', evidence: { report_confirmation: await png(3), extra: await png(4) }, ipHash: 'ip' })
    const second = await submitReport({ gameId: 'pubg-mobile', uid, evidence: { report_confirmation: await png(5) }, ipHash: 'ip' })
    expect(first.ok && second.ok).toBe(true)

    const s = sql()
    const reports = await s<{ id: string; duplicateOf: string | null }[]>`
      select id, duplicate_of as "duplicateOf" from zenith.ac_reports where reported_uid_raw = ${uid} order by created_at
    `
    expect(reports[1].duplicateOf).toBe(reports[0].id)

    // Pending reports create no flag; approval without a UID match is refused (app + database).
    const [{ n: flagsBefore }] = await s<{ n: number }[]>`select count(*)::int as n from zenith.ac_flag_identifiers where value_norm = ${uid}`
    expect(flagsBefore).toBe(0)
    await expect(reviewReport(reports[0].id, { decision: 'approve', uidMatch: false, reason: 'Looks right' }, REVIEWER)).rejects.toThrow(/UID/)
    await expect(s`update zenith.ac_reports set status = 'approved', reviewer_id = null where id = ${reports[0].id}`).rejects.toThrow()

    await reviewReport(reports[1].id, { decision: 'reject', uidMatch: false, reason: 'UID not visible in screenshot' }, REVIEWER)
    const res = await reviewReport(reports[0].id, { decision: 'approve', uidMatch: true, reason: 'UID matches; report confirmed', severity: 'banned' }, REVIEWER)
    expect(res.flagId).toBeTruthy()
    const [{ n: flagsAfter }] = await s<{ n: number }[]>`select count(*)::int as n from zenith.ac_flag_identifiers where value_norm = ${uid}`
    expect(flagsAfter).toBe(1)
    await expect(reviewReport(reports[0].id, { decision: 'reject', uidMatch: false, reason: 'again' }, REVIEWER)).rejects.toThrow(/already/)
    await s.end()
  })
})

describe('reports for every game', () => {
  it('PUBG Mobile and Free Fire need one successful-report screenshot plus the typed UID', async () => {
    const missing = await submitReport({ gameId: 'free-fire', uid: '123456789', evidence: {}, ipHash: 'ip' })
    expect(!missing.ok && missing.error).toMatch(/Successful report screenshot/)
    const ok = await submitReport({ gameId: 'free-fire', uid: '987654321', evidence: { report_confirmation: await png(41) }, ipHash: 'ip' })
    expect(ok.ok).toBe(true)
    const badUid = await submitReport({ gameId: 'free-fire', uid: 'abc', evidence: { report_confirmation: await png(42) }, ipHash: 'ip' })
    expect(!badUid.ok && badUid.fieldErrors?.uid).toBeTruthy()
  })

  it('VALORANT needs a Riot ID and a scoreboard screenshot; the clip must be an https link', async () => {
    const noTag = await submitReport({ gameId: 'valorant', uid: 'Player', evidence: { scoreboard: await png(51) }, ipHash: 'ip' })
    expect(!noTag.ok && noTag.fieldErrors?.uid).toBeTruthy()
    const noBoard = await submitReport({ gameId: 'valorant', uid: 'Player#EU1', evidence: { report_confirmation: await png(52) }, ipHash: 'ip' })
    expect(!noBoard.ok && noBoard.error).toMatch(/Scoreboard or match history/)
    const badClip = await submitReport({ gameId: 'valorant', uid: 'Player#EU1', clipUrl: 'javascript:alert(1)', evidence: { scoreboard: await png(53) }, ipHash: 'ip' })
    expect(!badClip.ok && badClip.fieldErrors?.clipUrl).toBeTruthy()
    const id = `Ace${uniq().slice(-6)}#PK1`
    const ok = await submitReport({ gameId: 'valorant', uid: id, matchDetails: 'Ascent, round 14', clipUrl: 'https://example.com/clip', evidence: { scoreboard: await png(54) }, ipHash: 'ip' })
    expect(ok.ok).toBe(true)
    const s = sql()
    const [row] = await s<{ videoUrl: string; matchDetails: string; kinds: string[] }[]>`
      select r.video_url as "videoUrl", r.match_details as "matchDetails", array_agg(e.kind) as kinds
        from zenith.ac_reports r join zenith.ac_report_evidence e on e.report_id = r.id
       where r.reported_uid_raw = ${id} group by r.id
    `
    expect(row).toMatchObject({ videoUrl: 'https://example.com/clip', matchDetails: 'Ascent, round 14', kinds: ['scoreboard'] })
    await s.end()
  })
})

describe('identity records', () => {
  it('a report without a name never overwrites the in-game name recorded at registration', async () => {
    const REVIEWER = await staffActor()
    const t = await openTournament(saveTournament, setTournamentStatus)
    const known = pubgUid()
    await register(t.slug, squad('Named', [known, pubgUid(), pubgUid(), pubgUid()]))
    const r = await submitReport({ gameId: 'pubg-mobile', uid: known, evidence: { report_confirmation: await png(21) }, ipHash: 'ip' })
    expect(r.ok).toBe(true)
    const s = sql()
    const [rep] = await s<{ id: string }[]>`select id from zenith.ac_reports where reported_uid_raw = ${known}`
    await reviewReport(rep.id, { decision: 'approve', uidMatch: true, reason: 'UID matches' }, REVIEWER)
    const [p] = await s<{ ign: string }[]>`
      select p.display_ign as ign from zenith.players p join zenith.player_identifiers i on i.player_id = p.id where i.value_norm = ${known}
    `
    expect(p.ign).toBe('Named1')
    await s.end()
  })
})
