'use client'

import { useActionState } from 'react'
import { contactAction } from '@/app/actions/public'
import { IDLE } from '@/lib/action-state'
import { Field, FormAlert, FormGuard, SubmitButton, SuccessPanel } from './form'

export function ContactForm({ token }: { token: string }) {
  const [state, action] = useActionState(contactAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="Message received" reference={state.data?.reference}>
        <p>We’ll reply to the email address you gave us.</p>
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
        <Field label="Name" name="name" required error={e.name}>
          {(p) => <input {...p} className="input" autoComplete="name" maxLength={80} defaultValue={v.name} />}
        </Field>
        <Field label="Email" name="email" required error={e.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" defaultValue={v.email} />}
        </Field>
      </div>
      <Field label="Topic" name="topic" required error={e.topic}>
        {(p) => (
          <select {...p} className="input" defaultValue={v.topic ?? ''}>
            <option value="" disabled>
              Choose a topic
            </option>
            <option value="general">General</option>
            <option value="tournaments">Tournaments & registrations</option>
            <option value="partnership">Partnerships & sponsorship</option>
            <option value="media">Media & press</option>
            <option value="anticheat">AntiCheat & appeals</option>
            <option value="privacy">Privacy & data requests</option>
          </select>
        )}
      </Field>
      <Field label="Message" name="message" required error={e.message}>
        {(p) => <textarea {...p} className="input" rows={6} maxLength={4000} defaultValue={v.message} />}
      </Field>
      <div>
        <SubmitButton>Send message →</SubmitButton>
      </div>
    </form>
  )
}
