import type { Metadata } from 'next'
import { ConsoleFrame } from '@/components/console/entry-points'

export const metadata: Metadata = { title: { default: 'AntiCheat console', template: '%s · AntiCheat console' }, robots: { index: false, follow: false } }

const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/reports', label: 'Report queue' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/flags', label: 'Flags' },
  { to: '/entry', label: 'Manual entry' },
  { to: '/scans', label: 'Scans & retention' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleFrame surface="anticheat" nav={NAV}>
      {children}
    </ConsoleFrame>
  )
}
