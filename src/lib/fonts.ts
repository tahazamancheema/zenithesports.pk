import { Geist, Geist_Mono, Michroma } from 'next/font/google'

// The ZenithHisaab type system: Michroma (brand/display), Geist (UI), Geist Mono (figures).
export const display = Michroma({ weight: '400', subsets: ['latin'], variable: '--ff-display', display: 'swap' })
export const sans = Geist({ subsets: ['latin'], variable: '--ff-sans', display: 'swap' })
export const mono = Geist_Mono({ subsets: ['latin'], variable: '--ff-mono', display: 'swap' })

export const fontVariables = `${display.variable} ${sans.variable} ${mono.variable}`
