/* eslint-disable @next/next/no-img-element -- the sign-in provider's avatar (Google only, see safeAvatar) */

/** A signed-in person: their Google photo, or their initial when there is none. */
export function Avatar({ url, name, size = 40, className = '' }: { url: string | null; name: string; size?: number; className?: string }) {
  const style = { width: size, height: size }
  if (url) return <img src={url} alt="" width={size} height={size} style={style} className={`shrink-0 rounded-full border border-line-2 object-cover ${className}`} referrerPolicy="no-referrer" />
  return (
    <span style={{ ...style, fontSize: size * 0.42 }} className={`grid shrink-0 place-items-center rounded-full border border-line-2 bg-ink-2 font-semibold text-fg ${className}`} aria-hidden>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}
