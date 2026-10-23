import { redirect } from 'next/navigation'
import type { ConsoleSurface } from '@/lib/permissions'
import { can, SURFACE_GATE } from '@/lib/permissions'
import { getStaff, requirePage } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { liveStream, type Topic } from '@/server/realtime'
import { AuthPage } from './auth-page'
import { signOutAction } from '@/app/actions/auth'
import { getAccount, supabaseConfigured } from '@/server/auth/account'
import { staffPasswordLogin } from '@/server/auth/session'
import { GoogleButton } from '../auth/sign-in'
import { ConsoleEnterForm, LoginForm, PasswordForm } from './auth-forms'
import { ConsoleShell, type ConsoleNav } from './shell'

export async function ConsoleLogin({ surface, denied, signedOut }: { surface: ConsoleSurface; denied?: boolean; signedOut?: boolean }) {
  const staff = await getStaff(surface)
  const base = await consoleBase(surface)
  if (staff && can(staff.roles, SURFACE_GATE[surface]) && !denied) redirect(base)
  const sso = supabaseConfigured()
  const account = sso ? await getAccount() : null
  const here = `${base}/login`
  return (
    <AuthPage
      surface={surface}
      title="Sign in"
      note={denied ? <span className="text-warn">Your account does not have access to this console.</span> : 'Each console has its own session: entering this one grants nothing in the others.'}
    >
      <div className="grid gap-6">
        {sso &&
          (account ? (
            <div className="grid gap-4">
              <p className="text-sm text-fg-2">
                Signed in as <span className="text-fg">{account.email}</span>
              </p>
              <ConsoleEnterForm surface={surface} label="Enter this console" auto={!denied && !signedOut} />
              <form action={signOutAction}>
                <button type="submit" className="btn btn-sm btn-ghost w-full">
                  Use a different account
                </button>
              </form>
            </div>
          ) : (
            <div className="grid gap-3">
              <GoogleButton next={here} label="Sign in with Google" />
              <a href={`/login?next=${encodeURIComponent(here)}`} className="btn btn-ghost w-full">
                Sign in with email
              </a>
            </div>
          ))}
        {staffPasswordLogin() && (
          <div className={sso ? 'border-t border-line pt-6' : ''}>
            {sso && <p className="t-label mb-4">Password sign-in (local)</p>}
            <LoginForm surface={surface} />
          </div>
        )}
      </div>
    </AuthPage>
  )
}

export async function ConsolePassword({ surface }: { surface: ConsoleSurface }) {
  const base = await consoleBase(surface)
  const staff = await requirePage(surface, { base, allowPasswordChange: true })
  return (
    <AuthPage surface={surface} title="Change your password" note={staff.mustChangePassword ? 'Your password was set by an administrator. Choose your own before continuing.' : undefined}>
      <PasswordForm surface={surface} />
    </AuthPage>
  )
}

export async function ConsoleFrame({ surface, nav, children }: { surface: ConsoleSurface; nav: ConsoleNav; children: React.ReactNode }) {
  const base = await consoleBase(surface)
  const staff = await requirePage(surface, { base })
  return (
    <ConsoleShell staff={staff} nav={nav} base={base}>
      {children}
    </ConsoleShell>
  )
}

/** SSE endpoint: authorised per console, same-origin only (EventSource sends cookies, not CORS). */
export function liveHandler(surface: ConsoleSurface, topic: Topic) {
  return async function GET(req: Request) {
    const staff = await getStaff(surface)
    if (!staff || staff.mustChangePassword || !can(staff.roles, SURFACE_GATE[surface])) return new Response('Unauthorized', { status: 401 })
    return liveStream(topic, req.headers.get('last-event-id'), req.signal)
  }
}
