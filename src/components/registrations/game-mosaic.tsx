/* eslint-disable @next/next/no-img-element -- static, pre-optimised game art under /visuals and /games */
import { artCrop, GAME_ART } from '@/config/game-art'

const ORDER = ['pubg-mobile', 'free-fire', 'valorant', 'honor-of-kings', 'tekken-8', 'ea-fc']

/**
 * The games Zenith runs tournaments for: each title's official art with its
 * logo. `grid` is a 3×2 board for a page header; `strip` is a row of slanted
 * panels that fills a card's background.
 */
export function GameMosaic({ variant = 'grid', className = '' }: { variant?: 'grid' | 'strip'; className?: string }) {
  const games = ORDER.filter((id) => GAME_ART[id])
  if (variant === 'strip') {
    return (
      <div aria-hidden className={`flex h-full gap-1.5 ${className}`}>
        {games.map((id) => {
          const a = GAME_ART[id]
          return (
            <div key={id} className="relative h-full min-w-0 flex-1 -skew-x-6 overflow-hidden first:ml-[-4%] last:mr-[-4%]">
              <img src={a.thumb} alt="" loading="lazy" style={artCrop(id, a.thumb)} className="absolute inset-0 h-full w-full skew-x-6 scale-125 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              {a.logo && <img src={a.logo} alt="" loading="lazy" className="absolute inset-x-0 bottom-5 mx-auto max-h-8 w-auto max-w-[68%] skew-x-6 object-contain" />}
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <ul className={`grid grid-cols-3 gap-2 ${className}`} aria-label="Games with Zenith tournaments">
      {games.map((id, i) => {
        const a = GAME_ART[id]
        return (
          <li key={id} className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line-2" style={{ animation: `rise 800ms var(--ease-out-expo) ${120 + i * 70}ms both` }}>
            <img src={a.thumb} alt="" style={artCrop(id, a.thumb)} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            {a.logo ? (
              <img src={a.logo} alt={a.word.join(' ')} className="absolute inset-x-3 bottom-3 mx-auto max-h-9 w-auto max-w-[80%] object-contain" />
            ) : (
              <span className="absolute inset-x-3 bottom-3 text-center text-sm font-semibold text-white">{a.word.join(' ')}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
