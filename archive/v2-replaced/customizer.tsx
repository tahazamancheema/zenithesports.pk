'use client'

import { useState } from 'react'

const ACCENTS = [
  { name: 'Violet', v: '#9d8cff' },
  { name: 'Ember', v: '#ff7a45' },
  { name: 'Mint', v: '#4fe0b0' },
  { name: 'Gold', v: '#d9b25f' },
]
const TYPES = [
  { name: 'Wide', v: 'var(--font-display)', up: true },
  { name: 'Clean', v: 'var(--font-sans)', up: false },
  { name: 'Mono', v: 'var(--font-mono)', up: true },
]

/** A small, real demonstration of the theming idea: change colour and type, see the table follow. */
export function Customizer() {
  const [accent, setAccent] = useState(ACCENTS[0])
  const [type, setType] = useState(TYPES[0])
  const [dense, setDense] = useState(false)
  const rows = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E']
  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div className="panel space-y-6 p-6">
        <fieldset>
          <legend className="t-label mb-3">Accent</legend>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.name}
                type="button"
                onClick={() => setAccent(a)}
                aria-pressed={accent.name === a.name}
                aria-label={a.name}
                className="h-9 w-9 rounded-sm border-2 transition-transform hover:scale-105"
                style={{ background: a.v, borderColor: accent.name === a.name ? '#fff' : 'transparent' }}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="t-label mb-3">Typography</legend>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t.name} type="button" onClick={() => setType(t)} aria-pressed={type.name === t.name} className={`btn btn-sm ${type.name === t.name ? 'btn-primary' : 'btn-ghost'}`}>
                {t.name}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="choice">
          <input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} />
          <span className="text-sm">Compact rows</span>
        </label>
      </div>
      <div className="overflow-hidden rounded-md border border-line-2" style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${accent.v} 14%, #0b0d11), #0b0d11 60%)` }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `2px solid ${accent.v}` }}>
          <span style={{ fontFamily: type.v, textTransform: type.up ? 'uppercase' : 'none', letterSpacing: type.up ? '0.06em' : 0 }} className="text-lg">
            Overall standings
          </span>
          <span className="font-mono text-[12px] text-fg-3">Sample</span>
        </div>
        <ol>
          {rows.map((r, i) => (
            <li key={r} className={`flex items-center gap-4 px-6 ${dense ? 'py-2' : 'py-3.5'} border-b border-line transition-all`}>
              <span className="grid h-7 w-7 place-items-center rounded-xs font-mono text-xs" style={{ background: i === 0 ? accent.v : 'var(--color-ink-3)', color: i === 0 ? '#0a0b0e' : 'var(--color-fg-2)' }}>
                {i + 1}
              </span>
              <span className="flex-1" style={{ fontFamily: type.v, textTransform: type.up ? 'uppercase' : 'none', fontSize: type.name === 'Wide' ? 13 : 15 }}>
                {r}
              </span>
              <span className="font-mono text-sm" style={{ color: i === 0 ? accent.v : 'var(--color-fg-2)' }}>
                {[64, 51, 47, 39, 30][i]}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
