import type { Surface } from '@/lib/surfaces'

export type Product = {
  surface: Exclude<Surface, 'hq'>
  name: string
  nav: string
  verb: string
  color: string
  role: string
  blurb: string
  index: string
}

/** The four platforms, in the order a tournament moves through them. */
export const PRODUCTS: Product[] = [
  {
    surface: 'registrations',
    name: 'Zenith Registrations',
    nav: 'Registrations',
    verb: 'Enter',
    color: 'var(--color-reg)',
    role: 'Competition entry',
    blurb: 'Tournament discovery, team and roster entry, approvals and operations for every Zenith competition.',
    index: '01',
  },
  {
    surface: 'anticheat',
    name: 'ZenithAntiCheat',
    nav: 'AntiCheat',
    verb: 'Verify',
    color: 'var(--color-ac)',
    role: 'Competitive integrity',
    blurb: 'Verified player reports and private integrity checks that every registration passes through.',
    index: '02',
  },
  {
    surface: 'production',
    name: 'ZenithProduction',
    nav: 'Production',
    verb: 'Broadcast',
    color: 'var(--color-prod)',
    role: 'Broadcast production',
    blurb: 'Desktop software that turns live observer data into a complete, animated esports broadcast.',
    index: '03',
  },
  {
    surface: 'points',
    name: 'ZenithPoints',
    nav: 'Points',
    verb: 'Score',
    color: 'var(--color-pts)',
    role: 'Scoring & results',
    blurb: 'A mobile scoring tool for organisers: placement and kill points, custom designs, AI-assisted extraction.',
    index: '04',
  },
]

export const productBySurface = (s: Surface) => PRODUCTS.find((p) => p.surface === s)

export const LEGAL_LINKS = [
  { to: '/rules', label: 'Tournament rules' },
  { to: '/legal/privacy', label: 'Privacy policy' },
  { to: '/legal/terms', label: 'Terms of service' },
  { to: '/legal/cookies', label: 'Cookies' },
  { to: '/legal/accessibility', label: 'Accessibility' },
]
