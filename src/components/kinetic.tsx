'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, usePrefersReducedMotion } from './motion'

/**
 * Letter-by-letter headline reveal. Gradient text (t-chrome) must go on
 * `letterClassName`: background-clip does not reach transformed children. Screen readers get the plain text; the
 * animated letters are presentational. CSS only, so it costs no JavaScript work.
 */
export function SplitText({ text, delay = 0, className = '', letterClassName = '' }: { text: string; delay?: number; className?: string; letterClassName?: string }) {
  let i = 0
  return (
    <span className={className} aria-label={text} role="text">
      {text.split(' ').map((word, w) => (
        <span key={w} aria-hidden>
          <span className="kx-word">
            {[...word].map((ch, c) => (
              <span key={c} className={`kx-letter ${letterClassName}`} style={{ '--i': i++, '--d': `${delay}ms` } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {w < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}

/** A word slot that rolls through a list, each word in its own colour. */
export function WordCycle({ words, interval = 2200, className = '' }: { words: { text: string; color: string }[]; interval?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref)
  const reduce = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    const t = setInterval(() => setActive((a) => (a + 1) % words.length), interval)
    return () => clearInterval(t)
  }, [inView, reduce, interval, words.length])
  return (
    <span ref={ref} className={`kx-slot ${className}`} aria-live="off">
      {words.map((w, i) => (
        <span key={w.text} data-state={i === active ? 'on' : i === (active + words.length - 1) % words.length ? 'after' : 'before'} style={{ color: w.color }} aria-hidden={i !== active}>
          {w.text}
        </span>
      ))}
    </span>
  )
}

/**
 * An endless strip that drifts on its own and speeds up (and leans) with the
 * reader's scroll velocity. Runs only while visible; static for reduced motion.
 */
export function VelocityMarquee({ children, speed = 0.5, reverse = false, className = '' }: { children: React.ReactNode; speed?: number; reverse?: boolean; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const inView = useInView(wrap, '100px')
  const reduce = usePrefersReducedMotion()
  useEffect(() => {
    if (!inView || reduce) return
    const el = track.current
    if (!el) return
    let x = 0
    let lastY = window.scrollY
    let boost = 0
    let raf = 0
    const tick = () => {
      const y = window.scrollY
      boost = boost * 0.9 + Math.min(40, Math.abs(y - lastY)) * 0.1
      lastY = y
      const half = el.scrollWidth / 2
      x += (speed + boost * 0.35) * (reverse ? 1 : -1)
      if (x <= -half) x += half
      if (x > 0) x -= half
      el.style.transform = `translate3d(${x}px,0,0) skewX(${(reverse ? 1 : -1) * Math.min(8, boost * 0.5)}deg)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, speed, reverse])
  return (
    <div ref={wrap} className={`overflow-hidden ${className}`}>
      <div ref={track} className="marquee">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Two oversized lines that slide against each other as the section scrolls past. */
export function ScrollStatement({ lines }: { lines: [string, string] }) {
  const ref = useRef<HTMLDivElement>(null)
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, '200px')
  const reduce = usePrefersReducedMotion()
  useEffect(() => {
    if (!inView || reduce) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = ref.current!.getBoundingClientRect()
      const p = 1 - (r.top + r.height) / (window.innerHeight + r.height) // 0 → 1 across the viewport
      a.current!.style.transform = `translate3d(${(-p * 30 + 5).toFixed(2)}%,0,0)`
      b.current!.style.transform = `translate3d(${(p * 30 - 25).toFixed(2)}%,0,0)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [inView, reduce])
  const row = (text: string, outline: boolean) => (
    <span className={`t-display whitespace-nowrap pr-[0.6em] text-[clamp(3rem,9vw,8.5rem)] leading-none ${outline ? 't-outline' : 't-chrome'}`}>
      {text} {text} {text}
    </span>
  )
  return (
    <div ref={ref} className="select-none overflow-hidden py-6" aria-label={lines.join(' ')} role="img">
      <div ref={a} className="will-change-transform">{row(lines[0], false)}</div>
      <div ref={b} className="mt-2 will-change-transform">{row(lines[1], true)}</div>
    </div>
  )
}

/** Pointer tilt for media cards: sets --rx/--ry on the element. */
export function TiltCard({ children, className = '', max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = ref.current!.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        ref.current!.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`)
        ref.current!.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`)
      }}
      onPointerLeave={() => {
        ref.current!.style.setProperty('--ry', '0deg')
        ref.current!.style.setProperty('--rx', '0deg')
      }}
    >
      {children}
    </div>
  )
}

/** A muted, looping video that only plays while on screen (and never for reduced motion). */
export function InViewVideo({ sources, poster, className = '', label }: { sources: { src: string; type: string }[]; poster: string; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref, '0px')
  const reduce = usePrefersReducedMotion()
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (inView && !reduce) v.play().catch(() => {})
    else v.pause()
  }, [inView, reduce])
  return (
    <video ref={ref} className={className} poster={poster} muted loop playsInline preload="none" aria-label={label}>
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  )
}
