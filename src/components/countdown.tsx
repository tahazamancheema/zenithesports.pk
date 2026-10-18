'use client'

import { useEffect, useState } from 'react'

/** Counts down to a real deadline from the database. Renders nothing once it has passed. */
export function Countdown({ to, label }: { to: string; label: string }) {
  const target = new Date(to).getTime()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0) // client-only clock: avoids a hydration mismatch
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])
  if (now === null) return <p className="t-label h-12">{label}</p>
  const ms = target - now
  if (ms <= 0) return null
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms / 3600000) % 24
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  const cells = [
    [d, 'days'],
    [h, 'hrs'],
    [m, 'min'],
    [s, 'sec'],
  ] as const
  return (
    <div>
      <p className="t-label">{label}</p>
      <div className="mt-2 flex gap-4 font-mono tabular-nums" role="timer" aria-label={`${d} days ${h} hours ${m} minutes`}>
        {cells.map(([v, u]) => (
          <span key={u} className="flex items-baseline gap-1">
            <span className="text-2xl text-fg">{String(v).padStart(2, '0')}</span>
            <span className="text-[11px] text-fg-3">{u}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
