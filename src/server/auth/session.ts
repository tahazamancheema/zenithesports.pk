import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { can, SURFACE_GATE, type ConsoleSurface, type Permission, type Role } from '@/lib/permissions'
import { audit, type Actor } from '../audit'
import { randomToken, sha256, verifyAgainstDummy, verifyPassword } from '../crypto'
import { db } from '../db'
import { isProd } from '../env'
import { consume, resetLimit } from '../rate-limit'
import { ipHash, userAgent } from '../request'

const ABSOLUTE_HOURS = 12
const IDLE_MINUTES = 60
const LOCK_AFTER = 8
const LOCK_MINUTES = 15

/**
 * One admin panel, one session. The cookie is host-only (`__Host-` in
 * production) on the main site, where the panel lives; what a person can do is
 * decided by their roles, checked on every page and action.
 */
export function cookieName() {
  return isProd ? '__Host-zx_admin' : 'zx_admin'
}

export type Staff = {
  id: string
  email: string
  displayName: string
  roles: Role[]
  /** Games this person's tournament work is limited to; null means every game. */
  gameScope: string[] | null
  mustChangePassword: boolean
  surface: ConsoleSurface
  sessionId: string
}

/** Owners, administrators and tournament managers work on every game; scoped roles on their assigned games. */
export function gameScopeFor(roles: Role[], games: string[]): string[] | null {
  if (roles.some((r) => r === 'super_admin' || r === 'senior_admin' || r === 'tournament_admin')) return null
  if (roles.includes('game_manager')) return games
  return games.length ? games : null
}

/** True when this person may work on tournaments of `gameId`. */
export const inGameScope = (staff: Pick<Staff, 'gameScope'>, gameId: string | null | undefined) =>
  staff.gameScope === null || (gameId != null && staff.gameScope.includes(gameId))

export class AuthError extends Error {
  constructor(message = 'You do not have permission to do that.') {
    super(message)
  }
}

export const actorOf = async (s: Staff): Promise<Actor> => ({
  id: s.id,
  label: s.email,
  surface: s.surface,
  ipHash: await ipHash(),
})

/** Reads and validates the admin session. Cached per request; the surface argument is historical. */
export const getStaff = cache(async (surface: ConsoleSurface = 'hq'): Promise<Staff | null> => {
  const token = (await cookies()).get(cookieName())?.value
  if (!token || token.length < 32) return null
  const id = sha256(token)
  const [row] = await db()<
    { id: string; email: string; displayName: string; mustChangePassword: boolean; roles: Role[]; games: string[]; lastSeenAt: Date }[]
  >`
    select u.id, u.email, u.display_name, u.must_change_password, s.last_seen_at,
           coalesce(array_agg(distinct r.role) filter (where r.role is not null), '{}') as roles,
           coalesce((select array_agg(g.game_id) from zenith.staff_game_scopes g where g.user_id = u.id), '{}') as games
      from zenith.sessions s
      join zenith.staff_users u on u.id = s.user_id
      left join zenith.staff_roles r on r.user_id = u.id
     where s.id = ${id}
       and s.revoked_at is null
       and s.expires_at > now()
       and s.last_seen_at > now() - make_interval(mins => ${IDLE_MINUTES})
       and u.status = 'active'
     group by u.id, s.last_seen_at
  `
  if (!row) return null
  if (Date.now() - new Date(row.lastSeenAt).getTime() > 5 * 60 * 1000) {
    // Best effort: a busy row must never fail or stall the page; the next request retries.
    await db()`update zenith.sessions set last_seen_at = now() where id = ${id} and last_seen_at < now() - interval '5 minutes'`.catch(() => {})
  }
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    roles: row.roles,
    gameScope: gameScopeFor(row.roles, row.games),
    mustChangePassword: row.mustChangePassword,
    surface,
    sessionId: id,
  }
})

