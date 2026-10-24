import { redirect } from 'next/navigation'
import type { ConsoleSurface } from '@/lib/permissions'
import { can, canAny, SURFACE_GATE, type Permission } from '@/lib/permissions'
import { navFor } from '@/config/admin-nav'
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
  const base = await consoleBase()
  if (staff && can(staff.roles, SURFACE_GATE[surface]) && !denied) redirect(base)
  const sso = supabaseConfigured()
  const account = sso ? await getAccount() : null
  const here = `${base}/login`
  return (
    <AuthPage
      surface={surface}
      title="Sign in"
      note={denied ? <span className="text-warn">Your account is not on the Zenith staff list.</span> : 'For Zenith staff. What you can see depends on your role.'}
    >
      <div className="grid gap-6">
        {sso &&
          (account ? (
            <div className="grid gap-4">
              <p className="text-sm text-fg-2">
                Signed in as <span className="text-fg">{account.email}</span>
              </p>
              <ConsoleEnterForm surface={surface} label="Open the admin panel" auto={!denied && !signedOut} />
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
  const base = await consoleBase()
  const staff = await requirePage(surface, { base, allowPasswordChange: true })
  return (
    <AuthPage surface={surface} title="Change your password" note={staff.mustChangePassword ? 'Your password was set by an administrator. Choose your own before continuing.' : undefined}>
      <PasswordForm surface={surface} />
    </AuthPage>
  )
}

/** The admin panel around every page: the sidebar shows only the sections this person's roles allow. */
export async function AdminFrame({ children }: { children: React.ReactNode }) {
  const base = await consoleBase()
  const staff = await requirePage('hq', { base })
  return (
    <ConsoleShell staff={staff} nav={navFor(staff.roles)} base={base}>
      {children}
    </ConsoleShell>
  )
}

/**
 * Every admin page starts with this: signed in, and holding at least one of the
 * permissions for the section. Anyone else is sent to the overview.
 */
export async function adminPage(...permissions: Permission[]) {
  const base = await consoleBase()
  const staff = await requirePage('hq', { base })
  if (!canAny(staff.roles, permissions)) redirect(`${base}?denied=1`)
  return staff
}

/** SSE endpoint, same-origin only (EventSource sends cookies, not CORS): only the topics this person may see. */
export async function adminLive(req: Request) {
  const staff = await getStaff()
  if (!staff || staff.mustChangePassword) return new Response('Unauthorized', { status: 401 })
  const topics: Topic[] = []
  if (canAny(staff.roles, ['registrations.review', 'tournaments.manage'])) topics.push('registrations')
  if (can(staff.roles, 'anticheat.review')) topics.push('anticheat')
  if (canAny(staff.roles, ['inbox.messages', 'inbox.production', 'inbox.waitlist'])) topics.push('hq')
  return liveStream(topics, req.headers.get('last-event-id'), req.signal)
}
