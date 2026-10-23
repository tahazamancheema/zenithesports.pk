import Image from 'next/image'

export function ZenithMark({ size = 28, className = '', priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={size > 120 ? '/brand/zenith-mark-512.webp' : '/brand/zenith-mark-160.webp'}
      alt="Zenith Esports"
      width={size}
      height={size}
      priority={priority}
      className={className}
      unoptimized
    />
  )
}

/** Wordmark: the name set in Michroma, the ecosystem's display face. */
export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-display text-[13px] tracking-[0.32em] text-fg ${className}`}>ZENITH</span>
}

/** Diamond node in a given colour — the signature mark of the Meridian system. */
export function Node({ color, filled = false, size = 8 }: { color?: string; filled?: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      className={`node ${filled ? 'node-fill' : ''}`}
      style={{ width: size, height: size, ...(color ? ({ '--accent': color } as React.CSSProperties) : {}) }}
    />
  )
}

/** Section label above a heading. */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`t-label flex items-center gap-3 ${className}`}>
      <span className="node node-fill" />
      <span>{children}</span>
    </p>
  )
}
