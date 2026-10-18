'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ConsoleSurface } from '@/lib/permissions'
import { failure, type ActionState } from '@/server/action-guard'
import { getAccount, localAuthEnabled, localSignIn, safeNext, signOutEverywhere, supabaseConfigured, supabaseServer } from '@/server/auth/account'
import { enterWithAccount } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { env } from '@/server/env'
import { consume } from '@/server/rate-limit'
import { assertSameOrigin, ipHash } from '@/server/request'

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

/** This request's own origin — only for hosts we serve, never an arbitrary Host header. */
async function origin() {
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').toLowerCase()
  const bare = host.split(':')[0]
  const ours = bare === env.ROOT_DOMAIN || bare.endsWith(`.${env.ROOT_DOMAIN}`) || bare === 'localhost' || bare === '127.0.0.1'
  if (!ours) throw new Error('Unknown host.')
  const proto = h.get('x-forwarded-proto') ?? (bare === 'localhost' || bare === '127.0.0.1' ? 'http' : 'https')
  return `${proto}://${host}`
}

async function limit(kind: string, max = 10) {
  await consume(`auth:${kind}:${await ipHash()}`, max, 15 * 60)
}

/** Supabase error text is safe to show for sign-in problems; keep it short. */
const authMessage = (m: string | undefined) => {
  if (!m) return 'Sign-in failed. Please try again.'
  if (/invalid login credentials/i.test(m)) return 'Email or password is incorrect.'
  if (/email not confirmed/i.test(m)) return 'Confirm your email first — check your inbox for the link.'
  return m.slice(0, 160)
}

export async function googleSignInAction(fd: FormData) {
  await assertSameOrigin()
  if (!supabaseConfigured()) redirect('/login?error=unavailable')
  await limit('oauth', 20)
  const next = safeNext(s(fd, 'next'))
  const { data, error } = await (await supabaseServer()).auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: 'select_account' } },
  })
  if (error || !data.url) redirect(`/login?error=oauth&next=${encodeURIComponent(next)}`)
  redirect(data.url)
}

export async function emailSignInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = { email: s(fd, 'email') }
  const next = safeNext(s(fd, 'next'))
  try {
    await assertSameOrigin()
    await limit('password')
    if (!supabaseConfigured()) return { status: 'error', message: 'Sign-in is not configured yet.', values }
    const { error } = await (await supabaseServer()).auth.signInWithPassword({ email: values.email, password: String(fd.get('password') ?? '') })
    if (error) return { status: 'error', message: authMessage(error.message), values }
  } catch (e) {
    return failure(e, values)
  }
  redirect(next)
}

export async function emailSignUpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = { email: s(fd, 'email'), name: s(fd, 'name') }
  try {
    await assertSameOrigin()
    await limit('signup', 5)
    if (!supabaseConfigured()) return { status: 'error', message: 'Sign-up is not configured yet.', values }
    const password = String(fd.get('password') ?? '')
    if (password.length < 10) return { status: 'error', message: 'Use a password of at least 10 characters.', values }
    const next = safeNext(s(fd, 'next'))
    const { data, error } = await (await supabaseServer()).auth.signUp({
      email: values.email,
      password,
      options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`, data: { full_name: values.name.slice(0, 80) } },
    })
    if (error) return { status: 'error', message: authMessage(error.message), values }
    if (data.session) redirect(next) // confirmation disabled in the project: signed in straight away
    return { status: 'success', message: 'Check your inbox — we sent a link to confirm your email.' }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e // redirect
    return failure(e, values)
  }
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = { email: s(fd, 'email') }
  try {
    await assertSameOrigin()
    await limit('reset', 5)
    if (!supabaseConfigured()) return { status: 'error', message: 'Sign-in is not configured yet.', values }
    await (await supabaseServer()).auth.resetPasswordForEmail(values.email, { redirectTo: `${await origin()}/auth/callback?next=/account/password` })
    // Same answer whether or not the address has an account.
    return { status: 'success', message: 'If that address has an account, a reset link is on its way.' }
  } catch (e) {
    return failure(e, values)
  }
}

export async function updatePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin()
    if (!(await getAccount())) return { status: 'error', message: 'Your sign-in link has expired. Request a new one.' }
    const password = String(fd.get('password') ?? '')
    if (password.length < 10) return { status: 'error', message: 'Use a password of at least 10 characters.' }
    if (password !== String(fd.get('confirm') ?? '')) return { status: 'error', message: 'The passwords do not match.' }
    const { error } = await (await supabaseServer()).auth.updateUser({ password })
    if (error) return { status: 'error', message: authMessage(error.message) }
    return { status: 'success', message: 'Password updated.' }
  } catch (e) {
    return failure(e)
  }
}

export async function localSignInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = { email: s(fd, 'email'), name: s(fd, 'name') }
  try {
    await assertSameOrigin()
    if (!localAuthEnabled()) return { status: 'error', message: 'Local sign-in is disabled.', values }
    await localSignIn(values.email, values.name)
  } catch (e) {
    if (e instanceof Error && /valid email/.test(e.message)) return { status: 'error', message: e.message, values }
    return failure(e, values)
  }
  redirect(safeNext(s(fd, 'next')))
}

export async function signOutAction() {
  await assertSameOrigin()
  await signOutEverywhere()
  redirect('/')
}

/** A signed-in staff member opens a session for one console — an explicit step, never automatic. */
export async function consoleEnterAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const surface = s(fd, 'surface') as ConsoleSurface
  if (!['hq', 'registrations', 'anticheat'].includes(surface)) return { status: 'error', message: 'Unknown console.' }
  try {
    await assertSameOrigin()
    const account = await getAccount()
    if (!account) return { status: 'error', message: 'Sign in first.' }
    const r = await enterWithAccount(surface, account)
    if (!r.ok) return { status: 'error', message: r.error }
  } catch (e) {
    return failure(e)
  }
  redirect(await consoleBase(surface))
}
