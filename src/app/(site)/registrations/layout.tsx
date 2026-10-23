import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'ZenithRegistrations — tournaments', template: '%s · ZenithRegistrations' },
  description: 'Find Zenith tournaments for PUBG Mobile, Free Fire, VALORANT and more. Read the rules, check roster requirements and register your team.',
}

export default function RegistrationsLayout({ children }: { children: React.ReactNode }) {
  return <div data-surface="registrations">{children}</div>
}
