import { adminPage } from '@/components/console/entry-points'
import { staffAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { RolePicker } from '@/components/console/role-picker'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { ROLE_LABEL } from '@/lib/permissions'
import { staffPasswordLogin } from '@/server/auth/session'
import { getGames } from '@/server/services/catalog'
import { listStaff } from '@/server/services/staff'

export const metadata = { title: 'Staff & roles' }

export default async function StaffPage() {
  const me = await adminPage('staff.manage')
  const [staff, games] = await Promise.all([listStaff(), getGames()])
  const allGames = games.map((g) => ({ id: g.id, name: g.name }))
  const gameName = (id: string) => allGames.find((g) => g.id === id)?.name ?? id
  const passwords = staffPasswordLogin()
  return (
    <>
      <ConsoleTitle title="Staff & roles" sub="Give each person only the roles their work needs. Changing someone’s roles signs them out so the change takes effect at once." />
      <div className="grid gap-8 xl:grid-cols-[1fr_24rem]">
        <ul className="grid content-start gap-3">
          {staff.map((u) => (
            <li key={u.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{u.displayName}</span>
                    <StatusChip value={u.status} />
                    {u.id === me.id && <span className="chip">you</span>}
                  </div>
                  <p className="truncate font-mono text-sm text-fg-2">{u.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {u.roles.map((r) => (
                      <span key={r} className="chip chip-accent">
                        {ROLE_LABEL[r]}
                      </span>
                    ))}
                    {u.games.map((g) => (
                      <span key={g} className="chip">
                        {gameName(g)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 font-mono text-[12px] text-fg-3">last sign-in {fmt(u.lastLoginAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.id !== me.id && (
                    <ActionForm action={staffAction} inline submit={u.status === 'active' ? 'Disable' : 'Enable'} submitClass="btn btn-sm btn-ghost" confirm={u.status === 'active' ? 'Disable this account?' : undefined}>
                      <input type="hidden" name="op" value={u.status === 'active' ? 'disable' : 'enable'} />
                      <input type="hidden" name="id" value={u.id} />
                    </ActionForm>
                  )}
                  {passwords ? (
                    <ActionForm action={staffAction} inline submit="Reset password" submitClass="btn btn-sm btn-ghost" confirm="Issue a new one-time password and sign this person out?">
                      <input type="hidden" name="op" value="reset" />
                      <input type="hidden" name="id" value={u.id} />
                    </ActionForm>
                  ) : (
                    <ActionForm action={staffAction} inline submit="Sign out everywhere" submitClass="btn btn-sm btn-ghost" confirm="End this person's admin sessions?">
                      <input type="hidden" name="op" value="revoke" />
                      <input type="hidden" name="id" value={u.id} />
                    </ActionForm>
                  )}
                </div>
              </div>
              <details className="mt-4 border-t border-line pt-3">
                <summary className="t-label cursor-pointer hover:text-fg">Change roles</summary>
                <ActionForm action={staffAction} className="mt-4" submit="Save roles" submitClass="btn btn-sm btn-primary justify-self-start">
                  <input type="hidden" name="op" value="roles" />
                  <input type="hidden" name="id" value={u.id} />
                  <RolePicker roles={u.roles} games={u.games} allGames={allGames} />
                </ActionForm>
              </details>
            </li>
          ))}
        </ul>
        <div className="panel content-start p-5">
          <p className="t-label mb-4">Add a staff member</p>
          <ActionForm action={staffAction} submit="Create account">
            <input type="hidden" name="op" value="create" />
            <input name="displayName" className="input" placeholder="Display name" aria-label="Display name" required />
            <input name="email" type="email" className="input" placeholder="Email" aria-label="Email" required />
            <RolePicker allGames={allGames} />
          </ActionForm>
          <p className="mt-4 text-xs text-fg-3">
            {passwords
              ? 'A one-time password is shown once. Share it privately; it must be changed at first sign-in.'
              : 'They sign in at the admin panel with Google or email using exactly this address. The account links itself on first sign-in.'}
          </p>
        </div>
      </div>
    </>
  )
}
