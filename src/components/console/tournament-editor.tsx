'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveTournamentAction } from '@/app/actions/console'
import { IDLE } from '@/lib/action-state'
import { FormAlert, SubmitButton } from '../form'

type FormatOpt = { id: string; gameId: string; gameName: string; label: string; code: string; minPlayers: number; maxPlayers: number; maxSubstitutes: number }
type VersionOpt = { id: string; templateName: string; version: number; gameId: string | null }

export type EditorValues = Record<string, string>

const ZONES = ['Asia/Karachi', 'Asia/Dubai', 'Asia/Riyadh', 'Europe/London', 'UTC']

export function TournamentEditor({ initial, formats, versions }: { initial: EditorValues; formats: FormatOpt[]; versions: VersionOpt[] }) {
  const [state, action] = useActionState(saveTournamentAction, IDLE)
  const v = { ...initial, ...(state.values ?? {}) }
  const e = state.fieldErrors ?? {}
  const [formatId, setFormatId] = useState(v.formatId ?? '')
  const fmt = useMemo(() => formats.find((f) => f.id === formatId), [formats, formatId])
  const games = [...new Map(formats.map((f) => [f.gameId, f.gameName])).entries()]

  const text = (name: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`t-${name}`} name={name} className="input" defaultValue={v[name] ?? ''} aria-invalid={e[name] ? true : undefined} {...extra} />
  )
  const area = (name: string, rows = 4) => <textarea id={`t-${name}`} name={name} className="input" rows={rows} defaultValue={v[name] ?? ''} />
  const check = (name: string, label: string) => (
    <label className="choice">
      <input type="checkbox" name={name} defaultChecked={v[name] === 'on' || v[name] === 'true'} />
      <span className="text-sm">{label}</span>
    </label>
  )

  return (
    <form action={action} className="grid gap-10">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <FormAlert state={state} />
      {state.status === 'success' && <p className="text-sm text-ok">{state.message}</p>}

      <Section title="Basics">
        <F e={e} name="name" label="Name" span>
          {text('name', { required: true, maxLength: 120 })}
        </F>
        <F e={e} name="formatId" label="Game & format">
          <select id="t-formatId" name="formatId" className="input" value={formatId} onChange={(ev) => setFormatId(ev.target.value)} required>
            <option value="">Choose…</option>
            {games.map(([gid, gname]) => (
              <optgroup key={gid} label={gname}>
                {formats
                  .filter((f) => f.gameId === gid && f.code !== 'lft')
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {gname} · {f.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </F>
        <F e={e} name="slug" label="URL slug" help="Leave empty to generate from the name.">
          {text('slug', { maxLength: 80, pattern: '[a-z0-9-]*' })}
        </F>
        <F e={e} name="summary" label="One-line summary" span>
          {text('summary', { maxLength: 280 })}
        </F>
        <F e={e} name="description" label="Description" span>
          {area('description', 5)}
        </F>
      </Section>

      <Section title="Schedule" note="Times are in the tournament’s timezone.">
        <F e={e} name="timezone" label="Timezone">
          <select id="t-timezone" name="timezone" className="input" defaultValue={v.timezone || 'Asia/Karachi'}>
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </F>
        <div />
        <F e={e} name="registrationOpensAt" label="Registration opens" help="Empty = opens when published.">
          {text('registrationOpensAt', { type: 'datetime-local' })}
        </F>
        <F e={e} name="registrationClosesAt" label="Registration closes" help="Empty = closes at the start time.">
          {text('registrationClosesAt', { type: 'datetime-local' })}
        </F>
        <F e={e} name="startsAt" label="Starts">
          {text('startsAt', { type: 'datetime-local' })}
        </F>
        <F e={e} name="endsAt" label="Ends">
          {text('endsAt', { type: 'datetime-local' })}
        </F>
      </Section>

      <Section title="Entries & roster" note={fmt ? `Format default: ${fmt.minPlayers}–${fmt.maxPlayers} players, up to ${fmt.maxSubstitutes} substitutes.` : undefined}>
        <F e={e} name="capacity" label="Capacity (entries)" help="Empty = unlimited.">
          {text('capacity', { type: 'number', min: 1 })}
        </F>
        <div />
        <F e={e} name="rosterMin" label="Minimum players">
          {text('rosterMin', { type: 'number', min: 1, placeholder: fmt ? String(fmt.minPlayers) : '' })}
        </F>
        <F e={e} name="rosterMax" label="Maximum players">
          {text('rosterMax', { type: 'number', min: 1, placeholder: fmt ? String(fmt.maxPlayers) : '' })}
        </F>
        <F e={e} name="substitutesMax" label="Maximum substitutes">
          {text('substitutesMax', { type: 'number', min: 0, placeholder: fmt ? String(fmt.maxSubstitutes) : '' })}
        </F>
        <F e={e} name="substitutesRequired" label="Required substitutes">
          {text('substitutesRequired', { type: 'number', min: 0, placeholder: '0' })}
        </F>
        <div className="grid gap-2 sm:col-span-2">
          {check('requiresApproval', 'Entries need administrator approval')}
          {check('waitlistEnabled', 'Use a waitlist when full')}
          {check('uniquePhone', 'One entry per WhatsApp number')}
        </div>
      </Section>

      <Section title="Form">
        <F e={e} name="formVersionId" label="Registration form" help="Only published versions can be attached. Entries keep the version they were submitted with." span>
          <select id="t-formVersionId" name="formVersionId" className="input" defaultValue={v.formVersionId ?? ''}>
            <option value="">No extra questions</option>
            {versions
              .filter((x) => !x.gameId || !fmt || x.gameId === fmt.gameId)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.templateName} · v{x.version}
                </option>
              ))}
          </select>
        </F>
      </Section>

      <Section title="Rules, prizes & fees">
        <F e={e} name="eligibility" label="Eligibility" span>
          {area('eligibility', 3)}
        </F>
        <F e={e} name="rules" label="Rules" span>
          {area('rules', 8)}
        </F>
        <F e={e} name="prizeInfo" label="Prizes" span>
          {area('prizeInfo', 3)}
        </F>
        <F e={e} name="entryFeePkr" label="Entry fee (PKR)" help="Empty = free.">
          {text('entryFeePkr', { type: 'number', min: 0 })}
        </F>
        <F e={e} name="feeNotes" label="Fee notes">
          {text('feeNotes', { maxLength: 500 })}
        </F>
      </Section>

      <Section title="Links & notes">
        <F e={e} name="communicationLinks" label="Event links (shown to approved teams only)" help="One per line: Label | https://…" span>
          {area('communicationLinks', 3)}
        </F>
        <F e={e} name="broadcastUrl" label="Broadcast URL (public)" span>
          {text('broadcastUrl', { type: 'url' })}
        </F>
        <F e={e} name="resultsNotes" label="Results (public)" span>
          {area('resultsNotes', 3)}
        </F>
        <F e={e} name="adminNotes" label="Administrative notes (private)" span>
          {area('adminNotes', 3)}
        </F>
      </Section>

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-line bg-void/90 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
        <SubmitButton pendingLabel="Saving…">{v.id ? 'Save changes' : 'Create draft'}</SubmitButton>
      </div>
    </form>
  )
}

function F({ e, name, label, children, help, span }: { e: Record<string, string>; name: string; label: string; children: React.ReactNode; help?: string; span?: boolean }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label htmlFor={`t-${name}`} className="field-label">
        {label}
      </label>
      {children}
      {e[name] ? <p className="field-error">{e[name]}</p> : help ? <p className="field-help">{help}</p> : null}
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-5 sm:grid-cols-2">
      <legend className="mb-4 w-full border-b border-line pb-3 sm:col-span-2">
        <span className="t-label !text-fg-2">{title}</span>
        {note && <span className="ml-3 text-xs text-fg-3">{note}</span>}
      </legend>
      {children}
    </fieldset>
  )
}
