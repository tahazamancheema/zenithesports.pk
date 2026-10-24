import { adminPage } from '@/components/console/entry-points'
import { ConsoleTitle } from '@/components/console/shell'
import { TournamentEditor } from '@/components/console/tournament-editor'
import { editorOptions } from '@/server/services/editor-data'

export const metadata = { title: 'New tournament' }

export default async function NewTournament() {
  const me = await adminPage('tournaments.manage')
  const { formats, versions } = await editorOptions(me.gameScope)
  return (
    <>
      <ConsoleTitle title="New tournament" sub="Saved as a draft. Publish it when it’s ready for the public." />
      <TournamentEditor initial={{ timezone: 'Asia/Karachi', requiresApproval: 'on', waitlistEnabled: 'on', uniquePhone: 'on' }} formats={formats} versions={versions} />
    </>
  )
}
