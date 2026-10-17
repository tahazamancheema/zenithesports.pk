'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { ROLES, type ConsoleSurface, type Permission, type Role } from '@/lib/permissions'
import { REGISTRATION_STATUSES, type RegistrationStatus } from '@/lib/tournament'
import { failure, type ActionState } from '@/server/action-guard'
import { AuthError, actorOf, getStaff, login, logout, requireStaff, type Staff } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { UploadError } from '@/server/files'
import { deliverPending } from '@/server/notify'
import { OriginError, assertSameOrigin } from '@/server/request'
import * as adminT from '@/server/services/admin-tournaments'
import * as ac from '@/server/services/anticheat'
import * as content from '@/server/services/content'
import * as intake from '@/server/services/intake'
import { adminSetLft } from '@/server/services/lft'
import { transition, TransitionError, updateMember } from '@/server/services/registrations'
import * as staffSvc from '@/server/services/staff'
import { saveSetting, SETTINGS_SCHEMA, type SettingsKey } from '@/server/settings'

const SURFACES: ConsoleSurface[] = ['hq', 'registrations', 'anticheat']
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

/** Origin check + session for this console + the specific permission. */
async function gate(surface: ConsoleSurface, permission: Permission): Promise<Staff> {
  await assertSameOrigin()
  return requireStaff(surface, permission)
}

function fail(e: unknown): ActionState {
  if (
    e instanceof AuthError ||
    e instanceof TransitionError ||
    e instanceof ac.ReviewError ||
    e instanceof UploadError ||
    e instanceof OriginError
  ) {
    return { status: 'error', message: e.message }
  }
  // Service-layer validation errors are plain Errors with user-facing text. Database and
  // driver errors carry a code and are never shown (they can name internal objects).
  const isDriverError = e instanceof Error && ('code' in e || e.name === 'PostgresError')
  if (e instanceof Error && !isDriverError && e.message.length < 200) {
    return { status: 'error', message: e.message }
  }
  return failure(e)
}

const ok = (message?: string, data?: Record<string, string>): ActionState => {
  refresh()
  return { status: 'success', message, data }
}

// ─── auth ───────────────────────────────────────────────────────────────────

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const surface = s(fd, 'surface') as ConsoleSurface
  if (!SURFACES.includes(surface)) return { status: 'error', message: 'Unknown console.' }
  try {
    await assertSameOrigin()
    const r = await login(surface, s(fd, 'email'), String(fd.get('password') ?? ''))
    if (!r.ok) return { status: 'error', message: r.error, values: { email: s(fd, 'email') } }
  } catch (e) {
    return failure(e)
  }
  redirect(await consoleBase(surface))
}

export async function logoutAction(fd: FormData) {
  const surface = s(fd, 'surface') as ConsoleSurface
  if (!SURFACES.includes(surface)) return
  await assertSameOrigin()
  await logout(surface)
  redirect(`${await consoleBase(surface)}/login`)
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const surface = s(fd, 'surface') as ConsoleSurface
  try {
    await assertSameOrigin()
    const staff = await getStaff(surface)
    if (!staff) return { status: 'error', message: 'Your session has ended. Sign in again.' }
    if (String(fd.get('next')) !== String(fd.get('confirm'))) return { status: 'error', message: 'The new passwords do not match.' }
    const r = await staffSvc.changeOwnPassword(staff, String(fd.get('current') ?? ''), String(fd.get('next') ?? ''))
    if (!r.ok) return { status: 'error', message: r.error }
  } catch (e) {
    return failure(e)
  }
  redirect(await consoleBase(surface))
}

// ─── registrations console ──────────────────────────────────────────────────

export async function saveTournamentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const raw = Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === 'string' && !k.startsWith('$')).map(([k, v]) => [k, String(v)]))
  try {
    const staff = await gate('registrations', 'tournaments.manage')
    const id = raw.id || null
    const r = await adminT.saveTournament(id, raw, await actorOf(staff))
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: r.fieldErrors, values: raw }
    if (!id) redirect(`${await consoleBase('registrations')}/tournaments/${r.id}`)
    return ok('Saved.')
  } catch (e) {
    if (isRedirect(e)) throw e
    return { ...fail(e), values: raw }
  }
}

