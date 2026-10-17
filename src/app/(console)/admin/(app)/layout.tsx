import type { Metadata } from 'next'
import { ConsoleFrame } from '@/components/console/entry-points'

export const metadata: Metadata = { title: { default: 'HQ console', template: '%s · HQ console' }, robots: { index: false, follow: false } }

const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/inquiries', label: 'Product inquiries' },
  { to: '/bookings', label: 'Production bookings' },
  { to: '/messages', label: 'Messages' },
  { to: '/waitlist', label: 'Points waitlist' },
  { to: '/settings', label: 'Site settings' },
  { to: '/content', label: 'Media & team' },
  { to: '/staff', label: 'Staff & roles' },
  { to: '/audit', label: 'Audit log' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleFrame surface="hq" nav={NAV}>
      {children}
    </ConsoleFrame>
  )
}
