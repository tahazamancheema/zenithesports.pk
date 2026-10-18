'use client'

import { useRef, useState } from 'react'

/* eslint-disable @next/next/no-img-element -- static captures under /products, already optimised */

const P = '/products/production'

export const APP_SCREENS = [
  { id: 'command', label: 'Command centre', src: `${P}/command-center.webp`, body: 'The match on air, what is showing, what is queued — and every control one click away.' },
  { id: 'automation', label: 'Automation', src: `${P}/automation.webp`, body: 'Match start, chicken dinner and the after-match rundown can run themselves, or wait for the operator’s cue.' },
  { id: 'library', label: 'Overlay library', src: `${P}/overlay-library.webp`, body: 'Every scene and pop-up in one place, with presets that restyle the whole show at once.' },
  { id: 'preview', label: 'Program preview', src: `${P}/program-preview.webp`, body: 'See exactly what the audience will see before it goes to air.' },
]

/** Tabbed viewer for the operator screens. */
export function AppScreens() {
  const [i, setI] = useState(0)
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-4" role="tablist" aria-label="ZenithProduction screens">
        {APP_SCREENS.map((s, n) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={n === i}
            onClick={() => setI(n)}
            className={`mb-2 block w-full rounded-md border px-4 py-3 text-left transition-colors ${n === i ? 'border-prod bg-[color-mix(in_oklab,var(--color-prod)_8%,transparent)]' : 'border-line hover:border-line-3'}`}
          >
            <span className="t-title block text-[16px]">{s.label}</span>
            <span className="mt-1 block text-[14px] text-fg-2">{s.body}</span>
          </button>
        ))}
      </div>
      <div className="lg:col-span-8">
        <div className="bezel">
          <div className="relative aspect-video bg-black">
            {APP_SCREENS.map((s, n) => (
              <img key={s.id} src={s.src} alt={`ZenithProduction — ${s.label}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700" style={{ opacity: n === i ? 1 : 0, transform: n === i ? 'none' : 'scale(1.02)' }} />
            ))}
          </div>
        </div>
        <p className="mt-3 text-[13px] text-fg-3">Real software, shown with its built-in sample data.</p>
      </div>
    </div>
  )
}

export const SCENES = [
  { src: `${P}/starting-soon.webp`, t: 'Starting soon', c: 'Countdown before the show.' },
  { src: `${P}/map-schedule.webp`, t: 'Map schedule', c: 'Where and when every match is played.' },
  { src: `${P}/playing-teams.webp`, t: 'Playing teams', c: 'Every team in the lobby.' },
  { src: `${P}/map-pov.webp`, t: 'Map & POV', c: 'Teams alive, players alive and the map.' },
  { src: `${P}/match-ranking.webp`, t: 'Match ranking', c: 'Placement and finish points per match.' },
  { src: `${P}/overall-standings.webp`, t: 'Overall standings', c: 'The tournament table after every match.' },
  { src: `${P}/chicken-dinner.webp`, t: 'Chicken dinner', c: 'The winning team, the moment it happens.' },
  { src: `${P}/winner-stats.webp`, t: 'Winner stats', c: 'How the winners did it.' },
  { src: `${P}/match-mvp.webp`, t: 'Match MVP', c: 'The standout player of the match.' },
  { src: `${P}/top-fraggers.webp`, t: 'Top fraggers', c: 'Leading players across the tournament.' },
  { src: `${P}/head-to-head.webp`, t: 'Head to head', c: 'Two teams compared side by side.' },
  { src: `${P}/team-spotlight.webp`, t: 'Team spotlight', c: 'A team’s players and numbers.' },
  { src: `${P}/road-to-mvp.webp`, t: 'Road to MVP', c: 'The MVP race, match by match.' },
  { src: `${P}/champions.webp`, t: 'Champions', c: 'The final result.' },
  { src: `${P}/casting-desk.webp`, t: 'Casting desk', c: 'Camera frames for the casters.' },
  { src: `${P}/thanks-for-watching.webp`, t: 'Thanks for watching', c: 'The end card.' },
]

/** Horizontal, snap-scrolling strip of full broadcast scenes. */
export function SceneStrip() {
  const ref = useRef<HTMLDivElement>(null)
  const by = (d: number) => ref.current?.scrollBy({ left: d * Math.min(720, ref.current.clientWidth * 0.8), behavior: 'smooth' })
  return (
    <div className="relative">
      <div className="mb-4 flex justify-end gap-2">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => by(-1)} aria-label="Previous scenes">←</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => by(1)} aria-label="Next scenes">→</button>
      </div>
      <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]" tabIndex={0} aria-label="Broadcast scenes">
        {SCENES.map((s) => (
          <figure key={s.t} className="w-[min(82vw,560px)] shrink-0 snap-start">
            <div className="overflow-hidden rounded-lg border border-line-2">
              <img src={s.src} alt={`${s.t} scene`} loading="lazy" className="aspect-video w-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
            </div>
            <figcaption className="mt-3">
              <span className="t-title text-[16px]">{s.t}</span>
              <span className="ml-2 text-[14px] text-fg-2">{s.c}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
