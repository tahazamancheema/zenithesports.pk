'use client'

import { useEffect, useRef, useState } from 'react'

/* eslint-disable @next/next/no-img-element -- static captures under /products, already optimised */

const P = '/products/production'

const STEPS = [
  { k: 'Observer feed', t: 'The match is watched', b: 'The PUBG Mobile observer client follows the match. Every elimination, zone change and placement becomes an event.' },
  { k: 'ZenithProduction', t: 'The command centre listens', b: 'ZenithProduction receives those events live, keeps the scoreboard and knows exactly what should be on screen next.' },
  { k: 'Graphics', t: 'Graphics build themselves', b: 'Live standings, elimination pop-ups, zone alerts and the ticker animate on as things happen. Nothing is typed by hand.' },
  { k: 'OBS', t: 'OBS runs the show', b: 'Scenes switch on cue or automatically — starting soon, gameplay, standings, chicken dinner and the after-match rundown.' },
  { k: 'Live', t: 'Your audience sees it live', b: 'OBS streams the finished broadcast to YouTube, Facebook or wherever you broadcast. One operator seat, the whole show.' },
]

const EVENTS = ['Elimination · Squad 07', 'Zone · phase 4 closing', 'Team eliminated · #12', 'Knock · Squad 03', 'Placement · 9 teams left']
const SCENES = [
  { label: 'Starting soon', src: `${P}/starting-soon.webp` },
  { label: 'Gameplay', src: '/products/production/gameplay-frame.webp' },
  { label: 'Standings', src: `${P}/overall-standings.webp` },
  { label: 'Chicken dinner', src: `${P}/chicken-dinner.webp` },
  { label: 'After match', src: `${P}/match-mvp.webp` },
]

/** Layer helper: visible from step `from`, with a per-layer entrance. */
function Layer({ on, className = '', style, children, enter = 'translate-y-4' }: { on: boolean; className?: string; style?: React.CSSProperties; children: React.ReactNode; enter?: string }) {
  return (
    <div className={`absolute transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${on ? 'opacity-100' : `pointer-events-none opacity-0 ${enter}`} ${className}`} style={style} aria-hidden={!on}>
      {children}
    </div>
  )
}

