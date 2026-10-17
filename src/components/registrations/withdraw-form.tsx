'use client'

import { useActionState } from 'react'
import { withdrawAction } from '@/app/actions/public'
import { IDLE } from '@/lib/action-state'
import { FormAlert, SubmitButton } from '../form'

export function WithdrawForm({ token }: { token: string }) {
  const [state, action] = useActionState(withdrawAction, IDLE)
  if (state.status === 'success') {
    return <p className="rounded-sm border border-line-2 px-4 py-3 text-fg-2" role="status">Your entry has been withdrawn. Reload the page to see the updated status.</p>
  }
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <p className="t-label">Withdraw</p>
      <p className="text-sm text-fg-2">Withdrawing frees your players to enter elsewhere in this tournament. It cannot be undone from this page.</p>
      <FormAlert state={state} />
      <label className="choice max-w-md">
        <input type="checkbox" name="confirm" value="yes" />
        <span className="text-sm">I want to withdraw this entry.</span>
      </label>
      <div>
        <SubmitButton className="btn btn-danger" pendingLabel="Withdrawing…">
          Withdraw entry
        </SubmitButton>
      </div>
    </form>
  )
}
