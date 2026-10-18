/**
 * What a valid AntiCheat report needs, per game. The typed player ID is always
 * required; screenshots are the evidence a reviewer compares it against.
 *
 * - PUBG Mobile / Free Fire: the in-game "report submitted" screen shows the
 *   reported player's UID, so that one screenshot is enough.
 * - VALORANT: players are identified by Riot ID (Name#TAG). The in-game report
 *   screen does not show it, so the evidence is the scoreboard or match history
 *   where the Riot ID is readable; the report confirmation is optional.
 * - Honor of Kings, TEKKEN 8, EA SPORTS FC: one screenshot where the
 *   player's ID is readable (profile, player card or result screen), plus an
 *   optional clip link.
 */
export type EvidenceKind = 'report_confirmation' | 'uid_proof' | 'scoreboard' | 'extra'

export type EvidenceSlot = { kind: EvidenceKind; label: string; hint: string; required: boolean }

export type ReportRule = {
  evidence: EvidenceSlot[]
  steps: string[]
  idPlaceholder: string
  numericId: boolean
  clip: boolean
  matchDetails: boolean
}

const EXTRA: EvidenceSlot = { kind: 'extra', label: 'Another screenshot', hint: 'Optional — anything else that supports the report.', required: false }

export const REPORT_RULES: Record<string, ReportRule> = {
  'pubg-mobile': {
    evidence: [
      { kind: 'report_confirmation', label: 'Successful report screenshot', hint: 'The in-game screen confirming your report was submitted. The player’s Character ID must be readable on it.', required: true },
      EXTRA,
    ],
    steps: ['Report the player in game.', 'Screenshot the “report successful” screen — it shows their Character ID.', 'Type the Character ID here exactly as shown and upload the screenshot.', 'A reviewer checks the ID against your screenshot.'],
    idPlaceholder: '5123456789',
    numericId: true,
    clip: false,
    matchDetails: false,
  },
  'free-fire': {
    evidence: [
      { kind: 'report_confirmation', label: 'Successful report screenshot', hint: 'The in-game screen confirming your report was submitted. The player’s UID must be readable on it.', required: true },
      EXTRA,
    ],
    steps: ['Report the player in game.', 'Screenshot the successful report screen — it shows their UID.', 'Type the UID here exactly as shown and upload the screenshot.', 'A reviewer checks the UID against your screenshot.'],
    idPlaceholder: '123456789',
    numericId: true,
    clip: false,
    matchDetails: false,
  },
  valorant: {
    evidence: [
      { kind: 'scoreboard', label: 'Scoreboard or match history', hint: 'A screenshot where the player’s full Riot ID (Name#TAG) is readable — the in-match scoreboard or the match details in your career page.', required: true },
      { kind: 'report_confirmation', label: 'Report confirmation', hint: 'Optional — the in-game report screen, if you reported them.', required: false },
    ],
    steps: ['Open the scoreboard (or the match in your career history).', 'Screenshot it so the player’s Riot ID is readable.', 'Type the Riot ID here as Name#TAG, add the match details and upload.', 'A reviewer checks the Riot ID against your screenshot.'],
    idPlaceholder: 'PlayerName#TAG',
    numericId: false,
    clip: true,
    matchDetails: true,
  },
  'honor-of-kings': {
    evidence: [
      { kind: 'uid_proof', label: 'Screenshot showing the player ID', hint: 'The player’s profile or the post-match screen with their ID readable.', required: true },
      { kind: 'report_confirmation', label: 'Report confirmation', hint: 'Optional — the in-game report screen, if you reported them.', required: false },
    ],
    steps: ['Open the player’s profile or the post-match details.', 'Screenshot it so their player ID is readable.', 'Type the ID here exactly as shown and upload.', 'A reviewer checks the ID against your screenshot.'],
    idPlaceholder: '123456789',
    numericId: true,
    clip: true,
    matchDetails: true,
  },
  'tekken-8': {
    evidence: [
      { kind: 'uid_proof', label: 'Player card or match result', hint: 'A screenshot where the player’s TEKKEN ID or platform name is readable.', required: true },
      EXTRA,
    ],
    steps: ['Open the opponent’s player card or the match result.', 'Screenshot it so their TEKKEN ID is readable.', 'Type the ID here and link a replay clip if you have one.', 'A reviewer checks the ID against your screenshot.'],
    idPlaceholder: 'TEKKEN ID',
    numericId: false,
    clip: true,
    matchDetails: true,
  },
  'ea-fc-26': {
    evidence: [
      { kind: 'uid_proof', label: 'Screenshot showing their EA ID', hint: 'The match result or opponent profile with their EA ID or platform name readable.', required: true },
      EXTRA,
    ],
    steps: ['Open the match result or the opponent’s profile.', 'Screenshot it so their EA ID is readable.', 'Type the EA ID here and link a clip if you have one.', 'A reviewer checks the ID against your screenshot.'],
    idPlaceholder: 'EA ID',
    numericId: false,
    clip: true,
    matchDetails: true,
  },
}

export const reportRule = (gameId: string): ReportRule =>
  REPORT_RULES[gameId] ?? {
    evidence: [{ kind: 'uid_proof', label: 'Screenshot showing the player ID', hint: 'A screenshot where the player’s ID is readable.', required: true }, EXTRA],
    steps: ['Screenshot a screen where the player’s ID is readable.', 'Type the ID here exactly as shown and upload.', 'A reviewer checks the ID against your screenshot.'],
    idPlaceholder: '',
    numericId: false,
    clip: true,
    matchDetails: true,
  }

export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  report_confirmation: 'Report confirmation',
  uid_proof: 'ID proof',
  scoreboard: 'Scoreboard / match history',
  extra: 'Additional screenshot',
}

/** Only https links are stored; the reviewer opens them deliberately. */
export function cleanClipUrl(v: string | undefined): { ok: true; url: string | null } | { ok: false } {
  const s = (v ?? '').trim()
  if (!s) return { ok: true, url: null }
  try {
    const u = new URL(s)
    if (u.protocol !== 'https:' || s.length > 500 || u.username || u.password) return { ok: false }
    return { ok: true, url: u.toString() }
  } catch {
    return { ok: false }
  }
}
