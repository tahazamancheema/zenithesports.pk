import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormPage } from '@/components/form-page'
import { LftCreateForm } from '@/components/registrations/lft'
import { issueFormToken } from '@/server/crypto'
import { getFormats, getGame } from '@/server/services/catalog'
import { LFT_ROLES } from '@/server/services/lft'

export const metadata: Metadata = { title: 'List yourself', robots: { index: false } }

export default async function LftNew(props: PageProps<'/registrations/lft/new'>) {
  const { game } = await props.searchParams
  const g = await getGame(typeof game === 'string' ? game : 'valorant')
  const formats = await getFormats()
  if (!g || !formats.some((f) => f.gameId === g.id && f.code === 'lft' && f.enabled)) notFound()
  return (
    <FormPage
      eyebrow={`Looking for team · ${g.name}`}
      title="List yourself"
      intro={<p>Your listing shows your in-game name, roles and profile. Your {g.uidLabel} and contact details are never shown publicly.</p>}
      steps={['Create your listing.', 'Captains send you requests.', 'You accept the ones you want — only they see your contact.']}
    >
      <LftCreateForm token={issueFormToken('lft')} gameId={g.id} roles={LFT_ROLES[g.id] ?? ['flex']} uidLabel={g.uidLabel} uidHint={g.uidHint} />
    </FormPage>
  )
}
