import type { Metadata } from 'next'
import { AdminFrame } from '@/components/console/entry-points'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Zenith Admin' }, robots: { index: false, follow: false } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>
}
