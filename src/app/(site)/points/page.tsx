import { Altitude } from '@/components/brand'
import { Faq } from '@/components/faq'
import { IllustrationTag, PointsPhone } from '@/components/illustrations'
import { Customizer } from '@/components/points/customizer'
import { Extraction } from '@/components/points/extraction'
import { WaitlistForm } from '@/components/points/waitlist'
import { issueFormToken } from '@/server/crypto'
import { WAITLIST_CONSENT } from '@/server/services/intake'
import { getSettings } from '@/server/settings'

const FEATURES = [
  ['Placement & kill points', 'Score every match from placements and eliminations, with totals across days and stages.'],
  ['Your scoring rules', 'Set the points table your tournament uses instead of bending to a fixed one.'],
  ['Custom designs', 'Themes, colours and typography so results look like your event.'],
  ['Teams & players', 'Keep team and player records on the device and reuse them across tournaments.'],
  ['Previous results', 'Every saved match stays available to review, edit and export later.'],
  ['AI-assisted extraction', 'Read results from screenshots, then check and correct before anything counts.'],
]

const FAQ = [
  { q: 'When does ZenithPoints launch?', a: 'We have not announced a release date. Join the launch list and we will email you when it is available on Google Play and the App Store.' },
  { q: 'Which games will it support?', a: 'PUBG Mobile and Free Fire at first.' },
  { q: 'Is the AI extraction always right?', a: 'No — and the app is designed around that. Extracted values are shown for review, uncertain readings are highlighted, and you confirm or correct them before points are calculated.' },
  { q: 'Can I use it on this website?', a: 'No. ZenithPoints is a mobile app; this page describes it. The website does not process screenshots or calculate scores.' },
  { q: 'Where is my data stored?', a: 'The app is designed to keep teams and results in a local database on your device.' },
]

function StoreBadge({ store, url, live }: { store: string; url: string; live: boolean }) {
  const inner = (
    <>
      <span className="t-label block !text-[10px]">{live && url ? 'Get it on' : 'Coming soon to'}</span>
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
        <div aria-hidden className="absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(closest-side, var(--color-pts), transparent)' }} />
        <div className="shell grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3" style={{ animation: 'fade 700ms both' }}>
              <span className="chip chip-accent">{s.status === 'available' ? 'Available now' : s.status === 'beta' ? 'In beta' : 'Coming soon'}</span>
              <span className="t-label">ZenithPoints · PUBG Mobile & Free Fire</span>
            </div>
            <h1 className="t-display mt-7 text-[clamp(1.8rem,4.4vw,3.4rem)]" style={{ animation: 'rise 900ms var(--ease-out-expo) 80ms both' }}>
              Results in.
              <br />
              <span className="text-pts">Standings out.</span>
            </h1>
            <p className="t-lede mt-7 max-w-xl" style={{ animation: 'rise 900ms var(--ease-out-expo) 180ms both' }}>
              A scoring app for esports organisers and teams. Turn results screenshots into checked, calculated leaderboards — in your own design.
            </p>
            {s.launchNote && <p className="mt-4 text-fg-2">{s.launchNote}</p>}
            <div className="mt-9 flex flex-wrap gap-3" style={{ animation: 'rise 900ms var(--ease-out-expo) 280ms both' }}>
              <StoreBadge store="Google Play" url={s.playStoreUrl} live={live} />
              <StoreBadge store="App Store" url={s.appStoreUrl} live={live} />
              {!live && (
                <a href="#launch" className="btn btn-primary self-center">
                  Get launch updates <span className="arrow">↓</span>
                </a>
              )}
            </div>
          </div>
          <div className="relative mx-auto w-56 lg:col-span-4 lg:col-start-9 lg:w-64" style={{ animation: 'rise 1100ms var(--ease-out-expo) 200ms both' }}>
            <IllustrationTag>Illustration · in development</IllustrationTag>
            <PointsPhone />
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="flow-title">
        <div className="shell">
          <div className="grid gap-6 md:grid-cols-12" data-reveal>
            <div className="md:col-span-6">
              <Altitude deg={15}>How it works</Altitude>
              <h2 id="flow-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
                Screenshot to standings
              </h2>
            </div>
            <p className="t-lede md:col-span-5 md:col-start-8 md:pt-10">AI does the reading. You stay in charge of the result: every extracted value is reviewed before points are calculated.</p>
          </div>
          <div className="mt-14" data-reveal>
            <Extraction />
            <p className="mt-3 text-sm text-fg-3">Product illustration with sample data. It shows the intended workflow of the app, not output from it.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="feat-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={30}>Features</Altitude>
            <h2 id="feat-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              Built for scorekeepers
            </h2>
          </div>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([t, d], i) => (
              <li key={t} className="bg-ink-1 p-7" data-reveal style={{ '--i': i % 3 } as React.CSSProperties}>
                <span className="t-label !text-pts">{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-4 text-lg font-medium">{t}</p>
                <p className="mt-2 text-fg-2">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="custom-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={45}>Customisation</Altitude>
            <h2 id="custom-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              Make it yours — try it
            </h2>
            <p className="mt-4 max-w-xl text-fg-2">A small preview of the idea. Pick a colour and a typeface and the standings follow.</p>
          </div>
          <div className="mt-12" data-reveal>
            <Customizer />
          </div>
        </div>
      </section>

      <section id="launch" className="scroll-mt-20 border-b border-line py-24" aria-labelledby="launch-title">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5" data-reveal>
            <Altitude deg={60}>Launch</Altitude>
            <h2 id="launch-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
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
