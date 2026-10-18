'use client'

import { startTransition, useActionState, useId, useMemo, useState } from 'react'
import { registerAction } from '@/app/actions/public'
import { IDLE } from '@/lib/action-state'
import { validateAnswers, visibleFields, type Answers, type AnswerValue } from '@/lib/forms/engine'
import type { FormSchema } from '@/lib/forms/schema'
import { isEmail, toE164 } from '@/lib/normalize'
import { isTeamFormat, STATUS_LABEL, type RegistrationStatus } from '@/lib/tournament'
import { FormAlert, FormGuard, SuccessPanel } from '../form'
import { ZLink } from '../link'
import { DynamicField } from './dynamic-field'

export type FlowTournament = {
  slug: string
  name: string
  gameName: string
  formatCode: string
  formatLabel: string
  rosterMin: number
  rosterMax: number
  substitutesMax: number
  substitutesRequired: number
  rules: string
  eligibility: string
  requiresApproval: boolean
  entryFeePkr: number | null
  feeNotes: string
  full: boolean
  waitlist: boolean
}
type Game = { uidLabel: string; uidHint: string; uidPattern: string }
type Member = { role: 'captain' | 'player' | 'substitute'; ign: string; uid: string; phone: string; answers: Answers }

const STEPS = ['Requirements', 'Team & contact', 'Roster', 'Questions', 'Confirm']

