import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'ZenithProduction — esports broadcast production', template: '%s · ZenithProduction' },
  description:
    'ZenithProduction is desktop broadcast software for esports: live observer data in, animated standings, pop-ups and after-match scenes out through OBS. Currently for PUBG Mobile.',
}

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  return <div data-surface="production">{children}</div>
}
