'use server'

import { after } from 'next/server'
import type { Answers } from '@/lib/forms/engine'
import { failure, guardPublic, textValues, type ActionState } from '@/server/action-guard'
import { absoluteUrl } from '@/server/link'
import { deliverPending } from '@/server/notify'
import { assertSameOrigin, ipHash } from '@/server/request'
import { submitReport } from '@/server/services/anticheat'
import { joinWaitlist, leaveWaitlist, submitBooking, submitContact, submitInquiry } from '@/server/services/intake'
import { createLftProfile, requestContact, respondToRequest, setLftStatusByToken } from '@/server/services/lft'
import { submitRegistration, withdrawByToken, type MemberInput } from '@/server/services/registrations'
import { consume } from '@/server/rate-limit'

const HOUR = 3600
const deliver = () => after(() => deliverPending())

export async function contactAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('contact', fd, { max: 5, windowSeconds: HOUR })
    const r = await submitContact(values, ip)
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: r.fieldErrors, values }
    deliver()
    return { status: 'success', data: { reference: r.reference } }
  } catch (e) {
    return failure(e, values)
  }
}

export async function inquiryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('inquiry', fd, { max: 5, windowSeconds: HOUR })
    const r = await submitInquiry(values, ip)
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: r.fieldErrors, values }
    deliver()
    return { status: 'success', data: { reference: r.reference } }
  } catch (e) {
    return failure(e, values)
  }
}

export async function bookingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('booking', fd, { max: 5, windowSeconds: HOUR })
    const r = await submitBooking(values, ip)
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: r.fieldErrors, values }
    deliver()
    return { status: 'success', data: { reference: r.reference } }
  } catch (e) {
    return failure(e, values)
  }
}

export async function waitlistAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('waitlist', fd, { max: 5, windowSeconds: HOUR })
    const base = await absoluteUrl('points', '/leave')
    const r = await joinWaitlist(values, ip, (t) => `${base}?t=${t}`)
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: r.fieldErrors, values }
    deliver()
    return { status: 'success' }
  } catch (e) {
    return failure(e, values)
  }
}

export async function leaveWaitlistAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin()
    await consume(`leave:${await ipHash()}`, 20, HOUR)
    const ok = await leaveWaitlist(String(fd.get('t') ?? ''))
    return ok ? { status: 'success' } : { status: 'error', message: 'This removal link is not valid, or you have already been removed.' }
  } catch (e) {
    return failure(e)
  }
}

export async function reportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('report', fd, { max: 4, windowSeconds: HOUR })
    const file = (k: string) => {
      const f = fd.get(k)
      return f instanceof File ? f : null
    }
    const r = await submitReport({
      gameId: values.gameId || 'pubg-mobile',
      uid: values.uid ?? '',
      ign: values.ign,
      explanation: values.explanation,
      contact: values.contact,
      reportScreenshot: file('reportScreenshot'),
      uidScreenshot: file('uidScreenshot'),
      ipHash: ip,
    })
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: r.fieldErrors, values }
    deliver()
    return { status: 'success', data: { reference: r.reference } }
  } catch (e) {
    return failure(e, values)
  }
}

/**
 * Registration FormData layout:
 *   tournament, teamName, contactPhone, contactEmail
 *   a.<fieldId>                         entry answers (repeat key for multi-choice)
 *   m.<i>.role | m.<i>.ign | m.<i>.uid | m.<i>.phone
 *   m.<i>.a.<fieldId>                   per-player answers
 *   f.entry.<fieldId> | f.m<i>.<fieldId> files
 */
