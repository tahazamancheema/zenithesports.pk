'use client'

import { useEffect, useRef, useState } from 'react'
import { ProductIcon } from '../brand/product-logos'
import { useInView, usePrefersReducedMotion } from '../motion'

/*
 * A scripted demo of the ZenithPoints app, drawn in code. Teams are placeholders
 * ("Team Alpha" …) and the section is labelled as a concept. Every number is
 * calculated from the sample matches below with a standard placement table, so
 * the phone and the generated graphics always agree.
 */

// ─── sample tournament ──────────────────────────────────────────────────────

const NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa']
const TAGS = NAMES.map((n) => n.slice(0, 3).toUpperCase())
const HUES = [42, 8, 172, 250, 330, 200, 90, 20, 280, 140, 60, 300, 220, 0, 110, 190]
const PLACEMENT = [10, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]
const MATCHES = [
  { map: 'Erangel', order: [0, 3, 1, 5, 2, 7, 4, 6, 9, 8, 11, 10, 13, 12, 15, 14], kills: [9, 6, 4, 7, 3, 5, 2, 4, 1, 2, 1, 0, 1, 0, 2, 1] },
  { map: 'Miramar', order: [1, 0, 2, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 15], kills: [7, 8, 5, 4, 6, 2, 3, 1, 2, 1, 0, 1, 0, 2, 1, 0] },
  { map: 'Sanhok', order: [0, 2, 3, 1, 6, 4, 8, 5, 7, 11, 9, 10, 12, 15, 13, 14], kills: [11, 4, 6, 5, 2, 3, 4, 2, 1, 0, 1, 1, 0, 1, 0, 0] },
  // Match 4 — the one the demo reads from a screenshot.
  { map: 'Erangel', order: [3, 2, 0, 6, 1, 5, 4, 9, 7, 8, 10, 11, 12, 13, 14, 15], kills: [5, 4, 9, 12, 2, 3, 6, 1, 1, 2, 0, 1, 0, 0, 1, 0] },
]
const MATCH4 = MATCHES[3]
// Readings the "AI" is unsure about, so the review step has something real to show.
const UNSURE: Record<number, number> = { 3: 71, 9: 64 }

type Row = { team: number; pp: number; kp: number; total: number; wins: number }
function table(upTo: number): Row[] {
  const rows: Row[] = NAMES.map((_, team) => ({ team, pp: 0, kp: 0, total: 0, wins: 0 }))
  for (const m of MATCHES.slice(0, upTo)) {
    m.order.forEach((team, place) => {
      rows[team].pp += PLACEMENT[place]
      if (place === 0) rows[team].wins++
    })
    m.kills.forEach((k, team) => (rows[team].kp += k))
  }
  rows.forEach((r) => (r.total = r.pp + r.kp))
  return rows.sort((a, b) => b.total - a.total || b.wins - a.wins || b.kp - a.kp)
}
const BEFORE = table(3)
const AFTER = table(4)
const rankBefore = (team: number) => BEFORE.findIndex((r) => r.team === team)

// ─── themes ─────────────────────────────────────────────────────────────────

export const THEMES = [
  { id: 'meridian', label: 'Meridian', bg: 'linear-gradient(160deg,#1d170d 0%,#0b0a08 55%,#14100a 100%)', panel: 'rgba(226,187,99,0.08)', accent: '#e8c06a', accent2: '#fff1cc', ink: '#fff7e6', muted: 'rgba(255,247,230,0.6)' },
  { id: 'inferno', label: 'Inferno', bg: 'linear-gradient(160deg,#2d090c 0%,#110405 55%,#240709 100%)', panel: 'rgba(255,77,94,0.1)', accent: '#ff4d5e', accent2: '#ffd2d6', ink: '#fff0f1', muted: 'rgba(255,240,241,0.6)' },
  { id: 'emerald', label: 'Emerald', bg: 'linear-gradient(160deg,#0b2c20 0%,#04110c 55%,#0a2419 100%)', panel: 'rgba(62,213,152,0.1)', accent: '#3ed598', accent2: '#c9f7df', ink: '#effcf5', muted: 'rgba(239,252,245,0.62)' },
  { id: 'glacier', label: 'Glacier', bg: 'linear-gradient(160deg,#f1f6fa 0%,#d6e3ec 60%,#e9f0f5 100%)', panel: 'rgba(13,110,168,0.08)', accent: '#0d6ea8', accent2: '#0a3e5f', ink: '#0b1a26', muted: 'rgba(11,26,38,0.6)' },
] as const
type Theme = (typeof THEMES)[number]