/** For pages: redirect to the console login when signed out or unauthorised. */
export async function requirePage(
  surface: ConsoleSurface,
  opts: { permission?: Permission; base: string; allowPasswordChange?: boolean },
) {
  const staff = await getStaff(surface)
  if (!staff) redirect(`${opts.base}/login`)
  if (!can(staff.roles, SURFACE_GATE[surface])) redirect(`${opts.base}/login?denied=1`)
  if (staff.mustChangePassword && !opts.allowPasswordChange) redirect(`${opts.base}/password`)
  if (opts.permission && !can(staff.roles, opts.permission)) redirect(`${opts.base}?denied=1`)
  return staff
}

/** For actions and route handlers: throws instead of redirecting. */
export async function requireStaff(surface: ConsoleSurface, permission: Permission): Promise<Staff> {
  const staff = await getStaff(surface)
  if (!staff) throw new AuthError('Your session has ended. Sign in again.')
  // A bootstrap/reset password is single-use: nothing privileged until it is changed.
  if (staff.mustChangePassword) throw new AuthError('Change your initial password before continuing.')
  if (!can(staff.roles, SURFACE_GATE[surface]) || !can(staff.roles, permission)) throw new AuthError()
  return staff
}

export type LoginResult = { ok: true } | { ok: false; error: string }

/**
 * Console passwords are for local development (and as an emergency switch).
 * With Supabase configured, staff sign in with Google or email instead.
 */
export function staffPasswordLogin() {
  const sso = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  return process.env.STAFF_PASSWORD_LOGIN === '1' || !sso
}

export async function login(surface: ConsoleSurface, emailRaw: string, password: string): Promise<LoginResult> {
  if (!staffPasswordLogin()) return { ok: false, error: 'Sign in with Google or email above.' }
  const email = emailRaw.trim().toLowerCase()
  const ip = await ipHash()
  const generic = 'Email or password is incorrect.'
  try {
    await consume(`login:ip:${ip}`, 20, 15 * 60)
    await consume(`login:acct:${email}`, 10, 15 * 60)
  } catch {
    return { ok: false, error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }
  }

  const [user] = await db()<
    { id: string; passwordHash: string | null; status: string; lockedUntil: Date | null; roles: Role[] }[]
  >`
    select u.id, u.password_hash, u.status, u.locked_until,
           coalesce(array_agg(r.role) filter (where r.role is not null), '{}') as roles
      from zenith.staff_users u
      left join zenith.staff_roles r on r.user_id = u.id
     where lower(u.email) = ${email}
     group by u.id
  `
  if (!user || !user.passwordHash) {
    await verifyAgainstDummy(password)
    return { ok: false, error: generic }
  }
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    await verifyAgainstDummy(password)
    return { ok: false, error: 'This account is temporarily locked after repeated failures. Try again later.' }
  }
  const valid = await verifyPassword(password, user.passwordHash)
  const actor: Actor = { id: user.id, label: email, surface, ipHash: ip }
  if (!valid || user.status !== 'active') {
    await db()`
      update zenith.staff_users
         set failed_attempts = failed_attempts + 1,
             locked_until = case when failed_attempts + 1 >= ${LOCK_AFTER}
                                 then now() + make_interval(mins => ${LOCK_MINUTES}) else locked_until end
       where id = ${user.id}
    `
    await audit(db(), actor, 'auth.login_failed', { type: 'staff_user', id: user.id })
    return { ok: false, error: generic }
  }
  if (!can(user.roles, SURFACE_GATE[surface])) {
    await audit(db(), actor, 'auth.login_denied_surface', { type: 'staff_user', id: user.id })
    return { ok: false, error: 'Your account has no admin role yet. Ask an Owner to give you one.' }
  }

  await startSession(surface, user.id, actor, 'auth.login')
  await resetLimit(`login:acct:${email}`)
  return { ok: true }
}

