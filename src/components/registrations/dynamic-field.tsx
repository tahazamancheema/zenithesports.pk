'use client'

import { useId } from 'react'
import type { AnswerValue } from '@/lib/forms/engine'
import type { FormField } from '@/lib/forms/schema'

/** Renders one form-builder field. Used by the registration flow and the builder's live preview. */
export function DynamicField({
  field,
  value,
  onChange,
  error,
  uidHint,
}: {
  field: FormField
  value: AnswerValue
  onChange: (v: AnswerValue) => void
  error?: string
  uidHint?: string
}) {
  const id = useId()
  if (field.type === 'heading') {
    return <h3 className="t-display pt-4 text-base">{field.label}</h3>
  }
  if (field.type === 'paragraph') {
    return <p className="whitespace-pre-line-safe text-fg-2">{field.label}</p>
  }
  const described = [field.help || (field.type === 'game_uid' && uidHint) ? `${id}-h` : null, error ? `${id}-e` : null].filter(Boolean).join(' ') || undefined
  const common = {
    id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': described,
    required: field.required,
  }
  const str = typeof value === 'string' || typeof value === 'number' ? String(value) : ''

  const label = (
    <span className="field-label" id={`${id}-l`}>
      {field.label}
      {field.required ? <span className="ml-1 text-[var(--accent)]" aria-hidden>*</span> : <span className="ml-2 text-xs font-normal text-fg-3">optional</span>}
    </span>
  )

  let control: React.ReactNode
  switch (field.type) {
    case 'long_text':
      control = <textarea {...common} className="input" rows={4} maxLength={field.maxLength ?? 2000} placeholder={field.placeholder} value={str} onChange={(e) => onChange(e.target.value)} />
      break
    case 'number':
      control = <input {...common} type="number" inputMode="decimal" className="input input-mono" min={field.min} max={field.max} step={field.integer ? 1 : 'any'} value={str} onChange={(e) => onChange(e.target.value)} />
      break
    case 'email':
      control = <input {...common} type="email" autoComplete="email" className="input" value={str} onChange={(e) => onChange(e.target.value)} />
      break
    case 'phone':
      control = <input {...common} type="tel" autoComplete="tel" className="input input-mono" placeholder={field.placeholder ?? '03XX XXXXXXX'} value={str} onChange={(e) => onChange(e.target.value)} />
      break
    case 'game_uid':
      control = <input {...common} className="input input-mono" autoComplete="off" value={str} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      break
    case 'dropdown':
      control = (
        <select {...common} className="input" value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'single_choice':
      return (
        <fieldset aria-describedby={described}>
          <legend>{label}</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {field.options?.map((o) => (
              <label key={o.value} className="choice">
                <input type="radio" name={`${id}-r`} checked={str === o.value} onChange={() => onChange(o.value)} />
                <span className="text-sm">{o.label}</span>
              </label>
            ))}
          </div>
          <Help id={id} field={field} error={error} />
        </fieldset>
      )
    case 'multi_choice': {
      const list = Array.isArray(value) ? value : []
      return (
        <fieldset aria-describedby={described}>
          <legend>{label}</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {field.options?.map((o) => (
              <label key={o.value} className="choice">
                <input type="checkbox" checked={list.includes(o.value)} onChange={(e) => onChange(e.target.checked ? [...list, o.value] : list.filter((x) => x !== o.value))} />
                <span className="text-sm">{o.label}</span>
              </label>
            ))}
          </div>
          <Help id={id} field={field} error={error} />
        </fieldset>
      )
    }
    case 'consent':
      return (
        <div>
          <label className="choice">
            <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} aria-invalid={error ? true : undefined} aria-describedby={described} />
            <span className="text-sm text-fg-2">
              {field.label}
              {field.required && <span className="ml-1 text-[var(--accent)]" aria-hidden>*</span>}
            </span>
          </label>
          <Help id={id} field={field} error={error} />
        </div>
      )
    case 'file': {
      const f = value as { name?: string; size?: number } | null
      return (
        <div>
          {label}
          <label htmlFor={id} className="flex cursor-pointer items-center gap-4 rounded-sm border border-dashed border-line-3 px-4 py-4 hover:border-[var(--accent)]">
            <span className="btn btn-sm btn-ghost pointer-events-none">Choose image</span>
            <span className="truncate text-sm text-fg-2">{f?.name ? `${f.name} · ${((f.size ?? 0) / 1048576).toFixed(2)} MB` : 'No file chosen'}</span>
            <input
              id={id}
              type="file"
              className="sr-only"
              accept={(field.accept ?? ['image/png', 'image/jpeg', 'image/webp']).join(',')}
              onChange={(e) => onChange((e.target.files?.[0] as unknown as AnswerValue) ?? null)}
              aria-describedby={described}
            />
          </label>
          <Help id={id} field={field} error={error} />
        </div>
      )
    }
    default:
      control = (
        <input
          {...common}
          className="input"
          maxLength={field.maxLength ?? (field.type === 'ign' ? 40 : 200)}
          placeholder={field.placeholder}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {control}
      <Help id={id} field={field} error={error} uidHint={field.type === 'game_uid' ? uidHint : undefined} />
    </div>
  )
}

function Help({ id, field, error, uidHint }: { id: string; field: FormField; error?: string; uidHint?: string }) {
  if (error)
    return (
      <p id={`${id}-e`} className="field-error" role="alert">
        {error}
      </p>
    )
  const h = field.help ?? uidHint
  return h ? (
    <p id={`${id}-h`} className="field-help">
      {h}
    </p>
  ) : null
}
