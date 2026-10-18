import { gameArt } from '@/config/game-art'
import { phaseOf, formatInZone, tzAbbrev } from '@/lib/tournament'
import { mediaUrl, type Game, type PublicTournament, type Sponsor } from '@/server/services/catalog'
import { GameMark } from './game-mark'
import { ZLink } from './link'
import { PhaseChip } from './tournament-list'

/* eslint-disable @next/next/no-img-element -- posters and logos come from /media and /visuals with their own caching */

function Logo({ fileId, name, className = '' }: { fileId: string | null; name: string; className?: string }) {
  const url = mediaUrl(fileId)
  if (url) return <img src={url} alt={`${name} logo`} className={`object-contain ${className}`} loading="lazy" />
  return (
    <span className={`grid place-items-center bg-ink-3 font-sans text-[13px] font-bold uppercase text-fg-2 ${className}`} aria-hidden>
      {name.slice(0, 2)}
    </span>
  )
}

const dateLine = (t: PublicTournament) =>
  t.startsAt ? `${formatInZone(t.startsAt, t.timezone, { weekday: 'short', year: undefined })} ${tzAbbrev(t.timezone)}` : 'Date to be announced'

/** A poster-led card: which game, who runs it, who backs it, and how full it is — at a glance. */
export function TournamentCard({ t, game, sponsors = [], featured = false }: { t: PublicTournament; game?: Game; sponsors?: Sponsor[]; featured?: boolean }) {
  const art = gameArt(t.gameId)
  const phase = phaseOf(t)
  const poster = mediaUrl(t.posterFileId) ?? mediaUrl(game?.coverFileId) ?? art.art
  const pct = t.capacity ? Math.min(100, Math.round((t.activeCount / t.capacity) * 100)) : null
  const spots = t.capacity ? Math.max(0, t.capacity - t.activeCount) : null
  const prize = t.prizeInfo.split('\n')[0].trim()

  return (
    <ZLink
      surface="registrations"
      to={`/t/${t.slug}`}
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-line-2 bg-ink-1 transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-1 hover:border-[color:var(--g)] hover:shadow-[0_30px_80px_-40px_var(--g)] ${featured ? 'lg:flex-row' : ''}`}
      style={{ '--g': art.accent } as React.CSSProperties}
    >
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/9] lg:aspect-auto lg:w-[58%]' : 'aspect-[16/9]'}`}>
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading={featured ? 'eager' : 'lazy'} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/30 to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/55 py-1 pl-1 pr-3 backdrop-blur-md">
            <GameMark gameId={t.gameId} name={t.gameName} logoUrl={mediaUrl(game?.logoFileId)} size={26} />
            <span className="text-[13px] font-semibold text-white">{t.gameName}</span>
          </span>
          <span className="rounded-sm bg-black/55 backdrop-blur-md">
            <PhaseChip phase={phase} />
          </span>
        </div>
        {t.logoFileId && (
          <div className="absolute bottom-3 left-3 h-16 w-16 overflow-hidden rounded-lg border border-white/15 bg-black/50 p-1.5 backdrop-blur-md">
            <Logo fileId={t.logoFileId} name={t.name} className="h-full w-full" />
          </div>
        )}
        {featured && <span className="absolute bottom-3 right-3 chip border-[color:var(--g)] bg-black/60 text-white">Featured</span>}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: art.accent }}>
          {t.formatLabel} · {art.genre}
        </p>
        <h3 className={`t-title mt-2 text-fg transition-colors group-hover:text-white ${featured ? 'text-[clamp(1.4rem,2.4vw,2rem)]' : 'text-xl'}`}>{t.name}</h3>
        {featured && t.summary && <p className="mt-3 line-clamp-3 text-fg-2">{t.summary}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
          <div>
            <dt className="t-label">Starts</dt>
            <dd className="mt-0.5 text-fg">{dateLine(t)}</dd>
          </div>
          <div>
            <dt className="t-label">Prize</dt>
            <dd className="mt-0.5 truncate font-semibold text-[var(--color-gold-hi)]">{prize || '—'}</dd>
          </div>
        </dl>

        {pct !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-[13px] text-fg-2">
              <span>{t.activeCount} of {t.capacity} slots</span>
              <span>{phase === 'registration_open' ? (spots ? `${spots} left` : 'Waitlist') : ''}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-3">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${art.accent}, color-mix(in oklab, ${art.accent} 60%, white))` }} />
            </div>
          </div>
        )}

        <div className="flex-1" />
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4 text-[13px] text-fg-2">
          <span className="flex items-center gap-2">
            {t.organizerLogoFileId ? (
              <Logo fileId={t.organizerLogoFileId} name={t.organizerName} className="h-6 w-6 rounded" />
            ) : t.organizerName === 'Zenith Esports' ? (
              <img src="/brand/zenith-mark-160.webp" alt="" className="h-5 w-5" />
            ) : null}
            <span>
              <span className="text-fg-3">By </span>
              {t.organizerName}
            </span>
          </span>
          {sponsors.length > 0 && (
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-fg-3">Sponsored by</span>
              {sponsors.slice(0, 3).map((s) =>
                s.logoFileId ? (
                  <Logo key={s.id} fileId={s.logoFileId} name={s.name} className="h-6 w-auto max-w-[72px]" />
                ) : (
                  <span key={s.id} className="font-semibold text-fg">{s.name}</span>
                ),
              )}
            </span>
          )}
        </div>
      </div>
    </ZLink>
  )
}

export function TournamentGrid({ items, games, sponsors }: { items: PublicTournament[]; games: Game[]; sponsors: Record<string, Sponsor[]> }) {
  const byId = Object.fromEntries(games.map((g) => [g.id, g]))
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((t, i) => (
        <div key={t.id} data-reveal className="h-full" style={{ '--i': i % 3 } as React.CSSProperties}>
          <TournamentCard t={t} game={byId[t.gameId]} sponsors={sponsors[t.id]} />
        </div>
      ))}
    </div>
  )
}
