import { NotFoundView } from '@/components/not-found-view'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-16">
        <NotFoundView />
      </main>
      <SiteFooter />
    </>
  )
}
