import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocPage } from '@/components/doc-page'
import { GameMark } from '@/components/game-mark'
import { ZLink } from '@/components/link'
import { ruleSections } from '@/components/rules'
import { gameRulebook, RULES_UPDATED } from '@/config/rules'

export async function generateMetadata(props: PageProps<'/tournament-rules/[game]'>): Promise<Metadata> {
  const g = gameRulebook((await props.params).game)
  return { title: g ? `${g.name} tournament rules` : 'Rules not found', description: g?.summary }
}

export default async function GameRulesPage(props: PageProps<'/tournament-rules/[game]'>) {
  const g = gameRulebook((await props.params).game)
  if (!g) notFound()
  return (
    <DocPage
      eyebrow={`${g.name} · Rules`}
      title={`${g.name} tournament rules`}
      updated={RULES_UPDATED}
      intro={
        <>
          <div className="mb-6">
            <GameMark gameId={g.gameId} name={g.name} size={56} />
          </div>
          <p>
            Based on the official {g.name} esports rules and adapted for Zenith events. The{' '}
            <ZLink surface="hq" to="/tournament-rules" className="underline underline-offset-4 hover:text-fg">
              general tournament rules
            </ZLink>{' '}
            also apply, and where a tournament page sets its own details, the tournament page applies.
          </p>
        </>
      }
      sections={[
        ...ruleSections(g.sections),
        {
          id: 'sources',
          title: 'Official sources',
          body: (
            <ul>
              {g.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ),
        },
      ]}
    />
  )
}
