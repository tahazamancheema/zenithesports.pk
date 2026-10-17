import { UidMatch } from '@/components/anticheat/uid-match'
import { Altitude } from '@/components/brand'
import { Faq } from '@/components/faq'
import { IllustrationTag } from '@/components/illustrations'
import { ZLink } from '@/components/link'
import { getSettings } from '@/server/settings'

const PIPELINE = [
  { t: 'Report', d: 'You submit the player’s UID with two screenshots: proof the in-game report went through, and proof of the UID.' },
  { t: 'Evidence check', d: 'Files are checked for type, size and integrity, stored privately, and compared with earlier reports.' },
  { t: 'UID match', d: 'A reviewer confirms that the UID you entered is the one shown in your evidence. No match, no approval.' },
  { t: 'Decision', d: 'The reviewer approves, rejects, or asks for clarification — and records the reason.' },
  { t: 'Verified flag', d: 'Only an approved report creates a verified flag on that identifier.' },
  { t: 'Historical scan', d: 'The flag is matched against current and past registrations and rosters. Matches become alerts for staff — never automatic bans.' },
]

const FAQ = [
  { q: 'Which games can I report for?', a: 'PUBG Mobile, while ZenithAntiCheat is in its first phase. Other games will open here when the review process is ready for them.' },
  { q: 'Will the player see who reported them?', a: 'No. Reports, evidence and reporter details are private to the AntiCheat reviewers.' },
  { q: 'Is there a public list of banned players?', a: 'No. We never publish flagged players, evidence or investigation notes. Flags are used privately to check entries to Zenith competitions.' },
  { q: 'What happens if my screenshot doesn’t show the UID?', a: 'The report stays pending while we ask for clarification, or is rejected. We cannot approve a report unless the UID is visible and matches.' },
  { q: 'How long do you keep my evidence?', a: 'Evidence for reports that are not approved is deleted after 180 days. Evidence behind an approved flag is kept for as long as the flag is active, for appeals.' },
]

export default async function AnticheatPage() {
  const settings = await getSettings()
  const pilot = settings['product.anticheat'].status === 'pilot'
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="grid-field absolute inset-0 -z-10 opacity-40" />
        <div className="shell grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="t-label flex items-center gap-3" style={{ animation: 'fade 700ms both' }}>
              <span className="node node-fill" />
              ZenithAntiCheat · PUBG Mobile{pilot ? ' · First phase' : ''}
            </p>
            <h1 className="t-display mt-7 text-[clamp(1.8rem,4.4vw,3.4rem)]" style={{ animation: 'rise 900ms var(--ease-out-expo) 80ms both' }}>
              Integrity,
              <br />
              <span className="text-ac">verified.</span>
            </h1>
            <p className="t-lede mt-7 max-w-lg" style={{ animation: 'rise 900ms var(--ease-out-expo) 180ms both' }}>
              Report a banned or cheating player with evidence. A person reviews every report, and verified flags are checked against every team that enters a Zenith competition.
            </p>
            <div className="mt-9 flex flex-wrap gap-3" style={{ animation: 'rise 900ms var(--ease-out-expo) 280ms both' }}>
              <ZLink to="/report" className="btn btn-primary">
                Report a banned player <span className="arrow">→</span>
              </ZLink>
              <a href="#process" className="btn btn-ghost">
                How reviews work
              </a>
            </div>
          </div>
          <div className="relative lg:col-span-6" style={{ animation: 'fade 1200ms 300ms both' }}>
            <div className="panel-raised relative p-6 pt-12">
              <IllustrationTag />
              <UidMatch />
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-20 border-b border-line py-24" aria-labelledby="process-title">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4" data-reveal>
            <Altitude deg={15}>The process</Altitude>
            <h2 id="process-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              From report to verified flag
            </h2>
            <p className="mt-6 text-fg-2">Evidence is a starting point, not a verdict. A shared phone number or matching ID is a reason to look closer — the decision is always a person’s.</p>
          </div>
          <ol className="relative lg:col-span-7 lg:col-start-6">
            <span aria-hidden className="absolute top-2 bottom-2 left-[11px] w-px bg-linear-to-b from-ac via-line-2 to-transparent" />
            {PIPELINE.map((p, i) => (
              <li key={p.t} className="relative grid grid-cols-[24px_1fr] gap-6 pb-10 last:pb-0" data-reveal style={{ '--i': i } as React.CSSProperties}>
                <span className="relative mt-1 grid h-6 w-6 place-items-center">
                  <span className="h-3 w-3 rotate-45 border border-ac bg-void" />
                </span>
                <div>
                  <p className="t-label !text-ac">
                    {String(i + 1).padStart(2, '0')} · {p.t}
                  </p>
                  <p className="mt-2 text-fg-2">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="evidence-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={30}>Valid evidence</Altitude>
            <h2 id="evidence-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              Two screenshots. One UID.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="panel p-7" data-reveal>
              <p className="t-label !text-ok">Do</p>
              <ul className="prose-zenith mt-5">
                <li>Upload the in-game confirmation that your report of the player was submitted.</li>
                <li>Upload a second screenshot that clearly shows the player’s UID — their profile or the match result.</li>
                <li>Type the UID exactly as it appears in the screenshot.</li>
                <li>Use original, uncropped screenshots where you can.</li>
              </ul>
            </div>
            <div className="panel p-7" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
              <p className="t-label !text-bad">Don’t</p>
              <ul className="prose-zenith mt-5">
                <li>Submit edited, drawn-on or composited images — manipulated evidence is rejected.</li>
                <li>Upload the same screenshot twice, or unrelated images.</li>
                <li>Report a player without a visible UID — we cannot match it.</li>
                <li>Include other people’s personal details.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24" aria-labelledby="privacy-title">
        <div className="shell grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5" data-reveal>
            <Altitude deg={45}>Privacy</Altitude>
            <h2 id="privacy-title" className="t-display mt-6 text-[clamp(1.5rem,3vw,2.3rem)]">
              What stays private
            </h2>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 md:col-span-7" data-reveal>
            {['Lists of flagged players', 'Contact numbers', 'Team and player associations', 'Unreviewed reports', 'Your evidence', 'Investigation notes'].map((x) => (
              <li key={x} className="flex items-center gap-3 bg-ink-1 px-5 py-4 text-fg-2">
                <span className="node" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-24" aria-labelledby="ac-faq">
        <div className="shell grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4" data-reveal>
            <Altitude deg={60}>Questions</Altitude>
            <h2 id="ac-faq" className="t-display mt-6 text-[clamp(1.4rem,2.6vw,2rem)]">
              Reporting FAQ
            </h2>
            <ZLink to="/report" className="btn btn-primary mt-8">
              Start a report <span className="arrow">→</span>
            </ZLink>
          </div>
          <div className="md:col-span-8">
            <Faq items={FAQ} />
          </div>
        </div>
      </section>
    </>
  )
}
