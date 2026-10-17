import 'server-only'
import type { Db } from './db'

export type Actor = { id: string | null; label: string; surface?: string; ipHash?: string | null }

export const PUBLIC_ACTOR: Actor = { id: null, label: 'public' }
export const SYSTEM_ACTOR: Actor = { id: null, label: 'system' }

/** Append-only. Never put secrets, tokens, evidence or full phone numbers in `details`. */
export async function audit(
  conn: Db,
  actor: Actor,
  action: string,
  entity?: { type: string; id: string | null },
  details: Record<string, unknown> = {},
) {
  await conn`
    insert into zenith.audit_events (actor_id, actor_label, surface, action, entity_type, entity_id, ip_hash, details)
    values (${actor.id}, ${actor.label}, ${actor.surface ?? null}, ${action}, ${entity?.type ?? null},
            ${entity?.id ?? null}, ${actor.ipHash ?? null}, ${conn.json(details as never)})
  `
}