export function BroadcastBuild() {
  const ref = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const span = r.height - window.innerHeight
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // A slow pulse drives the event feed and scene switcher while the section is pinned.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setTick((x) => x + 1), 1400)
    return () => clearInterval(t)
  }, [])

  const goTo = (n: number) => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + (span * (n + 0.5)) / STEPS.length, behavior: 'smooth' })
  }

  const scene = step >= 3 ? (step === 4 ? 2 : 1 + (tick % 2)) : 1
  const showOverlays = step >= 2 && SCENES[scene].label === 'Gameplay'

  return (
    <section ref={ref} className="relative" style={{ height: `${STEPS.length * 85 + 40}vh` }} aria-labelledby="build-title">
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden py-6">
        <div className="shell grid items-center gap-6 lg:grid-cols-12 lg:gap-10">
          {/* steps */}
          <div className="order-2 lg:order-1 lg:col-span-4">
            <h2 id="build-title" className="t-label !text-prod">How a broadcast is built</h2>
            <ol className="mt-4 space-y-1 lg:mt-6">
              {STEPS.map((s, n) => (
                <li key={s.k}>
                  <button type="button" onClick={() => goTo(n)} className={`w-full rounded-md border-l-2 py-2 pl-4 text-left transition-colors ${n === step ? 'border-prod' : 'border-line-2 opacity-60 hover:opacity-90'}`} aria-current={n === step ? 'step' : undefined}>
                    <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-fg-3">
                      {String(n + 1).padStart(2, '0')} · {s.k}
                    </span>
                    <span className={`t-title block text-[clamp(1rem,1.6vw,1.3rem)] ${n === step ? 'text-fg' : 'text-fg-2'}`}>{s.t}</span>
                    <span className={`grid transition-[grid-template-rows] duration-500 ${n === step ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <span className="overflow-hidden text-[15px] text-fg-2">
                        <span className="block pt-1.5">{s.b}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* stage */}
          <div className="order-1 lg:order-2 lg:col-span-8">
            <div className="bezel">
              <div className="relative aspect-video bg-black">
                {/* program output */}
                {SCENES.map((s, n) => (
                  <img key={s.label} src={s.src} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700" style={{ opacity: n === scene ? 1 : 0 }} loading="lazy" />
                ))}

                {/* 1 · observer events */}
                <Layer on={step === 0} className="bottom-[6%] left-[3%] w-[44%] min-w-[180px]">
                  <div className="rounded-lg border border-white/15 bg-black/70 p-2.5 backdrop-blur-md sm:p-3">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-prod sm:text-[12px]">● Observer events</p>
                    <ul className="mt-1.5 space-y-1">
                      {[0, 1, 2].map((i) => (
                        <li key={`${tick}-${i}`} className="truncate font-mono text-[10.5px] text-white/85 sm:text-[12.5px]" style={{ animation: i === 0 ? 'rise 500ms var(--ease-out-expo) both' : undefined, opacity: 1 - i * 0.28 }}>
                          {EVENTS[(tick + EVENTS.length - i) % EVENTS.length]}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Layer>

                {/* 2 · the command centre */}
                <Layer on={step === 1} enter="scale-95" className="inset-[6%]">
                  <div className="h-full overflow-hidden rounded-md border border-white/20 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
                    <img src={`${P}/command-center.webp`} alt="ZenithProduction command centre" className="h-full w-full object-cover object-top" loading="lazy" />
                  </div>
                </Layer>
                <Layer on={step === 2} enter="translate-x-6" className="bottom-[13%] right-[2%] hidden w-[24%] sm:block">
                  <div className="overflow-hidden rounded border border-white/25 shadow-xl">
                    <img src={`${P}/command-center.webp`} alt="" className="w-full" loading="lazy" />
                  </div>
                  <p className="mt-1 text-right font-mono text-[10.5px] uppercase tracking-wider text-white/80">Operator view</p>
                </Layer>

                {/* 3 · real overlay output, at broadcast positions */}
                <Layer on={showOverlays} enter="-translate-y-3" className="left-1/2 top-[3%] w-[34%] -translate-x-1/2">
                  <img src={`${P}/popup-team-eliminated.webp`} alt="Team eliminated pop-up" className="w-full" />
                </Layer>
                <Layer on={showOverlays && tick % 2 === 0} enter="-translate-y-2" className="left-1/2 top-[19%] w-[36%] -translate-x-1/2">
                  <img src={`${P}/popup-zone.webp`} alt="Zone alert" className="w-full" />
                </Layer>
                <Layer on={showOverlays} enter="translate-x-6" className="right-[1.5%] top-[11%] w-[17.5%]" style={{ transitionDelay: '120ms' }}>
                  <img src={`${P}/live-standings.webp`} alt="Live standings" className="w-full" />
                </Layer>
                <Layer on={showOverlays && tick % 2 === 1} enter="-translate-x-6" className="left-[2%] top-[30%] w-[23%]">
                  <img src={`${P}/popup-first-blood.webp`} alt="First blood pop-up" className="w-full" />
                </Layer>
                <Layer on={showOverlays} enter="-translate-x-6" className="bottom-[7%] left-[2%] w-[27.7%]" style={{ transitionDelay: '200ms' }}>
                  <img src={`${P}/lower-third.webp`} alt="Lower third" className="w-full" />
                </Layer>
                <Layer on={showOverlays || step === 4} enter="translate-y-full" className="inset-x-0 bottom-0">
                  <img src={`${P}/ticker.webp`} alt="Ticker" className="w-full" />
                </Layer>

                {/* 5 · live */}
                <Layer on={step === 4} enter="-translate-y-2" className="left-[2.5%] top-[4%]">
                  <span className="flex items-center gap-2 rounded bg-[#e5312a] px-2 py-1 font-mono text-[11.5px] font-semibold uppercase tracking-wider text-white shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" style={{ animation: 'blink 1.2s steps(1) infinite' }} /> Live
                  </span>
                </Layer>
              </div>

              {/* 4 · OBS scene switcher */}
              <div className={`grid grid-cols-5 gap-1.5 bg-[#0c0e12] p-1.5 transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-35'}`}>
                {SCENES.map((s, n) => (
                  <div key={s.label} className={`overflow-hidden rounded-[4px] border ${n === scene && step >= 3 ? 'border-prod' : 'border-white/10'}`}>
                    <img src={s.src} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                    <p className={`truncate px-1 py-0.5 text-center text-[10.5px] sm:text-[11.5px] ${n === scene && step >= 3 ? 'bg-prod text-black' : 'text-white/70'}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[13px] text-fg-3">Overlays and screens are real ZenithProduction output with its built-in sample data. The gameplay frame is a real PUBG Mobile (BGMI) screenshot from its official store listing.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
