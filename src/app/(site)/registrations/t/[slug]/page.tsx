import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Countdown } from '@/components/countdown'
import { ZLink } from '@/components/link'
import { PhaseChip } from '@/components/tournament-list'
import { formatInZone, phaseOf, tzAbbrev } from '@/lib/tournament'
import { getGame, getPublicTournament } from '@/server/services/catalog'

export async function generateMetadata(props: PageProps<'/registrations/t/[slug]'>): Promise<Metadata> {
  const t = await getPublicTournament((await props.params).slug)
  return t ? { title: t.name, description: t.summary || `${t.gameName} ${t.formatLabel} tournament by Zenith Esports.` } : { title: 'Tournament not found' }
}

export default async function TournamentPage(props: PageProps<'/registrations/t/[slug]'>) {
  const t = await getPublicTournament((await props.params).slug)
  if (!t) notFound()
  const game = await getGame(t.gameId)
  const phase = phaseOf(t)
  const tz = tzAbbrev(t.timezone)
  const full = t.capacity !== null && t.activeCount >= t.capacity
  const fill = t.capacity ? Math.min(1, t.activeCount / t.capacity) : null
  const closes = t.registrationClosesAt ?? t.startsAt

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="grid-field absolute inset-0 -z-10 opacity-40" />
        <div className="shell py-14 md:py-20">
          <ZLink to="/" className="t-label hover:text-fg" transitionTypes={['nav-back']}>
            ← All tournaments
          </ZLink>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PhaseChip phase={phase} />
            <span className="chip">{t.gameName}</span>
            <span className="chip">{t.formatLabel}</span>
          </div>
          <h1 className="t-display mt-6 max-w-4xl text-[clamp(1.6rem,4vw,3rem)]" style={{ animation: 'rise 800ms var(--ease-out-expo) both' }}>
            {t.name}
          </h1>
          {t.summary && <p className="t-lede mt-5 max-w-2xl">{t.summary}</p>}
          {phase === 'cancelled' && t.cancelReason && (
            <p className="mt-6 max-w-2xl rounded-sm border border-bad/40 px-4 py-3 text-sm text-fg">This tournament was cancelled: {t.cancelReason}</p>
          )}
        </div>
      </section>

      <div className="shell grid gap-12 py-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
            <Fact k="Starts" v={`${formatInZone(t.startsAt, t.timezone)} ${t.startsAt ? tz : ''}`} />
            <Fact k="Ends" v={t.endsAt ? `${formatInZone(t.endsAt, t.timezone)} ${tz}` : 'To be announced'} />
            <Fact k="Registration opens" v={t.registrationOpensAt ? `${formatInZone(t.registrationOpensAt, t.timezone)} ${tz}` : 'On publication'} />
            <Fact k="Registration closes" v={closes ? `${formatInZone(closes, t.timezone)} ${tz}` : 'To be announced'} />
            <Fact k="Roster" v={t.rosterMin === t.rosterMax ? `${t.rosterMin} player${t.rosterMin > 1 ? 's' : ''}` : `${t.rosterMin}–${t.rosterMax} players`} />
            <Fact k="Substitutes" v={t.substitutesMax ? `Up to ${t.substitutesMax}${t.substitutesRequired ? ` (${t.substitutesRequired} required)` : ''}` : 'None'} />
            <Fact k="Each player needs" v={`In-game name · ${game?.uidLabel ?? 'Game ID'}`} />
            <Fact k="Entry fee" v={t.entryFeePkr ? `PKR ${t.entryFeePkr.toLocaleString('en-PK')}` : 'Free'} />
          </dl>

          {t.description && <Block title="About this tournament">{t.description}</Block>}
          {t.prizeInfo && <Block title="Prizes">{t.prizeInfo}</Block>}
          {t.eligibility && <Block title="Eligibility">{t.eligibility}</Block>}
          {t.rules && <Block title="Rules">{t.rules}</Block>}
          {t.feeNotes && <Block title="Fees">{t.feeNotes}</Block>}
          {t.resultsNotes && <Block title="Results">{t.resultsNotes}</Block>}
          <p className="mt-10 text-sm text-fg-3">
            General policies in the{' '}
            <ZLink surface="hq" to="/rules" className="underline underline-offset-4 hover:text-fg">
              Zenith tournament rules
            </ZLink>{' '}
            apply to every event.
          </p>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="panel-raised p-6 lg:sticky lg:top-24">
            {fill !== null && (
              <div className="mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="t-label">Entries</span>
                  <span className="font-mono text-sm">
                    {t.activeCount} / {t.capacity}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden bg-line-2">
                  <div className="h-full bg-[var(--accent)]" style={{ width: `${fill * 100}%`, transition: 'width 1s var(--ease-out-expo)' }} />
                </div>
              </div>
            )}
            {phase === 'registration_open' && closes && <Countdown to={new Date(closes).toISOString()} label="Registration closes in" />}
            {phase === 'announced' && t.registrationOpensAt && <Countdown to={new Date(t.registrationOpensAt).toISOString()} label="Registration opens in" />}

            <div className="mt-6">
              {phase === 'registration_open' ? (
                full && !t.waitlistEnabled ? (
                  <p className="text-fg-2">This tournament is full.</p>
                ) : (
                  <>
                    <ZLink to={`/t/${t.slug}/register`} className="btn btn-primary w-full" transitionTypes={['nav-forward']}>
                      {full ? 'Join the waitlist' : t.formatCode === 'solo' ? 'Register' : 'Register your team'} <span className="arrow">→</span>
                    </ZLink>
                    <p className="mt-3 text-center text-xs text-fg-3">{t.requiresApproval ? 'Entries are reviewed before approval.' : 'Entries are confirmed automatically.'}</p>
                  </>
                )
              ) : (
                <p className="text-fg-2">
                  {phase === 'announced' && 'Registration has not opened yet.'}
                  {phase === 'registration_closed' && 'Registration is closed.'}
                  {phase === 'live' && 'This tournament is under way.'}
                  {phase === 'completed' && 'This tournament has finished.'}
                  {phase === 'cancelled' && 'This tournament was cancelled.'}
                </p>
              )}
            </div>
            {t.broadcastUrl && (
              <a href={t.broadcastUrl} rel="noopener noreferrer" target="_blank" className="btn btn-ghost mt-4 w-full">
                Watch the broadcast ↗
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-ink-1 px-5 py-4">
      <dt className="t-label">{k}</dt>
      <dd className="mt-1.5">{v}</dd>
    </div>
  )
}

function Block({ title, children }: { title: string; children: string }) {
  return (
    <section className="mt-12" data-reveal>
      <h2 className="t-label mb-4 flex items-center gap-3">
        <span className="node" />
        {title}
      </h2>
      <div className="whitespace-pre-line-safe max-w-[68ch] text-fg-2">{children}</div>
    </section>
  )
}
