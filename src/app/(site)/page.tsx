import { Altitude } from '@/components/brand'
import { Ascent } from '@/components/home/ascent'
import { Circuit } from '@/components/home/circuit'
import { BroadcastFrame, IllustrationTag, PointsPhone } from '@/components/illustrations'
import { ZLink } from '@/components/link'
import { SocialLinks } from '@/components/social'
import { EmptySignal, TournamentRows } from '@/components/tournament-list'
import { PortfolioTable } from '@/components/portfolio'
import { phaseOf } from '@/lib/tournament'
import { listPublicTournaments } from '@/server/services/catalog'
import { getSettings } from '@/server/settings'

export default async function Home() {
  const [tournaments, settings] = await Promise.all([listPublicTournaments(), getSettings()])
  const current = tournaments
    .filter((t) => ['registration_open', 'live', 'announced', 'registration_closed'].includes(phaseOf(t)))
    .sort((a, b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime())
    .slice(0, 4)
  const points = settings['product.points']

  return (
    <>
      {/* ALT 00 — the ascent */}
      <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
        <div aria-hidden className="grid-field absolute inset-0 -z-10 opacity-60" />
        <div className="shell grid min-h-[calc(100svh-4rem)] items-center gap-10 py-14 lg:grid-cols-12 lg:py-10">
          <div className="lg:col-span-6">
            <p className="t-label flex items-center gap-3" style={{ animation: 'fade 900ms var(--ease-out-expo) both' }}>
              <span className="node node-fill" />
              Zenith Esports · Multi-gaming organisation · Pakistan
            </p>
            <h1 id="hero-title" className="t-display mt-8 text-[clamp(1.75rem,4.1vw,3.55rem)]">
              <span className="line-mask" style={{ '--i': 0 } as React.CSSProperties}>
                <span>Beyond</span>
              </span>
              <span className="line-mask" style={{ '--i': 1 } as React.CSSProperties}>
                <span>the game.</span>
              </span>
              <span className="line-mask" style={{ '--i': 2 } as React.CSSProperties}>
                <span className="t-chrome">Built for</span>
              </span>
              <span className="line-mask" style={{ '--i': 3 } as React.CSSProperties}>
                <span className="t-chrome">the ecosystem.</span>
              </span>
            </h1>
            <p className="t-lede mt-8 max-w-xl" style={{ animation: 'rise 900ms var(--ease-out-expo) 600ms both' }}>
              Competition, production, integrity and scoring — connected in one ecosystem, built to move Pakistani esports forward.
            </p>
            <div className="mt-10 flex flex-wrap gap-3" style={{ animation: 'rise 900ms var(--ease-out-expo) 750ms both' }}>
              <a href="#ecosystem" className="btn btn-primary">
                Explore the ecosystem <span className="arrow">↓</span>
              </a>
              <ZLink surface="registrations" to="/" className="btn btn-ghost">
                Enter tournaments <span className="arrow">→</span>
              </ZLink>
              <a href="#products" className="btn btn-ghost">
                Discover our products
              </a>
            </div>
          </div>
          <div className="lg:col-span-6 lg:pl-6">
            <Ascent />
          </div>
        </div>
      </section>

      {/* ALT 15 — the circuit */}
      <section id="ecosystem" className="relative scroll-mt-20 border-t border-line py-28" aria-labelledby="eco-title">
        <div className="shell">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-5" data-reveal>
              <Altitude deg={15}>The ecosystem</Altitude>
              <h2 id="eco-title" className="t-display mt-6 text-[clamp(1.6rem,3.4vw,2.6rem)]">
                One tournament.
                <br />
                Four systems.
              </h2>
            </div>
            <p className="t-lede md:col-span-6 md:col-start-7 md:pt-12" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
              Most organisations stop at the bracket. Zenith builds the infrastructure around it — so the same team that enters a tournament is
              integrity-checked, broadcast and scored inside one connected system.
            </p>
          </div>
          <div className="mt-20" data-reveal>
            <Circuit />
          </div>
        </div>
      </section>

      {/* ALT 30 — competition */}
      <section className="border-t border-line py-28" aria-labelledby="comp-title" data-surface="registrations">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div>
              <Altitude deg={30}>Competition</Altitude>
              <h2 id="comp-title" className="t-display mt-6 text-[clamp(1.6rem,3.4vw,2.6rem)]">
                On the circuit
              </h2>
            </div>
            <ZLink surface="registrations" to="/" className="btn btn-ghost">
              All tournaments <span className="arrow">→</span>
            </ZLink>
          </div>
          <div className="mt-12">
            {current.length ? (
              <TournamentRows items={current} />
            ) : (
              <EmptySignal
                title="No events on the board right now"
                body="New tournaments are announced here and on our channels first. Check the portfolio below for the games we run."
              >
                <ZLink surface="registrations" to="/" className="btn btn-sm btn-ghost">
                  Tournament hub
                </ZLink>
              </EmptySignal>
            )}
          </div>

          <div className="mt-24" data-reveal>
            <p className="t-label">The portfolio</p>
            <PortfolioTable />
          </div>
        </div>
      </section>

      {/* ALT 45 / 60 — products */}
      <section id="products" className="scroll-mt-20 border-t border-line py-28" aria-labelledby="products-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={45}>Products</Altitude>
            <h2 id="products-title" className="t-display mt-6 max-w-3xl text-[clamp(1.6rem,3.4vw,2.6rem)]">
              Tools we built because esports needed them
            </h2>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-12">
            <article data-surface="production" className="panel-raised relative overflow-hidden lg:col-span-7" data-reveal aria-labelledby="zp-title">
              <div className="relative border-b border-line">
                <IllustrationTag>Illustration · not a screenshot</IllustrationTag>
                <BroadcastFrame />
              </div>
              <div className="p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip chip-accent">Desktop software</span>
                  <span className="chip">PUBG Mobile</span>
                  <span className="chip">{settings['product.production'].status === 'paused' ? 'Inquiries paused' : 'Available'}</span>
                </div>
                <h3 id="zp-title" className="t-display mt-6 text-2xl">
                  ZenithProduction
                </h3>
                <p className="mt-4 max-w-xl text-fg-2">
                  A broadcast command centre for esports. It reads live observer data and drives animated standings, player pop-ups and after-match
                  scenes through OBS — the full on-air package from one operator seat.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ZLink surface="production" to="/" className="btn btn-primary">
                    See how it works <span className="arrow">→</span>
                  </ZLink>
                  <ZLink surface="production" to="/book" className="btn btn-ghost">
                    Book production
                  </ZLink>
                </div>
              </div>
            </article>

            <article data-surface="points" className="panel-raised relative overflow-hidden lg:col-span-5" data-reveal style={{ '--i': 1 } as React.CSSProperties} aria-labelledby="pts-title">
              <div className="relative flex justify-center border-b border-line bg-ink-1 px-10 pt-10">
                <IllustrationTag>Illustration · app in development</IllustrationTag>
                <div className="w-44 translate-y-6">
                  <PointsPhone />
                </div>
              </div>
              <div className="p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip chip-accent">{points.status === 'available' ? 'Available' : points.status === 'beta' ? 'Beta' : 'Coming soon'}</span>
                  <span className="chip">Android · iOS</span>
                </div>
                <h3 id="pts-title" className="t-display mt-6 text-2xl">
                  ZenithPoints
                </h3>
                <p className="mt-4 text-fg-2">
                  Scoring for PUBG Mobile and Free Fire organisers: placement and kill points, your own designs, and AI-assisted extraction from
                  results screenshots — always reviewed before it counts.
                </p>
                <ZLink surface="points" to="/" className="btn btn-primary mt-8">
                  {points.status === 'coming_soon' ? 'Get launch updates' : 'Learn more'} <span className="arrow">→</span>
                </ZLink>
              </div>
            </article>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ZLink surface="registrations" to="/" data-surface="registrations" className="panel group flex items-start gap-5 p-7 transition-colors hover:border-line-3" data-reveal>
              <span className="node mt-2" />
              <span>
                <span className="t-display block text-base">Zenith Registrations</span>
                <span className="mt-2 block text-fg-2">Find a tournament, read its rules and roster requirements, and enter your team in minutes.</span>
              </span>
            </ZLink>
            <ZLink surface="anticheat" to="/" data-surface="anticheat" className="panel group flex items-start gap-5 p-7 transition-colors hover:border-line-3" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
              <span className="node mt-2" />
              <span>
                <span className="t-display block text-base">ZenithAntiCheat</span>
                <span className="mt-2 block text-fg-2">Report a banned player with evidence. Reviewed by people, matched across every competition we run.</span>
              </span>
            </ZLink>
          </div>
        </div>
      </section>

      {/* ALT 75 — community */}
      <section className="border-t border-line py-28" aria-labelledby="community-title">
        <div className="shell grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6" data-reveal>
            <Altitude deg={75}>Community</Altitude>
            <h2 id="community-title" className="t-display mt-6 text-[clamp(1.6rem,3.4vw,2.6rem)]">
              Follow the signal
            </h2>
            <p className="t-lede mt-6 max-w-lg">
              Announcements, schedules and broadcasts go out on our official channels first. Join them so you never miss a registration window.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-8 md:col-span-5 md:col-start-8" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
            <SocialLinks social={settings.social} size="lg" />
            <ZLink surface="hq" to="/contact" className="btn btn-ghost self-start">
              Talk to the team <span className="arrow">→</span>
            </ZLink>
          </div>
        </div>
      </section>

      {/* ALT 90 — the zenith */}
      <section className="relative overflow-hidden border-t border-line py-32 text-center" aria-labelledby="zenith-title">
        <div aria-hidden className="meridian" style={{ '--meridian-x': '50%' } as React.CSSProperties} />
        <div className="shell relative" data-reveal>
          <div className="mx-auto mb-10 grid h-16 w-16 place-items-center">
            <span className="node node-fill" style={{ width: 16, height: 16 }} />
          </div>
          <Altitude deg={90} className="justify-center">
            Zenith
          </Altitude>
          <h2 id="zenith-title" className="t-display mx-auto mt-8 max-w-3xl text-[clamp(1.7rem,4vw,3rem)]">
            Compete at the <span className="t-chrome">highest point</span>
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <ZLink surface="registrations" to="/" className="btn btn-primary">
              Enter a tournament <span className="arrow">→</span>
            </ZLink>
            <ZLink surface="hq" to="/about" className="btn btn-ghost">
              About Zenith
            </ZLink>
          </div>
        </div>
      </section>
    </>
  )
}
