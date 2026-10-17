'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * One observer for the whole page: any element with [data-reveal] gains
 * `.is-in` when it scrolls into view. Server components only add the attribute.
 */
export function RevealRoot() {
  const pathname = usePathname()
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    const scan = () =>
      document.querySelectorAll('[data-reveal]:not(.is-in), [data-draw]:not(.is-in)').forEach((el) => {
        if (reduce) el.classList.add('is-in')
        else io.observe(el)
      })
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])
  return null
}

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduce
}

/** True while the element is on screen — used to pause looping animations off-screen. */
export function useInView<T extends Element>(ref: RefObject<T | null>, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

/**
 * Steps through `count` stages on an interval while visible and playing.
 * Returns [active, setActive, playing, setPlaying].
 */
export function useSequence(count: number, intervalMs: number, ref: RefObject<HTMLElement | null>) {
  const reduce = usePrefersReducedMotion()
  const inView = useInView(ref, '-10% 0px')
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (reduce) setPlaying(false)
  }, [reduce])
  useEffect(() => {
    if (!playing || !inView) return
    timer.current = setInterval(() => setActive((a) => (a + 1) % count), intervalMs)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, inView, count, intervalMs])
  return { active, setActive, playing, setPlaying, reduce }
}