// ─── small parts ────────────────────────────────────────────────────────────

function Badge({ team, size = 22, radius = 6 }: { team: number; size?: number; radius?: number }) {
  const h = HUES[team]
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center font-sans font-extrabold text-white"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.42, background: `linear-gradient(150deg, hsl(${h} 75% 55%), hsl(${h} 70% 26%))`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}
    >
      {NAMES[team][0]}
    </span>
  )
}

/** A counter that restarts whenever `key` changes and ticks while `run` is true. */
function useTicker(key: unknown, run: boolean, ms: number, max: number) {
  const [n, setN] = useState(0)
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setN(0)
  }
  useEffect(() => {
    if (!run) return
    const t = setInterval(() => setN((x) => (x >= max ? x : x + 1)), ms)
    return () => clearInterval(t)
  }, [run, ms, max, key])
  return run ? n : max
}

const VIOLET = '#3ed598'

// ─── phone screens ──────────────────────────────────────────────────────────

function Dashboard({ t }: { t: number }) {
  const progress = Math.min(4, 3 + (t > 6 ? 1 : 0))
  return (
    <div className="flex h-full flex-col gap-2.5 p-3 text-[#e9edf3]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/45">Good evening</p>
          <p className="text-[15px] font-bold">Zenith Weekly Cup</p>
        </div>
        <span className="rounded-full bg-[#6fd39a]/15 px-2 py-0.5 text-[10.5px] font-semibold text-[#6fd39a]">● Live</span>
      </div>
      <div className="rounded-2xl p-3" style={{ background: 'linear-gradient(140deg,#0f5e44,#082a1f)' }}>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#a7f3cc" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(progress / 6) * 94.2} 94.2`} style={{ transition: 'stroke-dasharray .8s' }} />
          </svg>
          <div>
            <p className="text-[11px] text-white/60">Grand final · Day 2</p>
            <p className="text-[18px] font-extrabold leading-tight">Match {progress} of 6</p>
            <p className="text-[11px] text-white/60">16 teams · 64 players</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          ['M3 12h18M12 3v18', 'Results'],
          ['M4 19V9m6 10V5m6 14v-7', 'Standings'],
          ['M4 4h16v16H4zM4 15l5-5 4 4 3-3 4 4', 'Design'],
          ['M12 4v12m0 0-4-4m4 4 4-4M5 20h14', 'Export'],
        ].map(([d, l], i) => (
          <div key={l} className={`grid place-items-center gap-1 rounded-xl py-2 ${i === 0 && t % 4 < 2 ? 'bg-[#3ed598]/25' : 'bg-white/[0.05]'}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={VIOLET} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={d} />
            </svg>
            <span className="text-[10px] text-white/70">{l}</span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-white/45">Leaderboard</p>
      <ul className="grid gap-1">
        {BEFORE.slice(0, 5).map((r, i) => (
          <li key={r.team} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 text-[12px]">
            <span className="w-3 font-mono text-white/50">{i + 1}</span>
            <Badge team={r.team} size={18} radius={5} />
            <span className="flex-1 truncate font-medium">Team {NAMES[r.team]}</span>
            <span className="font-mono font-bold text-[#a7f3cc]">{r.total}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto rounded-lg border border-dashed border-white/15 px-2 py-1.5 text-center text-[11px] text-white/55">Match 4 finished · add its results</p>
    </div>
  )
}

function Capture({ t }: { t: number }) {
  const boxes = Math.min(16, Math.max(0, t - 2))
  const done = boxes >= 16
  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[#e9edf3]">
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-[#a7f3cc]">Match 4 · read results</p>
      {/* the results screenshot being read */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(160deg,#20262f,#11151b)] p-2">
        <p className="mb-1 text-center text-[9px] font-bold tracking-[0.2em] text-[#f2b33d]">MATCH RESULTS · ERANGEL</p>
        <div className="grid gap-[3px]">
          {MATCH4.order.map((team, place) => {
            const shown = place < boxes
            const unsure = UNSURE[place]
            return (
              <div key={team} className="relative flex items-center gap-1.5 rounded-[3px] px-1 text-[8.5px] leading-[11px] text-white/80">
                <span className="w-4 font-mono">#{place + 1}</span>
                <span className="flex-1 truncate">{TAGS[team]} · Team {NAMES[team]}</span>
                <span className="font-mono">{MATCH4.kills[team]}</span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[3px] border transition-opacity duration-200"
                  style={{ opacity: shown ? 1 : 0, borderColor: unsure ? '#e8b04b' : '#6fd39a', background: unsure ? 'rgba(232,176,75,0.12)' : 'rgba(111,211,154,0.08)' }}
                />
              </div>
            )
          })}
        </div>
        {!done && <div className="pts-scan absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[#3ed598]/45 to-transparent" />}
      </div>
      <div className="rounded-lg bg-white/[0.05] px-2.5 py-2 text-[11.5px]">
        {done ? (
          <>
            <p className="font-semibold text-[#6fd39a]">✓ 16 teams read in 1.2 s</p>
            <p className="text-white/60">2 readings below 80% confidence: please check</p>
          </>
        ) : (
          <>
            <p className="font-semibold">Reading screenshot… {Math.round((boxes / 16) * 100)}%</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#3ed598] transition-[width] duration-200" style={{ width: `${(boxes / 16) * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Review({ t }: { t: number }) {
  const fixed = t >= 5
  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[#e9edf3]">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] uppercase tracking-[0.16em] text-[#a7f3cc]">Review · Match 4</p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">{fixed ? '0' : '2'} to check</span>
      </div>
      <div className="grid grid-cols-[22px_1fr_28px_30px] gap-x-1.5 px-1.5 text-[9.5px] uppercase tracking-wider text-white/45">
        <span>#</span>
        <span>Team</span>
        <span className="text-right">Fin</span>
        <span className="text-right">Pts</span>
      </div>
      <ul className="grid gap-[3px]">
        {MATCH4.order.slice(0, 11).map((team, place) => {
          const unsure = UNSURE[place] && !fixed
          return (
            <li
              key={team}
              className="grid grid-cols-[22px_1fr_28px_30px] items-center gap-x-1.5 rounded-md px-1.5 py-[3px] text-[11.5px]"
              style={{ background: unsure ? 'rgba(232,176,75,0.14)' : 'rgba(255,255,255,0.04)', outline: unsure ? '1px solid rgba(232,176,75,0.6)' : 'none' }}
            >
              <span className="font-mono text-white/50">{place + 1}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                <Badge team={team} size={15} radius={4} />
                <span className="truncate">Team {NAMES[team]}</span>
              </span>
              <span className={`text-right font-mono ${unsure ? 'font-bold text-[#f0c060]' : ''}`}>{MATCH4.kills[team]}</span>
              <span className="text-right font-mono font-semibold text-[#a7f3cc]">+{PLACEMENT[place] + MATCH4.kills[team]}</span>
            </li>
          )
        })}
      </ul>
      {!fixed ? (
        <p className="rounded-lg border border-[#e8b04b]/40 bg-[#e8b04b]/10 px-2 py-1.5 text-[11px] text-[#f5d38c]">Team Delta finishes read as 12 at 71% confidence. Tap to confirm or correct.</p>
      ) : (
        <p className="rounded-lg border border-[#6fd39a]/40 bg-[#6fd39a]/10 px-2 py-1.5 text-[11px] text-[#9ce6bd]">Checked by you · ready to confirm</p>
      )}
      <button type="button" tabIndex={-1} className={`mt-auto rounded-xl py-2.5 text-[12.5px] font-bold transition-colors ${fixed ? 'bg-[#3ed598] text-[#03140d]' : 'bg-white/10 text-white/50'}`}>
        Confirm match 4
      </button>
    </div>
  )
}

function Standings({ t }: { t: number }) {
  const moved = t >= 2
  const rows = moved ? AFTER : BEFORE
  const ROW = 25
  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[#e9edf3]">
      <div className="flex gap-1 rounded-lg bg-white/[0.05] p-0.5 text-[10.5px]">
        {['Overall', 'Match 4', 'MVP race'].map((x, i) => (
          <span key={x} className={`flex-1 rounded-md py-1 text-center ${i === 0 ? 'bg-[#3ed598] font-semibold text-[#03140d]' : 'text-white/60'}`}>
            {x}
          </span>
        ))}
      </div>
      {moved && <p className="rounded-md bg-[#6fd39a]/12 px-2 py-1 text-center text-[10.5px] text-[#9ce6bd]">Standings updated in 0.8 s</p>}
      <div className="relative" style={{ height: ROW * 12 }}>
        {AFTER.slice(0, 12).map((r) => {
          const now = rows.findIndex((x) => x.team === r.team)
          const delta = rankBefore(r.team) - AFTER.findIndex((x) => x.team === r.team)
          const total = (moved ? AFTER : BEFORE).find((x) => x.team === r.team)!.total
          if (now > 11) return null
          return (
            <div
              key={r.team}
              className="absolute inset-x-0 flex h-[22px] items-center gap-1.5 rounded-md bg-white/[0.04] px-1.5 text-[11.5px] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ transform: `translateY(${now * ROW}px)` }}
            >
              <span className="w-3.5 font-mono text-white/50">{now + 1}</span>
              <Badge team={r.team} size={15} radius={4} />
              <span className="flex-1 truncate">Team {NAMES[r.team]}</span>
              {moved && delta !== 0 && (
                <span className={`font-mono text-[10px] ${delta > 0 ? 'text-[#6fd39a]' : 'text-[#f0705a]'}`}>
                  {delta > 0 ? '▲' : '▼'}
                  {Math.abs(delta)}
                </span>
              )}
              <span className="w-7 text-right font-mono font-bold text-[#a7f3cc]">{total}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-auto text-center text-[10px] text-white/45">Ties: wins, then finishes, then best placement</p>
    </div>
  )
}

function Rules({ t }: { t: number }) {
  const hi = t % 8
  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[#e9edf3]">
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-[#a7f3cc]">Scoring rules</p>
      <div className="rounded-xl bg-white/[0.04] p-2">
        <p className="mb-1.5 text-[11px] text-white/60">Placement points</p>
        <div className="grid grid-cols-4 gap-1">
          {PLACEMENT.slice(0, 8).map((p, i) => (
            <div key={i} className={`rounded-md py-1 text-center transition-colors ${i === hi ? 'bg-[#3ed598]/30 ring-1 ring-[#3ed598]' : 'bg-white/[0.05]'}`}>
              <p className="text-[9px] text-white/50">#{i + 1}</p>
              <p className="font-mono text-[13px] font-bold">{p}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-2.5 py-2 text-[12px]">
        <span>Points per finish</span>
        <span className="flex items-center gap-2 font-mono font-bold">
          <span className="grid h-5 w-5 place-items-center rounded bg-white/10">−</span>1<span className="grid h-5 w-5 place-items-center rounded bg-white/10">+</span>
        </span>
      </div>
      <div className="rounded-xl bg-white/[0.04] p-2 text-[11.5px]">
        <p className="mb-1 text-[11px] text-white/60">Tie-breakers (drag to reorder)</p>
        {['Chicken dinners', 'Total finishes', 'Best placement', 'Last match placement'].map((x, i) => (
          <p key={x} className="flex items-center gap-2 border-t border-white/5 py-1 first:border-0">
            <span className="text-white/35">⠿</span>
            <span className="font-mono text-white/45">{i + 1}</span>
            {x}
          </p>
        ))}
      </div>
      <p className="mt-auto text-center text-[10.5px] text-white/45">Saved as a preset for every Zenith Weekly Cup</p>
    </div>
  )
}

function Studio({ theme, setTheme, layout, setLayout }: { theme: number; setTheme: (n: number) => void; layout: number; setLayout: (n: number) => void }) {
  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[#e9edf3]">
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-[#a7f3cc]">Design studio</p>
      <div className="grid grid-cols-3 gap-1.5">
        {['Table', 'Podium', 'Cards'].map((l, i) => (
          <button key={l} type="button" onClick={() => setLayout(i)} className={`rounded-lg py-1.5 text-[11px] ${layout === i ? 'bg-[#3ed598] font-semibold text-[#03140d]' : 'bg-white/[0.06] text-white/70'}`}>
            {l}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-white/60">Theme</p>
      <div className="grid grid-cols-4 gap-1.5">
        {THEMES.map((th, i) => (
          <button key={th.id} type="button" onClick={() => setTheme(i)} className={`h-10 rounded-lg ring-offset-2 ring-offset-black ${theme === i ? 'ring-2 ring-[#3ed598]' : ''}`} style={{ background: th.bg }} aria-label={th.label}>
            <span className="mx-auto block h-2 w-5 rounded-full" style={{ background: th.accent }} />
          </button>
        ))}
      </div>
      <div className="grid gap-1.5 rounded-xl bg-white/[0.04] p-2 text-[11.5px]">
        {[
          ['Logo', 'Zenith Esports.png'],
          ['Font', 'Michroma + Geist'],
          ['Sponsor strip', 'On'],
          ['Language', 'English · اردو'],
        ].map(([k, v]) => (
          <p key={k} className="flex justify-between">
            <span className="text-white/55">{k}</span>
            <span>{v}</span>
          </p>
        ))}
      </div>
      <p className="mt-auto text-center text-[10.5px] text-white/45">Every graphic below updates as you change it</p>
    </div>
  )
}

// ─── the generated graphic ──────────────────────────────────────────────────

function Poster({ kind, theme, layout, rows }: { kind: number; theme: Theme; layout: number; rows: Row[] }) {
  const champ = rows[0]
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]" style={{ background: theme.bg, color: theme.ink }}>
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: theme.accent }} />
      <div className="relative flex h-full flex-col p-[6%]">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[clamp(8px,1.1vw,11px)] uppercase tracking-[0.24em]" style={{ color: theme.accent }}>
              Zenith Weekly Cup · Grand final
            </p>
            <p className="font-display mt-1 text-[clamp(16px,2.6vw,30px)] uppercase leading-none">
              {['Overall standings', 'Champions', 'Tournament MVP', 'Slot list'][kind]}
            </p>
            <p className="mt-1 text-[clamp(9px,1.1vw,12px)]" style={{ color: theme.muted }}>
              {kind === 3 ? 'Day 2 · 16 teams' : 'After match 4 of 6'}
            </p>
          </div>
          <span className="rounded-md px-2 py-1 font-mono text-[clamp(8px,0.9vw,10px)] font-bold" style={{ background: theme.panel, color: theme.accent }}>
            ZENITH
          </span>
        </div>

        {kind === 0 && layout !== 1 && (
          <ol className={`mt-[5%] grid min-h-0 flex-1 content-start gap-[1.4%] overflow-hidden ${layout === 2 ? 'grid-cols-2' : ''}`}>
            {rows.slice(0, layout === 2 ? 12 : 8).map((r, i) => (
              <li key={r.team} className="flex items-center gap-[3%] rounded-md px-[3%] py-[1.6%] text-[clamp(9px,1.15vw,13px)]" style={{ background: i < 3 ? theme.panel : 'transparent', border: i < 3 ? `1px solid ${theme.accent}40` : '1px solid transparent' }}>
                <span className="w-[8%] font-mono font-bold" style={{ color: i < 3 ? theme.accent : theme.muted }}>
                  {i + 1}
                </span>
                <Badge team={r.team} size={20} radius={5} />
                <span className="flex-1 truncate font-semibold">Team {NAMES[r.team]}</span>
                {layout === 0 && (
                  <>
                    <span className="w-[10%] text-right font-mono" style={{ color: theme.muted }}>{r.pp}</span>
                    <span className="w-[10%] text-right font-mono" style={{ color: theme.muted }}>{r.kp}</span>
                  </>
                )}
                <span className="w-[12%] text-right font-mono font-extrabold" style={{ color: theme.accent }}>
                  {r.total}
                </span>
              </li>
            ))}
          </ol>
        )}

        {kind === 0 && layout === 1 && (
          <div className="mt-auto grid grid-cols-3 items-end gap-[3%] pb-[4%]">
            {[1, 0, 2].map((rank) => {
              const r = rows[rank]
              const h = rank === 0 ? '62%' : rank === 1 ? '46%' : '36%'
              return (
                <div key={r.team} className="flex flex-col items-center gap-2">
                  <Badge team={r.team} size={rank === 0 ? 56 : 42} radius={12} />
                  <p className="text-center text-[clamp(9px,1.1vw,13px)] font-bold">Team {NAMES[r.team]}</p>
                  <div className="grid w-full place-items-center rounded-t-lg py-3" style={{ height: `calc(${h} * 3)`, minHeight: 60, background: `linear-gradient(180deg, ${theme.accent}, ${theme.accent}33)` }}>
                    <span className="font-display text-[clamp(18px,3vw,36px)]" style={{ color: theme.id === 'glacier' ? '#fff' : '#0b0a08' }}>
                      {rank + 1}
                    </span>
                    <span className="font-mono text-[clamp(9px,1.1vw,12px)] font-bold" style={{ color: theme.id === 'glacier' ? '#fff' : '#0b0a08' }}>
                      {r.total} pts
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {kind === 1 && (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <div className="mx-auto w-fit rounded-3xl p-2" style={{ background: theme.panel, boxShadow: `0 0 80px ${theme.accent}55` }}>
                <Badge team={champ.team} size={110} radius={26} />
              </div>
              <p className="font-display mt-[8%] text-[clamp(20px,3.4vw,40px)] uppercase leading-none">Team {NAMES[champ.team]}</p>
              <p className="mt-3 font-mono text-[clamp(10px,1.2vw,14px)]" style={{ color: theme.accent }}>
                {champ.total} points · {champ.wins} chicken dinners · {champ.kp} finishes
              </p>
            </div>
          </div>
        )}

        {kind === 2 && (
          <div className="mt-[6%] grid flex-1 grid-rows-[1fr_auto] gap-[4%]">
            <div className="relative grid place-items-center overflow-hidden rounded-2xl" style={{ background: theme.panel }}>
              <svg viewBox="0 0 100 100" className="h-[80%]" aria-hidden>
                <circle cx="50" cy="34" r="17" fill={theme.accent} opacity="0.9" />
                <path d="M14 100c2-26 18-40 36-40s34 14 36 40z" fill={theme.accent} opacity="0.9" />
              </svg>
              <span className="absolute left-3 top-3">
                <Badge team={3} size={34} radius={8} />
              </span>
              <span className="absolute bottom-3 right-3 rounded-md px-2 py-1 font-mono text-[clamp(9px,1vw,11px)] font-bold" style={{ background: theme.accent, color: theme.id === 'glacier' ? '#fff' : '#0b0a08' }}>
                MVP
              </span>
            </div>
            <div>
              <p className="font-display text-[clamp(18px,2.8vw,32px)] uppercase leading-none">Delta·Viper</p>
              <p className="text-[clamp(10px,1.1vw,13px)]" style={{ color: theme.muted }}>Team Delta</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Finishes', '19'],
                  ['Matches', '4'],
                  ['Per match', '4.8'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg py-2" style={{ background: theme.panel }}>
                    <p className="font-mono text-[clamp(14px,1.9vw,22px)] font-extrabold" style={{ color: theme.accent }}>
                      {v}
                    </p>
                    <p className="text-[clamp(8px,0.9vw,10px)] uppercase tracking-wider" style={{ color: theme.muted }}>
                      {k}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {kind === 3 && (
          <div className="mt-[5%] grid flex-1 grid-cols-2 content-start gap-[1.6%]">
            {NAMES.map((n, i) => (
              <div key={n} className="flex items-center gap-[4%] rounded-md px-[4%] py-[2%] text-[clamp(9px,1.1vw,12px)]" style={{ background: theme.panel }}>
                <span className="w-[14%] font-mono font-bold" style={{ color: theme.accent }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Badge team={i} size={18} radius={5} />
                <span className="truncate font-semibold">Team {n}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-[4%] flex items-center justify-between font-mono text-[clamp(7px,0.85vw,10px)] uppercase tracking-[0.14em]" style={{ color: theme.muted }}>
          <span>Sponsored by · Your sponsor</span>
          <span>Made with ZenithPoints</span>
        </div>
      </div>
    </div>
  )
}

// ─── the demo ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'dash', label: 'Dashboard', title: 'Every match at a glance', body: 'Tournaments, days and matches in one place, with the live leaderboard always a tap away.' },
  { id: 'capture', label: 'AI capture', title: 'Read results from a screenshot', body: 'Upload the results screen. ZenithPoints reads placements and finishes for all 16 teams in about a second, and scores its own confidence.' },
  { id: 'review', label: 'Review', title: 'You check what it is unsure of', body: 'Low-confidence readings are flagged for a person to confirm or correct. Nothing counts until you confirm the match.' },
  { id: 'standings', label: 'Standings', title: 'Standings recalculated instantly', body: 'Placement and finish points, tie-breakers and rank changes, recalculated the moment a match is confirmed.' },
  { id: 'rules', label: 'Scoring rules', title: 'Your rules, saved as presets', body: 'Set placement points, points per finish and tie-break order once, and reuse them across every event.' },
  { id: 'studio', label: 'Design studio', title: 'Graphics in your own design', body: 'Pick a layout and theme, add your logo and sponsors, and every graphic follows. No designer, no waiting.' },
] as const

const POSTERS = ['Standings', 'Champions', 'MVP', 'Slot list']

/** The phone running the app, at any step. */
function StudioPhone({ step, t, theme, layout, onTheme, onLayout }: { step: number; t: number; theme: number; layout: number; onTheme: (n: number) => void; onLayout: (n: number) => void }) {
  const s = STEPS[step]
  return (
    <div className="relative aspect-[300/640] w-full rounded-[46px] bg-[linear-gradient(160deg,#454b58,#101216_32%,#262a33)] p-[10px] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)_inset]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[37px] bg-[#07080b]">
        <div className="flex items-center justify-between px-6 pb-1 pt-3 font-mono text-[10.5px] text-white/70">
          <span>9:41</span>
          <span className="h-[20px] w-[78px] rounded-full bg-black" />
          <span>5G ▮▮▮</span>
        </div>
        <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-2">
          <ProductIcon product="points" size={24} />
          <span className="text-[13px] font-semibold text-white">ZenithPoints</span>
          <span className="ml-auto whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] text-white/70">{s.label}</span>
        </div>
        <div className="relative min-h-0 flex-1">
          {STEPS.map((x, i) => (
            <div
              key={x.id}
              className="absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ opacity: i === step ? 1 : 0, transform: i === step ? 'none' : i < step ? 'translateX(-14px)' : 'translateX(14px)' }}
              aria-hidden={i !== step}
              inert={i !== step}
            >
              {i === 0 && <Dashboard t={i === step ? t : 0} />}
              {i === 1 && <Capture t={i === step ? t : 0} />}
              {i === 2 && <Review t={i === step ? t : 0} />}
              {i === 3 && <Standings t={i === step ? t : 0} />}
              {i === 4 && <Rules t={i === step ? t : 0} />}
              {i === 5 && <Studio theme={theme} setTheme={onTheme} layout={layout} setLayout={onLayout} />}
            </div>
          ))}
        </div>
        <div className="flex justify-around border-t border-white/10 bg-[#0b0c10] px-3 pb-4 pt-2">
          {['M3 11l9-7 9 7v9H3z', 'M4 19V9m6 10V5m6 14v-7', 'M4 4h16v16H4z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'].map((d, i) => (
            <svg key={d} viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={i === Math.min(3, Math.floor(step / 1.6)) ? VIOLET : 'rgba(255,255,255,0.35)'} strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <path d={d} />
            </svg>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Small self-running version for heroes and cards. */
export function PointsPhoneDemo({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, '0px')
  const reduce = usePrefersReducedMotion()
  const [step, setStep] = useState(1)
  const [theme, setTheme] = useState(2)
  const t = useTicker(step, inView && !reduce, 280, 40)
  useEffect(() => {
    if (!inView || reduce) return
    const id = setTimeout(() => setStep((x) => (x + 1) % STEPS.length), step === 1 ? 6500 : 4200)
    return () => clearTimeout(id)
  }, [inView, reduce, step])
  return (
    <div ref={ref} className={className}>
      <StudioPhone step={step} t={t} theme={theme} layout={0} onTheme={setTheme} onLayout={() => {}} />
    </div>
  )
}

export function PointsStudio() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, '-10% 0px')
  const reduce = usePrefersReducedMotion()
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(true)
  const [theme, setTheme] = useState(2)
  const [layout, setLayout] = useState(0)
  const [poster, setPoster] = useState(0)
  const playing = auto && inView && !reduce
  const t = useTicker(step, inView && !reduce, 280, 40)

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), step === 1 ? 7200 : 5600)
    return () => clearTimeout(id)
  }, [playing, step])

  // The demo drives the graphic too: confirmed standings, then the designs.
  const [rendering, setRendering] = useState(false)
  const shownPoster = step >= 3 ? poster : 0
  const rows = step >= 3 ? AFTER : BEFORE
  const regenerate = (fn: () => void) => {
    fn()
    if (reduce) return
    setRendering(true)
    setTimeout(() => setRendering(false), 650)
  }
  useEffect(() => {
    if (!playing || step !== 5) return
    const id = setInterval(() => {
      setRendering(true)
      setTimeout(() => setRendering(false), 650)
      setTheme((x) => (x + 1) % THEMES.length)
      setPoster((x) => (x + 1) % POSTERS.length)
    }, 1800)
    return () => clearInterval(id)
  }, [playing, step])

  const pick = (n: number) => {
    setAuto(false)
    setStep(n)
  }
  const s = STEPS[step]

  return (
    <div ref={ref} className="grid gap-8">
      {/* step rail */}
      <div className="-mx-4 overflow-x-auto px-4">
        <ol className="flex min-w-max gap-2" role="tablist" aria-label="ZenithPoints demo">
          {STEPS.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                role="tab"
                aria-selected={i === step}
                onClick={() => pick(i)}
                className={`relative flex items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-[14px] transition-colors ${i === step ? 'border-[var(--color-pts)] text-fg' : 'border-line-2 text-fg-2 hover:text-fg'}`}
              >
                <span className="font-mono text-[12px] text-fg-3">{String(i + 1).padStart(2, '0')}</span>
                {x.label}
                {i === step && playing && <span aria-hidden key={step} className="pts-progress absolute inset-x-0 bottom-0 h-0.5 bg-[var(--color-pts)]" style={{ animationDuration: step === 1 ? '7.2s' : '5.6s' }} />}
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setAuto((a) => !a)} className="rounded-full border border-line-2 px-4 py-2 font-mono text-[12px] uppercase tracking-wider text-fg-3 hover:text-fg" aria-pressed={!auto}>
              {auto ? 'Pause' : 'Play'}
            </button>
          </li>
        </ol>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_auto_minmax(0,1.1fr)] lg:gap-12">
        {/* narration */}
        <div className="lg:pt-10" aria-live="polite">
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-pts">
            Step {step + 1} of {STEPS.length}
          </p>
          <h3 key={s.id} className="t-title mt-3 text-[clamp(1.4rem,2.4vw,2rem)]" style={{ animation: 'rise 600ms var(--ease-out-expo) both' }}>
            {s.title}
          </h3>
          <p key={`${s.id}-b`} className="mt-3 max-w-md text-fg-2" style={{ animation: 'rise 600ms var(--ease-out-expo) 80ms both' }}>
            {s.body}
          </p>
          <ul className="mt-8 grid gap-2 text-[14px] text-fg-2">
            {['AI reading with confidence scores', 'Human review before anything counts', 'Custom points tables and tie-breakers', 'Teams and logos saved once', 'Export 1080×1350, 1080×1920 and 4K'].map((x) => (
              <li key={x} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rotate-45 bg-[var(--color-pts)]" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        {/* the phone */}
        <div className="mx-auto w-[300px]">
          <StudioPhone step={step} t={t} theme={theme} layout={layout} onTheme={(n) => regenerate(() => (setAuto(false), setTheme(n)))} onLayout={(n) => regenerate(() => (setAuto(false), setLayout(n)))} />
        </div>

        {/* the output */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-fg-3">Generated graphic</p>
            <div className="flex gap-1 rounded-lg border border-line-2 p-0.5" role="group" aria-label="Graphic">
              {POSTERS.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => regenerate(() => (setAuto(false), setStep((x) => Math.max(x, 3)), setPoster(i)))}
                  aria-pressed={shownPoster === i}
                  className={`rounded-md px-2.5 py-1 text-[12.5px] transition-colors ${shownPoster === i ? 'bg-[var(--color-pts)] text-[#03140d]' : 'text-fg-2 hover:text-fg'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-4 max-w-[460px]">
            <div className={`transition-[opacity,filter,transform] duration-500 ${rendering ? 'scale-[0.985] opacity-40 blur-[2px]' : ''}`}>
              <Poster kind={shownPoster} theme={THEMES[theme]} layout={layout} rows={rows} />
            </div>
            {rendering && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded-full bg-black/70 px-4 py-2 font-mono text-[12px] text-white backdrop-blur">Rendering… 0.6 s</span>
              </div>
            )}
            {step < 3 && (
              <span className="absolute -top-3 right-4 rounded-md border border-line-2 bg-ink-2 px-2 py-1 font-mono text-[11px] text-fg-2">Before match 4</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {THEMES.map((th, i) => (
              <button key={th.id} type="button" onClick={() => regenerate(() => (setAuto(false), setTheme(i)))} aria-pressed={theme === i} aria-label={`${th.label} theme`} className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${theme === i ? 'border-[var(--color-pts)]' : 'border-transparent'}`} style={{ background: th.bg }}>
                <span className="mx-auto block h-2.5 w-2.5 rounded-full" style={{ background: th.accent }} />
              </button>
            ))}
            <span className="ml-2 font-mono text-[12px] text-fg-3">PNG · 1080×1350 · Story 1080×1920 · 4K</span>
          </div>
          <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.14em] text-fg-3">Concept preview · sample teams</p>
        </div>
      </div>
    </div>
  )
}
