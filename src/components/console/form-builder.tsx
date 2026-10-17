'use client'

import { useMemo, useState, useTransition } from 'react'
import { publishDraftAction, saveDraftAction } from '@/app/actions/console'
import { visibleFields, type Answers } from '@/lib/forms/engine'
import {
  CHOICE_TYPES,
  CONDITION_OPS,
  DISPLAY_ONLY,
  FIELD_TYPE_LABEL,
  FIELD_TYPES,
  IMAGE_MIME,
  formSchemaSchema,
  type Condition,
  type FieldType,
  type FormField,
  type FormSchema,
} from '@/lib/forms/schema'
import { DynamicField } from '../registrations/dynamic-field'

const OP_LABEL: Record<string, string> = {
  equals: 'is',
  not_equals: 'is not',
  includes: 'includes',
  not_includes: 'does not include',
  checked: 'is checked',
  not_checked: 'is not checked',
  gt: 'is greater than',
  lt: 'is less than',
  filled: 'is answered',
  empty: 'is empty',
}
const NO_VALUE = ['checked', 'not_checked', 'filled', 'empty']

function newField(type: FieldType, existing: FormField[]): FormField {
  let n = existing.length + 1
  let id = `${type.split('_')[0]}_${n}`
  while (existing.some((f) => f.id === id)) id = `${type.split('_')[0]}_${++n}`
  const base: FormField = { id, type, label: FIELD_TYPE_LABEL[type], required: false, scope: 'entry' }
  if (CHOICE_TYPES.includes(type)) base.options = [{ value: 'option_1', label: 'Option 1' }, { value: 'option_2', label: 'Option 2' }]
  if (type === 'file') {
    base.accept = ['image/png', 'image/jpeg', 'image/webp']
    base.maxSizeMB = 4
  }
  if (type === 'consent') {
    base.label = 'I agree to …'
    base.required = true
  }
  if (type === 'heading') base.label = 'Section'
  if (type === 'paragraph') base.label = 'Explain what this section is for.'
  return base
}

