import { NotFoundView } from '@/components/not-found-view'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { getViewer } from '@/server/viewer'

export default async function NotFound() {
  const viewer = await getViewer()
  return (
    <>
      <SiteHeader viewer={viewer} />
      <main id="main" className="pt-16">
        <NotFoundView />
      </main>
      <SiteFooter />
    </>
  )
}
