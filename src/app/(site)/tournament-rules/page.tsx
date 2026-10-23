import type { Metadata } from 'next'
import { DocPage } from '@/components/doc-page'
import { GameMark } from '@/components/game-mark'
import { ZLink } from '@/components/link'
import { ruleSections } from '@/components/rules'
import { GAME_RULES, RULES_UPDATED, TOURNAMENT_RULES } from '@/config/rules'

export const metadata: Metadata = { title: 'Tournament rules', description: 'The rules for every Zenith competition, with a rulebook for each game based on its official esports rules.' }

export default function TournamentRulesPage() {
  return (
    <DocPage
      eyebrow="Rules"
      title="Tournament rules"
      updated={RULES_UPDATED}
      intro={
        <>
          <p>These rules apply to every Zenith competition. Each game also has its own rulebook, based on that game’s official esports rules.</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Game rulebooks">
            {GAME_RULES.map((g) => (
              <li key={g.gameId}>
                <ZLink surface="hq" to={`/tournament-rules/${g.gameId}`} className="panel flex items-center gap-4 p-4 text-base transition-colors hover:border-line-3">
                  <GameMark gameId={g.gameId} name={g.name} size={40} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-fg">{g.name} rulebook</span>
                    <span className="block text-sm text-fg-2">{g.summary}</span>
                  </span>
                </ZLink>
              </li>
            ))}
          </ul>
        </>
      }
      sections={ruleSections(TOURNAMENT_RULES)}
    />
  )
}
