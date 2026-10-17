import { Altitude } from '@/components/brand'
import { ZLink } from '@/components/link'
import { PageIntro } from '@/components/page-intro'
import { AVAILABILITY } from '@/components/portfolio'
import { EmptySignal, TournamentRows } from '@/components/tournament-list'
import { phaseOf, type Phase } from '@/lib/tournament'
import { getFormats, getGames, listPublicTournaments } from '@/server/services/catalog'

const GROUPS: { title: string; phases: Phase[] }[] = [
  { title: 'Registration open', phases: ['registration_open'] },
  { title: 'Live now', phases: ['live'] },
  { title: 'Coming up', phases: ['announced', 'registration_closed'] },
  { title: 'Completed', phases: ['completed', 'cancelled'] },
]

export default async function RegistrationsHub(props: PageProps<'/registrations'>) {
  const { game } = await props.searchParams
  const gameId = typeof game === 'string' ? game : undefined
  const [games, formats, all] = await Promise.all([getGames(), getFormats(), listPublicTournaments()])
  const list = gameId ? all.filter((t) => t.gameId === gameId) : all
  const names = Object.fromEntries(games.map((g) => [g.id, g.name]))
  const lftGames = games.filter((g) => formats.some((f) => f.gameId === g.id && f.code === 'lft' && f.enabled))

  return (
    <>
      <PageIntro
        eyebrow="Zenith Registrations"
        title={
          <>
            Find your next
            <br />
            tournament
          </>
        }
        lede="Every Zenith competition, with its rules, roster requirements and deadlines up front. Pick a tournament, check you meet the requirements, and enter your team."
      />

      <section className="py-16" aria-label="Tournaments">
        <div className="shell">
          <nav aria-label="Filter by game" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            <ZLink to="/" className={`btn btn-sm ${!gameId ? 'btn-primary' : 'btn-ghost'}`} aria-current={!gameId ? 'page' : undefined}>
              All games
            </ZLink>
            {games.map((g) => (
              <ZLink key={g.id} to={`/?game=${g.id}`} scroll={false} className={`btn btn-sm ${gameId === g.id ? 'btn-primary' : 'btn-ghost'}`} aria-current={gameId === g.id ? 'page' : undefined}>
                {g.name}
              </ZLink>
            ))}
          </nav>

          {list.length === 0 ? (
            <div className="mt-10">
              <EmptySignal
                title={gameId ? `No ${names[gameId] ?? ''} tournaments yet` : 'No tournaments on the board'}
                body="Nothing is open right now. New events are announced on our official channels first — check back soon."
              >
                {gameId && (
                  <ZLink to="/" className="btn btn-sm btn-ghost">
                    Show all games
                  </ZLink>
                )}
              </EmptySignal>
            </div>
          ) : (
            GROUPS.map((g) => {
              const items = list.filter((t) => g.phases.includes(phaseOf(t)))
              if (!items.length) return null
              return (
                <div key={g.title} className="mt-14">
                  <h2 className="t-label mb-5 flex items-center gap-3">
                    <span className="node" />
                    {g.title} · {items.length}
                  </h2>
                  <TournamentRows items={items} games={names} />
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="border-t border-line py-20" aria-labelledby="games-title">
        <div className="shell">
          <Altitude deg={30}>Games</Altitude>
          <h2 id="games-title" className="t-display mt-6 text-[clamp(1.4rem,2.6vw,2rem)]">
            Formats by game
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g, i) => (
              <ZLink key={g.id} to={`/games/${g.id}`} className="group bg-ink-1 p-6 transition-colors hover:bg-ink-2" data-reveal style={{ '--i': i % 3 } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-3">
                  <span className="t-display text-base transition-colors group-hover:text-[var(--accent)]">{g.name}</span>
                  <span className={AVAILABILITY[g.availability].chip}>{AVAILABILITY[g.availability].label}</span>
                </div>
                <p className="mt-4 font-mono text-[12.5px] text-fg-3">
                  {formats
                    .filter((f) => f.gameId === g.id && f.enabled)
                    .map((f) => f.label)
                    .join(' · ')}
                </p>
              </ZLink>
            ))}
          </div>
        </div>
      </section>

      {lftGames.length > 0 && (
        <section className="border-t border-line py-20" aria-labelledby="lft-title">
          <div className="shell grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <Altitude deg={45}>Looking for team</Altitude>
              <h2 id="lft-title" className="t-display mt-6 text-[clamp(1.4rem,2.6vw,2rem)]">
                Solo? Find a 5v5 roster.
              </h2>
              <p className="mt-4 max-w-xl text-fg-2">
                List yourself for {lftGames.map((g) => g.name).join(' or ')}. Captains can send you a request; your contact details stay private until you accept.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
              {lftGames.map((g) => (
                <ZLink key={g.id} to={`/lft?game=${g.id}`} className="btn btn-ghost">
                  {g.name} board <span className="arrow">→</span>
                </ZLink>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line py-16">
        <div className="shell flex flex-wrap items-center justify-between gap-4">
          <p className="text-fg-2">Already registered? Open the private status link from your confirmation to check your entry or withdraw.</p>
          <ZLink surface="hq" to="/rules" className="btn btn-sm btn-ghost">
            Tournament rules
          </ZLink>
        </div>
      </section>
    </>
  )
}
