import { logoutAction } from '@/app/actions/console'

export function SignOutButton({ surface }: { surface: string }) {
  return (
    <form action={logoutAction}>
      <input type="hidden" name="surface" value={surface} />
      <button type="submit" className="btn btn-sm btn-ghost">
        Sign out
      </button>
    </form>
  )
}
