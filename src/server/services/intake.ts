import 'server-only'
import { z } from 'zod'
import { cleanText, isEmail, toE164 } from '@/lib/normalize'
import { audit, PUBLIC_ACTOR, type Actor } from '../audit'
import { randomToken, referenceCode, sha256 } from '../crypto'
import { db, isUniqueViolation } from '../db'
import { enqueue } from '../notify'
import { getSettings } from '../settings'

export type FieldErrors = Record<string, string>
export type IntakeResult = { ok: true; reference: string } | { ok: false; error: string; fieldErrors?: FieldErrors }

const opt = (max: number) => z.string().max(max).optional().transform((v) => cleanText(v) || null)

function contactPair(email: string | null, phone: string | null, fe: FieldErrors) {
  const e = email?.trim().toLowerCase() || null
  const p = phone?.trim() ? toE164(phone) : null
  if (e && !isEmail(e)) fe.email = 'Enter a valid email address.'
  if (phone?.trim() && !p) fe.phone = 'Enter a valid phone number.'
  if (!e && !phone?.trim()) fe.email = 'Give us an email address or a phone number.'
  return { email: e, phone: p }
}

function zodErrors(err: z.ZodError): FieldErrors {
  const fe: FieldErrors = {}
  for (const i of err.issues) fe[String(i.path[0])] ??= i.message
  return fe
}

// ─── ZenithProduction purchase inquiry ──────────────────────────────────────

const inquirySchema = z.object({
  name: z.string().transform(cleanText).pipe(z.string().min(2, 'Tell us your name.').max(80)),
  organization: opt(120),
  game: opt(60),
  intendedUse: opt(120),
  requirements: z.string().max(3000).transform((v) => v.trim()).pipe(z.string().min(10, 'Describe what you need in a sentence or two.')),
  message: z.string().max(3000).optional().transform((v) => v?.trim() || null),
})

