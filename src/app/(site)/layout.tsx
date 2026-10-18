import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { AnnouncementBar } from '@/components/announcement'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative pt-[76px]">
        <AnnouncementBar />
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
