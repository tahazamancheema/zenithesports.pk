'use client'

import { useEffect, useRef, useState } from 'react'
import { useSequence } from '../motion'

const STAGES = [
  {
    key: 'PCOB',
    name: 'PUBG Mobile Client Observer',
    kind: 'Source',
    body: 'The observer client spectates the match and reports what is happening — players, eliminations, the zone and the result.',
  },
  {
    key: 'ZENITH',
    name: 'ZenithProduction',
    kind: 'Engine',
    body: 'Reads the live match data, holds the tournament’s teams, players and scoring, and decides what goes on screen — automatically or on the operator’s cue.',
  },
  {
    key: 'GFX',
    name: 'Custom broadcast graphics',
    kind: 'Design',
    body: 'Animated standings, player pop-ups, lower thirds and after-match scenes in the tournament’s own design, filled with live data.',
  },
  {
    key: 'OBS',
    name: 'OBS Studio',
    kind: 'Switcher',
    body: 'ZenithProduction builds and switches the OBS scenes with transitions, so the operator directs the show instead of wiring it.',
  },
  {
    key: 'LIVE',
    name: 'YouTube Live',
    kind: 'Output',
    body: 'The finished programme goes out to your audience — live, with the complete on-air package.',
  },
]

function Glyph({ i, on }: { i: number; on: boolean }) {
  const c = on ? 'var(--color-prod)' : 'var(--color-fg-3)'
  const common = { fill: 'none', stroke: c, strokeWidth: 1.4, style: { transition: 'stroke 400ms' } }
  switch (i) {
    case 0: // observer eye / crosshair
      return (
        <g {...common}>
          <circle cx="0" cy="0" r="9" />
          <circle cx="0" cy="0" r="3" fill={c} />
          <path d="M-15 0h4M11 0h4M0-15v4M0 11v4" />
        </g>
      )
    case 1: // engine: stacked bars
      return (
        <g {...common}>
          <rect x="-11" y="-10" width="22" height="5" />
          <rect x="-11" y="-2" width="22" height="5" />
          <rect x="-11" y="6" width="14" height="5" fill={on ? c : 'none'} />
        </g>
      )
    case 2: // graphics: lower third
      return (
        <g {...common}>
          <rect x="-13" y="-10" width="26" height="20" />
          <path d="M-13 4h18" />
          <rect x="-13" y="4" width="3" height="6" fill={c} />
        </g>
      )
    case 3: // switcher: two scenes
      return (
        <g {...common}>
          <rect x="-13" y="-9" width="11" height="9" />
          <rect x="2" y="0" width="11" height="9" fill={on ? c : 'none'} />
          <path d="M-2-4.5h4l-2-2M2 4.5h-4l2 2" />
        </g>
      )
    default: // live: broadcast waves
      return (
        <g {...common}>
          <circle cx="0" cy="0" r="2.5" fill={c} />
          <path d="M-7-7a10 10 0 0 0 0 14M7-7a10 10 0 0 1 0 14M-11-11a15.5 15.5 0 0 0 0 22M11-11a15.5 15.5 0 0 1 0 22" />
        </g>
      )
  }
}

