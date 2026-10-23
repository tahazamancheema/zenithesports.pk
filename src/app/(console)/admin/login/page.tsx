import type { Metadata } from 'next'
import { ConsoleLogin } from '@/components/console/entry-points'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }

export default async function Login(props: { searchParams: Promise<{ denied?: string; out?: string }> }) {
  const { denied, out } = await props.searchParams
  return <ConsoleLogin surface="hq" denied={denied === '1'} signedOut={out === '1'} />
}
