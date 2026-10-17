import { readFileBytes, imageHeaders } from '@/server/files'
import { isPublicFile } from '@/server/services/content'

/** Serves only images attached to published public content (approved product media, team profiles). */
export async function GET(_req: Request, ctx: RouteContext<'/media/[id]'>) {
  const { id } = await ctx.params
  if (!(await isPublicFile(id))) return new Response('Not found', { status: 404 })
  const file = await readFileBytes(id)
  if (!file?.data) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(file.data), { headers: { ...imageHeaders(file.mime, 'public'), ETag: `"${file.sha256.slice(0, 32)}"` } })
}
