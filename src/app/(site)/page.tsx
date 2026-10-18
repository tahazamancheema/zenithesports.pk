import { Altitude } from '@/components/brand'
import { ProductIcon, ProductLockup } from '@/components/brand/product-logos'
import { GameMark } from '@/components/game-mark'
import { Zenith3D } from '@/components/home/zenith-3d'
import { InViewVideo, ScrollStatement, SplitText, TiltCard, VelocityMarquee, WordCycle } from '@/components/kinetic'
import { ZLink } from '@/components/link'
import { PointsTour } from '@/components/points/points-mock'
import { GameShowcase } from '@/components/portfolio'
import { SocialLinks } from '@/components/social'
import { TournamentGrid } from '@/components/tournament-cards'
import { EmptySignal } from '@/components/tournament-list'
import { gameArt } from '@/config/game-art'
import { phaseOf } from '@/lib/tournament'
import { getGames, getSponsors, listPublicTournaments } from '@/server/services/catalog'
import { getSettings } from '@/server/settings'

/* eslint-disable @next/next/no-img-element -- static, pre-optimised visuals under /visuals and /products */

const VERBS = [
  { text: 'Enter', color: 'var(--color-reg)' },
  { text: 'Verify', color: 'var(--color-ac)' },
  { text: 'Broadcast', color: 'var(--color-prod)' },
  { text: 'Score', color: 'var(--color-pts)' },
]

const FALLBACK_GAMES = [
  { id: 'pubg-mobile', name: 'PUBG Mobile' },
  { id: 'free-fire', name: 'Free Fire' },
  { id: 'valorant', name: 'VALORANT' },
  { id: 'honor-of-kings', name: 'Honor of Kings' },
  { id: 'tekken-8', name: 'TEKKEN 8' },
  { id: 'ea-fc-26', name: 'EA SPORTS FC 26' },
]

