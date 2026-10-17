import { staffAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { can, ROLE_LABEL, ROLES } from '@/lib/permissions'
import { getStaff } from '@/server/auth/session'
import { listStaff } from '@/server/services/staff'

export const metadata = { title: 'Staff & roles' }

export default async function StaffPage() {
  const me = await getStaff('hq')
  if (!me || !can(me.roles, 'staff.manage')) {
    return (
      <>
        <ConsoleTitle title="Staff & roles" />
        <p className="text-fg-2">Only super administrators can manage staff accounts.</p>
      </>
    )
  }
  const staff = await listStaff()
  return (
    <>
      <ConsoleTitle title="Staff & roles" sub="Least privilege: give each person only the roles their work needs. Role changes sign the person out everywhere." />
      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <ul className="grid content-start gap-3">
          {staff.map((u) => (
            <li key={u.id} className="panel grid gap-4 p-5 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{u.displayName}</span>
                  <StatusChip value={u.status} />
                  {u.id === me.id && <span className="chip">you</span>}
                </div>
                <p className="font-mono text-sm text-fg-2">{u.email}</p>
                <p className="mt-1 font-mono text-[11px] text-fg-3">last sign-in {fmt(u.lastLoginAt)}</p>
                <ActionForm action={staffAction} className="mt-4" submit="Update roles" submitClass="btn btn-sm btn-ghost justify-self-start">
                  <input type="hidden" name="op" value="roles" />
                  <input type="hidden" name="id" value={u.id} />
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <label key={r} className="choice !py-2 text-sm">
                        <input type="checkbox" name="roles" value={r} defaultChecked={u.roles.includes(r)} />
                        {ROLE_LABEL[r]}
                      </label>
                    ))}
                  </div>
                </ActionForm>
              </div>
              <div className="flex flex-col gap-2">
                {u.id !== me.id && (
                  <ActionForm action={staffAction} inline submit={u.status === 'active' ? 'Disable' : 'Enable'} submitClass="btn btn-sm btn-ghost" confirm={u.status === 'active' ? 'Disable this account?' : undefined}>
                    <input type="hidden" name="op" value={u.status === 'active' ? 'disable' : 'enable'} />
                    <input type="hidden" name="id" value={u.id} />
                  </ActionForm>
                )}
                <ActionForm action={staffAction} inline submit="Reset password" submitClass="btn btn-sm btn-ghost" confirm="Issue a new one-time password and sign this person out?">
                  <input type="hidden" name="op" value="reset" />
                  <input type="hidden" name="id" value={u.id} />
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
        <div className="panel content-start p-5">
          <p className="t-label mb-4">New staff account</p>
          <ActionForm action={staffAction} submit="Create account">
            <input type="hidden" name="op" value="create" />
            <input name="displayName" className="input" placeholder="Display name" aria-label="Display name" required />
            <input name="email" type="email" className="input" placeholder="Email" aria-label="Email" required />
            <div className="grid gap-2">
              {ROLES.map((r) => (
                <label key={r} className="choice !py-2 text-sm">
                  <input type="checkbox" name="roles" value={r} />
                  {ROLE_LABEL[r]}
                </label>
              ))}
            </div>
          </ActionForm>
          <p className="mt-4 text-xs text-fg-3">A one-time password is shown once. Share it privately; it must be changed at first sign-in.</p>
        </div>
      </div>
    </>
  )
}
