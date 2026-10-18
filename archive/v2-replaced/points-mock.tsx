'use client'

import { useEffect, useRef, useState } from 'react'
import { ProductIcon } from '../brand/product-logos'
import { useInView, usePrefersReducedMotion } from '../motion'

/*
 * A concept of the ZenithPoints app, drawn in code. Every team below is a
 * placeholder ("Team Alpha" …) and the page labels it as a concept preview.
 * Totals are calculated with the common PUBG Mobile placement table so the
 * screens agree with each other, the way the app will.
 */

const PLACEMENT = [10, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]
const NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa']
const HUES = [42, 8, 172, 250, 330, 200, 90, 20, 280, 140, 60, 300, 220, 0, 110, 190]
// Three sample matches: placement order (team index) and kills per team.
const MATCHES = [
  { order: [0, 3, 1, 5, 2, 7, 4, 6, 9, 8, 11, 10, 13, 12, 15, 14], kills: [9, 6, 4, 7, 3, 5, 2, 4, 1, 2, 1, 0, 1, 0, 2, 1] },
  { order: [1, 0, 2, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 15], kills: [7, 8, 5, 4, 6, 2, 3, 1, 2, 1, 0, 1, 0, 2, 1, 0] },
  { order: [0, 2, 3, 1, 6, 4, 8, 5, 7, 11, 9, 10, 12, 15, 13, 14], kills: [11, 4, 6, 5, 2, 3, 4, 2, 1, 0, 1, 1, 0, 1, 0, 0] },
]

type Row = { team: number; pp: number; kp: number; total: number; wins: number }
function standings(): Row[] {
  const rows: Row[] = NAMES.map((_, team) => ({ team, pp: 0, kp: 0, total: 0, wins: 0 }))
  for (const m of MATCHES) {
    m.order.forEach((team, place) => {
      rows[team].pp += PLACEMENT[place]
      if (place === 0) rows[team].wins++
    })
    m.kills.forEach((k, team) => (rows[team].kp += k))
  }
  rows.forEach((r) => (r.total = r.pp + r.kp))
  return rows.sort((a, b) => b.total - a.total || b.wins - a.wins || b.kp - a.kp)
}

const ROWS = standings()

const THEMES = [
  { id: 'gold', label: 'Meridian', bg: 'linear-gradient(165deg,#1b1610,#0a0908 60%)', accent: '#e2bb63', ink: '#fff6df', row: 'rgba(226,187,99,0.08)' },
  { id: 'crimson', label: 'Inferno', bg: 'linear-gradient(165deg,#2a0b0d,#0d0506 60%)', accent: '#ff4d5e', ink: '#ffe8ea', row: 'rgba(255,77,94,0.09)' },
  { id: 'violet', label: 'Nebula', bg: 'linear-gradient(165deg,#181236,#07061a 60%)', accent: '#a08cff', ink: '#eeeaff', row: 'rgba(160,140,255,0.1)' },
  { id: 'ice', label: 'Glacier', bg: 'linear-gradient(165deg,#e9f1f7,#c9d8e4 70%)', accent: '#0d6ea8', ink: '#0b1a26', row: 'rgba(13,110,168,0.08)' },
]

export const SCREENS = [
  { id: 'slots', label: 'Slot list', blurb: 'Every team in its slot with its logo, ready to post before match one.' },
  { id: 'teams', label: 'Teams database', blurb: 'Teams, tags and logos saved once and reused across every tournament.' },
  { id: 'results', label: 'AI results entry', blurb: 'Upload the results screenshot; placements and finishes are read for you to confirm.' },
  { id: 'standings', label: 'Overall standings', blurb: 'Placement and finish points calculated instantly, in your own design.' },
  { id: 'champions', label: 'Champions', blurb: 'A champions poster the moment the final match is confirmed.' },
  { id: 'mvp', label: 'MVP', blurb: 'The tournament MVP card, built from the same confirmed results.' },
] as const
export type ScreenId = (typeof SCREENS)[number]['id']

