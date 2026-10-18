import { phaseOf } from '@/lib/tournament'
import { getFormats, getGames, listPublicTournaments, type Game } from '@/server/services/catalog'
import { gameArt } from '@/config/game-art'
import { mediaUrl } from '@/server/services/catalog'
import { GameWordmark } from './game-mark'
import { ZLink } from './link'

export const AVAILABILITY: Record<Game['availability'], { label: string; chip: string }> = {
  active: { label: 'Division open', chip: 'chip chip-ok' },
  upcoming: { label: 'Coming soon', chip: 'chip chip-info' },
  planned: { label: 'Planned', chip: 'chip' },
  paused: { label: 'Paused', chip: 'chip chip-warn' },
}

const FALLBACK = ['PUBG Mobile', 'Free Fire', 'VALORANT', 'Honor of Kings', 'TEKKEN 8', 'EA SPORTS FC']

/** The six-game portfolio with live availability, formats and open events — all from the database. */
export async function PortfolioTable() {
  const [games, formats, tournaments] = await Promise.all([getGames(), getFormats(), listPublicTournaments()])
  if (!games.length) {
    return (
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {FALLBACK.map((name, i) => (
          <li key={name} className="flex items-center gap-6 py-5">
            <span className="t-label w-8">{String(i + 1).padStart(2, '0')}</span>
            <span className="t-title text-lg">{name}</span>
            <span className="chip ml-auto">Status unavailable</span>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <ul className="mt-6 divide-y divide-line border-y border-line">
      {games.map((g, i) => {
        const fmts = formats.filter((f) => f.gameId === g.id && f.enabled)
        const open = tournaments.filter((t) => t.gameId === g.id && phaseOf(t) === 'registration_open').length
        const a = AVAILABILITY[g.availability]
        return (
          <li key={g.id} data-reveal style={{ '--i': i } as React.CSSProperties}>
            <ZLink
              surface="registrations"
              to={`/games/${g.id}`}
              className="group grid grid-cols-[2rem_1fr_auto] items-center gap-x-6 gap-y-2 py-6 transition-colors hover:bg-ink-1 md:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1.2fr)_9rem_8.5rem] md:px-4"
            >
              <span className="t-label">{String(i + 1).padStart(2, '0')}</span>
              <span className="t-display text-[clamp(1rem,2.2vw,1.45rem)] transition-colors group-hover:text-[var(--accent)]">{g.name}</span>
              <span className={`${a.chip} justify-self-end md:hidden`}>{a.label}</span>
              <span className="col-span-3 col-start-2 font-mono text-[12.5px] text-fg-3 md:col-span-1 md:col-start-auto">
                {fmts.map((f) => f.label).join(' · ') || '—'}
              </span>
              <span className="hidden font-mono text-[12.5px] text-fg-2 md:block">{open ? `${open} open now` : 'No open events'}</span>
              <span className={`${a.chip} hidden justify-self-end md:inline-flex`}>{a.label}</span>
            </ZLink>
          </li>
        )
      })}
    </ul>
  )
}

/** The portfolio as key-art cards: game, genre, formats, availability and open events. */
export async function GameShowcase() {
  const [games, formats, tournaments] = await Promise.all([getGames(), getFormats(), listPublicTournaments()])
  const list = games.length
    ? games
    : FALLBACK.map((name, i) => ({ id: ['pubg-mobile', 'free-fire', 'valorant', 'honor-of-kings', 'tekken-8', 'ea-fc-26'][i], name, availability: null, logoFileId: null }))
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
      {list.map((g, i) => {
        const art = gameArt(g.id)
        const fmts = formats.filter((f) => f.gameId === g.id && f.enabled && f.code !== 'lft')
        const open = tournaments.filter((t) => t.gameId === g.id && phaseOf(t) === 'registration_open').length
        const a = g.availability ? AVAILABILITY[g.availability] : null
        return (
          <ZLink
            key={g.id}
            surface="registrations"
            to={`/games/${g.id}`}
            data-reveal
            style={{ '--i': i % 3, '--g': art.accent } as React.CSSProperties}
            className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl border border-line-2 p-4 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-[color:var(--g)] sm:aspect-[16/11] md:p-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- generated key art, already optimised */}
            <img src={art.thumb} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06070a] via-[#06070a]/55 to-[#06070a]/5" />
            <div className="absolute left-4 top-4 md:left-5 md:top-5">
              <GameWordmark gameId={g.id} name={g.name} logoUrl={mediaUrl(g.logoFileId)} height={36} className="!max-w-[58%] [&_img]:max-w-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" />
            </div>
            {a && <span className={`${a.chip} absolute right-3 top-4 bg-black/50 backdrop-blur md:right-5 md:top-5`}>{a.label}</span>}
            <p className="font-mono text-[12px] uppercase tracking-[0.14em]" style={{ color: art.accent }}>{art.genre}</p>
            <p className="t-title mt-1 text-[clamp(1.05rem,2vw,1.5rem)] text-white">{g.name}</p>
            <p className="mt-1 text-[13px] text-fg-2">
              {fmts.map((f) => f.label).join(' · ') || 'Formats announced soon'}
              {open ? <span className="text-[var(--color-ok)]"> · {open} open now</span> : null}
            </p>
          </ZLink>
        )
      })}
    </div>
  )
}
