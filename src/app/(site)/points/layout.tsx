import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'ZenithPoints — tournament scoring, coming to mobile', template: '%s · ZenithPoints' },
  description: 'ZenithPoints is an upcoming mobile app for PUBG Mobile and Free Fire scoring: placement and kill points, custom designs and AI-assisted extraction from results screenshots.',
}

export default function PointsLayout({ children }: { children: React.ReactNode }) {
  return <div data-surface="points">{children}</div>
}
