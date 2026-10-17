'use client'

import { useEffect, useRef, useState } from 'react'
import { PRODUCTS } from '@/config/products'
import { useSequence } from '../motion'

const APEX = { x: 300, y: 92 }
const HORIZON = 548
const NODES = [72, 224, 376, 528]

/** Each platform's trajectory rises from the horizon and converges on the zenith. */
const path = (x: number) => {
  const pull = (x - APEX.x) * 0.92
  return `M ${x} ${HORIZON} C ${x} ${HORIZON - 190}, ${APEX.x + pull} ${APEX.y + 150}, ${APEX.x} ${APEX.y}`
}

export function Ascent() {
  const ref = useRef<HTMLDivElement>(null)
  const { active, setActive, playing, setPlaying, reduce } = useSequence(4, 3400, ref)
  const [hover, setHover] = useState<number | null>(null)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(t)
  }, [])
  const focus = hover ?? active
  const p = PRODUCTS[focus]

  return (
    <div ref={ref} className="relative">
      <svg
        viewBox="0 0 600 640"
        className={`w-full overflow-visible ${drawn ? 'is-in' : ''}`}
        role="img"
        aria-labelledby="ascent-title ascent-desc"
      >
        <title id="ascent-title">The Zenith ecosystem</title>
        <desc id="ascent-desc">
          Four platforms — Registrations, AntiCheat, Production and Points — each rise along a trajectory and meet at a single point: the zenith.
        </desc>
        <defs>
          <radialGradient id="apex-glow">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="horizon" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-chrome)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--color-chrome)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--color-chrome)" stopOpacity="0" />
          </linearGradient>
          {NODES.map((x, i) => (
            <path key={i} id={`traj-${i}`} d={path(x)} />
          ))}
        </defs>

        {/* altitude rings, like an astrolabe seen edge-on */}
        {[150, 300, 452].map((r, i) => (
          <path
            key={r}
            d={`M ${APEX.x - r} ${HORIZON} A ${r} ${r * 0.95} 0 0 1 ${APEX.x + r} ${HORIZON}`}
            fill="none"
            stroke="var(--color-line-2)"
            strokeDasharray="2 7"
            className="draw-path"
            style={{ '--len': 1500, '--d': 100 + i * 120 } as React.CSSProperties}
          />
        ))}

        {/* the meridian */}
        <line x1={APEX.x} y1="0" x2={APEX.x} y2="620" stroke="var(--color-line-2)" />
        {[0, 30, 60, 90].map((deg) => {
          const y = HORIZON - (deg / 90) * (HORIZON - APEX.y)
          return (
            <g key={deg} className="font-mono" fill="var(--color-fg-3)" fontSize="10" letterSpacing="1.5">
              <line x1={APEX.x - 5} x2={APEX.x + 5} y1={y} y2={y} stroke="var(--color-line-3)" />
              <text x={APEX.x + 12} y={y + 3.5}>{`${deg}°`}</text>
            </g>
          )
        })}

        <line x1="0" x2="600" y1={HORIZON} y2={HORIZON} stroke="url(#horizon)" />

        {/* trajectories */}
        {NODES.map((x, i) => {
          const on = i === focus
          return (
            <g key={i}>
              <use
                href={`#traj-${i}`}
                fill="none"
                stroke={PRODUCTS[i].color}
                strokeOpacity={on ? 0.95 : 0.22}
                strokeWidth={on ? 1.6 : 1}
                className="draw-path"
                style={{ '--len': 620, '--d': 280 + i * 140, transition: 'stroke-opacity 600ms var(--ease-out-expo), stroke-width 600ms' } as React.CSSProperties}
              />
              {!reduce && (
                <circle r={on ? 3.6 : 2.4} fill={PRODUCTS[i].color} opacity={on ? 1 : 0.55}>
                  <animateMotion dur={on ? '2.4s' : '4.6s'} repeatCount="indefinite" begin={`${1.4 + i * 0.45}s`} calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.65 0 0.35 1">
                    <mpath href={`#traj-${i}`} />
                  </animateMotion>
                </circle>
              )}
            </g>
          )
        })}

        {/* zenith apex */}
        <circle cx={APEX.x} cy={APEX.y} r="70" fill="url(#apex-glow)" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 1.4s 1.2s' }} />
        <g transform={`translate(${APEX.x} ${APEX.y}) rotate(45)`}>
          {!reduce && (
            <rect x="-9" y="-9" width="18" height="18" fill="none" stroke="var(--color-gold)" style={{ transformOrigin: 'center', animation: 'pulse-ring 2.6s var(--ease-out-expo) 1.8s infinite' }} />
          )}
          <rect x="-7" y="-7" width="14" height="14" fill="var(--color-gold)" style={{ filter: 'drop-shadow(0 0 10px var(--color-gold))' }} />
        </g>
        <text x={APEX.x} y={APEX.y - 26} textAnchor="middle" className="font-mono" fontSize="10.5" letterSpacing="3" fill="var(--color-gold)">
          ZENITH
        </text>

        {/* product nodes on the horizon */}
        {NODES.map((x, i) => {
          const on = i === focus
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`${PRODUCTS[i].name}: ${PRODUCTS[i].role}`}
              aria-pressed={on}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => {
                setActive(i)
                setPlaying(false)
              }}
              className="cursor-pointer outline-none"
              style={{ opacity: drawn ? 1 : 0, transition: `opacity 700ms ${300 + i * 120}ms` }}
            >
              <rect x={x - 36} y={HORIZON - 30} width="72" height="96" fill="transparent" />
              <g transform={`translate(${x} ${HORIZON}) rotate(45)`}>
                <rect x="-6" y="-6" width="12" height="12" fill={on ? PRODUCTS[i].color : 'var(--color-void)'} stroke={PRODUCTS[i].color} style={{ transition: 'fill 400ms' }} />
              </g>
              <text x={x} y={HORIZON + 30} textAnchor="middle" className="font-mono" fontSize="10" letterSpacing="2" fill={on ? PRODUCTS[i].color : 'var(--color-fg-3)'}>
                {PRODUCTS[i].index}
              </text>
              <text x={x} y={HORIZON + 48} textAnchor="middle" className="font-mono" fontSize="11" letterSpacing="1.6" fill={on ? 'var(--color-fg)' : 'var(--color-fg-2)'}>
                {PRODUCTS[i].verb.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>

      {/* caption for the focused platform — the diagram's legend */}
      <div className="mx-auto mt-2 flex min-h-[92px] max-w-md items-start gap-4 border-l pl-4" style={{ borderColor: p.color }} aria-live="polite">
        <div>
          <p className="t-label" style={{ color: p.color }}>
            {p.index} · {p.role}
          </p>
          <p className="mt-1.5 text-[15px] text-fg-2">{p.blurb}</p>
        </div>
        {!reduce && (
          <button type="button" onClick={() => setPlaying(!playing)} className="t-label ml-auto mt-0.5 shrink-0 hover:text-fg" aria-label={playing ? 'Pause the diagram' : 'Play the diagram'}>
            {playing ? '❚❚' : '▶'}
          </button>
        )}
      </div>
    </div>
  )
}
