'use client'

import { useEffect, useRef, useState } from 'react'
import { MARK_PATH, MARK_VIEWBOX } from '../brand/mark-path'
import { SplitText } from '../kinetic'

/**
 * The closing scene. A grid floor recedes to a gold horizon, light rises from
 * it, and the Zenith mark draws itself at the top. Everything waits
 * until the section is on screen and pauses again when it leaves.
 */

// Deterministic "random" so server and client render the same particles.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}
// Rounded, so server and browser produce identical style strings.
const r1 = (n: number) => Math.round(n * 10) / 10
const PARTICLES = Array.from({ length: 34 }, (_, i) => ({
  left: r1(8 + rand(i, 1) * 84),
  size: r1(2 + rand(i, 2) * 3),
  dur: r1(7 + rand(i, 3) * 9),
  delay: r1(-rand(i, 4) * 14),
  drift: Math.round((rand(i, 5) - 0.5) * 60),
}))

export function Finale({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      setLive(e.isIntersecting)
      if (e.isIntersecting) setSeen(true)
    }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`finale relative isolate overflow-hidden ${live ? 'is-live' : ''} ${seen ? 'is-seen' : ''}`}>
      {/* sky and sunrise */}
      <div aria-hidden className="absolute inset-0 -z-30 bg-[radial-gradient(120%_70%_at_50%_100%,rgba(217,178,95,0.30),rgba(217,178,95,0.06)_38%,transparent_62%),linear-gradient(180deg,#06070a,#0a0a0d_55%,#0d0b08)]" />
      <div aria-hidden className="finale-sheen absolute left-1/2 top-[58%] -z-20 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40" />
      {/* the floor */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-20 h-[46%] [perspective:520px]">
        <div className="finale-grid absolute inset-x-[-40%] bottom-[-20%] top-0 origin-bottom [transform:rotateX(62deg)]" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#0a0a0d] to-transparent" />
      </div>
      {/* rising light */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="finale-particle absolute bottom-[8%] rounded-full bg-[var(--color-gold-hi)]"
            style={{ left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, '--drift': `${p.drift}px` } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="shell relative py-28 text-center md:py-36">
        {/* the mark draws itself at the top */}
        <div className="mx-auto mb-10 w-[min(220px,46vw)]">
          <svg viewBox={MARK_VIEWBOX} className="w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="finale-chrome" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.45" stopColor="#c9cfd9" />
                <stop offset="1" stopColor="#d9b25f" />
              </linearGradient>
            </defs>
            <path d={MARK_PATH} fillRule="evenodd" className="finale-mark-fill" fill="url(#finale-chrome)" />
            <path d={MARK_PATH} fillRule="evenodd" className="finale-mark-line" fill="none" stroke="var(--color-gold-hi)" strokeWidth="6" pathLength={1} />
          </svg>
        </div>
        <p className="t-label flex items-center justify-center gap-3">
          <span className="node node-fill" />
          <span>Zenith</span>
        </p>
        <h2 id="zenith-title" className={`t-display mx-auto mt-8 max-w-4xl text-[clamp(2rem,5vw,3.8rem)] ${seen ? '' : 'kx-hold'}`}>
          <SplitText text="Compete at the" />
          <br />
          <SplitText text="highest point" delay={420} letterClassName="t-chrome" />
        </h2>
        {children}
      </div>
    </div>
  )
}
