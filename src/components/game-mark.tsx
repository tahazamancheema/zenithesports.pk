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
  if (art.emblem || art.logo) {
    return (
      <span className={frame} style={{ ...box, background: `linear-gradient(160deg, color-mix(in oklab, ${art.accent} 18%, #0b0d11), #07080b 75%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static official mark */}
        <img src={art.emblem ?? art.logo} alt={`${name} logo`} className={art.emblem ? 'h-[72%] w-[72%] object-contain' : 'w-[86%] object-contain'} />
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

/** The game's own wordmark where Zenith has one, otherwise the icon and its name. */
export function GameWordmark({ gameId, name, logoUrl, height = 36, className = '' }: { gameId: string; name: string; logoUrl?: string | null; height?: number; className?: string }) {
  const art = gameArt(gameId)
  if (art.logo && !logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- static official wordmark
    return <img src={art.logo} alt={name} style={{ height }} className={`w-auto max-w-full object-contain object-left ${className}`} />
  }
  return <GameMark gameId={gameId} name={name} logoUrl={logoUrl} size={height + 8} className={className} />
}
