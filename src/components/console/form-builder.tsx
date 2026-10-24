'use client'

import { useMemo, useState, useTransition } from 'react'
import { publishDraftAction, saveDraftAction } from '@/app/actions/console'
import { visibleFields, type Answers } from '@/lib/forms/engine'
import {
  CHOICE_TYPES,
  CONDITION_OPS,
  DISPLAY_ONLY,
  FIELD_TYPE_HINT,
  FIELD_TYPE_LABEL,
  IMAGE_MIME,
  formSchemaSchema,
  type Condition,
  type FieldType,
  type FormField,
  type FormSchema,
} from '@/lib/forms/schema'
import { libraryField, QUESTION_LIBRARY } from '@/lib/forms/presets'
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

/** A key for answers, derived from the question: "Team tag" → team_tag. */
function slug(label: string, fallback: string) {
  const s = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36)
  return /^[a-z]/.test(s) && s.length > 1 ? s : fallback
}

function uniqueKey(base: string, taken: string[]) {
  let id = base
  let n = 2
  while (taken.includes(id)) id = `${base.slice(0, 36)}_${n++}`
  return id
}

/** The order questions are offered in: the common ones first. */
const ADD_ORDER: FieldType[] = ['short_text', 'single_choice', 'dropdown', 'multi_choice', 'number', 'long_text', 'file', 'consent', 'ign', 'game_uid', 'phone', 'email', 'heading', 'paragraph']

function newField(type: FieldType, existing: FormField[]): FormField {
  const label = type === 'heading' ? 'New section' : type === 'paragraph' ? 'Explain what this section is for.' : type === 'consent' ? 'I agree to …' : 'New question'
  const id = uniqueKey(type.split('_')[0], existing.map((f) => f.id))
  const base: FormField = { id, type, label, required: type === 'consent', scope: 'entry' }
  if (CHOICE_TYPES.includes(type)) base.options = [{ value: 'option_1', label: 'Option 1' }, { value: 'option_2', label: 'Option 2' }]
  if (type === 'file') {
    base.accept = ['image/png', 'image/jpeg', 'image/webp']
    base.maxSizeMB = 4
  }
  return base
}

