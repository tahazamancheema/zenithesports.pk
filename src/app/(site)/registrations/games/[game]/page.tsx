import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ZLink } from '@/components/link'
import { PageIntro } from '@/components/page-intro'
import { AVAILABILITY } from '@/components/portfolio'
import { EmptySignal, TournamentRows } from '@/components/tournament-list'
import { getFormats, getGame, listPublicTournaments } from '@/server/services/catalog'

export async function generateMetadata(props: PageProps<'/registrations/games/[game]'>): Promise<Metadata> {
  const g = await getGame((await props.params).game)
  return { title: g ? `${g.name} tournaments` : 'Game not found' }
}

export default async function GamePage(props: PageProps<'/registrations/games/[game]'>) {
  const g = await getGame((await props.params).game)
  if (!g) notFound()
  const [formats, tournaments] = await Promise.all([getFormats(), listPublicTournaments(g.id)])
  const fmts = formats.filter((f) => f.gameId === g.id && f.enabled)
  const a = AVAILABILITY[g.availability]
  return (
    <>
      <PageIntro eyebrow={`Game · ${g.shortName}`} title={g.name} lede={g.description}>
        <span className={a.chip}>{a.label}</span>
        {fmts.map((f) => (
          <span key={f.id} className="chip">
            {f.label}
          </span>
        ))}
      </PageIntro>
      <section className="py-16">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="t-label mb-5">Tournaments</h2>
            {tournaments.length ? (
              <TournamentRows items={tournaments} />
            ) : (
              <EmptySignal
                title="No tournaments yet"
                body={g.availability === 'active' ? 'Nothing is scheduled right now. Check back soon.' : `${g.name} competitions have not started yet. Follow our channels for the announcement.`}
              />
            )}
          </div>
          <aside className="lg:col-span-4">
            <div className="panel p-6">
              <p className="t-label">Player ID</p>
              <p className="mt-2 font-medium">{g.uidLabel}</p>
              <p className="mt-2 text-sm text-fg-2">{g.uidHint}</p>
              <p className="t-label mt-6">Formats</p>
              <ul className="mt-2 space-y-1.5 text-sm text-fg-2">
                {fmts.map((f) => (
                  <li key={f.id}>
                    {f.label}
                    {f.code !== 'lft' && <span className="text-fg-3"> · {f.minPlayers === f.maxPlayers ? f.minPlayers : `${f.minPlayers}–${f.maxPlayers}`} players{f.maxSubstitutes ? ` + up to ${f.maxSubstitutes} subs` : ''}</span>}
                  </li>
                ))}
              </ul>
              {fmts.some((f) => f.code === 'lft') && (
                <ZLink to={`/lft?game=${g.id}`} className="btn btn-ghost mt-6 w-full">
                  Looking for team <span className="arrow">→</span>
                </ZLink>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
