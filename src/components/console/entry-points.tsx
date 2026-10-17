import { redirect } from 'next/navigation'
import type { ConsoleSurface } from '@/lib/permissions'
import { can, SURFACE_GATE } from '@/lib/permissions'
import { getStaff, requirePage } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { liveStream, type Topic } from '@/server/realtime'
import { AuthPage } from './auth-page'
import { LoginForm, PasswordForm } from './auth-forms'
import { ConsoleShell, type ConsoleNav } from './shell'

export async function ConsoleLogin({ surface, denied }: { surface: ConsoleSurface; denied?: boolean }) {
  const staff = await getStaff(surface)
  if (staff && can(staff.roles, SURFACE_GATE[surface]) && !denied) redirect(await consoleBase(surface))
  return (
    <AuthPage
      surface={surface}
      title="Sign in"
      note={denied ? <span className="text-warn">Your account does not have access to this console.</span> : 'This sign-in applies to this console only.'}
    >
      <LoginForm surface={surface} />
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
