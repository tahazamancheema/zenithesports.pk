'use client'

import { useRef } from 'react'
import { useSequence } from '../motion'

const STAGES = [
  { k: 'Screenshot', d: 'Drop in the end-of-match results screen, the way you capture it today.' },
  { k: 'AI-assisted extraction', d: 'The app reads team, placement and kills from the image.' },
  { k: 'Extracted scores', d: 'Every value is laid out for checking — uncertain readings are highlighted.' },
  { k: 'Review & correct', d: 'You confirm or fix anything flagged. Nothing counts until a person has checked it.' },
  { k: 'Point calculation', d: 'Your scoring rules turn placements and kills into points.' },
  { k: 'Saved results', d: 'Stored on the device with previous results, ready for the leaderboard.' },
]

// Illustrative sample only — not real teams or results.
const ROWS = [
  { team: 'Team A', place: 1, kills: 9, pp: 10 },
  { team: 'Team B', place: 2, kills: 6, pp: 6 },
  { team: 'Team C', place: 3, kills: 7, pp: 5, unsure: true, read: 1 },
  { team: 'Team D', place: 4, kills: 3, pp: 4 },
]

export function Extraction() {
  const ref = useRef<HTMLDivElement>(null)
  const { active, setActive, playing, setPlaying, reduce } = useSequence(6, 2400, ref)
  const s = reduce ? 5 : active

  return (
    <div ref={ref} className="panel-raised overflow-hidden" data-surface="points">
      <div className="grid lg:grid-cols-[1fr_1.15fr]">
        {/* the screenshot */}
        <div className="relative border-b border-line p-6 lg:border-r lg:border-b-0">
          <p className="t-label">Results screenshot · sample</p>
          <div className="relative mt-4 overflow-hidden rounded-sm border border-line-2 bg-[#0d1016] p-4">
            <div className="mb-3 h-3 w-28 bg-fg-3/40" />
            {ROWS.map((r, i) => (
              <div key={r.team} className="mb-2 flex items-center gap-3 rounded-xs bg-ink-3 px-3 py-2.5">
                <span className="font-mono text-[12px] text-fg-3">#{r.place}</span>
                <span className="h-2 flex-1 bg-fg-3/40" style={{ maxWidth: `${70 - i * 8}%` }} />
                <span className={`font-mono text-[12px] ${r.unsure ? 'text-fg-3/60 blur-[0.6px]' : 'text-fg-3'}`}>{r.kills} elims</span>
              </div>
            ))}
            {/* scanning beam */}
            {s === 1 && (
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full">
                <div
                  className="h-full w-full"
                  style={{
                    background: 'linear-gradient(180deg, transparent 38%, color-mix(in oklab, var(--color-pts) 38%, transparent) 50%, transparent 62%)',
                    animation: 'scan 1.6s var(--ease-in-out-quint) infinite',
                  }}
                />
              </div>
            )}
            {s >= 1 && (
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {ROWS.map((r, i) => (
                  <span
                    key={r.team}
                    className="absolute right-3 h-[30px] w-[70px] rounded-xs border"
                    style={{
                      top: 44 + i * 40,
                      borderColor: r.unsure ? 'var(--color-warn)' : 'var(--color-pts)',
                      opacity: s >= 1 ? 0.9 : 0,
                      transition: `opacity 400ms ${i * 120}ms`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* the structured result */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <p className="t-label">Structured result</p>
            {s >= 5 && (
              <span className="chip chip-ok" style={{ animation: 'rise 500ms var(--ease-out-expo) both' }}>
                ✓ Saved
              </span>
            )}
          </div>
          <table className="table mt-4 text-[14px]">
            <thead>
              <tr>
                <th>Team</th>
                <th className="text-right">Place</th>
                <th className="text-right">Elims</th>
                <th className="text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => {
                const shown = s >= 2
                const kills = r.unsure && s < 3 ? r.read : r.kills
                const total = r.pp + r.kills
                return (
                  <tr key={r.team} style={{ opacity: shown ? 1 : 0.15, transition: `opacity 500ms ${i * 110}ms` }}>
                    <td>{shown ? r.team : '—'}</td>
                    <td className="text-right font-mono">{shown ? r.place : '—'}</td>
                    <td className="text-right font-mono">
                      {shown ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xs px-1.5 ${r.unsure && s === 2 ? 'bg-[color-mix(in_oklab,var(--color-warn)_16%,transparent)] text-warn' : ''} ${r.unsure && s >= 3 ? 'text-ok' : ''}`}
                          title={r.unsure && s === 2 ? 'Low confidence — needs review' : undefined}
                        >
                          {kills}
                          {r.unsure && s === 2 && <span aria-label="needs review">?</span>}
                          {r.unsure && s >= 3 && <span aria-label="corrected">✓</span>}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-right font-mono">
                      <span style={{ color: s >= 4 ? 'var(--color-pts)' : 'var(--color-fg-3)', transition: 'color 400ms' }}>{s >= 4 ? total : '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {s >= 4 && <p className="mt-3 font-mono text-[12px] text-fg-3">Placement points + 1 per elimination · sample rules</p>}
        </div>
      </div>

      {/* stage rail */}
      <div className="border-t border-line p-6">
        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Scoring workflow">
          {STAGES.map((st, i) => (
            <li key={st.k}>
              <button
                type="button"
                onClick={() => {
                  setActive(i)
                  setPlaying(false)
                }}
                aria-pressed={i === s}
                className="group w-full text-left"
              >
                <span className="block h-0.5 w-full overflow-hidden bg-line-2">
                  <span className="block h-full bg-pts transition-transform duration-700" style={{ transform: `scaleX(${i <= s ? 1 : 0})`, transformOrigin: 'left' }} />
                </span>
                <span className={`mt-2 block font-mono text-[11.5px] uppercase tracking-[0.12em] ${i === s ? 'text-fg' : 'text-fg-3 group-hover:text-fg-2'}`}>{st.k}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4" aria-live="polite">
          <p className="max-w-xl text-fg-2">
            <span className="text-fg">{STAGES[s].k}.</span> {STAGES[s].d}
          </p>
          {!reduce && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPlaying(!playing)}>
              {playing ? 'Pause' : 'Play'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
