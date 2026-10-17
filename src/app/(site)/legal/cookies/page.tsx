import type { Metadata } from 'next'
import { DocPage } from '@/components/doc-page'

export const metadata: Metadata = { title: 'Cookies' }

export default function CookiesPage() {
  return (
    <DocPage
      eyebrow="Policies"
      title="Cookies"
      updated="18 October 2026"
      sections={[
        { id: 'visitors', title: 'Visitors', body: <p>The public website does not set advertising or analytics cookies, and does not track you across other sites. That is why there is no cookie banner.</p> },
        {
          id: 'staff',
          title: 'Staff consoles',
          body: <p>Zenith staff who sign in to an administration console receive one strictly necessary session cookie for that console. It is secure, cannot be read by scripts, is limited to that console’s address, and expires after 12 hours or 2 hours of inactivity.</p>,
        },
        { id: 'storage', title: 'Other storage', body: <p>Your browser may keep the site’s own files cached to load pages faster. This contains no personal information.</p> },
      ]}
    />
  )
}
