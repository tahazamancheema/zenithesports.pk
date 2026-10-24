import { getSettings } from '@/server/settings'

/** An administrator-controlled notice. Hidden unless switched on in the admin panel. */
export async function AnnouncementBar() {
  const { announcement } = await getSettings()
  if (!announcement.enabled || !announcement.text) return null
  const body = (
    <span className="flex items-center justify-center gap-3">
      <span className="node node-fill" style={{ '--accent': 'var(--color-gold)' } as React.CSSProperties} />
      <span>{announcement.text}</span>
      {announcement.href && <span aria-hidden>→</span>}
    </span>
  )
  return (
    <div className="border-b border-line bg-ink-1 py-2.5 text-center text-sm text-fg-2">
      <div className="shell">
        {announcement.href ? (
          <a href={announcement.href} className="hover:text-fg" rel="noopener">
            {body}
          </a>
        ) : (
          body
        )}
      </div>
    </div>
  )
}
