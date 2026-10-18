'use client'

import { useActionState, useState } from 'react'
import { emailSignInAction, emailSignUpAction, googleSignInAction, localSignInAction, resetPasswordAction, updatePasswordAction } from '@/app/actions/auth'
import { IDLE } from '@/lib/action-state'

function Alert({ state }: { state: { status: string; message?: string } }) {
  if (state.status === 'idle' || !state.message) return null
  return (
    <p role={state.status === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-[14px] ${state.status === 'error' ? 'border-bad/40 text-bad' : 'border-ok/40 text-ok'}`}>
      {state.message}
    </p>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  )
}

export function GoogleButton({ next, label = 'Continue with Google' }: { next: string; label?: string }) {
  return (
    <form action={googleSignInAction}>
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-white font-sans text-[15px] font-semibold text-[#1f1f1f] transition-[filter] hover:brightness-95">
        <GoogleIcon />
        {label}
      </button>
    </form>
  )
}

/** Email sign-in, sign-up and reset, switched in place. */
export function EmailAuth({ next }: { next: string }) {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [inState, inAction, inPending] = useActionState(emailSignInAction, IDLE)
  const [upState, upAction, upPending] = useActionState(emailSignUpAction, IDLE)
  const [rsState, rsAction, rsPending] = useActionState(resetPasswordAction, IDLE)
  const state = mode === 'in' ? inState : mode === 'up' ? upState : rsState
  const action = mode === 'in' ? inAction : mode === 'up' ? upAction : rsAction
  const pending = inPending || upPending || rsPending
  const v = state.values ?? {}
  return (
    <div>
      <div role="tablist" className="grid grid-cols-2 rounded-md border border-line-2 p-1 text-[14px]">
        {(['in', 'up'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded py-2 font-medium transition-colors ${mode === m ? 'bg-ink-3 text-fg' : 'text-fg-2 hover:text-fg'}`}>
            {m === 'in' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>
      <form action={action} className="mt-5 grid gap-4" key={mode}>
        <input type="hidden" name="next" value={next} />
        <Alert state={state} />
        {mode === 'up' && (
          <label className="grid gap-1.5">
            <span className="field-label">Your name</span>
            <input name="name" className="input" autoComplete="name" maxLength={80} defaultValue={v.name} />
          </label>
        )}
        <label className="grid gap-1.5">
          <span className="field-label">Email</span>
          <input name="email" type="email" required className="input" autoComplete="email" defaultValue={v.email} />
        </label>
        {mode !== 'reset' && (
          <label className="grid gap-1.5">
            <span className="field-label">Password</span>
            <input name="password" type="password" required minLength={mode === 'up' ? 10 : undefined} className="input" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} />
            {mode === 'up' && <span className="field-help">At least 10 characters.</span>}
          </label>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? 'One moment…' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}
        </button>
        <div className="flex justify-between text-[14px] text-fg-2">
          {mode !== 'reset' ? (
            <button type="button" className="hover:text-fg" onClick={() => setMode('reset')}>
              Forgot your password?
            </button>
          ) : (
            <button type="button" className="hover:text-fg" onClick={() => setMode('in')}>
              ← Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export function LocalSignIn({ next }: { next: string }) {
  const [state, action, pending] = useActionState(localSignInAction, IDLE)
  const v = state.values ?? {}
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Alert state={state} />
      <label className="grid gap-1.5">
        <span className="field-label">Email</span>
        <input name="email" type="email" required className="input" defaultValue={v.email} />
      </label>
      <label className="grid gap-1.5">
        <span className="field-label">Name</span>
        <input name="name" className="input" maxLength={80} defaultValue={v.name} />
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? 'One moment…' : 'Sign in (local test)'}
      </button>
    </form>
  )
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, IDLE)
  return (
    <form action={action} className="grid gap-4">
      <Alert state={state} />
      <label className="grid gap-1.5">
        <span className="field-label">New password</span>
        <input name="password" type="password" required minLength={10} className="input" autoComplete="new-password" />
      </label>
      <label className="grid gap-1.5">
        <span className="field-label">Repeat new password</span>
        <input name="confirm" type="password" required minLength={10} className="input" autoComplete="new-password" />
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? 'Saving…' : 'Save password'}
      </button>
    </form>
  )
}
