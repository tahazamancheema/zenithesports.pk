import { Altitude } from '@/components/brand'
import { BroadcastFrame, IllustrationTag } from '@/components/illustrations'
import { ZLink } from '@/components/link'
import { SignalChain } from '@/components/production/signal-chain'
import { Faq } from '@/components/faq'
import { listMedia } from '@/server/services/content'
import { getSettings } from '@/server/settings'

const CAPABILITIES = [
  { k: 'Command centre', v: 'Run the match from one screen: the tournament on air, the match in progress, what is showing and what is queued next.' },
  { k: 'Live data, not typing', v: 'Teams, eliminations and standings come straight from the observer feed, so graphics update the moment the game does.' },
  { k: 'An automated show', v: 'Match start, the chicken dinner and the after-match rundown can run by themselves — or step by step on the operator’s cue.' },
  { k: 'The full on-air package', v: 'Live standings, player pop-ups, lower thirds, breaks, highlights and after-match scenes, animated and on brand.' },
  { k: 'Your design', v: 'Every overlay is customisable — layout, fonts, colours and behaviour — and whole looks switch with presets.' },
  { k: 'A complete record', v: 'Every tournament, match and result is kept, with standings and ready-to-post 1080 × 1080 graphics for social media.' },
]

const FAQ = [
  {
    q: 'Which games does ZenithProduction support?',
    a: 'PUBG Mobile, using its official observer client. Support for other titles in the Zenith portfolio is not available today; we will announce it here if that changes.',
  },
  {
    q: 'Can I download it from this site?',
    a: 'No. ZenithProduction is licensed software supplied directly by the Zenith team after a purchase is agreed. Send an inquiry and we will walk you through it.',
  },
  {
    q: 'How much does it cost?',
    a: 'Pricing depends on how you will use it. Send a purchase inquiry and the team will reply with options — there is no automatic checkout.',
  },
  {
    q: 'Can Zenith produce our tournament instead?',
    a: 'Yes. Send a production booking request with your dates and requirements. A booking is only confirmed once a Zenith administrator has reviewed and accepted it.',
  },
  {
    q: 'What do I need to run it?',
    a: 'A Windows PC running OBS Studio and the PUBG Mobile observer client. The team confirms the detailed requirements for your setup during the inquiry.',
  },
]

