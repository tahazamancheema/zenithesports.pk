'use client'

import { useRef } from 'react'
import { PRODUCTS } from '@/config/products'
import { ZLink } from '../link'
import { useSequence } from '../motion'

const STAGES = [
  {
    title: 'Teams enter',
    body: 'Captains register their roster against the tournament’s own rules and form. Duplicate players, team names and numbers are stopped at the database, and every entry gets a private status link.',
    facts: ['Solo · Duo · Squad · 5v5', 'Custom forms per event', 'Approvals & waitlists'],
    cta: 'Browse tournaments',
  },
  {
    title: 'Integrity is checked',
    body: 'Every registration is matched against verified flags — game UIDs, linked numbers and team history. A match goes to a human reviewer as an alert. Nothing is banned automatically.',
    facts: ['Checks every entry', 'Scans past records too', 'Reviewer decides'],
    cta: 'How reporting works',
  },
  {
    title: 'The match goes live',
    body: 'ZenithProduction reads the observer’s live data and drives the whole on-air package — live standings, player pop-ups and after-match scenes — through OBS to the stream.',
    facts: ['PUBG Mobile today', 'Live animated overlays', 'OBS scene control'],
    cta: 'See ZenithProduction',
  },
  {
    title: 'Results are scored',
    body: 'ZenithPoints is being built to turn results screenshots into reviewed, calculated standings in minutes — placement and kill points, in your own design.',
    facts: ['PUBG Mobile & Free Fire', 'AI-assisted, human-checked', 'Coming to mobile'],
    cta: 'Join the launch list',
  },
]

export function Circuit() {
  const ref = useRef<HTMLDivElement>(null)
  const { active, setActive, playing, setPlaying, reduce } = useSequence(4, 5200, ref)
  const p = PRODUCTS[active]
  const s = STAGES[active]

  return (
    <div ref={ref} style={{ '--accent': p.color } as React.CSSProperties}>
      {/* the track */}
      <div role="tablist" aria-label="The life of a tournament" className="relative grid grid-cols-4">
        <div aria-hidden className="absolute top-[19px] right-[12.5%] left-[12.5%] h-px bg-line-2" />
        <div
          aria-hidden
          className="absolute top-[19px] left-[12.5%] h-px origin-left"
          style={{
            width: '75%',
            background: 'linear-gradient(90deg, var(--color-reg), var(--color-ac), var(--color-prod), var(--color-pts))',
            transform: `scaleX(${active / 3})`,
            transition: 'transform 900ms var(--ease-out-expo)',
          }}
        />
        {!reduce && playing && active < 3 && (
          <span
            aria-hidden
            key={active}
            className="absolute top-[16px] -ml-[3.5px] h-[7px] w-[7px]"
            style={
              {
                '--from': `calc(12.5% + ${active} * 25%)`,
                '--to': `calc(12.5% + ${active + 1} * 25%)`,
                background: p.color,
                boxShadow: `0 0 14px ${p.color}`,
                animation: 'circuit-hop 5.2s var(--ease-in-out-quint) both',
              } as React.CSSProperties
            }
          />
        )}
        {PRODUCTS.map((x, i) => {
          const on = i === active
          return (
            <button
              key={x.surface}
              role="tab"
              id={`circuit-tab-${i}`}
              aria-selected={on}
              aria-controls="circuit-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => {
                setActive(i)
                setPlaying(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  const next = (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4
                  setActive(next)
                  setPlaying(false)
                  document.getElementById(`circuit-tab-${next}`)?.focus()
                }
              }}
              className="group relative flex flex-col items-center gap-3 pb-2 text-center"
            >
              <span
                className="relative z-10 grid h-10 w-10 place-items-center border bg-void transition-all duration-500"
                style={{ borderColor: on ? x.color : 'var(--color-line-3)', transform: 'rotate(45deg) scale(var(--s,1))', ['--s' as string]: on ? 1 : 0.8 }}
              >
                <span className="-rotate-45 font-mono text-[11px]" style={{ color: on ? x.color : 'var(--color-fg-3)' }}>
                  {x.index}
                </span>
              </span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${on ? 'text-fg' : 'text-fg-3 group-hover:text-fg-2'}`}>
                <span className="hidden sm:inline">{x.nav}</span>
                <span className="sm:hidden">{x.verb}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div id="circuit-panel" role="tabpanel" aria-labelledby={`circuit-tab-${active}`} className="mt-12 grid gap-10 md:grid-cols-12">
        <div key={active} className="md:col-span-7" style={{ animation: reduce ? undefined : 'rise 700ms var(--ease-out-expo) both' }}>
          <p className="t-label !text-[var(--accent)]">
            Stage {p.index} · {p.name}
          </p>
          <h3 className="t-display mt-4 text-[clamp(1.4rem,3vw,2.1rem)]">{s.title}</h3>
          <p className="t-lede mt-5 max-w-xl">{s.body}</p>
          <ZLink surface={p.surface} to="/" className="btn btn-ghost mt-8">
            {s.cta} <span className="arrow">→</span>
          </ZLink>
        </div>
        <ul key={`f${active}`} className="grid content-start gap-px self-start overflow-hidden rounded-md border border-line bg-line md:col-span-5">
          {s.facts.map((f, i) => (
            <li
              key={f}
              className="flex items-center gap-4 bg-ink-1 px-5 py-4"
              style={{ animation: reduce ? undefined : `rise 600ms var(--ease-out-expo) ${120 + i * 90}ms both` }}
            >
              <span className="node" />
              <span className="text-fg-2">{f}</span>
            </li>
          ))}
          <li className="flex items-center justify-between bg-ink-1 px-5 py-3">
            <span className="t-label">
              {active + 1} / 4
            </span>
            {!reduce && (
              <button type="button" onClick={() => setPlaying(!playing)} className="t-label hover:text-fg">
                {playing ? 'Pause ❚❚' : 'Play ▶'}
              </button>
            )}
          </li>
        </ul>
      </div>
    </div>
  )
}