function useTimecode(running: boolean) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setT((x) => x + 1), 1000 / 25)
    return () => clearInterval(id)
  }, [running])
  const f = t % 25
  const s = Math.floor(t / 25)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`
}

export function SignalChain() {
  const ref = useRef<HTMLDivElement>(null)
  const { active, setActive, playing, setPlaying, reduce } = useSequence(5, 2600, ref)
  const tc = useTimecode(playing && !reduce)
  const s = STAGES[active]

  if (reduce) {
    return (
      <ol className="grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-5" aria-label="Production workflow">
        {STAGES.map((st, i) => (
          <li key={st.key} className="bg-ink-1 p-6">
            <p className="t-label !text-[var(--color-prod)]">
              {String(i + 1).padStart(2, '0')} · {st.kind}
            </p>
            <p className="mt-3 font-medium">{st.name}</p>
            <p className="mt-2 text-sm text-fg-2">{st.body}</p>
          </li>
        ))}
      </ol>
    )
  }

  const W = 1000
  const xs = STAGES.map((_, i) => 100 + i * 200)
  return (
    <div ref={ref} className="panel-raised overflow-hidden" data-surface="production">
      {/* broadcast chrome */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-prod" style={{ animation: playing ? 'blink 1.4s steps(1) infinite' : undefined }} />
          <span className="t-label !text-fg-2">Signal chain · PUBG Mobile</span>
        </div>
        <span className="font-mono text-[12px] tabular-nums text-fg-3" aria-hidden>
          TC {tc}
        </span>
      </div>

      {/* the chain — horizontal on wide screens */}
      <div className="hidden px-4 pt-10 pb-4 md:block">
        <svg viewBox={`0 0 ${W} 170`} className="w-full" role="img" aria-label="PCOB to ZenithProduction to custom broadcast graphics to OBS to YouTube Live">
          <defs>
            <linearGradient id="sc-done" x1="0" x2="1">
              <stop offset="0" stopColor="var(--color-prod)" stopOpacity="0.2" />
              <stop offset="1" stopColor="var(--color-prod)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <line x1={xs[0]} x2={xs[4]} y1="60" y2="60" stroke="var(--color-line-2)" strokeDasharray="3 6" />
          <line
            x1={xs[0]}
            x2={xs[4]}
            y1="60"
            y2="60"
            stroke="url(#sc-done)"
            strokeWidth="2"
            style={{
              transformOrigin: `${xs[0]}px 60px`,
              transform: `scaleX(${active / 4})`,
              transition: 'transform 900ms var(--ease-out-expo)',
            }}
          />
          {/* the data packet: three bars travelling to the active stage */}
          {active > 0 && playing && (
            <g key={active} style={{ animation: 'fade 200ms both' }}>
              {[0, 1, 2].map((k) => (
                <rect key={k} y={57} width="10" height="6" fill="var(--color-prod)" opacity={1 - k * 0.3}>
                  <animate attributeName="x" from={xs[active - 1] + 22 - k * 14} to={xs[active] - 30 - k * 14} dur="0.9s" fill="freeze" calcMode="spline" keySplines="0.65 0 0.35 1" keyTimes="0;1" />
                </rect>
              ))}
            </g>
          )}
          {STAGES.map((st, i) => {
            const on = i === active
            const done = i < active
            return (
              <g
                key={st.key}
                transform={`translate(${xs[i]} 60)`}
                className="cursor-pointer outline-none"
                role="button"
                tabIndex={0}
                aria-label={`${i + 1}. ${st.name}`}
                aria-pressed={on}
                onClick={() => {
                  setActive(i)
                  setPlaying(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActive(i)
                    setPlaying(false)
                  }
                }}
              >
                {on && <circle r="34" fill="var(--color-prod)" opacity="0.1" style={{ animation: 'fade 400ms both' }} />}
                <rect
                  x="-26"
                  y="-26"
                  width="52"
                  height="52"
                  transform="rotate(45)"
                  fill="var(--color-ink-1)"
                  stroke={on ? 'var(--color-prod)' : done ? 'color-mix(in oklab, var(--color-prod) 45%, transparent)' : 'var(--color-line-3)'}
                  strokeWidth={on ? 1.6 : 1}
                  style={{ transition: 'stroke 400ms' }}
                />
                <Glyph i={i} on={on || done} />
                <text y="66" textAnchor="middle" className="font-mono" fontSize="12" letterSpacing="2" fill={on ? 'var(--color-fg)' : 'var(--color-fg-3)'}>
                  {st.key}
                </text>
                <text y="86" textAnchor="middle" className="font-mono" fontSize="9.5" letterSpacing="1.6" fill="var(--color-fg-3)">
                  {String(i + 1).padStart(2, '0')} · {st.kind.toUpperCase()}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* vertical on phones */}
      <ol className="space-y-2 px-5 pt-6 md:hidden" aria-label="Production workflow">
        {STAGES.map((st, i) => (
          <li key={st.key}>
            <button
              type="button"
              onClick={() => {
                setActive(i)
                setPlaying(false)
              }}
              aria-pressed={i === active}
              className={`flex w-full items-center gap-4 rounded-sm border px-4 py-3 text-left transition-colors ${i === active ? 'border-prod bg-[color-mix(in_oklab,var(--color-prod)_8%,transparent)]' : 'border-line'}`}
            >
              <span className={`font-mono text-[12px] ${i === active ? 'text-prod' : 'text-fg-3'}`}>{String(i + 1).padStart(2, '0')}</span>
              <span className="font-mono text-[12px] tracking-[0.14em]">{st.key}</span>
              <span className="ml-auto text-xs text-fg-3">{st.kind}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 border-t border-line p-6 md:mt-4 md:grid-cols-[1fr_auto] md:items-end md:p-8" aria-live="polite">
        <div key={active} style={{ animation: 'rise 600ms var(--ease-out-expo) both' }}>
          <p className="t-label !text-[var(--color-prod)]">
            Stage {active + 1} of 5 · {s.kind}
          </p>
          <p className="t-title mt-3 text-lg">{s.name}</p>
          <p className="mt-3 max-w-2xl text-fg-2">{s.body}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm btn-ghost" aria-label="Previous stage" onClick={() => { setActive((active + 4) % 5); setPlaying(false) }}>
            ←
          </button>
          <button type="button" className="btn btn-sm btn-ghost min-w-24" onClick={() => setPlaying(!playing)}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" aria-label="Next stage" onClick={() => { setActive((active + 1) % 5); setPlaying(false) }}>
            →
          </button>
        </div>
      </div>
    </div>
  )
}