export function FormBuilder({ templateId, initial, hasDraft }: { templateId: string; initial: FormSchema; hasDraft: boolean }) {
  const [schema, setSchema] = useState<FormSchema>(initial)
  const [sel, setSel] = useState<number | null>(initial.fields.length ? 0 : null)
  const [addType, setAddType] = useState<FieldType>('short_text')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pending, start] = useTransition()
  const valid = useMemo(() => formSchemaSchema.safeParse(schema), [schema])

  const fields = schema.fields
  const update = (next: FormField[], intro = schema.intro) => {
    setSchema({ ...schema, fields: next, intro })
    setDirty(true)
    setMsg(null)
  }
  const patch = (i: number, p: Partial<FormField>) => update(fields.map((f, j) => (j === i ? clean({ ...f, ...p }) : f)))
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= fields.length) return
    const next = [...fields]
    ;[next[i], next[j]] = [next[j], next[i]]
    update(next)
    setSel(j)
  }

  function save() {
    start(async () => {
      const r = await saveDraftAction(templateId, schema)
      setMsg({ ok: r.status === 'success', text: r.message ?? '' })
      if (r.status === 'success') setDirty(false)
    })
  }
  function publish() {
    if (dirty) return setMsg({ ok: false, text: 'Save the draft first.' })
    if (!window.confirm('Publish this draft as a new, frozen version?')) return
    start(async () => {
      const r = await publishDraftAction(templateId)
      setMsg({ ok: r.status === 'success', text: r.message ?? '' })
    })
  }

  const f = sel !== null ? fields[sel] : null
  return (
    <div className="grid gap-6">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex gap-2" role="tablist">
          {(['edit', 'preview'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}>
              {t === 'edit' ? 'Build' : 'Preview'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!valid.success && <span className="text-sm text-warn">{valid.error.issues[0]?.message}</span>}
          {msg && <span className={`text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</span>}
          {dirty && <span className="t-label">Unsaved</span>}
          <button type="button" className="btn btn-sm btn-ghost" onClick={save} disabled={pending || !valid.success}>
            Save draft
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={publish} disabled={pending || !valid.success}>
            Publish version
          </button>
        </div>
      </div>

      {tab === 'preview' ? (
        <Preview schema={schema} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="grid content-start gap-4">
            <label className="grid gap-2">
              <span className="field-label">Introduction (shown above the questions)</span>
              <textarea className="input" rows={2} value={schema.intro ?? ''} onChange={(e) => update(fields, e.target.value)} maxLength={2000} />
            </label>
            <ol className="divide-y divide-line rounded-md border border-line">
              {fields.length === 0 && <li className="px-4 py-8 text-center text-sm text-fg-3">No fields yet. Team, roster and contact details are collected automatically — add only what this tournament needs extra.</li>}
              {fields.map((x, i) => (
                <li key={x.id + i} className={`flex items-center gap-3 px-3 py-2.5 ${sel === i ? 'bg-ink-3' : 'hover:bg-ink-2'}`}>
                  <button type="button" onClick={() => setSel(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="font-mono text-[11px] text-fg-3">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{x.label}</span>
                      <span className="block font-mono text-[11px] text-fg-3">
                        {FIELD_TYPE_LABEL[x.type]} · {x.id}
                        {x.scope === 'player' && ' · per player'}
                        {x.required && ' · required'}
                        {x.visibleWhen && ' · conditional'}
                        {x.disqualifyWhen && ' · eligibility'}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <IconBtn label="Move up" onClick={() => move(i, -1)}>↑</IconBtn>
                    <IconBtn label="Move down" onClick={() => move(i, 1)}>↓</IconBtn>
                    <IconBtn
                      label="Duplicate"
                      onClick={() => {
                        const copy = { ...structuredClone(x), id: newField(x.type, fields).id }
                        update([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)])
                        setSel(i + 1)
                      }}
                    >
                      ⧉
                    </IconBtn>
                    <IconBtn
                      label="Delete"
                      onClick={() => {
                        update(fields.filter((_, j) => j !== i))
                        setSel(null)
                      }}
                    >
                      ✕
                    </IconBtn>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <select className="input w-auto" value={addType} onChange={(e) => setAddType(e.target.value as FieldType)} aria-label="Field type">
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {FIELD_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  update([...fields, newField(addType, fields)])
                  setSel(fields.length)
                }}
              >
                + Add field
              </button>
            </div>
          </div>

          <div className="panel content-start p-5 xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
            {!f || sel === null ? (
              <p className="text-sm text-fg-3">Select a field to edit it.</p>
            ) : (
              <Inspector key={sel} field={f} earlier={fields.slice(0, sel)} onChange={(p) => patch(sel, p)} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function clean(f: FormField): FormField {
  const out = { ...f }
  for (const k of Object.keys(out) as (keyof FormField)[]) if (out[k] === '' || out[k] === undefined || Number.isNaN(out[k] as number)) delete out[k]
  return out
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid h-7 w-7 place-items-center rounded-xs text-fg-3 hover:bg-ink-4 hover:text-fg">
      {children}
    </button>
  )
}

function Inspector({ field: f, earlier, onChange }: { field: FormField; earlier: FormField[]; onChange: (p: Partial<FormField>) => void }) {
  const num = (v: string) => (v === '' ? undefined : Number(v))
  const display = DISPLAY_ONLY.includes(f.type)
  const textual = ['short_text', 'long_text', 'ign', 'game_uid'].includes(f.type)
  return (
    <div className="grid gap-4 text-sm">
      <p className="t-label">{FIELD_TYPE_LABEL[f.type]}</p>
      <L label={display ? 'Text' : 'Label / question'}>
        <textarea className="input" rows={2} value={f.label} onChange={(e) => onChange({ label: e.target.value })} />
      </L>
      {!display && (
        <>
          <L label="Key" help="Stored with each answer. Lowercase letters, numbers and _ .">
            <input className="input input-mono" value={f.id} onChange={(e) => onChange({ id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
          </L>
          <L label="Help text">
            <input className="input" value={f.help ?? ''} onChange={(e) => onChange({ help: e.target.value })} />
          </L>
          <div className="grid grid-cols-2 gap-3">
            <label className="choice">
              <input type="checkbox" checked={f.required} onChange={(e) => onChange({ required: e.target.checked })} />
              <span>Required</span>
            </label>
            <label className="choice">
              <input type="checkbox" checked={f.scope === 'player'} onChange={(e) => onChange({ scope: e.target.checked ? 'player' : 'entry' })} />
              <span>Ask each player</span>
            </label>
          </div>
        </>
      )}
      {(textual || f.type === 'number' || f.type === 'phone') && (
        <L label="Placeholder">
          <input className="input" value={f.placeholder ?? ''} onChange={(e) => onChange({ placeholder: e.target.value })} />
        </L>
      )}
      {textual && (
        <div className="grid grid-cols-2 gap-3">
          <L label="Min length">
            <input type="number" min={0} className="input" value={f.minLength ?? ''} onChange={(e) => onChange({ minLength: num(e.target.value) })} />
          </L>
          <L label="Max length">
            <input type="number" min={1} className="input" value={f.maxLength ?? ''} onChange={(e) => onChange({ maxLength: num(e.target.value) })} />
          </L>
        </div>
      )}
      {f.type === 'number' && (
        <div className="grid grid-cols-2 gap-3">
          <L label="Minimum">
            <input type="number" className="input" value={f.min ?? ''} onChange={(e) => onChange({ min: num(e.target.value) })} />
          </L>
          <L label="Maximum">
            <input type="number" className="input" value={f.max ?? ''} onChange={(e) => onChange({ max: num(e.target.value) })} />
          </L>
          <label className="choice col-span-2">
            <input type="checkbox" checked={!!f.integer} onChange={(e) => onChange({ integer: e.target.checked })} />
            <span>Whole numbers only</span>
          </label>
        </div>
      )}
      {CHOICE_TYPES.includes(f.type) && (
        <div className="grid gap-2">
          <span className="field-label">Options</span>
          {(f.options ?? []).map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_7rem_auto] gap-2">
              <input
                className="input"
                value={o.label}
                aria-label="Option label"
                onChange={(e) => onChange({ options: f.options!.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
              />
              <input
                className="input input-mono"
                value={o.value}
                aria-label="Option value"
                onChange={(e) => onChange({ options: f.options!.map((x, j) => (j === i ? { ...x, value: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') } : x)) })}
              />
              <IconBtn label="Remove option" onClick={() => onChange({ options: f.options!.filter((_, j) => j !== i) })}>
                ✕
              </IconBtn>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost justify-self-start" onClick={() => onChange({ options: [...(f.options ?? []), { value: `option_${(f.options?.length ?? 0) + 1}`, label: `Option ${(f.options?.length ?? 0) + 1}` }] })}>
            + Option
          </button>
          {f.type === 'multi_choice' && (
            <div className="grid grid-cols-2 gap-3">
              <L label="Min selections">
                <input type="number" min={0} className="input" value={f.minSelections ?? ''} onChange={(e) => onChange({ minSelections: num(e.target.value) })} />
              </L>
              <L label="Max selections">
                <input type="number" min={1} className="input" value={f.maxSelections ?? ''} onChange={(e) => onChange({ maxSelections: num(e.target.value) })} />
              </L>
            </div>
          )}
        </div>
      )}
      {f.type === 'file' && (
        <div className="grid gap-2">
          <span className="field-label">Accepted formats</span>
          <div className="flex gap-2">
            {IMAGE_MIME.map((m) => (
              <label key={m} className="choice">
                <input
                  type="checkbox"
                  checked={(f.accept ?? []).includes(m)}
                  onChange={(e) => onChange({ accept: e.target.checked ? [...(f.accept ?? []), m] : (f.accept ?? []).filter((x) => x !== m) })}
                />
                <span>{m.split('/')[1].toUpperCase()}</span>
              </label>
            ))}
          </div>
          <L label="Max size (MB, up to 4)">
            <input type="number" min={0.1} max={4} step={0.1} className="input" value={f.maxSizeMB ?? ''} onChange={(e) => onChange({ maxSizeMB: num(e.target.value) })} />
          </L>
        </div>
      )}
      {textual && (
        <>
          <L label="Custom validation (regular expression)" help="Optional. Example: ^[A-Z]{2,4}$">
            <input className="input input-mono" value={f.pattern ?? ''} onChange={(e) => onChange({ pattern: e.target.value })} />
          </L>
          {f.pattern && (
            <L label="Message when it doesn’t match">
              <input className="input" value={f.patternMessage ?? ''} onChange={(e) => onChange({ patternMessage: e.target.value })} />
            </L>
          )}
        </>
      )}

      <ConditionEditor
        title="Show only when"
        value={f.visibleWhen}
        fields={earlier.filter((x) => !DISPLAY_ONLY.includes(x.type) && (f.scope === 'player' || x.scope === 'entry'))}
        onChange={(c) => onChange({ visibleWhen: c })}
      />
      {!display && (
        <>
          <ConditionEditor
            title="Eligibility: block entry when"
            value={f.disqualifyWhen}
            fields={[...earlier, f].filter((x) => !DISPLAY_ONLY.includes(x.type) && (f.scope === 'player' || x.scope === 'entry'))}
            onChange={(c) => onChange({ disqualifyWhen: c })}
          />
          {f.disqualifyWhen && (
            <L label="Message shown to ineligible applicants">
              <input className="input" value={f.disqualifyMessage ?? ''} onChange={(e) => onChange({ disqualifyMessage: e.target.value })} />
            </L>
          )}
        </>
      )}
    </div>
  )
}

function ConditionEditor({ title, value, fields, onChange }: { title: string; value?: Condition; fields: FormField[]; onChange: (c: Condition | undefined) => void }) {
  if (!value) {
    return (
      <button type="button" disabled={!fields.length} className="btn btn-sm btn-ghost justify-self-start" onClick={() => onChange({ mode: 'all', rules: [{ field: fields[0].id, op: 'equals', value: '' }] })}>
        + {title}
      </button>
    )
  }
  return (
    <div className="grid gap-2 rounded-sm border border-line-2 p-3">
      <div className="flex items-center justify-between">
        <span className="field-label !mb-0">{title}</span>
        <button type="button" className="t-label hover:text-bad" onClick={() => onChange(undefined)}>
          Remove
        </button>
      </div>
      <select className="input" value={value.mode} onChange={(e) => onChange({ ...value, mode: e.target.value as 'all' | 'any' })} aria-label="Match mode">
        <option value="all">All of these are true</option>
        <option value="any">Any of these is true</option>
      </select>
      {value.rules.map((r, i) => {
        const target = fields.find((x) => x.id === r.field)
        const set = (p: Partial<typeof r>) => onChange({ ...value, rules: value.rules.map((x, j) => (j === i ? { ...x, ...p } : x)) })
        return (
          <div key={i} className="grid gap-2 border-t border-line pt-2">
            <select className="input" value={r.field} onChange={(e) => set({ field: e.target.value })} aria-label="Field">
              {fields.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label.slice(0, 40)}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <select className="input" value={r.op} onChange={(e) => set({ op: e.target.value as typeof r.op })} aria-label="Operator">
                {CONDITION_OPS.map((o) => (
                  <option key={o} value={o}>
                    {OP_LABEL[o]}
                  </option>
                ))}
              </select>
              {NO_VALUE.includes(r.op) ? (
                <span />
              ) : target?.options ? (
                <select className="input" value={String(r.value ?? '')} onChange={(e) => set({ value: e.target.value })} aria-label="Value">
                  <option value="">—</option>
                  {target.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input" value={String(r.value ?? '')} onChange={(e) => set({ value: e.target.value })} aria-label="Value" />
              )}
              <IconBtn label="Remove rule" onClick={() => (value.rules.length > 1 ? onChange({ ...value, rules: value.rules.filter((_, j) => j !== i) }) : onChange(undefined))}>
                ✕
              </IconBtn>
            </div>
          </div>
        )
      })}
      {value.rules.length < 10 && (
        <button type="button" className="t-label justify-self-start hover:text-fg" onClick={() => onChange({ ...value, rules: [...value.rules, { field: fields[0].id, op: 'equals', value: '' }] })}>
          + rule
        </button>
      )}
    </div>
  )
}

function L({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="field-label !mb-0">{label}</span>
      {children}
      {help && <span className="field-help !mt-0">{help}</span>}
    </label>
  )
}

function Preview({ schema }: { schema: FormSchema }) {
  const [entry, setEntry] = useState<Answers>({})
  const [player, setPlayer] = useState<Answers>({})
  const valid = formSchemaSchema.safeParse(schema).success
  if (!valid) return <p className="text-warn">Fix the form’s errors to preview it.</p>
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="panel grid content-start gap-5 p-6">
        <p className="t-label">Team questions · as applicants see them</p>
        {schema.intro && <p className="text-fg-2">{schema.intro}</p>}
        {visibleFields(schema, 'entry', entry).map((f) => (
          <DynamicField key={f.id} field={f} value={entry[f.id]} onChange={(v) => setEntry((a) => ({ ...a, [f.id]: v }))} />
        ))}
      </div>
      <div className="panel grid content-start gap-5 p-6">
        <p className="t-label">Per-player questions · one block per player</p>
        {visibleFields(schema, 'player', player, entry).map((f) => (
          <DynamicField key={f.id} field={f} value={player[f.id]} onChange={(v) => setPlayer((a) => ({ ...a, [f.id]: v }))} />
        ))}
        {!schema.fields.some((f) => f.scope === 'player') && <p className="text-sm text-fg-3">No per-player questions.</p>}
      </div>
    </div>
  )
}
