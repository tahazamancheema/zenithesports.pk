import type { Metadata } from 'next'
import { ReportForm } from '@/components/anticheat/report-form'
import { FormPage } from '@/components/form-page'
import { GameMark } from '@/components/game-mark'
import { ZLink } from '@/components/link'
import { reportRule } from '@/lib/report-rules'
import { issueFormToken } from '@/server/crypto'
import { getGames, mediaUrl } from '@/server/services/catalog'
import { getSettings } from '@/server/settings'

export const metadata: Metadata = { title: 'Report a player', description: 'Report a cheating or banned player in any game Zenith runs, with screenshot evidence for human review.' }

export default async function ReportPage(props: { searchParams: Promise<{ game?: string }> }) {
  const [{ game: wanted }, games, settings] = await Promise.all([props.searchParams, getGames(), getSettings()])
  const enabled = games.filter((g) => settings['product.anticheat'].games.includes(g.id))
  const game = enabled.find((g) => g.id === wanted) ?? enabled[0]
  if (!game) {
    return (
      <FormPage eyebrow="ZenithAntiCheat" title="Reporting is paused" intro={<p>Player reports are not open right now. Please check back soon.</p>} steps={[]}>
        <span />
      </FormPage>
    )
  }
  const rule = reportRule(game.id)
  return (
    <FormPage
      eyebrow={`ZenithAntiCheat · ${game.name}`}
      title="Report a player"
      intro={<p>Type the player’s {game.uidLabel} and upload the screenshot that shows it. A reviewer checks the two match before anything is decided.</p>}
      steps={rule.steps}
    >
      <nav aria-label="Choose the game" className="mb-10">
        <p className="t-label mb-3">Which game?</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {enabled.map((g) => (
            <li key={g.id}>
              <ZLink
                to={`/report?game=${g.id}`}
                aria-current={g.id === game.id ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-md border p-2 pr-3 text-[14px] transition-colors ${g.id === game.id ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] text-fg' : 'border-line-2 text-fg-2 hover:border-line-3 hover:text-fg'}`}
              >
                <GameMark gameId={g.id} name={g.name} logoUrl={mediaUrl(g.logoFileId)} size={32} />
                <span className="min-w-0 truncate font-medium">{g.name}</span>
              </ZLink>
            </li>
          ))}
        </ul>
      </nav>
      <ReportForm token={issueFormToken('report')} gameId={game.id} gameName={game.name} uidLabel={game.uidLabel} uidHint={game.uidHint} rule={rule} />
    </FormPage>
  )
}
