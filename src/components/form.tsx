'use client'

import { useId, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import type { ActionState } from '@/server/action-guard'

/** Honeypot (hidden from people and assistive tech) + signed timing token. */
export function FormGuard({ token }: { token: string }) {
  return (
    <>
      <input type="hidden" name="_ft" value={token} />
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
    </>
  )
}

export function Field({
  label,
  name,
  error,
  help,
  required,
  children,
  className = '',
}: {
  label: ReactNode
  name: string
  error?: string
  help?: ReactNode
  required?: boolean
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string; name: string; required?: boolean }) => ReactNode
  className?: string
}) {
  const id = useId()
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="ml-1 text-[var(--accent)]" aria-hidden>*</span> : <span className="ml-2 text-xs font-normal text-fg-3">optional</span>}
      </label>
      {children({ id, name, required, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {help && !error && (
        <p id={`${id}-help`} className="field-help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function SubmitButton({ children, pendingLabel = 'Sending…', className = 'btn btn-primary' }: { children: ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span aria-hidden className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function FormAlert({ state }: { state: ActionState }) {
  if (state.status !== 'error' || !state.message) return null
  return (
    <div role="alert" className="flex gap-3 rounded-sm border border-[color-mix(in_oklab,var(--color-bad)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-bad)_7%,transparent)] px-4 py-3 text-sm text-fg">
      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-bad" />
      <span>{state.message}</span>
    </div>
  )
}

/** The success state for any intake form: a reference, and what happens next. */
export function SuccessPanel({ title, reference, children }: { title: string; reference?: string; children?: ReactNode }) {
  return (
    <div className="panel-raised relative overflow-hidden p-8" role="status" style={{ animation: 'rise 700ms var(--ease-out-expo) both' }}>
      <svg viewBox="0 0 120 40" className="h-10 w-28" aria-hidden>
        <path d="M2 30 C 30 30, 50 6, 80 6" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="draw-path is-in" style={{ '--len': 110 } as React.CSSProperties} />
        <g transform="translate(86 6) rotate(45)">
          <rect x="-5" y="-5" width="10" height="10" fill="var(--accent)" />
        </g>
      </svg>
      <p className="t-display mt-5 text-xl">{title}</p>
      {reference && (
        <p className="mt-4 font-mono text-sm text-fg-2">
          Reference <span className="ml-2 rounded-xs border border-line-2 px-2 py-1 text-fg">{reference}</span>
        </p>
      )}
      <div className="mt-5 text-fg-2">{children}</div>
    </div>
  )
}
