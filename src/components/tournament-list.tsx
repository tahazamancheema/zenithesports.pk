import { phaseOf, PHASE_LABEL, formatInZone, tzAbbrev, type Phase } from '@/lib/tournament'
import type { PublicTournament } from '@/server/services/catalog'
import { ZLink } from './link'

const PHASE_CHIP: Record<Phase, string> = {
  draft: 'chip',
  cancelled: 'chip chip-bad',
  archived: 'chip',
  announced: 'chip chip-info',
  registration_open: 'chip chip-ok',
  registration_closed: 'chip chip-warn',
  live: 'chip chip-accent',
  completed: 'chip',
}

export function PhaseChip({ phase }: { phase: Phase }) {
  return (
    <span className={PHASE_CHIP[phase]}>
      {phase === 'live' && <span className="live-dot !bg-[var(--accent)]" />}
      {PHASE_LABEL[phase]}
    </span>
  )
}

/** Editorial list rows — tournaments are information, not decoration. */
export function TournamentRows({ items, games }: { items: PublicTournament[]; games?: Record<string, string> }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((t, i) => {
        const phase = phaseOf(t)
        const spots = t.capacity ? Math.max(0, t.capacity - t.activeCount) : null
        return (
          <li key={t.id} data-reveal style={{ '--i': i } as React.CSSProperties}>
            <ZLink
              surface="registrations"
              to={`/t/${t.slug}`}
              className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 py-6 transition-colors hover:bg-ink-1 md:grid-cols-[150px_1fr_220px_auto] md:px-4"
            >
              <span className="t-label order-1 col-span-2 md:order-none md:col-span-1">{games?.[t.gameId] ?? t.gameName}</span>
              <span className="order-2 md:order-none">
                <span className="block text-lg font-medium text-fg transition-colors group-hover:text-[var(--accent)]">{t.name}</span>
                <span className="mt-1 block text-sm text-fg-3">
                  {t.formatLabel}
                  {t.prizeInfo ? ` · ${t.prizeInfo.split('\n')[0].slice(0, 60)}` : ''}
                </span>
              </span>
              <span className="order-4 col-span-2 font-mono text-[13px] text-fg-2 md:order-none md:col-span-1">
                {formatInZone(t.startsAt, t.timezone, { weekday: undefined, year: undefined })} {t.startsAt ? tzAbbrev(t.timezone) : ''}
                {spots !== null && phase === 'registration_open' && <span className="mt-1 block text-fg-3">{spots > 0 ? `${spots} of ${t.capacity} places left` : 'Full · waitlist'}</span>}
              </span>
              <span className="order-3 flex items-center gap-4 justify-self-end md:order-none">
                <PhaseChip phase={phase} />
                <span aria-hidden className="hidden text-fg-3 transition-transform group-hover:translate-x-1 group-hover:text-fg md:inline">
                  →
                </span>
              </span>
            </ZLink>
          </li>
        )
      })}
    </ul>
  )
}

export function EmptySignal({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-dashed border-line-2 px-6 py-14 text-center">
      <svg viewBox="0 0 200 60" className="mx-auto h-12 w-40" aria-hidden>
        <line x1="0" y1="30" x2="200" y2="30" stroke="var(--color-line-2)" strokeDasharray="2 6" />
        <g transform="translate(100 30) rotate(45)">
          <rect x="-6" y="-6" width="12" height="12" fill="none" stroke="var(--accent)" />
        </g>
      </svg>
      <p className="t-display mt-4 text-base">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-fg-2">{body}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  )
}
