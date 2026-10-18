import { can } from '@/lib/permissions'
import { getStaff } from '@/server/auth/session'
import { imageHeaders, readFileBytes } from '@/server/files'

/** Registration uploads and draft branding: tournament staff only, never public, never cached. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaff('registrations')
  if (!staff || staff.mustChangePassword || !can(staff.roles, 'registrations.review')) return new Response('Forbidden', { status: 403 })
  const f = await readFileBytes((await ctx.params).id)
  if (!f || !['registration', 'branding'].includes(f.purpose) || !f.data) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(f.data), { headers: imageHeaders(f.mime) })
}