export default async function ProductionPage() {
  const [media, settings] = await Promise.all([listMedia('production'), getSettings()])
  const status = settings['product.production'].status
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="grid-field absolute inset-0 -z-10 opacity-40" />
        <div className="shell pt-16 pb-20 md:pt-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="t-label flex items-center gap-3" style={{ animation: 'fade 700ms both' }}>
                <span className="h-2 w-2 rounded-full bg-prod" style={{ animation: 'blink 1.6s steps(1) infinite' }} />
                ZenithProduction · Desktop broadcast software
              </p>
              <h1 className="t-display mt-7 text-[clamp(1.8rem,4.4vw,3.4rem)]" style={{ animation: 'rise 900ms var(--ease-out-expo) 80ms both' }}>
                The whole broadcast,
                <br />
                <span className="text-prod">one operator seat.</span>
              </h1>
            </div>
            <div className="lg:col-span-5" style={{ animation: 'rise 900ms var(--ease-out-expo) 200ms both' }}>
              <p className="t-lede">
                {settings['product.production'].headline ||
                  'Live observer data in. Animated standings, player pop-ups and after-match scenes out — switched through OBS and streamed to your audience.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ZLink to="/inquire" className="btn btn-primary">
                  Inquire about purchasing <span className="arrow">→</span>
                </ZLink>
                <ZLink to="/book" className="btn btn-ghost">
                  Book production
                </ZLink>
              </div>
              {status === 'paused' && <p className="mt-4 text-sm text-warn">New purchase inquiries are paused at the moment; booking requests are still reviewed.</p>}
            </div>
          </div>

          {/* program monitor */}
          <div className="mt-16" style={{ animation: 'rise 1100ms var(--ease-out-expo) 300ms both' }}>
            <div className="flex items-center justify-between border border-b-0 border-line-2 bg-ink-1 px-4 py-2.5 rounded-t-md">
              <span className="t-label">Program</span>
              <span className="t-label hidden sm:block">1920 × 1080 · PUBG Mobile</span>
              <span className="t-label !text-prod">● Live</span>
            </div>
            <div className="relative overflow-hidden rounded-b-md border border-line-2">
              <IllustrationTag>Illustration · not a screenshot of the software</IllustrationTag>
              <BroadcastFrame />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="chain-title">
        <div className="shell">
          <div className="grid gap-6 md:grid-cols-12" data-reveal>
            <div className="md:col-span-6">
              <Altitude deg={15}>How it works</Altitude>
              <h2 id="chain-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
                From observer
                <br />
                to audience
              </h2>
            </div>
            <p className="t-lede md:col-span-5 md:col-start-8 md:pt-10">
              Five stages, one direction. ZenithProduction sits in the middle: it listens to the match, makes the graphics, and drives OBS.
            </p>
          </div>
          <div className="mt-14" data-reveal>
            <SignalChain />
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="cap-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={30}>Capabilities</Altitude>
            <h2 id="cap-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              Built for match day
            </h2>
          </div>
          <dl className="mt-14 grid border-t border-line md:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <div key={c.k} className="group grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-8 md:pr-10 md:odd:border-r md:even:pl-10" data-reveal style={{ '--i': i % 2 } as React.CSSProperties}>
                <span className="t-label pt-1 !text-prod">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <dt className="text-lg font-medium">{c.k}</dt>
                  <dd className="mt-2 text-fg-2">{c.v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="gallery-title">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
            <div>
              <Altitude deg={45}>Gallery</Altitude>
              <h2 id="gallery-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
                On screen
              </h2>
            </div>
            <p className="max-w-md text-sm text-fg-3">
              {media.length
                ? 'Images marked “Screenshot” are approved captures of the software; others are illustrations.'
                : 'Approved screenshots of the software will appear here. Until then, these are illustrations of the kind of output it produces.'}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {media.length
              ? media.map((m, i) => (
                  <figure key={m.id} className={`panel overflow-hidden ${i === 0 ? 'md:col-span-2' : ''}`} data-reveal>
                    <div className="relative bg-ink-2">
                      <span className="t-label absolute top-3 left-3 rounded-xs border border-line-2 bg-void/80 px-2 py-1 !text-[10px]">
                        {m.isAuthentic ? 'Screenshot' : 'Illustration'}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/media/${m.fileId}`} alt={m.title} className="w-full" loading="lazy" />
                    </div>
                    <figcaption className="p-5">
                      <p className="font-medium">{m.title}</p>
                      {m.caption && <p className="mt-1 text-sm text-fg-2">{m.caption}</p>}
                    </figcaption>
                  </figure>
                ))
              : [
                  { t: 'Broadcast layout', c: 'Standings column, lower third and a player pop-up over gameplay.' },
                  { t: 'Observer to broadcast', c: 'The same signal chain shown above, as it runs during a match.' },
                ].map((g, i) => (
                  <figure key={g.t} className="panel overflow-hidden" data-reveal style={{ '--i': i } as React.CSSProperties}>
                    <div className="relative">
                      <IllustrationTag />
                      <BroadcastFrame animated={false} />
                    </div>
                    <figcaption className="p-5">
                      <p className="font-medium">{g.t}</p>
                      <p className="mt-1 text-sm text-fg-2">{g.c}</p>
                    </figcaption>
                  </figure>
                ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="buy-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={60}>Work with us</Altitude>
            <h2 id="buy-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              Two ways in
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <ZLink to="/inquire" className="panel-raised group relative flex min-w-0 flex-col p-8 transition-colors hover:border-prod" data-reveal>
              <span className="t-label !text-prod">01 · Purchase</span>
              <span className="t-display mt-5 text-xl">Run it yourself</span>
              <span className="mt-4 text-fg-2">License ZenithProduction for your own organisation or production crew. Tell us how you broadcast and the team will reply with options and pricing.</span>
              <span className="btn btn-primary mt-8 self-start whitespace-normal text-left">
                Inquire about purchasing <span className="arrow">→</span>
              </span>
            </ZLink>
            <ZLink to="/book" className="panel-raised group relative flex min-w-0 flex-col p-8 transition-colors hover:border-prod" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
              <span className="t-label !text-prod">02 · Production service</span>
              <span className="t-display mt-5 text-xl">We run it for you</span>
              <span className="mt-4 text-fg-2">Book the Zenith production crew for your upcoming tournament. Send the dates and requirements — we confirm after review.</span>
              <span className="btn btn-ghost mt-8 self-start whitespace-normal text-left">
                Book production for your tournament <span className="arrow">→</span>
              </span>
            </ZLink>
          </div>
        </div>
      </section>

      <section className="py-24" aria-labelledby="faq-title">
        <div className="shell grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4" data-reveal>
            <Altitude deg={75}>Questions</Altitude>
            <h2 id="faq-title" className="t-display mt-6 text-[clamp(1.4rem,2.6vw,2rem)]">
              Production FAQ
            </h2>
          </div>
          <div className="md:col-span-8">
            <Faq items={FAQ} />
          </div>
        </div>
      </section>
    </>
  )
}
