import 'server-only'
import type { ConsoleSurface } from '@/lib/permissions'
import { hrefFor } from '@/lib/surfaces'
import { getLinkMode } from './link'

/** Console root for the current host: "/admin" on a subdomain, "/registrations/admin" in path mode. */
export async function consoleBase(surface: ConsoleSurface) {
  const mode = await getLinkMode()
  const owner = surface === 'hq' ? 'hq' : surface
  // Always relative: a console only ever links within its own host.
  return hrefFor({ ...mode, current: owner }, owner, '/admin')
}
