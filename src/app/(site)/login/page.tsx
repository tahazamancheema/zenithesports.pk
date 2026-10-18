import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { IDLE_NOTICE_COOKIE } from '@/lib/idle'
import { signOutAction } from '@/app/actions/auth'
import { ProductIcon } from '@/components/brand/product-logos'
import { EmailAuth, GoogleButton, LocalSignIn } from '@/components/auth/sign-in'
import { ZLink } from '@/components/link'
import { getAccount, localAuthEnabled, safeNext, supabaseConfigured } from '@/server/auth/account'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } }

const ERRORS: Record<string, string> = {
  expired: 'That sign-in link has expired or was already used. Try again.',
  denied: 'Sign-in was cancelled.',
  oauth: 'Google sign-in could not start. Try again in a moment.',
  missing: 'That sign-in link is incomplete. Try again.',
  unavailable: 'Sign-in is not configured on this site yet.',
}

/* eslint-disable @next/next/no-img-element -- static, pre-optimised render */

export default async function LoginPage(props: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await props.searchParams
  const next = safeNext(rawNext)
  const account = await getAccount()
  const timedOut = (await cookies()).has(IDLE_NOTICE_COOKIE)

  return (
    <section className="relative isolate overflow-hidden">
      <img src="/visuals/arena.webp" alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_30%,rgba(6,7,10,0.4),#06070a_70%)]" />
      <div className="shell grid min-h-[calc(100svh-4rem)] place-items-center py-16">
        <div className="w-full max-w-[420px] rounded-2xl border border-line-2 bg-ink-1/85 p-7 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-9">
          <div className="flex items-center gap-3">
            <ProductIcon product="zenith" size={44} />
            <div>
              <p className="font-display text-[15px] tracking-[0.16em]">ZENITH</p>
              <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-fg-3">Player account</p>
            </div>
          </div>

          {account ? (
            <div className="mt-8">
              <h1 className="t-title text-2xl">You’re signed in</h1>
              <p className="mt-2 text-fg-2">
                as <span className="text-fg">{account.email}</span>
              </p>
              <a href={next} className="btn btn-primary mt-6 w-full">
                Continue <span className="arrow">→</span>
              </a>
              <form action={signOutAction} className="mt-3">
                <button type="submit" className="btn btn-ghost w-full">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-8">
              <h1 className="t-title text-2xl">Sign in to Zenith</h1>
              <p className="mt-2 text-[15px] text-fg-2">One account for tournament registrations, your entries and reports — on every Zenith site.</p>
              {timedOut && !error && (
                <p role="status" className="mt-5 rounded-md border border-warn/40 px-3 py-2 text-[14px] text-warn">
                  You were signed out after 2 hours without activity. Sign in again to continue.
                </p>
              )}
              {error && ERRORS[error] && (
                <p role="alert" className="mt-5 rounded-md border border-bad/40 px-3 py-2 text-[14px] text-bad">
                  {ERRORS[error]}
                </p>
              )}

              {supabaseConfigured() ? (
                <div className="mt-7 grid gap-6">
                  <GoogleButton next={next} />
                  <div className="flex items-center gap-3 text-[13px] text-fg-3">
                    <span className="h-px flex-1 bg-line-2" /> or with email <span className="h-px flex-1 bg-line-2" />
                  </div>
                  <EmailAuth next={next} />
                </div>
              ) : localAuthEnabled() ? (
                <div className="mt-7">
                  <p className="mb-5 rounded-md border border-warn/40 px-3 py-2 text-[13.5px] text-warn">
                    Local development: Supabase is not configured, so this signs you in with a test account on this machine only.
                  </p>
                  <LocalSignIn next={next} />
                </div>
              ) : (
                <p className="mt-7 rounded-md border border-line-2 px-4 py-3 text-[15px] text-fg-2">Sign-in is being set up. Please check back soon.</p>
              )}

              <p className="mt-8 text-[13px] text-fg-3">
                By continuing you agree to the{' '}
                <ZLink surface="hq" to="/legal/terms" className="underline underline-offset-4 hover:text-fg">
                  terms
                </ZLink>{' '}
                and{' '}
                <ZLink surface="hq" to="/legal/privacy" className="underline underline-offset-4 hover:text-fg">
                  privacy policy
                </ZLink>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
