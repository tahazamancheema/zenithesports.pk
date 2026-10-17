import { phaseOf } from '@/lib/tournament'
import { getFormats, getGames, listPublicTournaments, type Game } from '@/server/services/catalog'
import { ZLink } from './link'

export const AVAILABILITY: Record<Game['availability'], { label: string; chip: string }> = {
  active: { label: 'Division open', chip: 'chip chip-ok' },
  upcoming: { label: 'Coming soon', chip: 'chip chip-info' },
  planned: { label: 'Planned', chip: 'chip' },
  paused: { label: 'Paused', chip: 'chip chip-warn' },
}

const FALLBACK = ['PUBG Mobile', 'Free Fire', 'VALORANT', 'Honor of Kings', 'TEKKEN 8', 'EA SPORTS FC 26']

/** The six-game portfolio with live availability, formats and open events — all from the database. */
export async function PortfolioTable() {
  const [games, formats, tournaments] = await Promise.all([getGames(), getFormats(), listPublicTournaments()])
  if (!games.length) {
    return (
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {FALLBACK.map((name, i) => (
          <li key={name} className="flex items-center gap-6 py-5">
            <span className="t-label w-8">{String(i + 1).padStart(2, '0')}</span>
            <span className="t-display text-lg">{name}</span>
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
