import 'server-only'
import { db, type Db } from './db'
import { env, integrations } from './env'

/**
 * Notifications are written to an outbox inside the business transaction and
 * delivered afterwards. When a provider is not configured the row is marked
 * `skipped` — nothing pretends to have been sent.
 */
export async function enqueue(
  conn: Db,
  n: { channel: 'email' | 'discord'; recipient?: string | null; subject: string; body: string },
) {
  if (n.channel === 'email' && !n.recipient) return
  await conn`
    insert into zenith.notifications (channel, recipient, subject, body)
    values (${n.channel}, ${n.recipient ?? null}, ${n.subject.slice(0, 200)}, ${n.body.slice(0, 4000)})
  `
}

async function sendEmail(to: string, subject: string, body: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.NOTIFY_FROM_EMAIL, to: [to], subject, text: body }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`email provider returned ${res.status}`)
}

async function sendDiscord(subject: string, body: string) {
  const res = await fetch(env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Staff channel: summaries only, no personal data (see callers).
    body: JSON.stringify({ content: `**${subject}**\n${body}`.slice(0, 1900), allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`discord returned ${res.status}`)
}

/** Deliver what is pending. Safe to call from `after()`; never throws. */
export async function deliverPending(limit = 20) {
  try {
    const rows = await db()<{ id: string; channel: 'email' | 'discord'; recipient: string | null; subject: string; body: string }[]>`
      update zenith.notifications n set status = 'skipped', error = 'claimed'
       where n.id in (select id from zenith.notifications where status = 'pending' order by created_at limit ${limit} for update skip locked)
      returning n.id, n.channel, n.recipient, n.subject, n.body
    `
    for (const n of rows) {
      const configured = n.channel === 'email' ? integrations.email : integrations.discord
      if (!configured) {
        await db()`update zenith.notifications set status = 'skipped', error = 'provider not configured' where id = ${n.id}`
        continue
      }
      try {
        if (n.channel === 'email') await sendEmail(n.recipient!, n.subject, n.body)
        else await sendDiscord(n.subject, n.body)
        await db()`update zenith.notifications set status = 'sent', error = null, sent_at = now() where id = ${n.id}`
      } catch (e) {
        await db()`update zenith.notifications set status = 'failed', error = ${String((e as Error).message).slice(0, 300)} where id = ${n.id}`
      }
    }
  } catch {
    // Delivery is best-effort; the outbox keeps the record.
  }
}
