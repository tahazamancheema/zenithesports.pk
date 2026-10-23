'use client'

import { useActionState, useState } from 'react'
import { lftCreateAction, lftManageAction, lftRequestAction } from '@/app/actions/public'
import { IDLE } from '@/lib/action-state'
import { roleLabel } from '@/lib/lft'
import { Field, FormAlert, FormGuard, SubmitButton, SuccessPanel } from '../form'

export function LftCreateForm({ token, gameId, roles, uidLabel, uidHint }: { token: string; gameId: string; roles: string[]; uidLabel: string; uidHint: string }) {
  const [state, action] = useActionState(lftCreateAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="You’re listed" reference={state.data?.reference}>
        <p>Captains can now send you requests. Open your private link to see them and decide who gets your contact details.</p>
        <a href={state.data?.manage} className="mt-4 block break-all font-mono text-sm text-fg underline decoration-line-3 underline-offset-4">
          {state.data?.manage}
        </a>
      </SuccessPanel>
    )
  }
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="relative grid gap-6" noValidate>
      <FormGuard token={token} />
      <input type="hidden" name="gameId" value={gameId} />
      <FormAlert state={state} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="In-game name" name="ign" required error={e.ign}>
          {(p) => <input {...p} className="input" maxLength={40} defaultValue={v.ign} />}
        </Field>
        <Field label={uidLabel} name="uid" required error={e.uid} help={uidHint}>
          {(p) => <input {...p} className="input input-mono" defaultValue={v.uid} autoComplete="off" />}
        </Field>
      </div>
      <fieldset>
        <legend className="field-label">Roles you play <span className="ml-1 text-[var(--accent)]">*</span></legend>
        <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {roles.map((r) => (
            <label key={r} className="choice">
              <input type="checkbox" name="roles" value={r} />
              <span className="text-sm">{roleLabel(r)}</span>
            </label>
          ))}
        </div>
        {e.roles && <p className="field-error">{e.roles}</p>}
      </fieldset>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Rank" name="rank" error={e.rank}>
          {(p) => <input {...p} className="input" maxLength={40} defaultValue={v.rank} />}
        </Field>
        <Field label="City" name="city" error={e.city}>
          {(p) => <input {...p} className="input" maxLength={60} defaultValue={v.city} />}
        </Field>
        <Field label="Availability" name="availability" error={e.availability}>
          {(p) => <input {...p} className="input" maxLength={120} placeholder="e.g. weekday evenings" defaultValue={v.availability} />}
        </Field>
      </div>
      <Field label="About you" name="bio" error={e.bio}>
        {(p) => <textarea {...p} className="input" rows={3} maxLength={400} defaultValue={v.bio} />}
      </Field>
      <fieldset className="panel grid gap-6 p-5 sm:grid-cols-2">
        <legend className="t-label px-1">Private contact — never shown publicly</legend>
        <Field label="WhatsApp" name="phone" error={e.phone}>
          {(p) => <input {...p} type="tel" className="input input-mono" placeholder="03XX XXXXXXX" defaultValue={v.phone} />}
        </Field>
        <Field label="Discord" name="discord" error={e.discord}>
          {(p) => <input {...p} className="input" maxLength={40} defaultValue={v.discord} />}
        </Field>
        <p className="text-sm text-fg-3 sm:col-span-2">Shared only with a captain whose request you accept.</p>
      </fieldset>
      <label className="choice">
        <input type="checkbox" name="consent" />
        <span className="text-sm text-fg-2">List my in-game name, roles, rank, city, availability and bio publicly on the Zenith Looking for Team board. I can remove the listing at any time.</span>
      </label>
      {e.consent && <p className="field-error">{e.consent}</p>}
      <div>
        <SubmitButton>Create my listing →</SubmitButton>
      </div>
    </form>
  )
}

export function LftRequestButton({ token, profileId, ign }: { token: string; profileId: string; ign: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(lftRequestAction, IDLE)
  if (state.status === 'success') {
    return (
      <div className="text-sm text-fg-2" role="status">
        Request sent. Track it at{' '}
        <a href={state.data?.view} className="break-all text-fg underline underline-offset-4">
          your private link
        </a>
        .
      </div>
    )
  }
  if (!open) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>
        Request contact
      </button>
    )
  }
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="relative mt-4 grid gap-3 border-t border-line pt-4">
      <FormGuard token={token} />
      <input type="hidden" name="profileId" value={profileId} />
      <p className="text-sm text-fg-2">Ask {ign} to share their contact. They decide.</p>
      <FormAlert state={state} />
      <input name="name" className="input" placeholder="Your name" aria-label="Your name" maxLength={60} />
      {e.name && <p className="field-error">{e.name}</p>}
      <input name="teamName" className="input" placeholder="Team name (optional)" aria-label="Team name" maxLength={60} />
      <input name="contact" className="input" placeholder="How they can reach you" aria-label="Your contact" maxLength={80} />
      {e.contact && <p className="field-error">{e.contact}</p>}
      <textarea name="message" className="input" rows={2} placeholder="Short message (optional)" aria-label="Message" maxLength={500} />
      <div className="flex gap-2">
        <SubmitButton className="btn btn-sm btn-primary">Send request</SubmitButton>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function LftManageButton({ token, op, requestId, label, danger }: { token: string; op: string; requestId?: string; label: string; danger?: boolean }) {
  const [state, action] = useActionState(lftManageAction, IDLE)
  if (state.status === 'success') return <span className="t-label !text-ok">Done</span>
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="op" value={op} />
      {requestId && <input type="hidden" name="requestId" value={requestId} />}
      <SubmitButton className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-ghost'}`} pendingLabel="…">
        {label}
      </SubmitButton>
      {state.status === 'error' && <p className="field-error">{state.message}</p>}
    </form>
  )
}
