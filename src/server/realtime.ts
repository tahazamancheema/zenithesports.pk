import 'server-only'
import postgres from 'postgres'
import { db } from './db'
import { env } from './env'

export type Topic = 'registrations' | 'anticheat' | 'hq'
export type LiveEvent = { id: number; topic: Topic; kind: string; entityId: string | null; at: string }
type Listener = (e: LiveEvent) => void

/**
 * One hub per server instance. Source of truth is the zenith.events table:
 * - LISTEN zenith_events wakes the hub immediately (session/direct connections);
 * - a cursor read over zenith.events catches anything LISTEN cannot deliver
 *   (transaction poolers, reconnect gaps). Every delivered event is a real row.
 */
class Hub {
  private listeners = new Set<{ topic: Topic; fn: Listener }>()
  private lastId = 0
  private started = false
  private timer: ReturnType<typeof setInterval> | null = null
  private listenSql: postgres.Sql | null = null
  private listening = false
  private fetching = false

  async subscribe(topic: Topic, fn: Listener) {
    const entry = { topic, fn }
    this.listeners.add(entry)
    await this.start()
    return () => {
      this.listeners.delete(entry)
      if (!this.listeners.size) this.stop()
    }
  }

  private async start() {
    if (this.started) return
    this.started = true
    const [{ max }] = await db()<{ max: number }[]>`select coalesce(max(id), 0)::int as max from zenith.events`
    this.lastId = Math.max(this.lastId, max)
    const url = env.DATABASE_LISTEN_URL ?? env.DATABASE_URL
    // Supabase's transaction pooler (port 6543) cannot hold a LISTEN.
    if (url && !/:6543\//.test(url)) {
      try {
        this.listenSql = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
        await this.listenSql.listen('zenith_events', () => void this.fetch())
        this.listening = true
      } catch {
        this.listening = false
      }
    }
    this.timer = setInterval(() => void this.fetch(), this.listening ? 15_000 : 2_000)
  }

  private stop() {
    this.started = false
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    void this.listenSql?.end({ timeout: 1 })
    this.listenSql = null
    this.listening = false
  }

  private async fetch() {
    if (this.fetching) return
    this.fetching = true
    try {
      const rows = await db()<LiveEvent[]>`
        select id::int, topic, kind, entity_id, at from zenith.events where id > ${this.lastId} order by id limit 200
      `
      for (const e of rows) {
        this.lastId = Math.max(this.lastId, e.id)
        for (const l of this.listeners) if (l.topic === e.topic) l.fn(e)
      }
    } catch {
      // transient; next tick retries
    } finally {
      this.fetching = false
    }
  }
}

declare global {
  var __zenithHub: Hub | undefined
}
const hub = () => (globalThis.__zenithHub ??= new Hub())

/** Server-Sent Events stream for one topic. The caller has already authorised the request. */
export function liveStream(topic: Topic, lastEventId: string | null, signal: AbortSignal, maxSeconds = 270): Response {
  const enc = new TextEncoder()
  let cleanup = () => {}
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => {
        try {
          controller.enqueue(enc.encode(s))
        } catch {
          cleanup()
        }
      }
      const emit = (e: LiveEvent) => send(`id: ${e.id}\nevent: change\ndata: ${JSON.stringify({ kind: e.kind, entityId: e.entityId, at: e.at })}\n\n`)
      send(`retry: 3000\n: connected\n\n`)

      // Backfill what was missed since the client's last event.
      const since = Number(lastEventId)
      if (Number.isFinite(since) && since > 0) {
        const missed = await db()<LiveEvent[]>`
          select id::int, topic, kind, entity_id, at from zenith.events where topic = ${topic} and id > ${since} order by id limit 100
        `
        missed.forEach(emit)
      }

      const unsubscribe = await hub().subscribe(topic, emit)
      const heartbeat = setInterval(() => send(`: hb\n\n`), 25_000)
      // Close before the platform's function limit; EventSource reconnects with Last-Event-ID.
      const lifetime = setTimeout(() => cleanup(), maxSeconds * 1000)
      cleanup = () => {
        clearInterval(heartbeat)
        clearTimeout(lifetime)
        unsubscribe()
        try {
          controller.close()
        } catch {}
        cleanup = () => {}
      }
      signal.addEventListener('abort', () => cleanup())
    },
    cancel() {
      cleanup()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
