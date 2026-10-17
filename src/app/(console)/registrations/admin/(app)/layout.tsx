import type { Metadata } from 'next'
import { ConsoleFrame } from '@/components/console/entry-points'

export const metadata: Metadata = { title: { default: 'Registrations console', template: '%s · Registrations console' }, robots: { index: false, follow: false } }

const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/registrations', label: 'Registrations' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/forms', label: 'Form builder' },
  { to: '/lft', label: 'Looking for team' },
  { to: '/games', label: 'Games & formats' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleFrame surface="registrations" nav={NAV}>
      {children}
    </ConsoleFrame>
  )
}
