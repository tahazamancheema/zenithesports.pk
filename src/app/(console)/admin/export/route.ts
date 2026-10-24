import { audit } from '@/server/audit'
import { actorOf, getStaff } from '@/server/auth/session'
import { db } from '@/server/db'
import { can } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/** Neutralise spreadsheet formula injection and quote every cell. */
function cell(v: unknown) {
  let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(req: Request) {
  const staff = await getStaff()
  if (!staff || staff.mustChangePassword || !can(staff.roles, 'registrations.export')) return new Response('Forbidden', { status: 403 })
  // Same-origin only: a cross-site page cannot make a signed-in admin download this.
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return new Response('Forbidden', { status: 403 })
  const url = new URL(req.url)
  const tournament = url.searchParams.get('tournament')
  const status = url.searchParams.get('status')
  const rows = await db()<Record<string, unknown>[]>`
    select r.reference, t.name as tournament, r.status, r.team_name, r.contact_phone_e164 as contact_phone, r.contact_email,
           m.slot, m.role, m.ign, m.game_uid_raw as game_uid, m.phone_e164 as player_phone, r.answers as entry_answers, m.answers as player_answers,
           r.created_at, r.decided_at, r.decision_reason
      from zenith.registrations r
      join zenith.tournaments t on t.id = r.tournament_id
      join zenith.registration_members m on m.registration_id = r.id
     where (${tournament}::uuid is null or r.tournament_id = ${tournament}::uuid)
       and (${status}::text is null or r.status = ${status})
       and (${staff.gameScope}::text[] is null or t.game_id = any(${staff.gameScope}::text[]))
     order by r.created_at, m.slot
     limit 20000
  `
  await audit(db(), await actorOf(staff), 'registrations.exported', { type: 'tournament', id: tournament }, { rows: rows.length, status })
  const cols = ['reference', 'tournament', 'status', 'teamName', 'contactPhone', 'contactEmail', 'slot', 'role', 'ign', 'gameUid', 'playerPhone', 'entryAnswers', 'playerAnswers', 'createdAt', 'decidedAt', 'decisionReason']
  const body = [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c] instanceof Date ? (r[c] as Date).toISOString() : r[c])).join(','))].join('\r\n')
  return new Response('﻿' + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="zenith-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
