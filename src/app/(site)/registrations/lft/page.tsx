import type { Metadata } from 'next'
import { ZLink } from '@/components/link'
import { PageIntro } from '@/components/page-intro'
import { LftRequestButton, roleLabel } from '@/components/registrations/lft'
import { EmptySignal } from '@/components/tournament-list'
import { issueFormToken } from '@/server/crypto'
import { getFormats, getGames } from '@/server/services/catalog'
import { listLft } from '@/server/services/lft'

export const metadata: Metadata = { title: 'Looking for team' }

export default async function LftBoard(props: PageProps<'/registrations/lft'>) {
  const { game } = await props.searchParams
  const [games, formats] = await Promise.all([getGames(), getFormats()])
  const lftGames = games.filter((g) => formats.some((f) => f.gameId === g.id && f.code === 'lft' && f.enabled))
  const current = lftGames.find((g) => g.id === game) ?? lftGames[0]
  const players = current ? await listLft(current.id) : []
  const token = issueFormToken('lftreq')
  return (
    <>
      <PageIntro
        eyebrow="Zenith Registrations · Looking for team"
        title="Solo players, ready for a roster"
        lede="Players list themselves here; captains send a request. Contact details are shared only when the player accepts."
      >
        {current && (
          <ZLink to={`/lft/new?game=${current.id}`} className="btn btn-primary">
            List yourself <span className="arrow">→</span>
          </ZLink>
        )}
      </PageIntro>
      <section className="py-14">
        <div className="shell">
          <nav aria-label="Game" className="flex flex-wrap gap-2">
            {lftGames.map((g) => (
              <ZLink key={g.id} to={`/lft?game=${g.id}`} className={`btn btn-sm ${current?.id === g.id ? 'btn-primary' : 'btn-ghost'}`} aria-current={current?.id === g.id ? 'page' : undefined}>
                {g.name}
              </ZLink>
            ))}
          </nav>
          <div className="mt-10">
            {!current ? (
              <EmptySignal title="Looking for team is closed" body="No game currently has the Looking for Team board switched on." />
            ) : players.length === 0 ? (
              <EmptySignal title="No players listed yet" body={`Be the first ${current.name} player on the board.`}>
                <ZLink to={`/lft/new?game=${current.id}`} className="btn btn-sm btn-ghost">
                  List yourself
                </ZLink>
              </EmptySignal>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {players.map((p, i) => (
                  <li key={p.id} className="panel flex flex-col p-6" data-reveal style={{ '--i': i % 3 } as React.CSSProperties}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="t-display text-base">{p.ign}</p>
                      {p.rankLabel && <span className="chip">{p.rankLabel}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.roles.map((r) => (
                        <span key={r} className="chip chip-accent">
                          {roleLabel(r)}
                        </span>
                      ))}
                    </div>
                    {p.bio && <p className="mt-4 text-sm text-fg-2">{p.bio}</p>}
                    <p className="mt-4 font-mono text-xs text-fg-3">{[p.city, p.availability].filter(Boolean).join(' · ')}</p>
                    <div className="mt-auto pt-5">
                      <LftRequestButton token={token} profileId={p.id} ign={p.ign} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
