import { UidMatch } from '@/components/anticheat/uid-match'
import { Altitude } from '@/components/brand'
import { ProductLockup } from '@/components/brand/product-logos'
import { Faq } from '@/components/faq'
import { GameMark } from '@/components/game-mark'
import { SplitText } from '@/components/kinetic'
import { ZLink } from '@/components/link'
import { reportRule } from '@/lib/report-rules'
import { getGames, mediaUrl } from '@/server/services/catalog'
import { getSettings } from '@/server/settings'

/* eslint-disable @next/next/no-img-element -- static, pre-optimised render */

const PIPELINE = [
  { t: 'Report', d: 'You type the player’s ID and upload the screenshot that shows it — for PUBG Mobile and Free Fire, the successful-report screen.' },
  { t: 'Evidence check', d: 'Files are checked for type, size and integrity, stored privately, and compared with earlier reports.' },
  { t: 'ID match', d: 'A reviewer confirms that the ID you typed is the one shown in your evidence. No match, no approval.' },
  { t: 'Decision', d: 'The reviewer approves, rejects, or asks for clarification — and records the reason.' },
  { t: 'Verified flag', d: 'Only an approved report creates a verified flag on that identifier.' },
  { t: 'Historical scan', d: 'The flag is matched against current and past registrations and rosters. Matches become alerts for staff — never automatic bans.' },
]

const FAQ = [
  { q: 'Which games can I report for?', a: 'Every game Zenith runs competitions for: PUBG Mobile, Free Fire, VALORANT, Honor of Kings, TEKKEN 8 and EA SPORTS FC 26. Each game asks for the evidence that identifies a player in that game.' },
  { q: 'Why does VALORANT need a scoreboard instead of the report screen?', a: 'VALORANT identifies players by Riot ID (Name#TAG), and the in-game report screen does not show it. The scoreboard or the match in your career history does.' },
  { q: 'Will the player see who reported them?', a: 'No. Reports, evidence and reporter details are private to the AntiCheat reviewers.' },
  { q: 'Is there a public list of banned players?', a: 'No. We never publish flagged players, evidence or investigation notes. Flags are used privately to check entries to Zenith competitions.' },
  { q: 'What happens if my screenshot doesn’t show the ID?', a: 'The report stays pending while we ask for clarification, or is rejected. We cannot approve a report unless the ID is visible and matches.' },
  { q: 'How long do you keep my evidence?', a: 'Evidence for reports that are not approved is deleted after 180 days. Evidence behind an approved flag is kept for as long as the flag is active, for appeals.' },
]

