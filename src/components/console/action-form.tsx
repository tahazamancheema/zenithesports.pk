'use client'

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from 'react'
import { IDLE, type ActionState } from '@/lib/action-state'

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>

/**
 * Any console mutation: server-rendered inputs, client-side pending/error/success feedback.
 * Submits manually so a refused action never wipes what the reviewer typed (React resets
 * `<form action>` forms after every submission); the form resets only after success.
 */
export function ActionForm({
  action,
  children,
  className = '',
  submit,
  submitClass = 'btn btn-sm btn-primary',
  confirm,
  inline = false,
}: {
  action: Action
  children?: ReactNode
  className?: string
  submit?: ReactNode
  submitClass?: string
  confirm?: string
  inline?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, IDLE)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.status === 'success') ref.current?.reset()
  }, [state])
  return (
    <form
      ref={ref}
      className={inline ? `inline-flex flex-wrap items-center gap-2 ${className}` : `grid gap-4 ${className}`}
      onSubmit={(e) => {
        e.preventDefault()
        if (pending) return
        if (confirm && !window.confirm(confirm)) return
        const fd = new FormData(e.currentTarget)
        startTransition(() => formAction(fd))
      }}
      aria-busy={pending}
    >
      {children}
      {submit && (
        <button type="submit" className={submitClass} disabled={pending}>
          {pending ? '…' : submit}
        </button>
      )}
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-bad">
          {state.message}
        </p>
      )}
      {state.status === 'success' && state.message && (
        <p role="status" className="text-sm text-ok">
          {state.message}
        </p>
      )}
      {state.status === 'success' && state.data?.temp && (
        <p className="rounded-sm border border-warn/40 bg-ink-2 px-3 py-2 font-mono text-sm">
          One-time password: <strong className="select-all text-fg">{state.data.temp}</strong>
          <span className="mt-1 block font-sans text-xs text-fg-3">Shown once. It is not stored in readable form.</span>
        </p>
      )}
    </form>
  )
}