export default async function Home() {
  const [tournaments, settings, games] = await Promise.all([listPublicTournaments(), getSettings(), getGames()])
  const current = tournaments
    .filter((t) => ['registration_open', 'live', 'announced', 'registration_closed'].includes(phaseOf(t)))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime())
    .slice(0, 6)
  const sponsors = await getSponsors(current.map((t) => t.id))
  const points = settings['product.points']
  const marqueeGames = games.length ? games : FALLBACK_GAMES

  return (
    <>
      {/* ALT 00 — hero */}
      <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
        <img src="/visuals/summit.webp" alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40 [mask-image:linear-gradient(180deg,#000_30%,transparent)]" fetchPriority="high" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_45%,rgba(217,178,95,0.16),transparent_55%),linear-gradient(90deg,#06070a_15%,rgba(6,7,10,0.4)_60%,rgba(6,7,10,0.2))]" />
        <div aria-hidden className="grid-field absolute inset-0 -z-10 opacity-40" />

        <div className="shell grid min-h-[calc(100svh-4rem)] items-center gap-6 py-12 lg:grid-cols-12 lg:py-8">
          <div className="relative z-10 lg:col-span-6">
            <p className="t-label flex items-center gap-3 text-fg-2" style={{ animation: 'fade 900ms var(--ease-out-expo) both' }}>
              <span className="node node-fill" />
              Zenith Esports · Pakistan
            </p>
            <h1 id="hero-title" className="t-display mt-7 text-[clamp(2.1rem,5.2vw,4.4rem)] leading-[1.02]">
              <SplitText text="Beyond the game." />
              <br />
              <SplitText text="Built for esports." delay={380} letterClassName="t-chrome" />
            </h1>
            <p className="mt-7 text-[clamp(1.15rem,1.6vw,1.45rem)] font-medium text-fg" style={{ animation: 'rise 900ms var(--ease-out-expo) 700ms both' }}>
              For the competitive scene, we <WordCycle words={VERBS} className="font-display uppercase" />
            </p>
            <p className="t-lede mt-4 max-w-xl" style={{ animation: 'rise 900ms var(--ease-out-expo) 800ms both' }}>
              Tournaments, broadcast production, competitive integrity and scoring — four platforms built by one organisation, connected end to end.
            </p>
            <div className="mt-9 flex flex-wrap gap-3" style={{ animation: 'rise 900ms var(--ease-out-expo) 900ms both' }}>
              <ZLink surface="registrations" to="/" className="btn btn-primary">
                Enter a tournament <span className="arrow">→</span>
              </ZLink>
              <a href="#platforms" className="btn btn-ghost">
                Explore the platforms <span className="arrow">↓</span>
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2" style={{ animation: 'rise 900ms var(--ease-out-expo) 1000ms both' }} aria-label="Platforms">
              {(['registrations', 'anticheat', 'production', 'points'] as const).map((p) => (
                <li key={p}>
                  <a href={`#${p}`} className="flex items-center gap-2 rounded-full border border-line-2 bg-black/30 py-1 pl-1 pr-3 text-[13px] text-fg-2 backdrop-blur transition-colors hover:border-line-3 hover:text-fg">
                    <ProductIcon product={p} size={26} />
                    {{ registrations: 'Registrations', anticheat: 'AntiCheat', production: 'Production', points: 'Points' }[p]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative -order-1 lg:order-none lg:col-span-6">
            <Zenith3D className="mx-auto aspect-square w-full max-w-[min(640px,80vw)] lg:max-w-none" />
          </div>
        </div>
      </section>

      {/* the games, in motion */}
      <section className="border-y border-line bg-ink-1/60 py-6" aria-label="Games we run">
        <VelocityMarquee speed={0.6}>
          {marqueeGames.map((g) => (
            <span key={g.id} className="flex items-center gap-4 px-8">
              <GameMark gameId={g.id} name={g.name} size={40} />
              <span className="t-display whitespace-nowrap text-[clamp(1.1rem,2.2vw,1.8rem)]" style={{ color: gameArt(g.id).accent }}>
                {g.name}
              </span>
              <span aria-hidden className="node ml-4 opacity-50" />
            </span>
          ))}
        </VelocityMarquee>
      </section>

      {/* ALT 15 — platforms */}
      <section id="platforms" className="relative scroll-mt-20 py-24" aria-labelledby="eco-title">
        <ScrollStatement lines={['Compete · Verify ·', 'Broadcast · Score ·']} />
        <div className="shell mt-14">
          <div className="grid gap-8 md:grid-cols-12" data-reveal>
            <div className="md:col-span-6">
              <Altitude deg={15}>The ecosystem</Altitude>
              <h2 id="eco-title" className="t-display mt-6 text-[clamp(1.7rem,3.6vw,2.8rem)]">
                One tournament.
                <br />
                <span className="t-chrome">Four systems.</span>
              </h2>
            </div>
            <p className="t-lede md:col-span-6 md:pt-12">
              Most organisations stop at the bracket. Zenith builds the infrastructure around it — the same team that enters is integrity-checked,
              broadcast and scored inside one connected system.
            </p>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-12">
            {/* Registrations */}
            <article id="registrations" data-surface="registrations" data-reveal className="group relative isolate flex min-h-[420px] scroll-mt-24 flex-col justify-end overflow-hidden rounded-2xl border border-line-2 p-7 lg:col-span-5">
              <img src="/visuals/trophy.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_30%] opacity-95 transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06070a] via-[#06070a]/70 to-transparent" />
              <ProductLockup product="registrations" size={48} />
              <p className="mt-5 max-w-md text-fg-2">Find a tournament for your game, read its rules and roster requirements, and enter your team in minutes — signed in, with your status always one tap away.</p>
              <ZLink surface="registrations" to="/" className="btn btn-primary mt-6 self-start">
                Browse tournaments <span className="arrow">→</span>
              </ZLink>
            </article>

            {/* Production — real software footage */}
            <article id="production" data-surface="production" data-reveal style={{ '--i': 1 } as React.CSSProperties} className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-line-2 bg-ink-1 lg:col-span-7">
              <div className="relative">
                <InViewVideo
                  className="aspect-video w-full object-cover"
                  poster="/products/production/walkthrough-poster.webp"
                  label="ZenithProduction walkthrough with the software's built-in sample data"
                  sources={[
                    { src: '/products/production/walkthrough.webm', type: 'video/webm' },
                    { src: '/products/production/walkthrough.mp4', type: 'video/mp4' },
                  ]}
                />
                <span className="chip absolute right-3 top-3 border-white/20 bg-black/65 text-white">Real software · sample data</span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-6 p-7">
                <div className="max-w-lg">
                  <ProductLockup product="production" size={48} />
                  <p className="mt-5 text-fg-2">A broadcast command centre: live standings, player pop-ups and after-match scenes driven from observer data, straight into OBS.</p>
                </div>
                <ZLink surface="production" to="/" className="btn btn-primary">
                  See it in action <span className="arrow">→</span>
                </ZLink>
              </div>
            </article>

            {/* AntiCheat */}
            <article id="anticheat" data-surface="anticheat" data-reveal className="group relative isolate flex min-h-[420px] scroll-mt-24 flex-col justify-end overflow-hidden rounded-2xl border border-line-2 p-7 lg:col-span-6">
              <img src="/visuals/anticheat.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-75 transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06070a] via-[#06070a]/65 to-transparent" />
              <ProductLockup product="anticheat" size={48} />
              <p className="mt-5 max-w-md text-fg-2">Report a cheater in any game we run with one screenshot and their ID. Every report is reviewed by a person and matched across all our competitions.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ZLink surface="anticheat" to="/report" className="btn btn-primary">
                  Report a player <span className="arrow">→</span>
                </ZLink>
                <ZLink surface="anticheat" to="/" className="btn btn-ghost">How it works</ZLink>
              </div>
            </article>

            {/* Points — concept interface */}
            <article id="points" data-surface="points" data-reveal style={{ '--i': 1 } as React.CSSProperties} className="relative isolate grid scroll-mt-24 items-center gap-6 overflow-hidden rounded-2xl border border-line-2 p-7 sm:grid-cols-[1fr_auto] lg:col-span-6">
              <img src="/visuals/points.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06070a] via-[#06070a]/80 to-[#06070a]/30" />
              <div>
                <ProductLockup product="points" size={48} />
                <p className="mt-5 text-fg-2">Slot lists, standings, champions and MVP graphics in your own design — calculated and ready in seconds. No graphic designer needed.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip chip-accent">{points.status === 'available' ? 'Available' : points.status === 'beta' ? 'Beta' : 'Coming soon'}</span>
                  <span className="chip">Android · iOS</span>
                </div>
                <ZLink surface="points" to="/" className="btn btn-primary mt-6">
                  {points.status === 'coming_soon' ? 'Get launch updates' : 'Learn more'} <span className="arrow">→</span>
                </ZLink>
              </div>
              <div className="mx-auto w-[200px]">
                <PointsTour compact />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ALT 30 — games */}
      <section className="border-t border-line py-24" aria-labelledby="games-title">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div>
              <Altitude deg={30}>The portfolio</Altitude>
              <h2 id="games-title" className="t-display mt-6 text-[clamp(1.7rem,3.6vw,2.8rem)]">Six games. One standard.</h2>
            </div>
            <ZLink surface="hq" to="/games" className="btn btn-ghost">All games <span className="arrow">→</span></ZLink>
          </div>
          <div className="mt-12">
            <GameShowcase />
          </div>
        </div>
      </section>

      {/* ALT 45 — tournaments */}
      <section className="border-t border-line py-24" aria-labelledby="comp-title" data-surface="registrations">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div>
              <Altitude deg={45}>Competition</Altitude>
              <h2 id="comp-title" className="t-display mt-6 text-[clamp(1.7rem,3.6vw,2.8rem)]">On the circuit</h2>
            </div>
            <ZLink surface="registrations" to="/" className="btn btn-ghost">All tournaments <span className="arrow">→</span></ZLink>
          </div>
          <div className="mt-12">
            {current.length ? (
              <TournamentGrid items={current} games={games} sponsors={sponsors} />
            ) : (
              <EmptySignal title="No events on the board right now" body="New tournaments are announced here and on our channels first. Follow us below so you never miss a registration window.">
                <ZLink surface="registrations" to="/" className="btn btn-sm btn-ghost">Tournament hub</ZLink>
              </EmptySignal>
            )}
          </div>
        </div>
      </section>

      {/* ALT 75 / 90 — community and the zenith */}
      <section className="relative isolate overflow-hidden border-t border-line py-32" aria-labelledby="zenith-title">
        <img src="/visuals/arena.webp" alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#06070a,rgba(6,7,10,0.55)_40%,#06070a)]" />
        <div className="shell text-center" data-reveal>
          <Altitude deg={90} className="justify-center">Zenith</Altitude>
          <h2 id="zenith-title" className="t-display mx-auto mt-8 max-w-4xl text-[clamp(2rem,5vw,3.8rem)]">
            Compete at the <span className="t-chrome">highest point</span>
          </h2>
          <p className="t-lede mx-auto mt-6 max-w-xl">Announcements, schedules and broadcasts go out on our official channels first.</p>
          <div className="mt-10 flex justify-center">
            <SocialLinks social={settings.social} size="lg" />
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ZLink surface="registrations" to="/" className="btn btn-primary">Enter a tournament <span className="arrow">→</span></ZLink>
            <ZLink surface="hq" to="/contact" className="btn btn-ghost">Talk to the team</ZLink>
          </div>
        </div>
      </section>
    </>
  )
}