export async function submitInquiry(raw: Record<string, string>, ipHash: string): Promise<IntakeResult> {
  const parsed = inquirySchema.safeParse(raw)
  const fe: FieldErrors = parsed.success ? {} : zodErrors(parsed.error)
  const { email, phone } = contactPair(raw.email ?? null, raw.phone ?? null, fe)
  if (!parsed.success || Object.keys(fe).length) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: fe }
  const d = parsed.data
  const reference = referenceCode('ZQ')
  const settings = await getSettings()
  await db().begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into zenith.product_inquiries (reference, product, name, email, phone_e164, organization, game, intended_use, requirements, message, ip_hash)
      values (${reference}, 'production', ${d.name}, ${email}, ${phone}, ${d.organization}, ${d.game}, ${d.intendedUse}, ${d.requirements}, ${d.message}, ${ipHash})
      returning id
    `
    await audit(tx, { ...PUBLIC_ACTOR, surface: 'production', ipHash }, 'inquiry.submitted', { type: 'product_inquiry', id: row.id })
    await enqueue(tx, {
      channel: 'email',
      recipient: settings.notify.inquiryEmail || settings.notify.staffEmail || null,
      subject: `ZenithProduction inquiry ${reference}`,
      body: `A new ZenithProduction purchase inquiry (${reference}) is waiting in the HQ console.`,
    })
    await enqueue(tx, { channel: 'discord', subject: 'ZenithProduction inquiry', body: `${reference} · ${d.organization ?? 'Individual'}` })
  })
  return { ok: true, reference }
}

// ─── production booking request ─────────────────────────────────────────────

const bookingSchema = z.object({
  tournamentName: z.string().transform(cleanText).pipe(z.string().min(2, 'Name the tournament.').max(120)),
  game: z.string().transform(cleanText).pipe(z.string().min(2, 'Which game?').max(60)),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a start time.'),
  timezone: z.string().max(60).default('Asia/Karachi'),
  contactName: z.string().transform(cleanText).pipe(z.string().min(2, 'Tell us your name.').max(80)),
  organization: opt(120),
  broadcastRequirements: z.string().max(3000).transform((v) => v.trim()).pipe(z.string().min(5, 'Describe the broadcast you need.')),
  eventScope: opt(1000),
  notes: opt(2000),
})

export async function submitBooking(raw: Record<string, string>, ipHash: string): Promise<IntakeResult> {
  const parsed = bookingSchema.safeParse(raw)
  const fe: FieldErrors = parsed.success ? {} : zodErrors(parsed.error)
  const { email, phone } = contactPair(raw.email ?? null, raw.phone ?? null, fe)
  if (parsed.success) {
    const date = new Date(`${parsed.data.eventDate}T00:00:00Z`)
    const today = new Date(new Date().toISOString().slice(0, 10))
    if (Number.isNaN(date.getTime())) fe.eventDate = 'Pick a valid date.'
    else if (date < today) fe.eventDate = 'The event date is in the past.'
    if (!Intl.supportedValuesOf('timeZone').includes(parsed.data.timezone) && parsed.data.timezone !== 'UTC') fe.timezone = 'Pick a timezone.'
  }
  if (!parsed.success || Object.keys(fe).length) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: fe }
  const d = parsed.data
  const reference = referenceCode('ZB')
  const settings = await getSettings()
  await db().begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into zenith.production_bookings
        (reference, tournament_name, game, event_date, start_time, timezone, contact_name, email, phone_e164, organization,
         broadcast_requirements, event_scope, notes, ip_hash)
      values (${reference}, ${d.tournamentName}, ${d.game}, ${d.eventDate}, ${d.startTime}, ${d.timezone}, ${d.contactName},
              ${email}, ${phone}, ${d.organization}, ${d.broadcastRequirements}, ${d.eventScope}, ${d.notes}, ${ipHash})
      returning id
    `
    await tx`insert into zenith.booking_history (booking_id, from_status, to_status, note) values (${row.id}, null, 'requested', 'Submitted by customer')`
    await audit(tx, { ...PUBLIC_ACTOR, surface: 'production', ipHash }, 'booking.requested', { type: 'production_booking', id: row.id })
    await enqueue(tx, {
      channel: 'email',
      recipient: settings.notify.inquiryEmail || settings.notify.staffEmail || null,
      subject: `Production booking request ${reference}`,
      body: `A production booking request (${reference}) for ${d.eventDate} is waiting in the HQ console. It is not confirmed until an administrator confirms it.`,
    })
    await enqueue(tx, { channel: 'discord', subject: 'Production booking request', body: `${reference} · ${d.game} · ${d.eventDate}` })
  })
  return { ok: true, reference }
}

export const BOOKING_TRANSITIONS = {
  requested: ['under_review', 'needs_info', 'confirmed', 'declined'],
  under_review: ['needs_info', 'confirmed', 'declined'],
  needs_info: ['under_review', 'confirmed', 'declined'],
  confirmed: ['cancelled'],
  declined: ['under_review'],
  cancelled: [],
} as const satisfies Record<string, readonly string[]>
export type BookingStatus = keyof typeof BOOKING_TRANSITIONS

