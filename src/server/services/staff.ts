import 'server-only'
import { isEmail } from '@/lib/normalize'
import { ROLES, type Role } from '@/lib/permissions'
import { audit, type Actor } from '../audit'
import { hashPassword, randomToken, verifyPassword } from '../crypto'
import { db, isUniqueViolation, type Db } from '../db'
import { revokeAllSessions, type Staff } from '../auth/session'

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return 'Use at least 12 characters.'
  if (pw.length > 200) return 'That password is too long.'
  if (new Set(pw).size < 6) return 'Use a less repetitive password.'
  return null
}

export async function listStaff() {
  return db()<{ id: string; email: string; displayName: string; status: string; roles: Role[]; lastLoginAt: Date | null; createdAt: Date }[]>`
    select u.id, u.email, u.display_name, u.status, u.last_login_at, u.created_at,
           coalesce(array_agg(r.role order by r.role) filter (where r.role is not null), '{}') as roles
      from zenith.staff_users u left join zenith.staff_roles r on r.user_id = u.id
     group by u.id order by u.created_at
  `
}

/** Creates an account with a one-time password the person must change on first sign-in. */
export async function createStaff(d: { email: string; displayName: string; roles: Role[] }, actor: Actor) {
  const email = d.email.trim().toLowerCase()
  if (!isEmail(email)) throw new Error('Enter a valid email.')
  if (!d.displayName.trim()) throw new Error('Enter a display name.')
  const roles = d.roles.filter((r) => ROLES.includes(r))
  if (!roles.length) throw new Error('Choose at least one role.')
  const temp = randomToken(12)
  try {
    await db().begin(async (tx) => {
      const [u] = await tx<{ id: string }[]>`
        insert into zenith.staff_users (email, display_name, password_hash, must_change_password, created_by)
        values (${email}, ${d.displayName.trim().slice(0, 80)}, ${await hashPassword(temp)}, true, ${actor.id}) returning id
      `
      for (const r of roles) await tx`insert into zenith.staff_roles (user_id, role, granted_by) values (${u.id}, ${r}, ${actor.id})`
      await audit(tx, actor, 'staff.created', { type: 'staff_user', id: u.id }, { roles })
    })
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error('An account with this email already exists.')
    throw e
  }
  return temp
}

async function superAdminCount(conn: Db = db()) {
  const [{ n }] = await conn<{ n: number }[]>`
    select count(*)::int as n from zenith.staff_roles r join zenith.staff_users u on u.id = r.user_id
     where r.role = 'super_admin' and u.status = 'active'
  `
  return n
}

export async function setRoles(userId: string, roles: Role[], actor: Actor) {
  const next = roles.filter((r) => ROLES.includes(r))
  await db().begin(async (tx) => {
    await tx`select 1 from zenith.staff_users where id = ${userId} for update`
    const current = (await tx<{ role: Role }[]>`select role from zenith.staff_roles where user_id = ${userId}`).map((r) => r.role)
    if (current.includes('super_admin') && !next.includes('super_admin') && (await superAdminCount(tx)) <= 1) {
      throw new Error('There must always be at least one active super administrator.')
    }
    await tx`delete from zenith.staff_roles where user_id = ${userId}`
    for (const r of next) await tx`insert into zenith.staff_roles (user_id, role, granted_by) values (${userId}, ${r}, ${actor.id})`
    await audit(tx, actor, 'staff.roles', { type: 'staff_user', id: userId }, { from: current, to: next })
  })
  // Privileges changed: force fresh sessions.
  await revokeAllSessions(userId)
}

export async function setStaffStatus(userId: string, status: 'active' | 'disabled', actor: Actor) {
  if (userId === actor.id && status === 'disabled') throw new Error('You cannot disable your own account.')
  await db().begin(async (tx) => {
    const [u] = await tx<{ id: string }[]>`select id from zenith.staff_users where id = ${userId} for update`
    if (!u) throw new Error('Account not found.')
    if (status === 'disabled') {
      const [isSuper] = await tx`select 1 from zenith.staff_roles where user_id = ${userId} and role = 'super_admin'`
      if (isSuper && (await superAdminCount(tx)) <= 1) throw new Error('There must always be at least one active super administrator.')
    }
    await tx`update zenith.staff_users set status = ${status} where id = ${userId}`
    await audit(tx, actor, `staff.${status}`, { type: 'staff_user', id: userId })
  })
  if (status === 'disabled') await revokeAllSessions(userId)
}

export async function resetPassword(userId: string, actor: Actor) {
  const temp = randomToken(12)
  await db()`update zenith.staff_users set password_hash = ${await hashPassword(temp)}, must_change_password = true, failed_attempts = 0, locked_until = null where id = ${userId}`
  await audit(db(), actor, 'staff.password_reset', { type: 'staff_user', id: userId })
  await revokeAllSessions(userId)
  return temp
}

export async function changeOwnPassword(staff: Staff, current: string, next: string) {
  const problem = passwordProblem(next)
  if (problem) return { ok: false as const, error: problem }
  const [u] = await db()<{ passwordHash: string }[]>`select password_hash from zenith.staff_users where id = ${staff.id}`
  if (!u || !(await verifyPassword(current, u.passwordHash))) return { ok: false as const, error: 'Your current password is incorrect.' }
  if (current === next) return { ok: false as const, error: 'Choose a new password.' }
  await db()`update zenith.staff_users set password_hash = ${await hashPassword(next)}, must_change_password = false where id = ${staff.id}`
  await audit(db(), { id: staff.id, label: staff.email, surface: staff.surface }, 'staff.password_changed', { type: 'staff_user', id: staff.id })
  await revokeAllSessions(staff.id, staff.sessionId)
  return { ok: true as const }
}

export async function listAudit(f: { entityType?: string; action?: string; page?: number }) {
  const page = Math.max(1, f.page ?? 1)
  return db()<{ id: number; at: Date; actorLabel: string; surface: string | null; action: string; entityType: string | null; entityId: string | null; details: Record<string, unknown> }[]>`
    select id, at, actor_label, surface, action, entity_type, entity_id, details from zenith.audit_events
     where (${f.entityType ?? null}::text is null or entity_type = ${f.entityType ?? null})
       and (${f.action ?? null}::text is null or action like ${(f.action ?? '') + '%'})
     order by id desc limit 100 offset ${(page - 1) * 100}
  `
}