export function FormBuilder({ templateId, initial, presets = [] }: { templateId: string; initial: FormSchema; presets?: { gameId: string; name: string; schema: FormSchema }[] }) {
  const [schema, setSchema] = useState<FormSchema>(initial)
  const [open, setOpen] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
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
    setOpen(j)
  }
  const add = (f: FormField) => {
    update([...fields, f])
    setOpen(fields.length)
    setAdding(false)
  }

  function save(thenPublish: boolean) {
    start(async () => {
      const r = await saveDraftAction(templateId, schema)
      if (r.status !== 'success') return setMsg({ ok: false, text: r.message ?? 'Could not save.' })
      setDirty(false)
      if (!thenPublish) return setMsg({ ok: true, text: 'Saved. Publish when it is ready for tournaments.' })
      const p = await publishDraftAction(templateId)
      setMsg({ ok: p.status === 'success', text: p.status === 'success' ? 'Published. Tournaments can now use this version.' : (p.message ?? 'Could not publish.') })
    })
  }

  return (
    <div className="grid gap-6">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex gap-2" role="tablist">
          {(['edit', 'preview'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}>
              {t === 'edit' ? 'Questions' : 'Preview'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!valid.success && <span className="text-sm text-warn">{valid.error.issues[0]?.message}</span>}
          {msg && <span className={`text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</span>}
          {dirty && !msg && <span className="t-label">Unsaved changes</span>}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => save(false)} disabled={pending || !valid.success}>
            Save draft
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => save(true)} disabled={pending || !valid.success}>
            {pending ? 'Saving…' : 'Save & publish'}
          </button>
        </div>
      </div>

      {tab === 'preview' ? (
        <Preview schema={schema} />
      ) : (
        <div className="mx-auto grid w-full max-w-3xl gap-4">
          <p className="text-sm text-fg-2">
            Team name, the captain’s WhatsApp and every player’s in-game name and ID are always collected. Add only what this tournament needs on top.
          </p>
          <label className="grid gap-2">
            <span className="field-label">Introduction (optional, shown above the questions)</span>
            <textarea className="input" rows={2} value={schema.intro ?? ''} onChange={(e) => update(fields, e.target.value)} maxLength={2000} />
          </label>

          {fields.length === 0 && presets.length > 0 && (
            <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-fg-2">Start from a ready-made form and edit it.</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p.gameId} type="button" className="btn btn-sm btn-ghost" onClick={() => update(p.schema.fields, schema.intro || p.schema.intro)}>
                    Use {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ol className="grid gap-3">
            {fields.map((f, i) => (
              <li key={f.id + i} className={`panel overflow-hidden ${open === i ? 'border-line-3' : ''}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open === i}>
                    <span className="font-mono text-[12px] text-fg-3">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{f.label}</span>
                      <span className="block text-[12.5px] text-fg-3">
                        {FIELD_TYPE_LABEL[f.type]}
                        {f.required && ' · required'}
                        {f.scope === 'player' && ' · each player'}
                        {f.visibleWhen && ' · conditional'}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <IconBtn label="Move up" onClick={() => move(i, -1)}>↑</IconBtn>
                    <IconBtn label="Move down" onClick={() => move(i, 1)}>↓</IconBtn>
                    <IconBtn
                      label="Duplicate"
                      onClick={() => {
                        const copy = { ...structuredClone(f), id: uniqueKey(f.id, fields.map((x) => x.id)) }
                        update([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)])
                        setOpen(i + 1)
                      }}
                    >
                      ⧉
                    </IconBtn>
                    <IconBtn
                      label="Delete"
                      onClick={() => {
                        update(fields.filter((_, j) => j !== i))
                        setOpen(null)
                      }}
                    >
                      ✕
                    </IconBtn>
                  </div>
                </div>
                {open === i && (
                  <div className="border-t border-line bg-ink-2/40 p-4">
                    <QuestionEditor field={f} others={fields.filter((_, j) => j !== i).map((x) => x.id)} earlier={fields.slice(0, i)} onChange={(p) => patch(i, p)} />
                  </div>
                )}
              </li>
            ))}
          </ol>

          {adding ? (
            <div className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="t-label">Add a question</p>
                <button type="button" className="t-label hover:text-fg" onClick={() => setAdding(false)}>
                  Close
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ADD_ORDER.map((t) => (
                  <button key={t} type="button" onClick={() => add(newField(t, fields))} className="rounded-sm border border-line-2 px-3 py-2.5 text-left transition-colors hover:border-line-3 hover:bg-ink-2">
                    <span className="block text-sm font-medium">{FIELD_TYPE_LABEL[t]}</span>
                    <span className="block text-[12.5px] text-fg-3">{FIELD_TYPE_HINT[t]}</span>
                  </button>
                ))}
              </div>
              <p className="t-label mt-5 mb-2">Or a common question, ready to go</p>
              <div className="flex flex-wrap gap-2">
                {QUESTION_LIBRARY.map((x) => (
                  <button key={x.key} type="button" className="rounded-full border border-line-2 px-3 py-1 text-[13px] text-fg-2 transition-colors hover:border-line-3 hover:text-fg" onClick={() => add(libraryField(x.key, fields))}>
                    + {x.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost justify-self-start" onClick={() => setAdding(true)}>
              + Add a question
            </button>
          )}
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

/**
 * One question: what everyone needs up front (the question, its type, whether
 * it is required or asked of each player, the choices), and everything else
 * under "More settings".
 */
function QuestionEditor({ field: f, others, earlier, onChange }: { field: FormField; others: string[]; earlier: FormField[]; onChange: (p: Partial<FormField>) => void }) {
  const num = (v: string) => (v === '' ? undefined : Number(v))
  const display = DISPLAY_ONLY.includes(f.type)
  const textual = ['short_text', 'long_text', 'ign', 'game_uid'].includes(f.type)
  // The answer key follows the question text until someone sets it by hand under More settings.
  const autoKey = f.id === uniqueKey(slug(f.label, f.id), others) || /^[a-z]+(_\d+)?$/.test(f.id)
  const setLabel = (label: string) => onChange(display || !autoKey ? { label } : { label, id: uniqueKey(slug(label, f.id), others) })
  const setOptions = (labels: string[]) => {
    const taken: string[] = []
    onChange({
      options: labels.map((label, i) => {
        const value = uniqueKey(slug(label, `option_${i + 1}`).slice(0, 40).replace(/[^a-z0-9_-]/g, ''), taken)
        taken.push(value)
        return { value, label }
      }),
    })
  }
  return (
    <div className="grid gap-4 text-sm">
      <L label={display ? 'Text' : 'Question'}>
        <input className="input" value={f.label} onChange={(e) => setLabel(e.target.value)} maxLength={300} />
      </L>
      <div className="grid gap-3 sm:grid-cols-2">
        <L label="Type">
          <select
            className="input"
            value={f.type}
            onChange={(e) => {
              const type = e.target.value as FieldType
              onChange({ type, options: CHOICE_TYPES.includes(type) ? (f.options ?? [{ value: 'option_1', label: 'Option 1' }]) : undefined, required: DISPLAY_ONLY.includes(type) ? false : f.required })
            }}
          >
            {ADD_ORDER.map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </L>
        {!display && (
          <L label="Help text (optional)">
            <input className="input" value={f.help ?? ''} onChange={(e) => onChange({ help: e.target.value })} maxLength={600} />
          </L>
        )}
      </div>
      {!display && (
        <div className="flex flex-wrap gap-3">
          <label className="choice">
            <input type="checkbox" checked={f.required} onChange={(e) => onChange({ required: e.target.checked })} />
            <span>Required</span>
          </label>
          <label className="choice">
            <input type="checkbox" checked={f.scope === 'player'} onChange={(e) => onChange({ scope: e.target.checked ? 'player' : 'entry' })} />
            <span>Ask each player separately</span>
          </label>
        </div>
      )}
      {CHOICE_TYPES.includes(f.type) && (
        <div className="grid gap-2">
          <span className="field-label !mb-0">Choices</span>
          {(f.options ?? []).map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2">
              <input
                className="input"
                value={o.label}
                aria-label={`Choice ${i + 1}`}
                onChange={(e) => setOptions((f.options ?? []).map((x, j) => (j === i ? e.target.value : x.label)))}
              />
              <IconBtn label="Remove choice" onClick={() => setOptions((f.options ?? []).filter((_, j) => j !== i).map((x) => x.label))}>
                ✕
              </IconBtn>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost justify-self-start" onClick={() => setOptions([...(f.options ?? []).map((x) => x.label), `Option ${(f.options?.length ?? 0) + 1}`])}>
            + Choice
          </button>
        </div>
      )}

      <details className="rounded-sm border border-line p-3">
        <summary className="t-label cursor-pointer hover:text-fg">More settings</summary>
        <div className="mt-4 grid gap-4">
          {!display && (
            <L label="Answer key" help="Used in exports. Filled in from the question; change it only if you need a specific column name.">
              <input className="input input-mono" value={f.id} onChange={(e) => onChange({ id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
            </L>
          )}
          {(textual || f.type === 'number' || f.type === 'phone') && (
            <L label="Placeholder">
              <input className="input" value={f.placeholder ?? ''} onChange={(e) => onChange({ placeholder: e.target.value })} />
            </L>
          )}
          {textual && (
            <div className="grid grid-cols-2 gap-3">
              <L label="Shortest answer (characters)">
                <input type="number" min={0} className="input" value={f.minLength ?? ''} onChange={(e) => onChange({ minLength: num(e.target.value) })} />
              </L>
              <L label="Longest answer (characters)">
                <input type="number" min={1} className="input" value={f.maxLength ?? ''} onChange={(e) => onChange({ maxLength: num(e.target.value) })} />
              </L>
            </div>
          )}
          {f.type === 'number' && (
            <div className="grid grid-cols-2 gap-3">
              <L label="Lowest allowed">
                <input type="number" className="input" value={f.min ?? ''} onChange={(e) => onChange({ min: num(e.target.value) })} />
              </L>
              <L label="Highest allowed">
                <input type="number" className="input" value={f.max ?? ''} onChange={(e) => onChange({ max: num(e.target.value) })} />
              </L>
              <label className="choice col-span-2">
                <input type="checkbox" checked={!!f.integer} onChange={(e) => onChange({ integer: e.target.checked })} />
                <span>Whole numbers only</span>
              </label>
            </div>
          )}
          {f.type === 'multi_choice' && (
            <div className="grid grid-cols-2 gap-3">
              <L label="Pick at least">
                <input type="number" min={0} className="input" value={f.minSelections ?? ''} onChange={(e) => onChange({ minSelections: num(e.target.value) })} />
              </L>
              <L label="Pick at most">
                <input type="number" min={1} className="input" value={f.maxSelections ?? ''} onChange={(e) => onChange({ maxSelections: num(e.target.value) })} />
              </L>
            </div>
          )}
          {f.type === 'file' && (
            <div className="grid gap-2">
              <span className="field-label !mb-0">Accepted formats</span>
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
              <L label="Largest file (MB, up to 4)">
                <input type="number" min={0.1} max={4} step={0.1} className="input" value={f.maxSizeMB ?? ''} onChange={(e) => onChange({ maxSizeMB: num(e.target.value) })} />
              </L>
            </div>
          )}
          {textual && (
            <>
              <L label="Answer must match (regular expression)" help="Optional, for technical formats. Example: ^[A-Z]{2,4}$">
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
            title="Only show this when…"
            value={f.visibleWhen}
            fields={earlier.filter((x) => !DISPLAY_ONLY.includes(x.type) && (f.scope === 'player' || x.scope === 'entry'))}
            onChange={(c) => onChange({ visibleWhen: c })}
          />
          {!display && (
            <>
              <ConditionEditor
                title="Turn the entry away when…"
                value={f.disqualifyWhen}
                fields={[...earlier, f].filter((x) => !DISPLAY_ONLY.includes(x.type) && (f.scope === 'player' || x.scope === 'entry'))}
                onChange={(c) => onChange({ disqualifyWhen: c })}
              />
              {f.disqualifyWhen && (
                <L label="Message shown to teams that are turned away">
                  <input className="input" value={f.disqualifyMessage ?? ''} onChange={(e) => onChange({ disqualifyMessage: e.target.value })} />
                </L>
              )}
            </>
          )}
        </div>
      </details>
    </div>
  )
}

function ConditionEditor({ title, value, fields, onChange }: { title: string; value?: Condition; fields: FormField[]; onChange: (c: Condition | undefined) => void }) {
  // Read before any handler: the React Compiler evaluates property paths used in closures while rendering,
  // so `fields[0].id` inside onClick would crash when there are no earlier fields.
  const firstId = fields[0]?.id ?? ''
  if (!value) {
    return (
      <button type="button" disabled={!fields.length} className="btn btn-sm btn-ghost justify-self-start" onClick={() => onChange({ mode: 'all', rules: [{ field: firstId, op: 'equals', value: '' }] })}>
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
        <button type="button" className="t-label justify-self-start hover:text-fg" onClick={() => onChange({ ...value, rules: [...value.rules, { field: firstId, op: 'equals', value: '' }] })}>
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
