'use client'

import { useActionState } from 'react'
import { bookingAction, inquiryAction } from '@/app/actions/public'
import { Field, FormAlert, FormGuard, SubmitButton, SuccessPanel } from '../form'
import { IDLE } from '@/lib/action-state'
import { ZLink } from '../link'

export function InquiryForm({ token }: { token: string }) {
  const [state, action] = useActionState(inquiryAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="Inquiry received" reference={state.data?.reference}>
        <p>The Zenith team will reply using the contact details you gave us. Keep the reference in case you need to follow up.</p>
        <ZLink to="/" className="btn btn-ghost mt-6">
          Back to ZenithProduction
        </ZLink>
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
        <Field label="Your name" name="name" required error={e.name}>
          {(p) => <input {...p} className="input" autoComplete="name" defaultValue={v.name} maxLength={80} />}
        </Field>
        <Field label="Organisation" name="organization" error={e.organization}>
          {(p) => <input {...p} className="input" autoComplete="organization" defaultValue={v.organization} maxLength={120} />}
        </Field>
        <Field label="Email" name="email" error={e.email} help="Email or phone — at least one.">
          {(p) => <input {...p} type="email" className="input" autoComplete="email" defaultValue={v.email} />}
        </Field>
        <Field label="Phone / WhatsApp" name="phone" error={e.phone}>
          {(p) => <input {...p} type="tel" className="input input-mono" autoComplete="tel" placeholder="03XX XXXXXXX" defaultValue={v.phone} />}
        </Field>
        <Field label="Game" name="game" error={e.game}>
          {(p) => (
            <select {...p} className="input" defaultValue={v.game ?? 'PUBG Mobile'}>
              <option>PUBG Mobile</option>
              <option>Other / future titles</option>
            </select>
          )}
        </Field>
        <Field label="Intended use" name="intendedUse" error={e.intendedUse}>
          {(p) => (
            <select {...p} className="input" defaultValue={v.intendedUse ?? ''}>
              <option value="">Choose one</option>
              <option>Our own tournaments</option>
              <option>Production company / crew</option>
              <option>Content creation</option>
              <option>Other</option>
            </select>
          )}
        </Field>
      </div>
      <Field label="What do you need?" name="requirements" required error={e.requirements} help="Events per month, team counts, broadcast style — whatever helps us understand your setup.">
        {(p) => <textarea {...p} className="input" rows={5} maxLength={3000} defaultValue={v.requirements} />}
      </Field>
      <Field label="Anything else" name="message" error={e.message}>
        {(p) => <textarea {...p} className="input" rows={3} maxLength={3000} defaultValue={v.message} />}
      </Field>
      <p className="text-sm text-fg-3">We use these details only to answer your inquiry. See the privacy policy for how long we keep them.</p>
      <div>
        <SubmitButton>Send inquiry →</SubmitButton>
      </div>
    </form>
  )
}

const ZONES = ['Asia/Karachi', 'Asia/Dubai', 'Asia/Riyadh', 'Europe/London', 'UTC']

export function BookingForm({ token, today }: { token: string; today: string }) {
  const [state, action] = useActionState(bookingAction, IDLE)
  if (state.status === 'success') {
    return (
      <SuccessPanel title="Booking request received" reference={state.data?.reference}>
        <p>
          This is a <strong className="text-fg">request</strong>, not a confirmed booking. A Zenith administrator will review your dates and requirements and contact you. Your
          booking is confirmed only when we tell you it is.
        </p>
        <ZLink to="/" className="btn btn-ghost mt-6">
          Back to ZenithProduction
        </ZLink>
      </SuccessPanel>
    )
  }
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="relative grid gap-6" noValidate>
      <FormGuard token={token} />
      <FormAlert state={state} />
      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="t-label mb-2 sm:col-span-2">The event</legend>
        <Field label="Tournament name" name="tournamentName" required error={e.tournamentName} className="sm:col-span-2">
          {(p) => <input {...p} className="input" maxLength={120} defaultValue={v.tournamentName} />}
        </Field>
        <Field label="Game" name="game" required error={e.game}>
          {(p) => (
            <select {...p} className="input" defaultValue={v.game ?? 'PUBG Mobile'}>
              <option>PUBG Mobile</option>
              <option>Other (describe below)</option>
            </select>
          )}
        </Field>
        <Field label="Date" name="eventDate" required error={e.eventDate}>
          {(p) => <input {...p} type="date" min={today} className="input input-mono" defaultValue={v.eventDate} />}
        </Field>
        <Field label="Start time" name="startTime" required error={e.startTime}>
          {(p) => <input {...p} type="time" className="input input-mono" defaultValue={v.startTime} />}
        </Field>
        <Field label="Timezone" name="timezone" required error={e.timezone}>
          {(p) => (
            <select {...p} className="input" defaultValue={v.timezone ?? 'Asia/Karachi'}>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z === 'Asia/Karachi' ? 'Pakistan (PKT)' : z}
                </option>
              ))}
            </select>
          )}
        </Field>
      </fieldset>
      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="t-label mb-2 sm:col-span-2">Contact</legend>
        <Field label="Your name" name="contactName" required error={e.contactName}>
          {(p) => <input {...p} className="input" autoComplete="name" defaultValue={v.contactName} />}
        </Field>
        <Field label="Organisation" name="organization" error={e.organization}>
          {(p) => <input {...p} className="input" autoComplete="organization" defaultValue={v.organization} />}
        </Field>
        <Field label="Email" name="email" error={e.email} help="Email or phone — at least one.">
          {(p) => <input {...p} type="email" className="input" autoComplete="email" defaultValue={v.email} />}
        </Field>
        <Field label="Phone / WhatsApp" name="phone" error={e.phone}>
          {(p) => <input {...p} type="tel" className="input input-mono" autoComplete="tel" placeholder="03XX XXXXXXX" defaultValue={v.phone} />}
        </Field>
      </fieldset>
      <fieldset className="grid gap-6">
        <legend className="t-label mb-2">The broadcast</legend>
        <Field label="Broadcast requirements" name="broadcastRequirements" required error={e.broadcastRequirements} help="Platform (e.g. YouTube), casters, graphics package, number of streams.">
          {(p) => <textarea {...p} className="input" rows={4} maxLength={3000} defaultValue={v.broadcastRequirements} />}
        </Field>
        <Field label="Expected scope" name="eventScope" error={e.eventScope} help="Teams, matches per day, number of days.">
          {(p) => <textarea {...p} className="input" rows={3} maxLength={1000} defaultValue={v.eventScope} />}
        </Field>
        <Field label="Additional notes" name="notes" error={e.notes}>
          {(p) => <textarea {...p} className="input" rows={3} maxLength={2000} defaultValue={v.notes} />}
        </Field>
      </fieldset>
      <div>
        <SubmitButton pendingLabel="Sending request…">Request this booking →</SubmitButton>
      </div>
    </form>
  )
}
