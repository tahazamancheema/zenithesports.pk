'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const KIND_LABEL: Record<string, string> = {
  'registration.created': 'New registration',
  'registration.status': 'Registration status changed',
  'registration.roster': 'Roster updated',
  'tournament.saved': 'Tournament updated',
  'tournament.status': 'Tournament status changed',
  'lft.created': 'New Looking for Team listing',
  'report.created': 'New AntiCheat report',
  'report.reviewed': 'Report decided',
  'alert.detected': 'New AntiCheat alert',
  'alert.status': 'Alert updated',
  'product_inquiries.created': 'New product inquiry',
  'production_bookings.created': 'New production booking request',
  'contact_messages.created': 'New contact message',
}

/**
 * Subscribes to the console's authorised event stream. Every event is a real
 * database change; on arrival the page's server data is refreshed in place.
 */
export function LiveUpdates({ src }: { src: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([])
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const es = new EventSource(src)
    es.onopen = () => setStatus('live')
    es.onerror = () => setStatus(es.readyState === EventSource.CLOSED ? 'offline' : 'connecting')
    es.addEventListener('change', (ev) => {
      const id = Number((ev as MessageEvent).lastEventId) || Date.now()
      let kind = ''
      try {
        kind = JSON.parse((ev as MessageEvent).data).kind
      } catch {}
      setToasts((t) => [...t.slice(-2), { id, text: KIND_LABEL[kind] ?? 'Update received' }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
      if (pending.current) clearTimeout(pending.current)
      pending.current = setTimeout(() => router.refresh(), 500)
    })
    return () => es.close()
  }, [src, router])

  return (
    <>
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-3" title="Realtime connection">
        {status === 'live' ? <span className="live-dot" /> : <span className={`h-[7px] w-[7px] rounded-full ${status === 'offline' ? 'bg-bad' : 'bg-warn'}`} />}
        {status === 'live' ? 'Live' : status === 'offline' ? 'Offline' : 'Connecting'}
      </span>
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 grid gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="panel-raised flex items-center gap-3 px-4 py-3 text-sm shadow-2xl" style={{ animation: 'rise 400ms var(--ease-out-expo) both' }}>
            <span className="node node-fill" />
            {t.text}
          </div>
        ))}
      </div>
    </>
  )
}