export function RegisterFlow({ t, game, schema, token }: { t: FlowTournament; game: Game; schema: FormSchema; token: string }) {
  const [state, formAction, pending] = useActionState(registerAction, IDLE)
  const team = isTeamFormat(t.formatCode)
  const [step, setStep] = useState(0)
  const [ack, setAck] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState<Answers>({})
  const [members, setMembers] = useState<Member[]>(() =>
    Array.from({ length: t.rosterMin + t.substitutesRequired }, (_, i) => ({
      role: i === 0 ? 'captain' : i < t.rosterMin ? 'player' : 'substitute',
      ign: '',
      uid: '',
      phone: '',
      answers: {},
    })),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [stepError, setStepError] = useState<string | null>(null)

  const hasEntryQuestions = schema.fields.some((f) => f.scope === 'entry')
  const playerFields = useMemo(() => schema.fields.filter((f) => f.scope === 'player'), [schema])
  const starters = members.filter((m) => m.role !== 'substitute').length
  const subs = members.filter((m) => m.role === 'substitute').length
  const serverErrors = state.fieldErrors ?? {}
  const err = (k: string) => errors[k] ?? serverErrors[k]

  const updateMember = (i: number, patch: Partial<Member>) => setMembers((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  function validate(s: number): boolean {
    const e: Record<string, string> = {}
    if (s === 0 && !ack) e.ack = 'Confirm you have read the rules and requirements.'
    if (s === 1) {
      if (team && (teamName.trim().length < 2 || teamName.trim().length > 40)) e.teamName = 'Team name must be 2–40 characters.'
      if (!toE164(phone)) e.contactPhone = 'Enter a valid WhatsApp number, e.g. 03XX XXXXXXX.'
      if (email.trim() && !isEmail(email.trim())) e.contactEmail = 'Enter a valid email or leave it empty.'
    }
    if (s === 2) {
      const re = new RegExp(game.uidPattern)
      const seen = new Map<string, number>()
      members.forEach((m, i) => {
        if (m.ign.trim().length < 2) e[`m${i}.ign`] = 'In-game name is required.'
        const uid = m.uid.trim()
        if (!re.test(uid)) e[`m${i}.uid`] = `Enter a valid ${game.uidLabel}.`
        else if (seen.has(uid.toLowerCase())) e[`m${i}.uid`] = `Same ${game.uidLabel} as player ${seen.get(uid.toLowerCase())! + 1}.`
        seen.set(uid.toLowerCase(), i)
        if (m.phone.trim() && !toE164(m.phone)) e[`m${i}.phone`] = 'Enter a valid number or leave it empty.'
        const r = validateAnswers(schema, m.answers, { scope: 'player', entryAnswers: answers, uidPattern: game.uidPattern, uidLabel: game.uidLabel })
        for (const [k, v] of Object.entries(r.errors)) e[`m${i}.${k}`] = v
      })
    }
    if (s === 3) {
      const r = validateAnswers(schema, answers, { scope: 'entry', uidPattern: game.uidPattern, uidLabel: game.uidLabel })
      for (const [k, v] of Object.entries(r.errors)) e[`entry.${k}`] = v
      if (r.disqualified) {
        setErrors(e)
        setStepError(r.disqualified)
        return false
      }
    }
    setErrors(e)
    setStepError(Object.keys(e).length ? 'Please fix the highlighted fields.' : null)
    return Object.keys(e).length === 0
  }

  function go(next: number) {
    if (next > step && !validate(step)) return
    let n = next
    if (n === 3 && !hasEntryQuestions) n = next > step ? 4 : 2
    setStep(n)
    setStepError(null)
    document.getElementById('flow-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function submit() {
    const fd = new FormData()
    fd.set('_ft', token)
    fd.set('website', '')
    fd.set('tournament', t.slug)
    fd.set('teamName', teamName)
    fd.set('contactPhone', phone)
    fd.set('contactEmail', email)
    const multi: string[] = []
    const append = (prefix: string, key: string, v: AnswerValue, filePrefix: string) => {
      if (v === undefined || v === null || v === '') return
      if (typeof v === 'object' && 'size' in (v as object) && typeof (v as unknown as Blob).arrayBuffer === 'function') fd.set(`f.${filePrefix}.${key}`, v as unknown as Blob)
      else if (Array.isArray(v)) v.forEach((x) => fd.append(`${prefix}${key}`, x))
      else fd.set(`${prefix}${key}`, String(v))
    }
    for (const f of visibleFields(schema, 'entry', answers)) {
      if (f.type === 'multi_choice') multi.push(f.id)
      append('a.', f.id, answers[f.id], 'entry')
    }
    fd.set('_multi', multi.join(','))
    members.forEach((m, i) => {
      fd.set(`m.${i}.role`, m.role)
      fd.set(`m.${i}.ign`, m.ign)
      fd.set(`m.${i}.uid`, m.uid)
      if (m.phone) fd.set(`m.${i}.phone`, m.phone)
      for (const f of visibleFields(schema, 'player', m.answers, answers)) append(`m.${i}.a.`, f.id, m.answers[f.id], `m${i}`)
    })
    startTransition(() => formAction(fd))
  }

  if (state.status === 'success' && state.data) {
    const status = state.data.status as RegistrationStatus
    return (
      <SuccessPanel title={status === 'waitlisted' ? 'You’re on the waitlist' : 'Registration received'} reference={state.data.reference}>
        <p>
          Status: <strong className="text-fg">{STATUS_LABEL[status]}</strong>.{' '}
          {status === 'pending' && 'An administrator will review your entry.'}
          {status === 'waitlisted' && 'The tournament is full; you’ll move up if a place opens.'}
          {status === 'approved' && 'You’re in. Event details appear on your status page.'}
        </p>
        <div className="mt-6 rounded-sm border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] p-5">
          <p className="t-label !text-[var(--accent)]">Your private status link</p>
          <p className="mt-2 text-sm text-fg-2">Bookmark it — it’s the only way to check your status or withdraw. Anyone with the link can see your entry, so share it carefully.</p>
          <a href={state.data.manage} className="mt-3 block break-all font-mono text-sm text-fg underline decoration-line-3 underline-offset-4">
            {state.data.manage}
          </a>
        </div>
        <ZLink to="/" className="btn btn-ghost mt-6">
          Back to tournaments
        </ZLink>
      </SuccessPanel>
    )
  }

  const visibleStep = hasEntryQuestions ? STEPS : STEPS.filter((s) => s !== 'Questions')
  const currentLabel = STEPS[step]
  return (
    <div id="flow-top" className="scroll-mt-24">
      {/* progress */}
      <ol className="mb-10 grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleStep.length}, minmax(0, 1fr))` }} aria-label="Registration steps">
        {visibleStep.map((label) => {
          const idx = STEPS.indexOf(label)
          const done = idx < step
          const on = idx === step
          return (
            <li key={label} aria-current={on ? 'step' : undefined}>
              <span className="block h-0.5 overflow-hidden bg-line-2">
                <span className="block h-full bg-[var(--accent)] transition-transform duration-700" style={{ transform: `scaleX(${done || on ? 1 : 0})`, transformOrigin: 'left', transitionTimingFunction: 'var(--ease-out-expo)' }} />
              </span>
              <span className={`mt-2 hidden font-mono text-[11.5px] uppercase tracking-[0.12em] sm:block ${on ? 'text-fg' : 'text-fg-3'}`}>{label}</span>
            </li>
          )
        })}
      </ol>
      <p className="t-label mb-2 sm:hidden">
        Step {visibleStep.indexOf(currentLabel) + 1} of {visibleStep.length} · {currentLabel}
      </p>

      <div className="relative grid gap-6">
        <FormGuard token={token} />
        {(stepError || state.status === 'error') && <FormAlert state={stepError ? { status: 'error', message: stepError } : state} />}

        <div key={step} style={{ animation: 'rise 500ms var(--ease-out-expo) both' }} className="grid gap-6">
          {step === 0 && (
            <>
              <div className="panel p-6">
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Req k="Format" v={t.formatLabel} />
                  <Req k="Roster" v={t.rosterMin === t.rosterMax ? `${t.rosterMin} player${t.rosterMin > 1 ? 's' : ''}` : `${t.rosterMin}–${t.rosterMax} players`} />
                  <Req k="Substitutes" v={t.substitutesMax ? `Up to ${t.substitutesMax}${t.substitutesRequired ? `, ${t.substitutesRequired} required` : ''}` : 'None'} />
                  <Req k="Each player needs" v={`In-game name and ${game.uidLabel}`} />
                  <Req k="Review" v={t.requiresApproval ? 'Entries are reviewed by an administrator' : 'Entries are confirmed automatically'} />
                  <Req k="Entry fee" v={t.entryFeePkr ? `PKR ${t.entryFeePkr.toLocaleString('en-PK')}` : 'Free'} />
                </dl>
                {t.feeNotes && <p className="mt-4 text-sm text-fg-2">{t.feeNotes}</p>}
              </div>
              {t.full && (
                <p className="rounded-sm border border-warn/40 px-4 py-3 text-sm text-warn">
                  {t.waitlist ? 'This tournament is full. New entries join the waitlist.' : 'This tournament is full.'}
                </p>
              )}
              {(t.eligibility || t.rules) && (
                <details className="panel p-6" open>
                  <summary className="cursor-pointer font-medium">Rules & eligibility</summary>
                  {t.eligibility && <p className="whitespace-pre-line-safe mt-4 text-fg-2">{t.eligibility}</p>}
                  {t.rules && <p className="whitespace-pre-line-safe mt-4 max-h-72 overflow-y-auto pr-2 text-sm text-fg-2">{t.rules}</p>}
                </details>
              )}
              <label className="choice">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} aria-invalid={err('ack') ? true : undefined} />
                <span className="text-sm">I have read the rules and requirements, and every player on this entry agrees to them.</span>
              </label>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {team && (
                <Text label="Team name" required value={teamName} onChange={setTeamName} error={err('teamName')} className="sm:col-span-2" max={40} />
              )}
              <Text label="Captain’s WhatsApp number" required value={phone} onChange={setPhone} error={err('contactPhone')} mono placeholder="03XX XXXXXXX" type="tel" help="Used by organisers for match communication. Never shown publicly." />
              <Text label="Email" value={email} onChange={setEmail} error={err('contactEmail')} type="email" help="Optional — for your confirmation and status updates." />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              {members.map((m, i) => (
                <fieldset key={i} className="panel p-5">
                  <legend className="sr-only">Player {i + 1}</legend>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="t-label">
                      {m.role === 'captain' ? 'Captain' : m.role === 'substitute' ? 'Substitute' : `Player ${i + 1}`}
                      {!team && ' · You'}
                    </p>
                    {((m.role === 'player' && starters > t.rosterMin) || (m.role === 'substitute' && subs > t.substitutesRequired)) && (
                      <button type="button" className="t-label hover:text-bad" onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Text label="In-game name" required value={m.ign} onChange={(v) => updateMember(i, { ign: v })} error={err(`m${i}.ign`)} max={40} />
                    <Text label={game.uidLabel} required value={m.uid} onChange={(v) => updateMember(i, { uid: v })} error={err(`m${i}.uid`)} mono help={i === 0 ? game.uidHint : undefined} />
                    <Text label="WhatsApp" value={m.phone} onChange={(v) => updateMember(i, { phone: v })} error={err(`m${i}.phone`)} mono type="tel" placeholder={i === 0 ? 'Defaults to captain’s' : ''} />
                  </div>
                  {playerFields.length > 0 && (
                    <div className="mt-4 grid gap-4 border-t border-line pt-4">
                      {visibleFields(schema, 'player', m.answers, answers).map((f) => (
                        <DynamicField
                          key={f.id}
                          field={f}
                          value={m.answers[f.id]}
                          onChange={(v) => updateMember(i, { answers: { ...m.answers, [f.id]: v } })}
                          error={err(`m${i}.${f.id}`)}
                          uidHint={game.uidHint}
                        />
                      ))}
                    </div>
                  )}
                </fieldset>
              ))}
              <div className="flex flex-wrap gap-3">
                {starters < t.rosterMax && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setMembers((ms) => {
                      const at = ms.findIndex((x) => x.role === 'substitute')
                      const p: Member = { role: 'player', ign: '', uid: '', phone: '', answers: {} }
                      return at === -1 ? [...ms, p] : [...ms.slice(0, at), p, ...ms.slice(at)]
                    })}
                  >
                    + Add player
                  </button>
                )}
                {subs < t.substitutesMax && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMembers((ms) => [...ms, { role: 'substitute', ign: '', uid: '', phone: '', answers: {} }])}>
                    + Add substitute
                  </button>
                )}
              </div>
              <p className="text-sm text-fg-3">Each player can be on one active entry per tournament. Personal numbers are visible only to organisers.</p>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-6">
              {schema.intro && <p className="whitespace-pre-line-safe text-fg-2">{schema.intro}</p>}
              {visibleFields(schema, 'entry', answers).map((f) => (
                <DynamicField key={f.id} field={f} value={answers[f.id]} onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))} error={err(`entry.${f.id}`)} uidHint={game.uidHint} />
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="panel divide-y divide-line">
              <Row k="Tournament" v={`${t.name} · ${t.formatLabel}`} />
              {team && <Row k="Team" v={teamName} />}
              <Row k="Contact" v={`${phone}${email ? ` · ${email}` : ''}`} />
              <div className="px-5 py-4">
                <p className="t-label mb-3">Roster</p>
                <ul className="grid gap-2 text-sm">
                  {members.map((m, i) => (
                    <li key={i} className="flex flex-wrap justify-between gap-2">
                      <span>
                        {m.ign} <span className="text-fg-3">· {m.role}</span>
                      </span>
                      <span className="font-mono text-fg-2">{m.uid}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="px-5 py-4 text-sm text-fg-3">Nothing is saved until you submit. Every entry is checked for duplicates and against our integrity records.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => go(step === 4 && !hasEntryQuestions ? 2 : step - 1)} disabled={pending}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button type="button" className="btn btn-primary" onClick={() => go(step + 1)}>
              Continue <span className="arrow">→</span>
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={submit} disabled={pending} aria-busy={pending}>
              {pending ? (
                <>
                  <span aria-hidden className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" /> Submitting…
                </>
              ) : (
                <>
                  Submit registration <span className="arrow">→</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Req({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="t-label">{k}</dt>
      <dd className="mt-1">{v}</dd>
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 px-5 py-4">
      <span className="t-label">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  )
}

function Text({
  label,
  value,
  onChange,
  error,
  required,
  help,
  mono,
  type = 'text',
  placeholder,
  max = 200,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  help?: string
  mono?: boolean
  type?: string
  placeholder?: string
  max?: number
  className?: string
}) {
  const id = useId()
  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-[var(--accent)]" aria-hidden>*</span> : <span className="ml-2 text-xs font-normal text-fg-3">optional</span>}
      </label>
      <InputWithId id={id} value={value} onChange={onChange} error={error} help={help} mono={mono} type={type} placeholder={placeholder} max={max} required={required} />
    </div>
  )
}

function InputWithId(p: { id: string; value: string; onChange: (v: string) => void; error?: string; help?: string; mono?: boolean; type: string; placeholder?: string; max: number; required?: boolean }) {
  const described = p.error ? `${p.id}-e` : p.help ? `${p.id}-h` : undefined
  return (
    <>
      <input
        id={p.id}
        type={p.type}
        className={`input ${p.mono ? 'input-mono' : ''}`}
        value={p.value}
        maxLength={p.max}
        placeholder={p.placeholder}
        required={p.required}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={described}
        onChange={(e) => p.onChange(e.target.value)}
      />
      {p.error ? (
        <p id={`${p.id}-e`} className="field-error" role="alert">
          {p.error}
        </p>
      ) : p.help ? (
        <p id={`${p.id}-h`} className="field-help">
          {p.help}
        </p>
      ) : null}
    </>
  )
}
