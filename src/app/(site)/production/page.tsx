import { Eyebrow } from '@/components/brand'
import { ProductLockup } from '@/components/brand/product-logos'
import { InViewVideo, SplitText, TiltCard } from '@/components/kinetic'
import { ZLink } from '@/components/link'
import { BroadcastBuild } from '@/components/production/broadcast-build'
import { AppScreens, SceneStrip } from '@/components/production/gallery'
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

/* eslint-disable @next/next/no-img-element -- static visuals and /media images with their own caching */

export default async function ProductionPage() {
  const [media, settings] = await Promise.all([listMedia('production'), getSettings()])
  const status = settings['product.production'].status
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <img src="/visuals/production.webp" alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30 [mask-image:linear-gradient(180deg,#000,transparent_75%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_10%,rgba(255,90,68,0.18),transparent_50%)]" />
        <div className="shell pb-20 pt-14 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div style={{ animation: 'fade 700ms both' }}>
                <ProductLockup product="production" size={56} />
              </div>
              <h1 className="t-display mt-9 text-[clamp(2rem,4.8vw,3.8rem)] leading-[1.02]">
                <SplitText text="The whole broadcast." />
                <br />
                <SplitText text="One operator seat." delay={420} letterClassName="text-prod" />
              </h1>
            </div>
            <div className="lg:col-span-5" style={{ animation: 'rise 900ms var(--ease-out-expo) 300ms both' }}>
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

          {/* the walkthrough */}
          <div className="mt-14" style={{ animation: 'rise 1100ms var(--ease-out-expo) 400ms both' }}>
            <TiltCard max={3}>
              <div className="bezel glow-prod">
                <div className="relative">
                  <InViewVideo
                    className="aspect-video w-full bg-black object-cover"
                    poster="/products/production/walkthrough-poster.webp"
                    label="Walkthrough of ZenithProduction: command centre, overlays and after-match scenes, with the software's built-in sample data"
                    sources={[
                      { src: '/products/production/walkthrough.webm', type: 'video/webm' },
                      { src: '/products/production/walkthrough.mp4', type: 'video/mp4' },
                    ]}
                  />
                  <span className="chip absolute right-3 top-3 border-white/20 bg-black/65 text-white">Real software · sample data</span>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      <BroadcastBuild />

      <section className="border-y border-line py-24" aria-labelledby="inside-title">
        <div className="shell">
          <div data-reveal>
            <Eyebrow>Inside the software</Eyebrow>
            <h2 id="inside-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">The operator’s view</h2>
          </div>
          <div className="mt-12" data-reveal>
            <AppScreens />
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="cap-title">
        <div className="shell">
          <div data-reveal>
            <Eyebrow>Capabilities</Eyebrow>
            <h2 id="cap-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
              Built for match day
            </h2>
          </div>
          <dl className="mt-14 grid border-t border-line md:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <div key={c.k} className="group grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-8 md:pr-10 md:odd:border-r md:even:pl-10" data-reveal style={{ '--i': i % 2 } as React.CSSProperties}>
                <span className="t-label pt-1 !text-prod">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <dt className="t-title text-lg">{c.k}</dt>
                  <dd className="mt-2 text-fg-2">{c.v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="overflow-hidden border-b border-line py-24" aria-labelledby="gallery-title">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
            <div>
              <Eyebrow>On air</Eyebrow>
              <h2 id="gallery-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
                Every scene, ready
              </h2>
            </div>
            <p className="max-w-md text-[14px] text-fg-2">Real scenes from ZenithProduction, shown with its built-in sample teams and players.</p>
          </div>
          <div className="mt-10" data-reveal>
            <SceneStrip />
          </div>
          {media.length > 0 && (
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {media.map((m) => (
                <figure key={m.id} className="panel overflow-hidden" data-reveal>
                  <div className="relative bg-ink-2">
                    <span className="chip absolute left-3 top-3 bg-void/80">{m.isAuthentic ? 'Screenshot' : 'Illustration'}</span>
                    <img src={`/media/${m.fileId}`} alt={m.title} className="w-full" loading="lazy" />
                  </div>
                  <figcaption className="p-5">
                    <p className="font-medium">{m.title}</p>
                    {m.caption && <p className="mt-1 text-sm text-fg-2">{m.caption}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="buy-title">
        <div className="shell">
          <div data-reveal>
            <Eyebrow>Work with us</Eyebrow>
            <h2 id="buy-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              Two ways in
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <ZLink to="/inquire" className="panel-raised group relative flex min-w-0 flex-col p-8 transition-colors hover:border-prod" data-reveal>
              <span className="t-label !text-prod">01 · Purchase</span>
              <span className="t-title mt-5 text-2xl">Run it yourself</span>
              <span className="mt-4 text-fg-2">License ZenithProduction for your own organisation or production crew. Tell us how you broadcast and the team will reply with options and pricing.</span>
              <span className="btn btn-primary mt-8 self-start whitespace-normal text-left">
                Inquire about purchasing <span className="arrow">→</span>
              </span>
            </ZLink>
            <ZLink to="/book" className="panel-raised group relative flex min-w-0 flex-col p-8 transition-colors hover:border-prod" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
              <span className="t-label !text-prod">02 · Production service</span>
              <span className="t-title mt-5 text-2xl">We run it for you</span>
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
            <Eyebrow>Questions</Eyebrow>
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