export async function tournamentStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'tournaments.manage')
    const to = s(fd, 'to') as 'draft' | 'published' | 'archived' | 'cancelled'
    if (!['draft', 'published', 'archived', 'cancelled'].includes(to)) return { status: 'error', message: 'Unknown status.' }
    await adminT.setTournamentStatus(s(fd, 'id'), to, s(fd, 'reason') || null, await actorOf(staff))
    after(() => deliverPending())
    return ok(`Tournament ${to}.`)
  } catch (e) {
    return fail(e)
  }
}

export async function registrationStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'registrations.review')
    const to = s(fd, 'to') as RegistrationStatus
    if (!REGISTRATION_STATUSES.includes(to)) return { status: 'error', message: 'Unknown status.' }
    const ids = fd.getAll('ids').map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 100)
    if (!ids.length) return { status: 'error', message: 'Select at least one registration.' }
    const reason = s(fd, 'reason') || null
    if ((to === 'rejected' || to === 'disqualified') && !reason) return { status: 'error', message: 'Give a reason — the team will see it.' }
    const actor = await actorOf(staff)
    const failed: string[] = []
    for (const id of ids) {
      try {
        await transition(id, to, actor, reason)
      } catch (e) {
        failed.push(e instanceof Error ? e.message : 'failed')
      }
    }
    if (failed.length === ids.length) return { status: 'error', message: failed[0] }
    return ok(failed.length ? `${ids.length - failed.length} updated, ${failed.length} skipped (${failed[0]})` : `${ids.length} updated.`)
  } catch (e) {
    return fail(e)
  }
}

export async function updateMemberAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'registrations.review')
    const r = await updateMember(s(fd, 'memberId'), { ign: s(fd, 'ign'), uid: s(fd, 'uid'), phone: s(fd, 'phone') || null }, await actorOf(staff))
    return r.ok ? ok('Roster updated and re-checked.') : { status: 'error', message: r.error }
  } catch (e) {
    return fail(e)
  }
}

export async function createTemplateAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'forms.manage')
    const id = await adminT.createTemplate(s(fd, 'name'), s(fd, 'description'), s(fd, 'gameId') || null, s(fd, 'copyFrom') || null, await actorOf(staff))
    redirect(`${await consoleBase('registrations')}/forms/${id}`)
  } catch (e) {
    if (isRedirect(e)) throw e
    return fail(e)
  }
}

export async function saveDraftAction(templateId: string, schema: unknown): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'forms.manage')
    const r = await adminT.saveDraft(templateId, schema, await actorOf(staff))
    return r.ok ? ok('Draft saved.') : { status: 'error', message: r.error }
  } catch (e) {
    return fail(e)
  }
}

export async function publishDraftAction(templateId: string): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'forms.manage')
    await adminT.publishDraft(templateId, await actorOf(staff))
    return ok('Published. Attach the new version to tournaments that should use it.')
  } catch (e) {
    return fail(e)
  }
}

export async function gameSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'tournaments.manage')
    const actor = await actorOf(staff)
    const op = s(fd, 'op')
    if (op === 'availability') {
      const a = s(fd, 'availability') as 'active' | 'upcoming' | 'planned' | 'paused'
      if (!['active', 'upcoming', 'planned', 'paused'].includes(a)) return { status: 'error', message: 'Unknown availability.' }
      await adminT.setGameAvailability(s(fd, 'gameId'), a, actor)
    } else if (op === 'format') {
      await adminT.setFormatEnabled(s(fd, 'formatId'), s(fd, 'enabled') === 'true', actor)
    } else if (op === 'rules') {
      await adminT.updateGameRules(s(fd, 'gameId'), { uidLabel: s(fd, 'uidLabel'), uidHint: s(fd, 'uidHint'), uidPattern: s(fd, 'uidPattern') }, actor)
    }
    return ok('Saved.')
  } catch (e) {
    return fail(e)
  }
}

