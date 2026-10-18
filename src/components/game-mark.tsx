import { GAME_GLYPHS } from '@/config/game-glyphs'
import { gameArt } from '@/config/game-art'

/**
 * Identifies a game: an uploaded official logo when there is one, otherwise the
 * Simple Icons glyph, otherwise a typographic badge in the game's accent.
 */
export function GameMark({
  gameId,
  name,
  logoUrl,
  size = 40,
  className = '',
}: {
  gameId: string
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}) {
  const art = gameArt(gameId)
  const glyph = GAME_GLYPHS[gameId]
  const box = { width: size, height: size, '--g': art.accent } as React.CSSProperties
  const frame = `relative grid shrink-0 place-items-center overflow-hidden rounded-[22%] border border-white/10 bg-[#0b0d11] ${className}`

  if (logoUrl) {
    return (
      <span className={frame} style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element -- served by /media with its own caching */}
        <img src={logoUrl} alt={`${name} logo`} className="h-[78%] w-[78%] object-contain" loading="lazy" />
      </span>
    )
  }
  if (glyph) {
    return (
      <span className={frame} style={{ ...box, background: `linear-gradient(160deg, color-mix(in oklab, ${art.accent} 26%, #0b0d11), #07080b 70%)` }}>
        <svg viewBox="0 0 24 24" className="h-[56%] w-[56%]" role="img" aria-label={name}>
          <path d={glyph.path} fill={art.accent} />
        </svg>
      </span>
    )
  }
  const [a, b] = art.word
  return (
    <span className={frame} style={{ ...box, background: `linear-gradient(160deg, color-mix(in oklab, ${art.accent} 30%, #0b0d11), #07080b 75%)` }} role="img" aria-label={name}>
      <span aria-hidden className="text-center font-sans font-extrabold uppercase italic leading-[0.9] tracking-tight" style={{ color: art.accent, fontSize: size * (b ? 0.2 : 0.17) }}>
        {a}
        {b && <span className="block text-white" style={{ fontSize: size * 0.18 }}>{b}</span>}
      </span>
    </span>
  )
}
