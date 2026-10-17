'use client'

import { useActionState } from 'react'
import { changePasswordAction, loginAction } from '@/app/actions/console'
import { IDLE } from '@/lib/action-state'
import { FormAlert, SubmitButton } from '../form'

export function LoginForm({ surface }: { surface: string }) {
  const [state, action] = useActionState(loginAction, IDLE)
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="surface" value={surface} />
      <FormAlert state={state} />
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" defaultValue={state.values?.email} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  )
}

export function PasswordForm({ surface }: { surface: string }) {
  const [state, action] = useActionState(changePasswordAction, IDLE)
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="surface" value={surface} />
      <FormAlert state={state} />
      <div>
        <label htmlFor="current" className="field-label">
          Current password
        </label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
      </div>
      <div>
        <label htmlFor="next" className="field-label">
          New password
        </label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={12} required className="input" />
        <p className="field-help">At least 12 characters. A passphrase works well.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">
          Repeat new password
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" />
      </div>
      <SubmitButton pendingLabel="Saving…">Change password</SubmitButton>
    </form>
  )
}