export async function lftAdminAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('registrations', 'lft.manage')
    const st = s(fd, 'status') as 'active' | 'matched' | 'withdrawn' | 'hidden'
    if (!['active', 'matched', 'withdrawn', 'hidden'].includes(st)) return { status: 'error', message: 'Unknown status.' }
    await adminSetLft(s(fd, 'id'), st, s(fd, 'note') || null, await actorOf(staff))
    return ok('Updated.')
  } catch (e) {
    return fail(e)
  }
}

// ─── anticheat console ──────────────────────────────────────────────────────

export async function reviewReportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('anticheat', 'anticheat.review')
    const decision = s(fd, 'decision') as 'approve' | 'reject' | 'needs_clarification'
    if (!['approve', 'reject', 'needs_clarification'].includes(decision)) return { status: 'error', message: 'Choose a decision.' }
    await ac.reviewReport(
      s(fd, 'id'),
      {
        decision,
        uidMatch: fd.get('uidMatch') === 'yes',
        reason: s(fd, 'reason'),
        note: s(fd, 'note'),
        severity: (s(fd, 'severity') || 'banned') as 'watch' | 'suspended' | 'banned',
        category: (s(fd, 'category') || 'cheating') as 'cheating',
      },
      await actorOf(staff),
    )
    return ok(decision === 'approve' ? 'Approved. A verified flag was created and the history scanned.' : 'Decision recorded.')
  } catch (e) {
    return fail(e)
  }
}

export async function purgeReportEvidenceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('anticheat', 'anticheat.evidence.purge')
    const n = await ac.purgeReportEvidence(s(fd, 'id'), await actorOf(staff))
    return ok(`${n} file(s) purged.`)
  } catch (e) {
    return fail(e)
  }
}

function identifiersFrom(fd: FormData) {
  const kinds = fd.getAll('idKind').map(String)
  const values = fd.getAll('idValue').map(String)
  const conf = fd.getAll('idConfidence').map(String)
  return kinds
    .map((k, i) => ({ kind: k as 'game_uid' | 'phone' | 'team_name' | 'ign', value: (values[i] ?? '').trim(), confidence: (conf[i] ?? 'indicator') as ac.Confidence }))
    .filter((x) => x.value && ['game_uid', 'phone', 'team_name', 'ign'].includes(x.kind) && ['confirmed', 'strong', 'indicator'].includes(x.confidence))
}

export async function createFlagAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, String(v)]))
  try {
    const staff = await gate('anticheat', 'anticheat.flag')
    const id = await ac.createFlag(
      {
        gameId: s(fd, 'gameId'),
        subjectUid: s(fd, 'subjectUid'),
        subjectIgn: s(fd, 'subjectIgn'),
        teamName: s(fd, 'teamName'),
        category: s(fd, 'category') as 'cheating',
        severity: s(fd, 'severity') as 'banned',
        summary: s(fd, 'summary'),
        decision: { title: s(fd, 'recordTitle'), text: s(fd, 'recordText') },
        expiresAt: s(fd, 'expiresAt') ? new Date(s(fd, 'expiresAt')) : null,
        identifiers: identifiersFrom(fd),
      },
      await actorOf(staff),
    )
    redirect(`${await consoleBase('anticheat')}/flags/${id}`)
  } catch (e) {
    if (isRedirect(e)) throw e
    return { ...fail(e), values }
  }
}

export async function flagOpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const op = s(fd, 'op')
    const id = s(fd, 'id')
    if (op === 'lift') {
      const staff = await gate('anticheat', 'anticheat.lift')
      await ac.liftFlag(id, s(fd, 'reason'), await actorOf(staff))
      return ok('Flag lifted; its open alerts were resolved.')
    }
    const staff = await gate('anticheat', 'anticheat.flag')
    const actor = await actorOf(staff)
    if (op === 'identifier') {
      const [i] = identifiersFrom(fd)
      if (!i) return { status: 'error', message: 'Enter an identifier.' }
      await ac.addFlagIdentifier(id, { ...i, note: s(fd, 'note') }, actor)
      return ok('Identifier added and history rescanned.')
    }
    if (op === 'note') {
      const { db } = await import('@/server/db')
      await ac.addNote(db(), 'flag', id, s(fd, 'body'), actor)
      return ok('Note added.')
    }
    if (op === 'rescan') {
      const r = await ac.runScan({ trigger: 'manual', flagId: id, actor })
      return ok(`Scan complete: ${r.alertsCreated} new, ${r.alertsUpdated} re-detected.`)
    }
    return { status: 'error', message: 'Unknown operation.' }
  } catch (e) {
    return fail(e)
  }
}

