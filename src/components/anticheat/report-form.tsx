'use client'

import { useActionState } from 'react'
import { reportAction } from '@/app/actions/public'
import { IDLE } from '@/lib/action-state'
import { Field, FormAlert, FormGuard, SubmitButton, SuccessPanel } from '../form'
import { ImageDrop } from '../image-drop'
import { ZLink } from '../link'

export function ReportForm({ token, uidLabel, uidHint }: { token: string; uidLabel: string; uidHint: string }) {
  const [state, action] = useActionState(reportAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="Report submitted for review" reference={state.data?.reference}>
        <p>
          A reviewer will check that the UID matches your screenshots. Reports are not approved automatically, and we may keep a report pending if the evidence is unclear.
        </p>
        <ZLink to="/" className="btn btn-ghost mt-6">
          Back to ZenithAntiCheat
        </ZLink>
      </SuccessPanel>
    )
  }
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="relative grid gap-7" noValidate>
      <FormGuard token={token} />
      <input type="hidden" name="gameId" value="pubg-mobile" />
      <FormAlert state={state} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={`Player ${uidLabel}`} name="uid" required error={e.uid} help={uidHint}>
          {(p) => <input {...p} className="input input-mono" inputMode="numeric" autoComplete="off" defaultValue={v.uid} maxLength={20} />}
        </Field>
        <Field label="Player in-game name" name="ign" error={e.ign}>
          {(p) => <input {...p} className="input" autoComplete="off" defaultValue={v.ign} maxLength={40} />}
        </Field>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ImageDrop
          name="reportScreenshot"
          label="In-game report confirmation"
          required
          error={state.status === 'error' && state.message?.startsWith('Report screenshot') ? state.message : undefined}
          hint="The screen showing your report of this player was submitted."
        />
        <ImageDrop
          name="uidScreenshot"
          label="Screenshot showing the UID"
          required
          error={state.status === 'error' && state.message?.startsWith('UID screenshot') ? state.message : undefined}
          hint="The player’s profile or result screen where the UID is readable."
        />
      </div>
      <Field label="What happened?" name="explanation" error={e.explanation} help="Optional. Match, time and what you saw.">
        {(p) => <textarea {...p} className="input" rows={4} maxLength={2000} defaultValue={v.explanation} />}
      </Field>
      <Field
        label="How can we reach you?"
        name="contact"
        error={e.contact}
        help="Optional — only if you are happy for a reviewer to contact you about this report. It is never shown to the player."
      >
        {(p) => <input {...p} className="input" maxLength={120} defaultValue={v.contact} placeholder="Email, WhatsApp or Discord" />}
      </Field>
      <p className="text-sm text-fg-3">
        PNG, JPEG or WebP, up to 4 MB each. Larger images are resized in your browser before upload. By submitting you confirm the screenshots are genuine and unedited.
      </p>
      <div>
        <SubmitButton pendingLabel="Uploading evidence…">Submit report →</SubmitButton>
      </div>
    </form>
  )
}
