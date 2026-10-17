import { describe, expect, it } from 'vitest'
import { saveTournament, setTournamentStatus } from '@/server/services/admin-tournaments'
import { getRegistrationByToken, submitRegistration, transition, withdrawByToken } from '@/server/services/registrations'
import { ADMIN, openTournament, pkPhone, pubgUid, sql, squad } from './support/fixtures'

const base = (slug: string, over: Partial<Parameters<typeof submitRegistration>[0]> = {}) => ({
  tournamentSlug: slug,
  teamName: `Team ${Math.random().toString(36).slice(2, 8)}`,
  contactPhone: pkPhone(),
  answers: {},
  members: squad('P'),
  files: new Map<string, File>(),
  ...over,
})

describe('registration', () => {
  it('registers a squad as pending and returns a private manage link', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const r = await submitRegistration(base(t.slug))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.status).toBe('pending')
    expect(r.reference).toMatch(/^ZR-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    const managed = await getRegistrationByToken(r.manageToken)
    expect(managed?.members).toHaveLength(4)
    expect(managed?.members[0].uidMasked).toContain('•')
    expect(await getRegistrationByToken('x'.repeat(32))).toBeNull()
  })

  it('validates roster size, UID format and in-form duplicates on the server', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const short = await submitRegistration(base(t.slug, { members: squad('S').slice(0, 3) }))
    expect(short.ok).toBe(false)
    const uid = pubgUid()
    const dupInForm = await submitRegistration(base(t.slug, { members: squad('D', [uid, uid, pubgUid(), pubgUid()]) }))
    expect(!dupInForm.ok && dupInForm.fieldErrors?.['m1.uid']).toBeTruthy()
    const badUid = await submitRegistration(base(t.slug, { members: squad('B', ['12', pubgUid(), pubgUid(), pubgUid()]) }))
    expect(!badUid.ok && badUid.fieldErrors?.['m0.uid']).toBeTruthy()
  })

  it('blocks the same player, team name or phone twice in one tournament', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const members = squad('A')
    const first = await submitRegistration(base(t.slug, { members, teamName: 'Night Owls', contactPhone: '03001112233' }))
    expect(first.ok).toBe(true)
    const samePlayer = await submitRegistration(base(t.slug, { members: [members[0], ...squad('X').slice(1)] }))
    expect(samePlayer.ok).toBe(false)
    const sameName = await submitRegistration(base(t.slug, { teamName: '  night   OWLS ' }))
    expect(sameName.ok).toBe(false)
    const samePhone = await submitRegistration(base(t.slug, { contactPhone: '+92 300 1112233' }))
    expect(samePhone.ok).toBe(false)
    // …but the same player may enter a different tournament.
    const t2 = await openTournament(saveTournament, setTournamentStatus)
    expect((await submitRegistration(base(t2.slug, { members }))).ok).toBe(true)
  })

  it('is concurrency-safe: two simultaneous entries with the same player → exactly one succeeds', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const shared = pubgUid()
    const a = base(t.slug, { members: squad('C', [shared, pubgUid(), pubgUid(), pubgUid()]) })
    const b = base(t.slug, { members: squad('D', [shared, pubgUid(), pubgUid(), pubgUid()]) })
    const results = await Promise.all([submitRegistration(a), submitRegistration(b)])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
  })

  it('waitlists when full and rejects when full without a waitlist', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus, { capacity: '1' })
    expect((await submitRegistration(base(t.slug))).ok && true).toBe(true)
    const second = await submitRegistration(base(t.slug))
    expect(second.ok && second.status).toBe('waitlisted')
    const t2 = await openTournament(saveTournament, setTournamentStatus, { capacity: '1', waitlistEnabled: '' })
    await submitRegistration(base(t2.slug))
    const over = await submitRegistration(base(t2.slug))
    expect(!over.ok && over.error).toMatch(/full/)
  })

  it('auto-approves only when the tournament does not require review', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus, { requiresApproval: '' })
    const r = await submitRegistration(base(t.slug))
    expect(r.ok && r.status).toBe('approved')
  })

  it('refuses closed and unpublished tournaments', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus, {
      registrationOpensAt: new Date(Date.now() + 86400_000).toISOString(),
    })
    const r = await submitRegistration(base(t.slug))
    expect(!r.ok && r.error).toMatch(/not opened/)
  })

  it('enforces legal status transitions and records history', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const r = await submitRegistration(base(t.slug))
    if (!r.ok) throw new Error(r.error)
    const managed = (await getRegistrationByToken(r.manageToken))!
    await transition(managed.id, 'approved', ADMIN, 'Looks good')
    await expect(transition(managed.id, 'pending', ADMIN)).rejects.toThrow()
    const s = sql()
    await expect(s`update zenith.registrations set status = 'pending' where id = ${managed.id}`).rejects.toThrow(/illegal/)
    const hist = await s<{ toStatus: string }[]>`select to_status as "toStatus" from zenith.registration_status_history where registration_id = ${managed.id} order by at`
    expect(hist.map((h) => h.toStatus)).toEqual(['pending', 'approved'])
    await s.end()
  })

  it('lets the captain withdraw, which frees the players to enter again', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const members = squad('W')
    const r = await submitRegistration(base(t.slug, { members }))
    if (!r.ok) throw new Error(r.error)
    expect((await withdrawByToken(r.manageToken, 'ip')).ok).toBe(true)
    expect((await withdrawByToken(r.manageToken, 'ip')).ok).toBe(false)
    expect((await submitRegistration(base(t.slug, { members }))).ok).toBe(true)
  })

  it('cancelling a tournament cancels its active entries', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    const r = await submitRegistration(base(t.slug))
    if (!r.ok) throw new Error(r.error)
    await expect(setTournamentStatus(t.id, 'cancelled', null, ADMIN)).rejects.toThrow(/reason/)
    await setTournamentStatus(t.id, 'cancelled', 'Venue unavailable', ADMIN)
    expect((await getRegistrationByToken(r.manageToken))?.status).toBe('cancelled')
  })
})
