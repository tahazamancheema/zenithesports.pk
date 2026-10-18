import { Altitude } from '@/components/brand'
import { ProductLockup } from '@/components/brand/product-logos'
import { Faq } from '@/components/faq'
import { SplitText, WordCycle } from '@/components/kinetic'
import { Extraction } from '@/components/points/extraction'
import { PointsPhoneDemo, PointsStudio } from '@/components/points/points-studio'
import { WaitlistForm } from '@/components/points/waitlist'
import { issueFormToken } from '@/server/crypto'
import { WAITLIST_CONSENT } from '@/server/services/intake'
import { getSettings } from '@/server/settings'

/* eslint-disable @next/next/no-img-element -- static, pre-optimised render */

const OUTPUTS = [
  { text: 'Slot lists', color: 'var(--color-pts)' },
  { text: 'Standings', color: '#c6bdff' },
  { text: 'Champions', color: 'var(--color-gold)' },
  { text: 'MVPs', color: '#8cf0df' },
]

const PROMISES = [
  { t: 'Custom designs', d: 'Themes, colours, fonts and your own logos — every graphic looks like your event, not a template.', icon: 'M4 18l6-12 4 8 2-4 4 8z' },
  { t: 'Points, calculated', d: 'Placement and finish points added up the moment a match is confirmed, using your points table.', icon: 'M5 5h14v14H5zM9 9h6M9 12h6M9 15h3' },
  { t: 'Teams database', d: 'Teams, tags, logos and players saved once and reused in every tournament you run.', icon: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3' },
  { t: 'No designer needed', d: 'Post-ready slot lists, standings, champions and MVP graphics without opening a design tool.', icon: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z' },
  { t: 'Designs in seconds', d: 'From confirmed results to a finished graphic in a few taps — while the lobby is still talking.', icon: 'M13 2L4 14h7l-1 8 9-12h-7z' },
]

const FEATURES = [
  ['Slot lists & participating teams', 'Publish who is playing, in which slot, with team logos — before match one.'],
  ['Match & overall results', 'Per-match rankings and an overall table across days, groups and stages.'],
  ['Champions & MVP', 'The winners’ poster and the tournament MVP card, straight from confirmed results.'],
  ['Your scoring rules', 'Set the points table your tournament uses instead of bending to a fixed one.'],
  ['AI-assisted extraction', 'Read results from screenshots, then check and correct before anything counts.'],
  ['Previous results', 'Every saved match stays available to review, edit and export later.'],
]

const FAQ = [
  { q: 'When does ZenithPoints launch?', a: 'We have not announced a release date. Join the launch list and we will email you when it is available on Google Play and the App Store.' },
  { q: 'Which games will it support?', a: 'PUBG Mobile and Free Fire at first.' },
  { q: 'Do I need a graphic designer?', a: 'No. Pick a theme, add your logo and colours once, and every slot list, standings, champions and MVP graphic is generated in that design.' },
  { q: 'Is the AI extraction always right?', a: 'No — and the app is designed around that. Extracted values are shown for review, uncertain readings are highlighted, and you confirm or correct them before points are calculated.' },
  { q: 'Can I use it on this website?', a: 'No. ZenithPoints is a mobile app; this page describes it. The website does not process screenshots or calculate scores.' },
  { q: 'Where is my data stored?', a: 'The app is designed to keep teams and results in a local database on your device.' },
]

function StoreBadge({ store, url, live }: { store: string; url: string; live: boolean }) {
  const inner = (
    <>
      <span className="t-label block !text-[12px]">{live && url ? 'Get it on' : 'Coming soon to'}</span>
      <span className="mt-0.5 block font-medium">{store}</span>
    </>
  )
  return live && url ? (
    <a href={url} rel="noopener noreferrer" target="_blank" className="rounded-sm border border-pts px-5 py-3 transition-colors hover:bg-[color-mix(in_oklab,var(--color-pts)_10%,transparent)]">
      {inner}
    </a>
  ) : (
    <span className="rounded-sm border border-line-2 px-5 py-3 text-fg-2" aria-label={`${store}: coming soon`}>
      {inner}
    </span>
  )
}

export default async function PointsPage() {
  const s = (await getSettings())['product.points']
  const live = s.status === 'available' || s.status === 'beta'
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <img src="/visuals/points.webp" alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45 [mask-image:linear-gradient(90deg,transparent,#000_55%)]" />
        <div aria-hidden className="absolute -top-40 left-1/4 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(closest-side, var(--color-pts), transparent)' }} />
        <div className="shell grid gap-12 py-14 md:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-4" style={{ animation: 'fade 700ms both' }}>
              <ProductLockup product="points" size={56} />
              <span className="chip chip-accent">{s.status === 'available' ? 'Available now' : s.status === 'beta' ? 'In beta' : 'Coming soon'}</span>
            </div>
            <h1 className="t-display mt-9 text-[clamp(2rem,4.8vw,3.8rem)] leading-[1.02]">
              <SplitText text="Results in." />
              <br />
              <SplitText text="Graphics out." delay={300} letterClassName="text-pts" />
            </h1>
            <p className="mt-6 text-[clamp(1.15rem,1.6vw,1.4rem)] font-medium" style={{ animation: 'rise 900ms var(--ease-out-expo) 600ms both' }}>
              Your design, in seconds: <WordCycle words={OUTPUTS} className="font-display uppercase" />
            </p>
            <p className="t-lede mt-4 max-w-xl" style={{ animation: 'rise 900ms var(--ease-out-expo) 700ms both' }}>
              The scoring app for PUBG Mobile and Free Fire organisers. Points calculated for you, teams saved once, and every graphic ready to post — no graphic designer needed.
            </p>
            {s.launchNote && <p className="mt-4 text-fg-2">{s.launchNote}</p>}
            <div className="mt-9 flex flex-wrap gap-3" style={{ animation: 'rise 900ms var(--ease-out-expo) 800ms both' }}>
              <StoreBadge store="Google Play" url={s.playStoreUrl} live={live} />
              <StoreBadge store="App Store" url={s.appStoreUrl} live={live} />
              {!live && (
                <a href="#launch" className="btn btn-primary self-center">
                  Get launch updates <span className="arrow">↓</span>
                </a>
              )}
            </div>
          </div>
          <div className="relative flex flex-col items-center lg:col-span-4 lg:col-start-9" style={{ animation: 'rise 1100ms var(--ease-out-expo) 300ms both' }}>
            <PointsPhoneDemo className="w-[270px]" />
            <p className="t-label mt-4">Concept preview · sample teams</p>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-20" aria-label="Why ZenithPoints">
        <ul className="shell grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {PROMISES.map((p, i) => (
            <li key={p.t} className="bg-ink-1 p-6" data-reveal style={{ '--i': i } as React.CSSProperties}>
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="var(--color-pts)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
                <path d={p.icon} />
              </svg>
              <p className="t-title mt-5 text-lg">{p.t}</p>
              <p className="mt-2 text-[15px] text-fg-2">{p.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="tour-title">
        <div className="shell">
          <div className="grid gap-6 md:grid-cols-12" data-reveal>
            <div className="md:col-span-6">
              <Altitude deg={15}>The app</Altitude>
              <h2 id="tour-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
                Every graphic your tournament needs
              </h2>
            </div>
            <p className="t-lede md:col-span-5 md:col-start-8 md:pt-10">Watch a match go from a results screenshot to finished graphics, or tap any step, layout or theme to try it yourself.</p>
          </div>
          <div className="mt-14">
            <PointsStudio />
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="flow-title">
        <div className="shell">
          <div className="grid gap-6 md:grid-cols-12" data-reveal>
            <div className="md:col-span-6">
              <Altitude deg={30}>How it works</Altitude>
              <h2 id="flow-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
                Screenshot to standings
              </h2>
            </div>
            <p className="t-lede md:col-span-5 md:col-start-8 md:pt-10">AI does the reading. You stay in charge of the result: every extracted value is reviewed before points are calculated.</p>
          </div>
          <div className="mt-14" data-reveal>
            <Extraction />
            <p className="mt-3 text-sm text-fg-3">Concept illustration with sample data. It shows the intended workflow of the app, not output from it.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="feat-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={45}>Features</Altitude>
            <h2 id="feat-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
              Built for scorekeepers
            </h2>
          </div>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([t, d], i) => (
              <li key={t} className="bg-ink-1 p-7" data-reveal style={{ '--i': i % 3 } as React.CSSProperties}>
                <span className="t-label !text-pts">{String(i + 1).padStart(2, '0')}</span>
                <p className="t-title mt-4 text-lg">{t}</p>
                <p className="mt-2 text-fg-2">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="launch" className="scroll-mt-20 border-b border-line py-24" aria-labelledby="launch-title">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5" data-reveal>
            <Altitude deg={60}>Launch</Altitude>
            <h2 id="launch-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
              Be first on the scoreboard
            </h2>
            <p className="mt-5 text-fg-2">One email when ZenithPoints launches. We don’t share your address, and you can delete it from the list at any time.</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7" data-reveal>
            <WaitlistForm token={issueFormToken('waitlist')} consentText={WAITLIST_CONSENT} />
          </div>
        </div>
      </section>

      <section className="py-24" aria-labelledby="pts-faq">
        <div className="shell grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4" data-reveal>
            <Altitude deg={75}>Questions</Altitude>
            <h2 id="pts-faq" className="t-display mt-6 text-[clamp(1.4rem,2.6vw,2rem)]">
              ZenithPoints FAQ
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
