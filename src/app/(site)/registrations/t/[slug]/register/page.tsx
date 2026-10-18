import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ZLink } from '@/components/link'
import { RegisterFlow } from '@/components/registrations/register-flow'
import { phaseOf } from '@/lib/tournament'
import { GoogleButton } from '@/components/auth/sign-in'
import { authAvailable, getAccount, supabaseConfigured } from '@/server/auth/account'
import { issueFormToken } from '@/server/crypto'
import { href } from '@/server/link'
import { getFormSchema, getGame, getPublicTournament } from '@/server/services/catalog'

export const metadata: Metadata = { title: 'Register', robots: { index: false } }

export default async function RegisterPage(props: PageProps<'/registrations/t/[slug]/register'>) {
  const t = await getPublicTournament((await props.params).slug)
  if (!t) notFound()
  const phase = phaseOf(t)
  const [game, schema, account, here] = await Promise.all([getGame(t.gameId), getFormSchema(t.formVersionId), getAccount(), href('registrations', `/t/${t.slug}/register`)])
  const full = t.capacity !== null && t.activeCount >= t.capacity

  return (
    <section className="shell max-w-3xl py-14 md:py-20">
      <ZLink to={`/t/${t.slug}`} className="t-label hover:text-fg" transitionTypes={['nav-back']}>
        ← {t.name}
      </ZLink>
      <h1 className="t-display mt-6 text-[clamp(1.4rem,3vw,2.2rem)]">Register</h1>
      <p className="mt-3 text-fg-2">
        {t.gameName} · {t.formatLabel}
        {account && <span className="text-fg-3"> · signed in as {account.email}</span>}
      </p>
      <div className="mt-10">
        {phase !== 'registration_open' || !game || (full && !t.waitlistEnabled) ? (
          <div className="panel p-8">
            <p className="t-title text-base">Registration isn’t open</p>
            <p className="mt-3 text-fg-2">
              {phase === 'announced' ? 'Registration for this tournament has not opened yet.' : full ? 'This tournament is full.' : 'Registration for this tournament is closed.'}
            </p>
            <ZLink to={`/t/${t.slug}`} className="btn btn-ghost mt-6">
              Back to the tournament
            </ZLink>
          </div>
        ) : !account ? (
          <div className="panel-raised p-8">
            <p className="t-title text-xl">Sign in to register</p>
            <p className="mt-3 max-w-lg text-fg-2">
              Registrations are linked to your Zenith account, so you can check your status, fix your roster before the deadline and withdraw from one place.
            </p>
            {authAvailable() ? (
              <div className="mt-7 grid max-w-sm gap-3">
                {supabaseConfigured() && <GoogleButton next={here} />}
                <a href={`/login?next=${encodeURIComponent(here)}`} className="btn btn-ghost w-full">
                  {supabaseConfigured() ? 'Use email instead' : 'Sign in'} <span className="arrow">→</span>
                </a>
              </div>
            ) : (
              <p className="mt-6 text-fg-2">Sign-in is being set up. Please check back soon.</p>
            )}
          </div>
        ) : (
          <RegisterFlow
            token={issueFormToken('register')}
            schema={schema}
            game={{ uidLabel: game.uidLabel, uidHint: game.uidHint, uidPattern: game.uidPattern }}
            t={{
              slug: t.slug,
              name: t.name,
              gameName: t.gameName,
              formatCode: t.formatCode,
              formatLabel: t.formatLabel,
              rosterMin: t.rosterMin,
              rosterMax: t.rosterMax,
              substitutesMax: t.substitutesMax,
              substitutesRequired: t.substitutesRequired,
              rules: t.rules,
              eligibility: t.eligibility,
              requiresApproval: t.requiresApproval,
              entryFeePkr: t.entryFeePkr,
              feeNotes: t.feeNotes,
              full,
              waitlist: t.waitlistEnabled,
            }}
          />
        )}
      </div>
    </section>
  )
}