export async function alertStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('anticheat', 'anticheat.review')
    const to = s(fd, 'to') as ac.AlertStatus
    if (!['open', 'acknowledged', 'dismissed', 'resolved'].includes(to)) return { status: 'error', message: 'Unknown status.' }
    await ac.setAlertStatus(s(fd, 'id'), to, s(fd, 'note') || null, await actorOf(staff))
    return ok('Alert updated.')
  } catch (e) {
    return fail(e)
  }
}

export async function scanAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const op = s(fd, 'op')
    if (op === 'purge') {
      const staff = await gate('anticheat', 'anticheat.evidence.purge')
      const n = await ac.purgeExpiredEvidence(await actorOf(staff))
      return ok(`${n} expired evidence file(s) purged.`)
    }
    const staff = await gate('anticheat', 'anticheat.scan')
    const r = await ac.runScan({ trigger: (s(fd, 'trigger') || 'manual') as 'manual', actor: await actorOf(staff), resumeRunId: s(fd, 'resume') || undefined })
    return ok(`Scanned ${r.flagsDone} flag(s): ${r.alertsCreated} new alert(s), ${r.alertsUpdated} re-detected.`)
  } catch (e) {
    return fail(e)
  }
}

export async function manualEntryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, String(v)]))
  try {
    const staff = await gate('anticheat', 'anticheat.manual_entry')
    const igns = fd.getAll('ign').map(String)
    const uids = fd.getAll('uid').map(String)
    const phones = fd.getAll('phone').map(String)
    const players = igns.map((ign, i) => ({ ign, uid: uids[i] ?? '', phone: phones[i] ?? '' })).filter((p) => p.ign.trim() || p.uid.trim())
    const r = await ac.manualEntry({ gameId: s(fd, 'gameId'), teamName: s(fd, 'teamName'), players }, await actorOf(staff))
    return ok(
      r.flagsMatched ? `Saved. ${r.flagsMatched} flag(s) matched; ${r.alertsCreated} new alert(s) raised.` : 'Saved. No active flags matched.',
    )
  } catch (e) {
    return { ...fail(e), values }
  }
}

// ─── HQ console ─────────────────────────────────────────────────────────────

export async function bookingStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('hq', 'intake.manage')
    const to = s(fd, 'to') as intake.BookingStatus
    if (!(to in intake.BOOKING_TRANSITIONS)) return { status: 'error', message: 'Unknown status.' }
    await intake.setBookingStatus(s(fd, 'id'), to, s(fd, 'note') || null, await actorOf(staff))
    after(() => deliverPending())
    return ok(to === 'confirmed' ? 'Booking confirmed.' : 'Booking updated.')
  } catch (e) {
    return fail(e)
  }
}

export async function inquiryStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('hq', 'intake.manage')
    const st = s(fd, 'status') as 'new'
    if (!['new', 'contacted', 'qualified', 'closed', 'spam'].includes(st)) return { status: 'error', message: 'Unknown status.' }
    await intake.setInquiryStatus(s(fd, 'id'), st, s(fd, 'note') || null, await actorOf(staff))
    return ok('Updated.')
  } catch (e) {
    return fail(e)
  }
}

export async function messageStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('hq', 'intake.manage')
    const st = s(fd, 'status')
    if (!['new', 'replied', 'closed', 'spam'].includes(st)) return { status: 'error', message: 'Unknown status.' }
    const { db } = await import('@/server/db')
    const { audit } = await import('@/server/audit')
    await db()`update zenith.contact_messages set status = ${st} where id = ${s(fd, 'id')}`
    await audit(db(), await actorOf(staff), 'contact.status', { type: 'contact_message', id: s(fd, 'id') }, { status: st })
    return ok('Updated.')
  } catch (e) {
    return fail(e)
  }
}

