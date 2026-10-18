'use client'

import { useActionState } from 'react'
import { reportAction } from '@/app/actions/public'
import { IDLE } from '@/lib/action-state'
import type { ReportRule } from '@/lib/report-rules'
import { Field, FormAlert, FormGuard, SubmitButton, SuccessPanel } from '../form'
import { ImageDrop } from '../image-drop'
import { ZLink } from '../link'

export function ReportForm({
  token,
  gameId,
  gameName,
  uidLabel,
  uidHint,
  rule,
}: {
  token: string
  gameId: string
  gameName: string
  uidLabel: string
  uidHint: string
  rule: ReportRule
}) {
  const [state, action] = useActionState(reportAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="Report submitted for review" reference={state.data?.reference}>
        <p>A reviewer will check that the {uidLabel} you typed matches your screenshot. Reports are never approved automatically, and we may keep one pending if the evidence is unclear.</p>
        <ZLink to="/" className="btn btn-ghost mt-6">
          Back to ZenithAntiCheat
        </ZLink>
      </SuccessPanel>
    )
  }
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  const slotError = (label: string) => (state.status === 'error' && state.message?.startsWith(label) ? state.message : undefined)
  return (
    <form action={action} className="relative grid gap-7" noValidate key={gameId}>
      <FormGuard token={token} />
      <input type="hidden" name="gameId" value={gameId} />
      <FormAlert state={state} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={`Player ${uidLabel}`} name="uid" required error={e.uid} help={uidHint}>
          {(p) => (
            <input {...p} className="input input-mono" inputMode={rule.numericId ? 'numeric' : 'text'} autoComplete="off" defaultValue={v.uid} maxLength={40} placeholder={rule.idPlaceholder} />
          )}
        </Field>
        <Field label="Player in-game name" name="ign" error={e.ign} help="Optional, as it appears in game.">
          {(p) => <input {...p} className="input" autoComplete="off" defaultValue={v.ign} maxLength={40} />}
        </Field>
      </div>

      <div className={`grid gap-6 ${rule.evidence.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {rule.evidence.map((slot) => (
          <ImageDrop key={slot.kind} name={`evidence_${slot.kind}`} label={slot.required ? slot.label : `${slot.label} (optional)`} required={slot.required} error={slotError(slot.label)} hint={slot.hint} />
        ))}
      </div>

      {(rule.matchDetails || rule.clip) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {rule.matchDetails && (
            <Field label="Match details" name="matchDetails" error={e.matchDetails} help="Optional — map or mode, round, date and time.">
              {(p) => <input {...p} className="input" maxLength={300} defaultValue={v.matchDetails} />}
            </Field>
          )}
          {rule.clip && (
            <Field label="Clip link" name="clipUrl" error={e.clipUrl} help="Optional — an https link to a video of the incident (YouTube, Drive, Medal…).">
              {(p) => <input {...p} className="input" type="url" inputMode="url" maxLength={500} defaultValue={v.clipUrl} placeholder="https://" />}
            </Field>
          )}
        </div>
      )}

      <Field label="What happened?" name="explanation" error={e.explanation} help="Optional. What you saw and when.">
        {(p) => <textarea {...p} className="input" rows={4} maxLength={2000} defaultValue={v.explanation} />}
      </Field>
      <Field label="How can we reach you?" name="contact" error={e.contact} help="Optional — only if you are happy for a reviewer to contact you about this report. It is never shown to the player.">
        {(p) => <input {...p} className="input" maxLength={120} defaultValue={v.contact} placeholder="Email, WhatsApp or Discord" />}
      </Field>
      <p className="text-sm text-fg-3">
        PNG, JPEG or WebP, up to 4 MB each. Larger images are resized in your browser before upload. By submitting you confirm the screenshots are genuine and unedited. This report is about {gameName} play in Zenith competitions.
      </p>
      <div>
        <SubmitButton pendingLabel="Uploading evidence…">Submit report →</SubmitButton>
      </div>
    </form>
  )
}
