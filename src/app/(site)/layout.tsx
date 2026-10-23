import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { AnnouncementBar } from '@/components/announcement'
import { getViewer } from '@/server/viewer'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  return (
    <>
      <SiteHeader viewer={viewer} />
      <main id="main" className="relative pt-[76px]">
        <AnnouncementBar />
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
