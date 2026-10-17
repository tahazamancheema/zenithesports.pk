import type { Metadata, Viewport } from 'next'
import { fontVariables } from '@/lib/fonts'
import { LinkModeProvider } from '@/components/link'
import { RevealRoot } from '@/components/motion'
import { getLinkMode } from '@/server/link'
import { getSettings } from '@/server/settings'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  const suffix = s.seo.titleSuffix || 'Zenith Esports'
  return {
    title: { default: `${suffix} — Beyond the game`, template: `%s · ${suffix}` },
    description: s.seo.description,
    applicationName: 'Zenith Esports',
    openGraph: { siteName: 'Zenith Esports', type: 'website', locale: 'en_PK' },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: '#06070a',
  colorScheme: 'dark',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const linkMode = await getLinkMode()
  return (
    <html lang="en" className={fontVariables} data-scroll-behavior="smooth">
      <body>
        <LinkModeProvider value={linkMode}>
          {children}
          <RevealRoot />
        </LinkModeProvider>
      </body>
    </html>
  )
}
