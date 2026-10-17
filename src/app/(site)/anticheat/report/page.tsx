import type { Metadata } from 'next'
import { ReportForm } from '@/components/anticheat/report-form'
import { FormPage } from '@/components/form-page'
import { issueFormToken } from '@/server/crypto'
import { getGame } from '@/server/services/catalog'

export const metadata: Metadata = { title: 'Report a banned player', description: 'Submit a PUBG Mobile player report with evidence for review.' }

export default async function ReportPage() {
  const game = await getGame('pubg-mobile')
  return (
    <FormPage
      eyebrow="ZenithAntiCheat · PUBG Mobile"
      title="Report a banned player"
      intro={<p>Give us the player’s UID and two screenshots. A reviewer checks the UID against your evidence before anything is decided.</p>}
      steps={['Report the player in game, then screenshot the confirmation.', 'Screenshot a screen where their UID is readable.', 'Submit both here with the UID typed exactly.', 'A reviewer approves, rejects or asks for clarification.']}
    >
      <ReportForm token={issueFormToken('report')} uidLabel={game?.uidLabel ?? 'Character ID'} uidHint={game?.uidHint ?? 'Numbers only, as shown in game.'} />
    </FormPage>
  )
}