/** Creates the per-console session row and cookie. */
async function startSession(surface: ConsoleSurface, userId: string, actor: Actor, action: string) {
  const token = randomToken(32)
  const ip = await ipHash()
  await db().begin(async (tx) => {
    await tx`update zenith.staff_users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = ${userId}`
    await tx`
      insert into zenith.sessions (id, user_id, surface, expires_at, ip_hash, user_agent)
      values (${sha256(token)}, ${userId}, 'hq', now() + make_interval(hours => ${ABSOLUTE_HOURS}), ${ip}, ${await userAgent()})
    `
    await audit(tx, actor, action, { type: 'staff_user', id: userId })
  })
  ;(await cookies()).set(cookieName(), token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: ABSOLUTE_HOURS * 3600,
  })
}

/**
 * Opens a console session for someone already signed in with Supabase Auth.
 * The staff record is matched by its linked Supabase user, or — the first time —
 * by the same verified email, and then linked so the email alone never matters again.
 */
export async function enterWithAccount(
  surface: ConsoleSurface,
  account: { id: string; email: string; emailVerified: boolean; providers: string[] },
): Promise<LoginResult> {
  const ip = await ipHash()
  if (!account.emailVerified) return { ok: false, error: 'Verify your email address with the sign-in provider first.' }
  try {
    await consume(`login:ip:${ip}`, 20, 15 * 60)
  } catch {
    return { ok: false, error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }
  }
  const email = account.email.toLowerCase()
  const [user] = await db()<{ id: string; status: string; authUserId: string | null; roles: Role[] }[]>`
    select u.id, u.status, u.auth_user_id,
           coalesce(array_agg(r.role) filter (where r.role is not null), '{}') as roles
      from zenith.staff_users u
      left join zenith.staff_roles r on r.user_id = u.id
     where u.auth_user_id = ${account.id} or (u.auth_user_id is null and lower(u.email) = ${email})
     group by u.id
     order by (u.auth_user_id is not null) desc
     limit 1
  `
  const actor: Actor = { id: user?.id ?? null, label: email, surface, ipHash: ip }
  if (!user || user.status !== 'active') {
    await audit(db(), actor, 'auth.sso_denied', { type: 'staff_user', id: user?.id ?? null })
    return { ok: false, error: 'This account is not a Zenith staff account. Ask a super administrator to add your email.' }
  }
  if (!can(user.roles, SURFACE_GATE[surface])) {
    await audit(db(), actor, 'auth.login_denied_surface', { type: 'staff_user', id: user.id })
    return { ok: false, error: 'Your account has no admin role yet. Ask an Owner to give you one.' }
  }
  if (!user.authUserId) {
    // First link of a staff record to a sign-in. Google proves the address belongs to this person.
    // An email/password account only proves it if the Supabase project requires email confirmation,
    // which the website cannot check, so that route stays off unless explicitly enabled.
    const trusted = account.providers.includes('google') || account.providers.includes('local') || process.env.STAFF_EMAIL_LINKING === '1'
    if (!trusted) {
      await audit(db(), actor, 'auth.sso_link_refused', { type: 'staff_user', id: user.id })
      return { ok: false, error: 'For your first staff sign-in, use “Sign in with Google” with this email address.' }
    }
    // Any bootstrap password is no longer needed.
    await db()`update zenith.staff_users set auth_user_id = ${account.id}, must_change_password = false where id = ${user.id} and auth_user_id is null`
    await audit(db(), actor, 'auth.sso_linked', { type: 'staff_user', id: user.id })
  }
  await startSession(surface, user.id, actor, 'auth.login_sso')
  return { ok: true }
}

export async function logout(surface: ConsoleSurface) {
  const jar = await cookies()
  const token = jar.get(cookieName())?.value
  if (token) {
    const staff = await getStaff(surface)
    await db()`update zenith.sessions set revoked_at = now() where id = ${sha256(token)} and revoked_at is null`
    if (staff) await audit(db(), await actorOf(staff), 'auth.logout', { type: 'staff_user', id: staff.id })
  }
  jar.delete(cookieName())
}

/** Revoke every session of a user (role change, disable, password reset). */
export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await db()`
    update zenith.sessions set revoked_at = now()
     where user_id = ${userId} and revoked_at is null and id is distinct from ${exceptSessionId ?? null}
  `
}