function Badge({ team, size = 22 }: { team: number; size?: number }) {
  const h = HUES[team]
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[6px] font-sans font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(150deg, hsl(${h} 70% 52%), hsl(${h} 70% 28%))` }}
      aria-hidden
    >
      {NAMES[team][0]}
    </span>
  )
}

function Screen({ id, theme, rows }: { id: ScreenId; theme: (typeof THEMES)[number]; rows: Row[] }) {
  if (id === 'slots') {
    return (
      <div className="flex h-full flex-col p-3" style={{ background: theme.bg, color: theme.ink }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>Slot list</p>
        <p className="mt-0.5 text-[15px] font-bold leading-tight">Sample Cup · Week 2</p>
        <div className="mt-3 grid flex-1 grid-cols-2 content-start gap-1.5">
          {NAMES.map((n, i) => (
            <div key={n} className="flex items-center gap-1.5 rounded-[6px] px-1.5 py-1" style={{ background: theme.row }}>
              <span className="w-4 text-right font-mono text-[10.5px] opacity-70">{i + 1}</span>
              <Badge team={i} size={17} />
              <span className="truncate text-[11.5px] font-medium">{n}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (id === 'teams') {
    return (
      <div className="flex h-full flex-col bg-[#0d0f14] p-3 text-[#e9edf3]">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[12px] text-white/50">⌕ Search 16 saved teams</div>
        <ul className="mt-2.5 space-y-1.5">
          {NAMES.slice(0, 7).map((n, i) => (
            <li key={n} className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-2 py-1.5">
              <Badge team={i} size={26} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">Team {n}</span>
                <span className="block text-[11px] text-white/50">Tag {n.slice(0, 3).toUpperCase()} · 4 players</span>
              </span>
              <span className="rounded-full border border-[#9d8cff]/50 px-1.5 py-0.5 text-[10.5px] text-[#c6bdff]">Saved</span>
            </li>
          ))}
        </ul>
        <button type="button" tabIndex={-1} className="mt-auto rounded-lg bg-[#9d8cff] py-2 text-[12px] font-semibold text-[#0d0b1d]">+ Import from registrations</button>
      </div>
    )
  }
  if (id === 'results') {
    const m = MATCHES[2]
    return (
      <div className="flex h-full flex-col bg-[#0d0f14] p-3 text-[#e9edf3]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c6bdff]">Match 3 · results</p>
        <div className="relative mt-2 h-[86px] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,#2b3240,#151922)]">
          <div className="absolute inset-x-3 top-3 space-y-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-2 rounded bg-white/15" style={{ width: `${90 - i * 12}%` }} />
            ))}
          </div>
          <div className="pts-scan absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-[#9d8cff]/40 to-transparent" />
          <span className="absolute bottom-1.5 right-2 rounded bg-black/60 px-1.5 text-[10.5px] text-white/80">screenshot.jpg</span>
        </div>
        <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-[#6fd39a]">✓ Read 16 teams · check before confirming</p>
        <ul className="mt-1.5 space-y-1">
          {m.order.slice(0, 6).map((team, place) => (
            <li key={team} className="grid grid-cols-[18px_1fr_auto_auto] items-center gap-2 rounded-md bg-white/[0.04] px-2 py-1 text-[12px]">
              <span className="font-mono text-white/60">#{place + 1}</span>
              <span className="truncate">Team {NAMES[team]}</span>
              <span className="font-mono text-white/60">{m.kills[team]} fin</span>
              <span className="font-mono font-semibold text-[#c6bdff]">+{PLACEMENT[place] + m.kills[team]}</span>
            </li>
          ))}
        </ul>
        <button type="button" tabIndex={-1} className="mt-auto rounded-lg bg-[#9d8cff] py-2 text-[12px] font-semibold text-[#0d0b1d]">Confirm results</button>
      </div>
    )
  }
  if (id === 'standings') {
    return (
      <div className="flex h-full flex-col p-3" style={{ background: theme.bg, color: theme.ink }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>Overall standings</p>
            <p className="text-[16px] font-extrabold uppercase italic leading-tight">After 3 matches</p>
          </div>
          <span className="font-mono text-[10.5px] opacity-60">PP · FP · TOT</span>
        </div>
        <ol className="mt-2.5 space-y-[3px]">
          {rows.slice(0, 10).map((r, i) => (
            <li key={r.team} className="grid grid-cols-[18px_20px_1fr_20px_20px_26px] items-center gap-1.5 rounded-[5px] px-1.5 py-[3px] text-[11.5px]" style={{ background: i < 3 ? theme.row : 'transparent' }}>
              <span className="font-mono font-bold" style={{ color: i < 3 ? theme.accent : undefined }}>{i + 1}</span>
              <Badge team={r.team} size={18} />
              <span className="truncate font-semibold">Team {NAMES[r.team]}</span>
              <span className="text-right font-mono opacity-70">{r.pp}</span>
              <span className="text-right font-mono opacity-70">{r.kp}</span>
              <span className="text-right font-mono font-bold" style={{ color: theme.accent }}>{r.total}</span>
            </li>
          ))}
        </ol>
        <p className="mt-auto text-center font-mono text-[10.5px] opacity-50">Made with ZenithPoints</p>
      </div>
    )
  }
  if (id === 'champions') {
    const w = rows[0]
    return (
      <div className="relative flex h-full flex-col items-center justify-end overflow-hidden p-4 text-center" style={{ background: theme.bg, color: theme.ink }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative render */}
        <img src="/visuals/points.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-screen" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>Champions</p>
          <div className="mx-auto mt-3 w-fit"><Badge team={w.team} size={58} /></div>
          <p className="mt-3 text-[24px] font-extrabold uppercase italic leading-none">Team {NAMES[w.team]}</p>
          <p className="mt-2 font-mono text-[12px] opacity-80">{w.total} points · {w.wins} chicken dinners</p>
          <p className="mt-6 font-mono text-[10.5px] opacity-50">Sample Cup · Grand final</p>
        </div>
      </div>
    )
  }
  // mvp
  return (
    <div className="flex h-full flex-col p-3" style={{ background: theme.bg, color: theme.ink }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accent }}>Tournament MVP</p>
      <div className="relative mt-3 grid h-[150px] place-items-center overflow-hidden rounded-xl" style={{ background: theme.row }}>
        <svg viewBox="0 0 100 100" className="h-[120px] opacity-80" aria-hidden>
          <circle cx="50" cy="34" r="17" fill={theme.accent} opacity="0.85" />
          <path d="M14 100c2-26 18-40 36-40s34 14 36 40z" fill={theme.accent} opacity="0.85" />
        </svg>
        <span className="absolute left-2 top-2"><Badge team={0} size={24} /></span>
      </div>
      <p className="mt-3 text-[20px] font-extrabold uppercase italic leading-none">Alpha·Ace</p>
      <p className="text-[12px] opacity-70">Team Alpha</p>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ['Finishes', '13'],
          ['Matches', '3'],
          ['Per match', '4.3'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg py-1.5" style={{ background: theme.row }}>
            <p className="font-mono text-[16px] font-bold" style={{ color: theme.accent }}>{v}</p>
            <p className="text-[10.5px] uppercase tracking-wide opacity-60">{k}</p>
          </div>
        ))}
      </div>
      <p className="mt-auto text-center font-mono text-[10.5px] opacity-50">Made with ZenithPoints</p>
    </div>
  )
}

/** The phone itself, with optional controlled screen. */
export function PointsPhone({ screen, theme = 0, className = '' }: { screen: ScreenId; theme?: number; className?: string }) {
  const rows = ROWS
  return (
    <div className={`relative mx-auto aspect-[300/620] w-full max-w-[300px] rounded-[42px] bg-[linear-gradient(160deg,#3a3f4a,#101216_35%,#22262e)] p-[9px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)_inset] ${className}`}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[34px] bg-black">
        {/* status bar + app bar */}
        <div className="flex items-center justify-between px-6 pb-1 pt-2.5 font-mono text-[10.5px] text-white/70">
          <span>9:41</span>
          <span className="h-[18px] w-[72px] rounded-full bg-[#050505]" />
          <span>5G ▮▮</span>
        </div>
        <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-2">
          <ProductIcon product="points" size={22} />
          <span className="text-[12.5px] font-semibold text-white">ZenithPoints</span>
          <span className="ml-auto whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] text-white/70">{SCREENS.find((s) => s.id === screen)?.label}</span>
        </div>
        <div className="relative flex-1">
          {SCREENS.map((s) => (
            <div key={s.id} className="absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)]" style={{ opacity: s.id === screen ? 1 : 0, transform: s.id === screen ? 'none' : 'translateY(12px) scale(0.98)' }} aria-hidden={s.id !== screen}>
              <Screen id={s.id} theme={THEMES[theme]} rows={rows} />
            </div>
          ))}
        </div>
        {/* tab bar */}
        <div className="grid grid-cols-6 border-t border-white/10 bg-[#0b0c10] px-2 pb-3 pt-2">
          {SCREENS.map((s) => (
            <span key={s.id} className="mx-auto h-1.5 w-1.5 rounded-full" style={{ background: s.id === screen ? '#9d8cff' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Interactive tour: features on one side drive the phone; themes restyle every design live. */
export function PointsTour({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, '-10% 0px')
  const reduce = usePrefersReducedMotion()
  const [i, setI] = useState(0)
  const [theme, setTheme] = useState(0)
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    if (!auto || !inView || reduce) return
    const t = setInterval(() => setI((x) => (x + 1) % SCREENS.length), 3600)
    return () => clearInterval(t)
  }, [auto, inView, reduce])
  const pick = (n: number) => {
    setAuto(false)
    setI(n)
  }

  if (compact) {
    return (
      <div ref={ref} className="w-full max-w-[240px]">
        <PointsPhone screen={SCREENS[i].id} theme={theme} />
      </div>
    )
  }

  return (
    <div ref={ref} className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
      <ul className="space-y-2 lg:order-1" role="tablist" aria-label="ZenithPoints screens">
        {SCREENS.map((s, n) => (
          <li key={s.id}>
            <button
              type="button"
              role="tab"
              aria-selected={n === i}
              onClick={() => pick(n)}
              className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${n === i ? 'border-[var(--color-pts)] bg-[color-mix(in_oklab,var(--color-pts)_9%,transparent)]' : 'border-line hover:border-line-3'}`}
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-[12px] text-fg-3">{String(n + 1).padStart(2, '0')}</span>
                <span className="t-title text-[15px]">{s.label}</span>
              </span>
              <span className={`grid transition-[grid-template-rows] duration-500 ${n === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <span className="overflow-hidden pl-8 text-[14px] text-fg-2">{s.blurb}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="lg:order-2">
        <PointsPhone screen={SCREENS[i].id} theme={theme} className="w-[280px] sm:w-[300px]" />
      </div>
      <div className="lg:order-3">
        <p className="t-label">Your design, every graphic</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {THEMES.map((t, n) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(n)}
              aria-pressed={n === theme}
              className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-left text-[14px] transition-colors ${n === theme ? 'border-[var(--color-pts)]' : 'border-line hover:border-line-3'}`}
            >
              <span className="h-6 w-6 rounded-full border border-white/20" style={{ background: `conic-gradient(${t.accent} 0 40%, ${t.id === 'ice' ? '#c9d8e4' : '#111'} 0)` }} />
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[14px] text-fg-2">Pick a theme and the slot list, standings, champions and MVP graphics all change with it. Upload your own logo and colours in the app.</p>
        <p className="mt-6 t-label">Concept preview · sample teams</p>
      </div>
    </div>
  )
}
