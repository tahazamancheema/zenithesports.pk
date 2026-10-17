'use client'

import { useActionState } from 'react'
import { leaveWaitlistAction, waitlistAction } from '@/app/actions/public'
import { IDLE } from '@/lib/action-state'
import { Field, FormAlert, FormGuard, SubmitButton, SuccessPanel } from '../form'

export function WaitlistForm({ token, consentText }: { token: string; consentText: string }) {
  const [state, action] = useActionState(waitlistAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="You’re on the launch list">
        <p>We’ll email you when ZenithPoints is available. Every email includes a link to remove yourself — your address is deleted, not just hidden.</p>
      </SuccessPanel>
    )
  }
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="relative grid gap-6" noValidate>
      <FormGuard token={token} />
      <FormAlert state={state} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Email" name="email" required error={e.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" defaultValue={v.email} />}
        </Field>
        <Field label="Name" name="name" error={e.name}>
          {(p) => <input {...p} className="input" autoComplete="name" defaultValue={v.name} maxLength={80} />}
        </Field>
        <Field label="Platform" name="platform" required error={e.platform}>
          {(p) => (
            <select {...p} className="input" defaultValue={v.platform ?? ''}>
              <option value="" disabled>
                Choose
              </option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="both">Both</option>
            </select>
          )}
        </Field>
        <Field label="You are…" name="audience" error={e.audience}>
          {(p) => (
            <select {...p} className="input" defaultValue={v.audience ?? ''}>
              <option value="">Prefer not to say</option>
              <option value="organizer">A tournament organiser</option>
              <option value="team">A team</option>
              <option value="player">A player</option>
              <option value="other">Other</option>
            </select>
          )}
        </Field>
      </div>
      <div>
        <label className="choice">
          <input type="checkbox" name="consent" required aria-invalid={e.consent ? true : undefined} />
          <span className="text-sm text-fg-2">{consentText}</span>
        </label>
        {e.consent && (
          <p className="field-error" role="alert">
            {e.consent}
          </p>
        )}
      </div>
      <div>
        <SubmitButton>Notify me at launch →</SubmitButton>
      </div>
    </form>
  )
}

export function LeaveForm({ token }: { token: string }) {
  const [state, action] = useActionState(leaveWaitlistAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="You’ve been removed">
        <p>Your email address has been deleted from the ZenithPoints launch list.</p>
      </SuccessPanel>
    )
  }
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="t" value={token} />
      <FormAlert state={state} />
      <p className="text-fg-2">Remove your email address from the ZenithPoints launch list? This deletes it permanently.</p>
      <div>
        <SubmitButton pendingLabel="Removing…">Remove me</SubmitButton>
      </div>
    </form>
  )
}
