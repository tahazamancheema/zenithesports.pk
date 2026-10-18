import { Altitude } from '@/components/brand'
import { ProductLockup } from '@/components/brand/product-logos'
import { GameMark } from '@/components/game-mark'
import { ZLink } from '@/components/link'
import { PageIntro } from '@/components/page-intro'
import { AVAILABILITY, GameShowcase } from '@/components/portfolio'
import { TournamentCard, TournamentGrid } from '@/components/tournament-cards'
import { EmptySignal } from '@/components/tournament-list'
import { gameArt } from '@/config/game-art'
import { phaseOf, type Phase } from '@/lib/tournament'
import { getFormats, getGames, getSponsors, listPublicTournaments, mediaUrl } from '@/server/services/catalog'

/* eslint-disable @next/next/no-img-element -- static, pre-optimised key art */

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
  const selected = games.find((g) => g.id === gameId)
  const list = selected ? all.filter((t) => t.gameId === selected.id) : all
  const sponsors = await getSponsors(list.map((t) => t.id))
  const lftGames = games.filter((g) => formats.some((f) => f.gameId === g.id && f.code === 'lft' && f.enabled))
  const countFor = (id: string) => all.filter((t) => t.gameId === id && !['completed', 'cancelled'].includes(phaseOf(t))).length

  // The spotlight: a featured event that is open or upcoming, else the next one to open.
  const upcoming = list.filter((t) => ['registration_open', 'announced', 'live', 'registration_closed'].includes(phaseOf(t)))
  const spotlight = upcoming.find((t) => t.featured) ?? upcoming.find((t) => phaseOf(t) === 'registration_open')
  const rest = list.filter((t) => t.id !== spotlight?.id)
  const art = selected ? gameArt(selected.id) : null

  return (
    <>
      <PageIntro
        top={<ProductLockup product="registrations" size={52} />}
        image={art ? art.art : '/visuals/trophy.webp'}
        eyebrow={selected ? `${selected.name} tournaments` : 'Every Zenith competition'}
        title={
          selected ? (
            <>{selected.name}</>
          ) : (
            <>
              Find your next
              <br />
              <span className="t-chrome">tournament</span>
            </>
          )
        }
        lede={selected ? selected.description : 'Pick your game, check the rules and roster requirements, and enter your team — every deadline up front.'}
      />

      <section className="py-14" aria-label="Tournaments">
        <div className="shell">
          {/* game-first navigation */}
          <nav aria-label="Choose a game" className="-mx-4 overflow-x-auto px-4 pb-2">
            <ul className="flex min-w-max gap-2">
              <li>
                <ZLink
                  to="/"
                  aria-current={!selected ? 'page' : undefined}
                  className={`flex h-full items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${!selected ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]' : 'border-line-2 hover:border-line-3'}`}
                >
                  <span className="t-title text-[15px]">All games</span>
                  <span className="font-mono text-[12px] text-fg-3">{all.filter((t) => !['completed', 'cancelled'].includes(phaseOf(t))).length}</span>
                </ZLink>
              </li>
              {games.map((g) => {
                const on = selected?.id === g.id
                const c = countFor(g.id)
                return (
                  <li key={g.id}>
                    <ZLink
                      to={`/?game=${g.id}`}
                      scroll={false}
                      aria-current={on ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-lg border py-2 pl-2 pr-4 transition-colors ${on ? 'bg-[color-mix(in_oklab,var(--g)_12%,transparent)]' : 'border-line-2 hover:border-line-3'}`}
                      style={{ '--g': gameArt(g.id).accent, borderColor: on ? gameArt(g.id).accent : undefined } as React.CSSProperties}
                    >
                      <GameMark gameId={g.id} name={g.name} logoUrl={mediaUrl(g.logoFileId)} size={34} />
                      <span>
                        <span className="t-title block text-[15px] leading-tight">{g.name}</span>
                        <span className="block text-[12px] text-fg-3">{c ? `${c} upcoming` : AVAILABILITY[g.availability].label}</span>
                      </span>
                    </ZLink>
                  </li>
                )
              })}
            </ul>
          </nav>

          {spotlight && (
            <div className="mt-10" data-reveal>
              <p className="t-label mb-4 flex items-center gap-3">
                <span className="node node-fill" /> {spotlight.featured ? 'Featured' : 'Open now'}
              </p>
              <TournamentCard t={spotlight} game={games.find((g) => g.id === spotlight.gameId)} sponsors={sponsors[spotlight.id]} featured />
            </div>
          )}

          {list.length === 0 ? (
            <div className="mt-10">
              <EmptySignal
                title={selected ? `No ${selected.name} tournaments yet` : 'No tournaments on the board'}
                body="Nothing is open right now. New events are announced on our official channels first — check back soon."
              >
                {selected && (
                  <ZLink to="/" className="btn btn-sm btn-ghost">
                    Show all games
                  </ZLink>
                )}
              </EmptySignal>
            </div>
          ) : (
            GROUPS.map((g) => {
              const items = rest.filter((t) => g.phases.includes(phaseOf(t)))
              if (!items.length) return null
              return (
                <div key={g.title} className="mt-14">
                  <h2 className="mb-6 flex items-center gap-3">
                    <span className="t-title text-xl">{g.title}</span>
                    <span className="chip">{items.length}</span>
                  </h2>
                  <TournamentGrid items={items} games={games} sponsors={sponsors} />
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="border-t border-line py-20" aria-labelledby="games-title">
        <div className="shell">
          <Altitude deg={30}>Games</Altitude>
          <h2 id="games-title" className="t-display mt-6 text-[clamp(1.5rem,2.8vw,2.2rem)]">
            Formats by game
          </h2>
          <div className="mt-10">
            <GameShowcase />
          </div>
        </div>
      </section>

      {lftGames.length > 0 && (
        <section className="relative isolate overflow-hidden border-t border-line py-20" aria-labelledby="lft-title">
          <img src="/visuals/games/valorant.webp" alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20" />
          <div className="shell grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <Altitude deg={45}>Looking for team</Altitude>
              <h2 id="lft-title" className="t-display mt-6 text-[clamp(1.5rem,2.8vw,2.2rem)]">
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
          <p className="text-fg-2">Already registered? Your entries are listed under My registrations when you are signed in.</p>
          <div className="flex flex-wrap gap-3">
            <ZLink to="/account" className="btn btn-sm btn-ghost">
              My registrations
            </ZLink>
            <ZLink surface="hq" to="/rules" className="btn btn-sm btn-ghost">
              Tournament rules
            </ZLink>
          </div>
        </div>
      </section>
    </>
  )
}
