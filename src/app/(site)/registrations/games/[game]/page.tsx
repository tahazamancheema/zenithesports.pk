import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { ZLink } from '@/components/link'
import { PageIntro } from '@/components/page-intro'
import { AVAILABILITY } from '@/components/portfolio'
import { GameMark } from '@/components/game-mark'
import { TournamentGrid } from '@/components/tournament-cards'
import { EmptySignal } from '@/components/tournament-list'
import { artCrop, gameArt } from '@/config/game-art'
import { href } from '@/server/link'
import { getFormats, getGame, getGames, getSponsors, listPublicTournaments, mediaUrl } from '@/server/services/catalog'

export async function generateMetadata(props: PageProps<'/registrations/games/[game]'>): Promise<Metadata> {
  const g = await getGame((await props.params).game)
  return { title: g ? `${g.name} tournaments` : 'Game not found' }
}

/** Old game links that moved. */
const MOVED: Record<string, string> = { 'ea-fc-26': 'ea-fc' }

export default async function GamePage(props: PageProps<'/registrations/games/[game]'>) {
  const id = (await props.params).game
  if (MOVED[id]) permanentRedirect(await href('registrations', `/games/${MOVED[id]}`))
  const g = await getGame(id)
  if (!g) notFound()
  const [formats, tournaments, games] = await Promise.all([getFormats(), listPublicTournaments(g.id), getGames()])
  const sponsors = await getSponsors(tournaments.map((t) => t.id))
  const fmts = formats.filter((f) => f.gameId === g.id && f.enabled)
  const a = AVAILABILITY[g.availability]
  return (
    <>
      <PageIntro
        eyebrow={`${gameArt(g.id).genre} · ${g.shortName}`}
        title={g.name}
        lede={g.description}
        image={mediaUrl(g.coverFileId) ?? gameArt(g.id).art}
        imageStyle={artCrop(g.id, mediaUrl(g.coverFileId) ?? gameArt(g.id).art, true)}
        top={<GameMark gameId={g.id} name={g.name} logoUrl={mediaUrl(g.logoFileId)} size={72} />}
      >
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
            <h2 className="t-title mb-6 text-xl">Tournaments</h2>
            {tournaments.length ? (
              <div className="[&>div]:xl:grid-cols-2">
                <TournamentGrid items={tournaments} games={games} sponsors={sponsors} />
              </div>
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
