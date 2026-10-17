import type { Metadata } from 'next'
import { ConsolePassword } from '@/components/console/entry-points'

export const metadata: Metadata = { title: 'Change password', robots: { index: false, follow: false } }

export default function Password() {
  return <ConsolePassword surface="registrations" />
}
