import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'ZenithAntiCheat — competitive integrity', template: '%s · ZenithAntiCheat' },
  description: 'Report a banned or cheating player with evidence. Every report is reviewed by a person and matched across Zenith competitions.',
}

export default function AnticheatLayout({ children }: { children: React.ReactNode }) {
  return <div data-surface="anticheat">{children}</div>
}