export default async function AnticheatPage() {
  const [settings, games] = await Promise.all([getSettings(), getGames()])
  const enabled = games.filter((g) => settings['product.anticheat'].games.includes(g.id))
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <img src="/visuals/anticheat.webp" alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50 [mask-image:linear-gradient(90deg,transparent_10%,#000_70%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_20%,rgba(63,216,192,0.14),transparent_50%)]" />
        <div className="shell grid gap-12 py-14 md:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <div style={{ animation: 'fade 700ms both' }}>
              <ProductLockup product="anticheat" size={56} />
            </div>
            <h1 className="t-display mt-9 text-[clamp(2rem,4.8vw,3.8rem)] leading-[1.02]">
              <SplitText text="Integrity," />
              <br />
              <SplitText text="verified." delay={260} letterClassName="text-ac" />
            </h1>
            <p className="t-lede mt-7 max-w-lg" style={{ animation: 'rise 900ms var(--ease-out-expo) 500ms both' }}>
              Report a cheating or banned player in any game we run. A person reviews every report, and verified flags are checked against every team that enters a Zenith competition.
            </p>
            <div className="mt-9 flex flex-wrap gap-3" style={{ animation: 'rise 900ms var(--ease-out-expo) 600ms both' }}>
              <ZLink to="/report" className="btn btn-primary">
                Report a player <span className="arrow">→</span>
              </ZLink>
              <a href="#evidence" className="btn btn-ghost">
                What evidence counts
              </a>
            </div>
          </div>
          <div className="relative lg:col-span-6" style={{ animation: 'fade 1200ms 300ms both' }}>
            <div className="panel-raised relative bg-ink-1/80 p-6 pt-12 backdrop-blur">
              <span className="chip absolute left-4 top-4">How a reviewer checks an ID</span>
              <UidMatch />
            </div>
          </div>
        </div>
      </section>

      <section id="evidence" className="scroll-mt-20 border-b border-line py-24" aria-labelledby="evidence-title">
        <div className="shell">
          <div className="grid gap-6 md:grid-cols-12" data-reveal>
            <div className="md:col-span-6">
              <Altitude deg={15}>Valid evidence</Altitude>
              <h2 id="evidence-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
                One screenshot. One ID.
              </h2>
            </div>
            <p className="t-lede md:col-span-5 md:col-start-8 md:pt-10">Every game identifies players differently, so each one asks for the screenshot where that ID is readable — and you type the ID as well.</p>
          </div>
          <ul className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enabled.map((g, i) => {
              const rule = reportRule(g.id)
              const required = rule.evidence.filter((s) => s.required)
              return (
                <li key={g.id} className="panel flex flex-col p-6" data-reveal style={{ '--i': i % 3 } as React.CSSProperties}>
                  <div className="flex items-center gap-3">
                    <GameMark gameId={g.id} name={g.name} logoUrl={mediaUrl(g.logoFileId)} size={40} />
                    <p className="t-title text-lg">{g.name}</p>
                  </div>
                  <dl className="mt-5 grid gap-3 text-[15px]">
                    <div>
                      <dt className="t-label">Type</dt>
                      <dd className="mt-0.5">
                        {g.uidLabel} <span className="font-mono text-[13px] text-fg-3">{rule.idPlaceholder}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="t-label">Upload</dt>
                      {required.map((s) => (
                        <dd key={s.kind} className="mt-0.5 text-fg-2">
                          <span className="font-medium text-fg">{s.label}.</span> {s.hint}
                        </dd>
                      ))}
                    </div>
                    {(rule.clip || rule.evidence.some((s) => !s.required)) && (
                      <div>
                        <dt className="t-label">Optional</dt>
                        <dd className="mt-0.5 text-fg-2">
                          {[...rule.evidence.filter((s) => !s.required).map((s) => s.label.toLowerCase()), ...(rule.clip ? ['a clip link'] : [])].join(', ')}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <ZLink to={`/report?game=${g.id}`} className="btn btn-sm btn-ghost mt-6 self-start">
                    Report a {g.shortName} player <span className="arrow">→</span>
                  </ZLink>
                </li>
              )
            })}
          </ul>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="panel p-7" data-reveal>
              <p className="t-label !text-ok">Do</p>
              <ul className="prose-zenith mt-5">
                <li>Type the ID exactly as it appears in the screenshot.</li>
                <li>Use original, uncropped screenshots where you can.</li>
                <li>Add the match details and a clip when the game allows it.</li>
              </ul>
            </div>
            <div className="panel p-7" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
              <p className="t-label !text-bad">Don’t</p>
              <ul className="prose-zenith mt-5">
                <li>Submit edited, drawn-on or composited images — manipulated evidence is rejected.</li>
                <li>Upload the same screenshot twice, or unrelated images.</li>
                <li>Include other people’s personal details.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-20 border-b border-line py-24" aria-labelledby="process-title">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4" data-reveal>
            <Altitude deg={30}>The process</Altitude>
            <h2 id="process-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
              From report to verified flag
            </h2>
            <p className="mt-6 text-fg-2">Evidence is a starting point, not a verdict. A shared phone number or matching ID is a reason to look closer — the decision is always a person’s.</p>
          </div>
          <ol className="relative lg:col-span-7 lg:col-start-6">
            <span aria-hidden className="absolute bottom-2 left-[11px] top-2 w-px bg-linear-to-b from-ac via-line-2 to-transparent" />
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

      <section className="border-b border-line py-24" aria-labelledby="privacy-title">
        <div className="shell grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5" data-reveal>
            <Altitude deg={45}>Privacy</Altitude>
            <h2 id="privacy-title" className="t-display mt-6 text-[clamp(1.6rem,3.2vw,2.5rem)]">
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
