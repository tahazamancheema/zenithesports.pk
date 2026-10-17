import localFont from "next/font/local";
import { Inter } from "next/font/google";

/**
 * ============================================================================
 *  ZENITH ESPORTS — FONT DEFINITIONS
 *  All fonts loaded via next/font for zero FOUT.
 *  
 *  | Role    | Font           | Weight     | Usage                          |
 *  |---------|----------------|------------|--------------------------------|
 *  | Display | Clash Display  | 500-700    | Hero headlines, section titles |
 *  | Heading | Chakra Petch   | 600, 700   | Tournament names, game labels  |
 *  | Body    | Satoshi        | 400, 500   | All body copy                  |
 *  | Mono    | JetBrains Mono | 400, 500   | Team codes, timers, IDs        |
 *  | Label   | Satoshi        | 600        | Form labels, table headers     |
 * ============================================================================
 *
 *  Clash Display and Satoshi are from Fontshare (Indian Type Foundry).
 *  They are free for commercial use. We load them as local fonts from /public/fonts/.
 *  
 *  Chakra Petch and JetBrains Mono are Google Fonts, loaded via next/font/google.
 */

// ── Clash Display (Display face) ──
// Loaded as local font from Fontshare files.
// We'll use CSS font-face declarations until we have the actual files.
// For now, using Inter as a fallback and we'll swap to local fonts once downloaded.

import { Chakra_Petch, JetBrains_Mono } from "next/font/google";

export const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-heading",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

// Using Inter as a stand-in for Satoshi (body) until local font files are provided.
// Satoshi is visually similar to Inter — both are geometric neo-grotesques.
// TODO: Replace with local Satoshi font files from Fontshare
export const satoshi = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body",
});

// Using Chakra Petch bold as a stand-in for Clash Display (display).
// Both are sharp, geometric display faces.
// TODO: Replace with local Clash Display font files from Fontshare
export const clashDisplay = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

/**
 * Combined CSS variable class string to apply to <html>.
 * Usage: <html className={fontVariables}>
 */
export const fontVariables = [
  clashDisplay.variable,
  chakraPetch.variable,
  satoshi.variable,
  jetbrainsMono.variable,
].join(" ");
