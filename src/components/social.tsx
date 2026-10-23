import type { Settings } from '@/server/settings'

const LABELS: Record<keyof Settings['social'], string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  discord: 'Discord',
  x: 'X',
  whatsappChannel: 'WhatsApp channel',
}

const ICONS: Record<keyof Settings['social'], string> = {
  youtube: 'M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3Z',
  instagram: '',
  facebook: 'M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6A21 21 0 0 0 14.7 2.5c-2.3 0-3.9 1.4-3.9 4v2H8.2v3.2h2.6V21H14v-9.3h2.6l.4-3.2Z',
  tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6 2.5 2.5 0 0 1 .8.1V9.8a5.7 5.7 0 1 0 4.9 5.6V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z',
  discord: 'M19.3 5.3A17 17 0 0 0 15 4l-.2.4a15.6 15.6 0 0 1 3.8 1.9 13 13 0 0 0-13.2 0A15.6 15.6 0 0 1 9.2 4.4L9 4a17 17 0 0 0-4.3 1.3A17.6 17.6 0 0 0 1.7 17a17 17 0 0 0 5.2 2.7l1.1-1.7a11 11 0 0 1-1.8-.9l.4-.3a12.3 12.3 0 0 0 10.8 0l.4.3a11 11 0 0 1-1.8.9l1.1 1.7a17 17 0 0 0 5.2-2.7 17.6 17.6 0 0 0-2.9-11.7ZM8.7 14.7a2 2 0 1 1 1.9-2 2 2 0 0 1-1.9 2Zm6.6 0a2 2 0 1 1 1.9-2 2 2 0 0 1-1.9 2Z',
  x: 'M17.8 3h3.1l-6.7 7.7L22 21h-6.2l-4.8-6.3L5.5 21H2.4l7.2-8.2L2 3h6.3l4.4 5.8Zm-1.1 16.2h1.7L7.4 4.7H5.6Z',
  whatsappChannel: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.7-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z',
}

/** Only channels an administrator has configured are shown; nothing is invented. */
export function SocialLinks({ social, size = 'md' }: { social: Settings['social']; size?: 'md' | 'lg' }) {
  const entries = (Object.keys(LABELS) as (keyof Settings['social'])[]).filter((k) => social[k])
  if (!entries.length) {
    return <p className="t-label">Official channels will be listed here once verified.</p>
  }
  const box = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  return (
    <ul className="flex flex-wrap gap-2">
      {entries.map((k) => (
        <li key={k}>
          <a
            href={social[k]}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`Zenith Esports on ${LABELS[k]}`}
            className={`grid ${box} place-items-center rounded-sm border border-line-2 text-fg-2 transition-colors hover:border-[var(--accent)] hover:text-fg`}
          >
            {k === 'instagram' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                <path d={ICONS[k]} />
              </svg>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