export async function setBookingStatus(id: string, to: BookingStatus, note: string | null, actor: Actor) {
  await db().begin(async (tx) => {
    const [b] = await tx<{ status: BookingStatus; email: string | null; reference: string }[]>`
      select status, email, reference from zenith.production_bookings where id = ${id} for update
    `
    if (!b) throw new Error('Booking not found.')
    if (!(BOOKING_TRANSITIONS[b.status] as readonly string[]).includes(to)) throw new Error(`A ${b.status} booking cannot become ${to}.`)
    await tx`
      update zenith.production_bookings
         set status = ${to}, admin_note = coalesce(${note}, admin_note),
             decided_by = case when ${to} in ('confirmed', 'declined') then ${actor.id}::uuid else decided_by end,
             decided_at = case when ${to} in ('confirmed', 'declined') then now() else decided_at end
       where id = ${id}
    `
    await tx`insert into zenith.booking_history (booking_id, from_status, to_status, changed_by, note) values (${id}, ${b.status}, ${to}, ${actor.id}, ${note})`
    await audit(tx, actor, 'booking.status', { type: 'production_booking', id }, { from: b.status, to })
    if (to === 'confirmed' || to === 'declined' || to === 'needs_info') {
      await enqueue(tx, {
        channel: 'email',
        recipient: b.email,
        subject: `Your production booking ${b.reference}`,
        body:
          to === 'confirmed'
            ? `Your production booking ${b.reference} has been confirmed by the Zenith team. We'll be in touch with the details.`
            : to === 'declined'
              ? `We're unable to take on production booking ${b.reference}. Thank you for thinking of Zenith.`
              : `We need a little more information about production booking ${b.reference}. Our team will contact you.`,
      })
    }
  })
}

export async function setInquiryStatus(id: string, status: 'new' | 'contacted' | 'qualified' | 'closed' | 'spam', note: string | null, actor: Actor) {
  await db().begin(async (tx) => {
    const [r] = await tx`update zenith.product_inquiries set status = ${status}, internal_note = coalesce(${note}, internal_note) where id = ${id} returning id`
    if (!r) throw new Error('Inquiry not found.')
    await audit(tx, actor, 'inquiry.status', { type: 'product_inquiry', id }, { status })
  })
}

// ─── ZenithPoints waitlist ──────────────────────────────────────────────────

export const WAITLIST_CONSENT =
  'I agree that Zenith Esports may email me about the ZenithPoints launch. I can remove myself at any time with the link in that email or on this page.'

export async function joinWaitlist(
  raw: Record<string, string>,
  ipHash: string,
  leaveUrl: (token: string) => string,
): Promise<{ ok: true; removeToken: string } | { ok: false; error: string; fieldErrors?: FieldErrors }> {
  const fe: FieldErrors = {}
  const email = (raw.email ?? '').trim().toLowerCase()
  if (!isEmail(email)) fe.email = 'Enter a valid email address.'
  const platform = raw.platform
  if (!['android', 'ios', 'both'].includes(platform)) fe.platform = 'Choose a platform.'
  const audience = ['organizer', 'team', 'player', 'other'].includes(raw.audience) ? raw.audience : null
  if (raw.consent !== 'on' && raw.consent !== 'true') fe.consent = 'We need your consent to email you about the launch.'
  const name = cleanText(raw.name).slice(0, 80) || null
  if (Object.keys(fe).length) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: fe }
  const token = randomToken(24)
  try {
    await db().begin(async (tx) => {
      const [row] = await tx<{ id: string }[]>`
        insert into zenith.waitlist_signups (email, name, platform, audience, consent_text, unsubscribe_token_hash, ip_hash)
        values (${email}, ${name}, ${platform}, ${audience}, ${WAITLIST_CONSENT}, ${sha256(token)}, ${ipHash})
        returning id
      `
      await audit(tx, { ...PUBLIC_ACTOR, surface: 'points', ipHash }, 'waitlist.joined', { type: 'waitlist_signup', id: row.id })
      await enqueue(tx, {
        channel: 'email',
        recipient: email,
        subject: "You're on the ZenithPoints launch list",
        body: `Thanks for your interest in ZenithPoints. We'll email you when it launches.\n\nTo remove yourself from the list at any time, open:\n${leaveUrl(token)}\n\n— Zenith Esports`,
      })
    })
  } catch (e) {
    // Already on the list: respond the same way so the form cannot be used to test addresses.
    if (isUniqueViolation(e)) return { ok: true, removeToken: '' }
    throw e
  }
  return { ok: true, removeToken: token }
}