export async function registerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('register', fd, { max: 8, windowSeconds: HOUR })
    const entry: Answers = {}
    const members: MemberInput[] = []
    const files = new Map<string, File>()
    const put = (target: Answers, key: string, v: string) => {
      const cur = target[key]
      if (cur === undefined) target[key] = v === 'true' ? true : v
      else target[key] = Array.isArray(cur) ? [...cur, v] : [String(cur), v]
    }
    const multi = new Set(String(fd.get('_multi') ?? '').split(',').filter(Boolean))
    for (const [k, v] of fd.entries()) {
      if (v instanceof File) {
        if (k.startsWith('f.') && v.size > 0) files.set(k.slice(2), v)
        continue
      }
      if (k.startsWith('a.')) put(entry, k.slice(2), v)
      const m = /^m\.(\d{1,2})\.(role|ign|uid|phone)$/.exec(k)
      if (m) {
        const i = Number(m[1])
        members[i] ??= { role: 'player', ign: '', uid: '', answers: {} }
        ;(members[i] as Record<string, unknown>)[m[2]] = v
      }
      const ma = /^m\.(\d{1,2})\.a\.([a-z][a-z0-9_]*)$/.exec(k)
      if (ma) {
        const i = Number(ma[1])
        members[i] ??= { role: 'player', ign: '', uid: '', answers: {} }
        put(members[i].answers, ma[2], v)
      }
    }
    // Multi-choice fields arrive as repeated keys; make single selections arrays too.
    for (const id of multi) if (typeof entry[id] === 'string') entry[id] = [entry[id] as string]
    const clean = members.filter(Boolean).map((m) => ({
      ...m,
      role: (['captain', 'player', 'substitute'].includes(m.role) ? m.role : 'player') as MemberInput['role'],
    }))
    const r = await submitRegistration({
      tournamentSlug: values.tournament ?? '',
      teamName: values.teamName,
      contactPhone: values.contactPhone ?? '',
      contactEmail: values.contactEmail,
      answers: entry,
      members: clean,
      files,
      ipHash: ip,
    })
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: r.fieldErrors, values }
    deliver()
    const manage = await absoluteUrl('registrations', `/manage/${r.manageToken}`)
    return { status: 'success', data: { reference: r.reference, status: r.status, manage } }
  } catch (e) {
    return failure(e, values)
  }
}

export async function withdrawAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin()
    const ip = await ipHash()
    await consume(`withdraw:${ip}`, 10, HOUR)
    if (fd.get('confirm') !== 'yes') return { status: 'error', message: 'Tick the box to confirm.' }
    const r = await withdrawByToken(String(fd.get('token') ?? ''), ip)
    return r.ok ? { status: 'success' } : { status: 'error', message: r.error }
  } catch (e) {
    return failure(e)
  }
}

export async function lftCreateAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('lft', fd, { max: 4, windowSeconds: HOUR })
    const raw: Record<string, string | string[]> = { ...values, roles: fd.getAll('roles').map(String) }
    const r = await createLftProfile(raw, ip)
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: 'fieldErrors' in r ? r.fieldErrors : undefined, values }
    const manage = await absoluteUrl('registrations', `/lft/manage/${r.token}`)
    return { status: 'success', data: { reference: r.reference, manage } }
  } catch (e) {
    return failure(e, values)
  }
}

export async function lftRequestAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = textValues(fd)
  try {
    const ip = await guardPublic('lftreq', fd, { max: 10, windowSeconds: HOUR })
    const r = await requestContact(values, ip)
    if (!r.ok) return { status: 'error', message: r.error, fieldErrors: 'fieldErrors' in r ? r.fieldErrors : undefined, values }
    const view = await absoluteUrl('registrations', `/lft/request/${r.token}`)
    return { status: 'success', data: { view } }
  } catch (e) {
    return failure(e, values)
  }
}

export async function lftManageAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin()
    await consume(`lftmanage:${await ipHash()}`, 30, HOUR)
    const token = String(fd.get('token') ?? '')
    const op = String(fd.get('op') ?? '')
    let ok = false
    if (op === 'accept' || op === 'decline') ok = await respondToRequest(token, String(fd.get('requestId') ?? ''), op === 'accept')
    else if (op === 'matched' || op === 'withdrawn' || op === 'active') ok = await setLftStatusByToken(token, op)
    return ok ? { status: 'success' } : { status: 'error', message: 'That change could not be made.' }
  } catch (e) {
    return failure(e)
  }
}