export async function waitlistDeleteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('hq', 'intake.manage')
    const { db } = await import('@/server/db')
    const { audit } = await import('@/server/audit')
    await db()`delete from zenith.waitlist_signups where id = ${s(fd, 'id')}`
    await audit(db(), await actorOf(staff), 'waitlist.deleted_by_staff', { type: 'waitlist_signup', id: s(fd, 'id') })
    return ok('Removed.')
  } catch (e) {
    return fail(e)
  }
}

export async function saveSettingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('hq', 'settings.manage')
    const key = s(fd, 'key') as SettingsKey
    if (!(key in SETTINGS_SCHEMA)) return { status: 'error', message: 'Unknown setting.' }
    const value: Record<string, unknown> = {}
    for (const [k, v] of fd.entries()) {
      if (!k.startsWith('v.') || typeof v !== 'string') continue
      const field = k.slice(2)
      value[field] = v === '__true' ? true : v === '__false' ? false : field === 'games' ? v.split(',').map((x) => x.trim()).filter(Boolean) : v
    }
    for (const b of fd.getAll('bool').map(String)) if (!(b in value)) value[b] = false
    await saveSetting(key, value, await actorOf(staff))
    return ok('Saved.')
  } catch (e) {
    if (e && typeof e === 'object' && 'issues' in e) return { status: 'error', message: 'Some values are not valid (check URLs and lengths).' }
    return fail(e)
  }
}

export async function mediaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('hq', 'content.manage')
    const actor = await actorOf(staff)
    const op = s(fd, 'op')
    if (op === 'add') {
      const product = s(fd, 'product') as 'production'
      if (!['production', 'points', 'home'].includes(product)) return { status: 'error', message: 'Choose a product.' }
      await content.addMedia({ product, title: s(fd, 'title'), caption: s(fd, 'caption'), isAuthentic: fd.get('isAuthentic') === 'on', file: fd.get('file') as File | null }, actor)
      return ok('Uploaded. Publish it when it has been approved.')
    }
    if (op === 'publish' || op === 'unpublish') {
      await content.setMediaPublished(s(fd, 'id'), op === 'publish', actor)
      return ok(op === 'publish' ? 'Published.' : 'Unpublished.')
    }
    if (op === 'member') {
      await content.saveOrgMember(
        s(fd, 'id') || null,
        { name: s(fd, 'name'), roleTitle: s(fd, 'roleTitle'), bio: s(fd, 'bio'), published: fd.get('published') === 'on', sortOrder: Number(s(fd, 'sortOrder')) || 0, file: fd.get('file') as File | null },
        actor,
      )
      return ok('Saved.')
    }
    if (op === 'member-delete') {
      await content.deleteOrgMember(s(fd, 'id'), actor)
      return ok('Removed.')
    }
    return { status: 'error', message: 'Unknown operation.' }
  } catch (e) {
    return fail(e)
  }
}

export async function staffAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const staff = await gate('hq', 'staff.manage')
    const actor = await actorOf(staff)
    const op = s(fd, 'op')
    const roles = fd.getAll('roles').map(String).filter((r): r is Role => (ROLES as readonly string[]).includes(r))
    if (op === 'create') {
      const temp = await staffSvc.createStaff({ email: s(fd, 'email'), displayName: s(fd, 'displayName'), roles }, actor)
      return ok('Account created. Share the one-time password privately; it must be changed at first sign-in.', { temp })
    }
    if (op === 'roles') {
      await staffSvc.setRoles(s(fd, 'id'), roles, actor)
      return ok('Roles updated; their sessions were signed out.')
    }
    if (op === 'disable' || op === 'enable') {
      await staffSvc.setStaffStatus(s(fd, 'id'), op === 'disable' ? 'disabled' : 'active', actor)
      return ok(op === 'disable' ? 'Account disabled.' : 'Account enabled.')
    }
    if (op === 'reset') {
      const temp = await staffSvc.resetPassword(s(fd, 'id'), actor)
      return ok('Password reset. Share the one-time password privately.', { temp })
    }
    return { status: 'error', message: 'Unknown operation.' }
  } catch (e) {
    return fail(e)
  }
}

function isRedirect(e: unknown) {
  return typeof e === 'object' && e !== null && 'digest' in e && String((e as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')
}

