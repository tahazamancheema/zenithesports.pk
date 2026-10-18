import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { saveTournament, setTournamentStatus } from '@/server/services/admin-tournaments'
import { canEditRoster, listMyRegistrations, updateMyMember, withdrawMine } from '@/server/services/account'
import { addSponsor, removeSponsor, setTournamentImage } from '@/server/services/branding'
import { getSponsors } from '@/server/services/catalog'
import { isPublicFile } from '@/server/services/content'
import { submitRegistration } from '@/server/services/registrations'
import { ADMIN, formatId, openTournament, pkPhone, pubgUid, sql, squad, uniq } from './support/fixtures'

async function image(w: number, h: number) {
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: { r: 40, g: 60, b: 90 } } }).png().toBuffer()
  return new File([new Uint8Array(buf)], 'img.png', { type: 'image/png' })
}

async function account(email = `p-${uniq()}@test.local`) {
  const s = sql()
  const [a] = await s<{ id: string }[]>`
    insert into zenith.accounts (id, email, email_verified) values (gen_random_uuid(), ${email}, true) returning id
  `
  await s.end()
  return a.id
}

describe('tournament presentation', () => {
  it('posters must be landscape and only become public once the tournament is published', async () => {
    const res = await saveTournament(null, { name: `Poster Cup ${uniq()}`, formatId: await formatId('pubg-mobile', 'squad'), startsAt: new Date(Date.now() + 9 * 86400_000).toISOString() }, ADMIN)
    if (!res.ok) throw new Error(res.error)
    await expect(setTournamentImage(res.id, 'poster', await image(400, 600), ADMIN)).rejects.toThrow(/landscape/)
    await setTournamentImage(res.id, 'poster', await image(1280, 720), ADMIN)
    const s = sql()
    const [{ posterFileId }] = await s<{ posterFileId: string }[]>`select poster_file_id as "posterFileId" from zenith.tournaments where id = ${res.id}`
    expect(await isPublicFile(posterFileId)).toBe(false) // draft
    await setTournamentStatus(res.id, 'published', null, ADMIN)
    expect(await isPublicFile(posterFileId)).toBe(true)
    await setTournamentImage(res.id, 'poster', null, ADMIN)
    expect(await isPublicFile(posterFileId)).toBe(false) // detached
    await s.end()
  })

  it('sponsors need a name and an https link, and can be removed', async () => {
    const t = await openTournament(saveTournament, setTournamentStatus)
    await expect(addSponsor(t.id, { name: 'Acme', tier: 'title', url: 'http://acme.example', logo: null }, ADMIN)).rejects.toThrow(/https/)
    await addSponsor(t.id, { name: 'Acme', tier: 'title', url: 'https://acme.example', logo: await image(200, 100) }, ADMIN)
    const list = (await getSponsors([t.id]))[t.id]
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ name: 'Acme', tier: 'title', url: 'https://acme.example/' })
    expect(await isPublicFile(list[0].logoFileId!)).toBe(true)
    await removeSponsor(list[0].id, ADMIN)
    expect((await getSponsors([t.id]))[t.id]).toBeUndefined()
  })
})

describe('player accounts', () => {
  it('lists only my registrations and lets only me withdraw or fix the roster', async () => {
    const me = await account()
    const other = await account()
    const t = await openTournament(saveTournament, setTournamentStatus)
    const r = await submitRegistration({
      tournamentSlug: t.slug,
      teamName: `Acct ${uniq()}`,
      contactPhone: pkPhone(),
      answers: {},
      members: squad('Acct'),
      files: new Map(),
      accountId: me,
    })
    if (!r.ok) throw new Error(r.error)

    const mine = await listMyRegistrations(me)
    expect(mine).toHaveLength(1)
    expect(mine[0].members).toHaveLength(4)
    expect(canEditRoster(mine[0])).toBe(true)
    expect(await listMyRegistrations(other)).toHaveLength(0)

    const member = mine[0].members[1]
    const newUid = pubgUid()
    expect((await updateMyMember(other, mine[0].id, member.id, { ign: 'Hijack', uid: newUid }, 'ip')).ok).toBe(false)
    expect((await updateMyMember(me, mine[0].id, member.id, { ign: 'Renamed', uid: newUid }, 'ip')).ok).toBe(true)
    expect((await listMyRegistrations(me))[0].members.find((m) => m.id === member.id)).toMatchObject({ ign: 'Renamed', uid: newUid })

    expect((await withdrawMine(other, mine[0].id, 'ip')).ok).toBe(false)
    expect((await withdrawMine(me, mine[0].id, 'ip')).ok).toBe(true)
    expect((await listMyRegistrations(me))[0].status).toBe('withdrawn')
  })
})
