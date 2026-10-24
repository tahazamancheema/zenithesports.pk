import 'server-only'
import { hrefFor } from '@/lib/surfaces'
import { getLinkMode } from './link'

/**
 * The admin panel's root: "/admin" on the main site, or an absolute link to it
 * from a product subdomain.
 */
export async function consoleBase() {
  return hrefFor(await getLinkMode(), 'hq', '/admin')
}
