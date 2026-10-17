import { can } from '@/lib/permissions'
import { audit } from '@/server/audit'
import { actorOf, getStaff } from '@/server/auth/session'
import { db } from '@/server/db'
import { imageHeaders, readFileBytes } from '@/server/files'
import { isEvidenceFile } from '@/server/services/anticheat'

/** Evidence is served only to AntiCheat reviewers, never cached, and every view is logged. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaff('anticheat')
  if (!staff || staff.mustChangePassword || !can(staff.roles, 'anticheat.review')) return new Response('Forbidden', { status: 403 })
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return new Response('Forbidden', { status: 403 })
  const { id } = await ctx.params
  if (!(await isEvidenceFile(id))) return new Response('Not found', { status: 404 })
  const f = await readFileBytes(id)
  if (!f?.data) return new Response('Gone', { status: 410 })
  await audit(db(), await actorOf(staff), 'evidence.viewed', { type: 'file', id })
  return new Response(new Uint8Array(f.data), { headers: imageHeaders(f.mime) })
}