/** Deletion, not a flag: the record is removed entirely. */
export async function leaveWaitlist(token: string) {
  if (!token || token.length < 20 || token.length > 64) return false
  const rows = await db()`delete from zenith.waitlist_signups where unsubscribe_token_hash = ${sha256(token)} returning id`
  if (rows.length) await audit(db(), PUBLIC_ACTOR, 'waitlist.left', { type: 'waitlist_signup', id: rows[0].id as string })
  return rows.length > 0
}

// ─── contact ────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().transform(cleanText).pipe(z.string().min(2, 'Tell us your name.').max(80)),
  email: z.string().trim().toLowerCase().refine(isEmail, 'Enter a valid email address.'),
  topic: z.enum(['general', 'tournaments', 'partnership', 'media', 'anticheat', 'privacy'], { message: 'Choose a topic.' }),
  message: z.string().trim().min(10, 'Write a little more so we can help.').max(4000),
})

export async function submitContact(raw: Record<string, string>, ipHash: string): Promise<IntakeResult> {
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: zodErrors(parsed.error) }
  const d = parsed.data
  const reference = referenceCode('ZC')
  const settings = await getSettings()
  await db().begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into zenith.contact_messages (reference, name, email, topic, message, ip_hash)
      values (${reference}, ${d.name}, ${d.email}, ${d.topic}, ${d.message}, ${ipHash}) returning id
    `
    await audit(tx, { ...PUBLIC_ACTOR, surface: 'hq', ipHash }, 'contact.submitted', { type: 'contact_message', id: row.id })
    await enqueue(tx, {
      channel: 'email',
      recipient: settings.notify.staffEmail || null,
      subject: `Website message ${reference} (${d.topic})`,
      body: `A new ${d.topic} message (${reference}) is waiting in the HQ console.`,
    })
  })
  return { ok: true, reference }
}

// ─── HQ console reads ───────────────────────────────────────────────────────

export async function hqOverview() {
  const [row] = await db()<{ inquiries: number; bookings: number; messages: number; waitlist: number }[]>`
    select (select count(*)::int from zenith.product_inquiries where status = 'new') as inquiries,
           (select count(*)::int from zenith.production_bookings where status in ('requested', 'under_review', 'needs_info')) as bookings,
           (select count(*)::int from zenith.contact_messages where status = 'new') as messages,
           (select count(*)::int from zenith.waitlist_signups) as waitlist
  `
  return row
}

export async function listInquiries() {
  return db()<
    { id: string; reference: string; name: string; email: string | null; phoneE164: string | null; organization: string | null; game: string | null; intendedUse: string | null; requirements: string | null; message: string | null; status: string; internalNote: string | null; createdAt: Date }[]
  >`select * from zenith.product_inquiries order by case status when 'new' then 0 else 1 end, created_at desc limit 200`
}

export async function listBookings() {
  return db()<
    {
      id: string
      reference: string
      tournamentName: string
      game: string
      eventDate: Date
      startTime: string
      timezone: string
      contactName: string
      email: string | null
      phoneE164: string | null
      organization: string | null
      broadcastRequirements: string
      eventScope: string | null
      notes: string | null
      status: BookingStatus
      adminNote: string | null
      createdAt: Date
      decidedAt: Date | null
    }[]
  >`select * from zenith.production_bookings order by case when status in ('requested', 'under_review', 'needs_info') then 0 else 1 end, event_date limit 200`
}

export async function listMessages() {
  return db()<{ id: string; reference: string; name: string; email: string; topic: string; message: string; status: string; createdAt: Date }[]>`
    select * from zenith.contact_messages order by case status when 'new' then 0 else 1 end, created_at desc limit 200
  `
}

export async function listWaitlist() {
  return db()<{ id: string; email: string; name: string | null; platform: string; audience: string | null; createdAt: Date }[]>`
    select id, email, name, platform, audience, created_at from zenith.waitlist_signups order by created_at desc limit 1000
  `
}
