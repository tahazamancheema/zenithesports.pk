import type { FormField, FormSchema } from './schema'

/**
 * Ready-made registration questions. The base registration already collects the
 * team name, the captain's WhatsApp and every player's in-game name and game ID,
 * so these only add what tournaments commonly ask on top. Everything here is a
 * starting point: organisers can edit, reorder or remove any of it.
 */

const opts = (...labels: string[]) => labels.map((label) => ({ value: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40), label }))

/** Common questions, offered as one-click additions in the form builder. */
export const QUESTION_LIBRARY: { key: string; title: string; field: FormField }[] = [
  { key: 'team_tag', title: 'Team tag', field: { id: 'team_tag', type: 'short_text', label: 'Team tag', help: 'The short tag shown on broadcasts and standings.', placeholder: 'e.g. ZNX', required: true, scope: 'entry', maxLength: 6 } },
  { key: 'team_logo', title: 'Team logo', field: { id: 'team_logo', type: 'file', label: 'Team logo', help: 'Square PNG or JPEG, used on broadcast graphics.', required: false, scope: 'entry', accept: ['image/png', 'image/jpeg', 'image/webp'], maxSizeMB: 4 } },
  { key: 'captain_discord', title: 'Captain’s Discord', field: { id: 'captain_discord', type: 'short_text', label: 'Captain’s Discord username', placeholder: 'username', required: true, scope: 'entry', maxLength: 40 } },
  { key: 'city', title: 'City', field: { id: 'city', type: 'short_text', label: 'City', required: true, scope: 'entry', maxLength: 60 } },
  { key: 'instagram', title: 'Team Instagram', field: { id: 'instagram', type: 'short_text', label: 'Team Instagram (optional)', placeholder: '@team', required: false, scope: 'entry', maxLength: 60 } },
  { key: 'experience', title: 'Previous events', field: { id: 'experience', type: 'long_text', label: 'Tournaments your team has played recently', help: 'Optional. Helps us seed fairly.', required: false, scope: 'entry', maxLength: 1000 } },
  { key: 'substitute', title: 'Substitute player', field: { id: 'substitute_ign', type: 'ign', label: 'Substitute’s in-game name (optional)', required: false, scope: 'entry' } },
  { key: 'player_discord', title: 'Discord per player', field: { id: 'player_discord', type: 'short_text', label: 'Discord username', required: false, scope: 'player', maxLength: 40 } },
  { key: 'device', title: 'Device per player', field: { id: 'device', type: 'dropdown', label: 'Device', required: true, scope: 'player', options: opts('Phone', 'Tablet') } },
  { key: 'stream_consent', title: 'Broadcast consent', field: { id: 'stream_consent', type: 'consent', label: 'We agree that our names, team logo and gameplay may appear on Zenith broadcasts.', required: true, scope: 'entry' } },
  { key: 'rules_consent', title: 'Rules agreement', field: { id: 'rules_consent', type: 'consent', label: 'Every player has read the rules and agrees to play fairly.', required: true, scope: 'entry' } },
]

const q = (key: string): FormField => {
  const f = QUESTION_LIBRARY.find((x) => x.key === key)
  if (!f) throw new Error(`Unknown preset question ${key}`)
  return structuredClone(f.field)
}

const RANKS_VALORANT = opts('Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant')
const RANKS_HOK = opts('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Mythic', 'Epic', 'Legend')

/** One ready-made form per game. */
export const GAME_PRESETS: Record<string, { name: string; intro: string; fields: FormField[] }> = {
  'pubg-mobile': {
    name: 'PUBG Mobile — standard',
    intro: 'A few details for the broadcast and seeding. Rosters and IDs were collected in the previous step.',
    fields: [q('team_tag'), q('captain_discord'), q('city'), q('team_logo'), q('device'), q('experience'), q('stream_consent'), q('rules_consent')],
  },
  'free-fire': {
    name: 'Free Fire — standard',
    intro: 'A few details for the broadcast and seeding. Rosters and IDs were collected in the previous step.',
    fields: [
      q('team_tag'),
      q('captain_discord'),
      q('city'),
      q('team_logo'),
      q('device'),
      { id: 'ff_level', type: 'number', label: 'Account level', required: false, scope: 'player', min: 1, max: 100, integer: true },
      q('stream_consent'),
      q('rules_consent'),
    ],
  },
  valorant: {
    name: 'VALORANT — standard',
    intro: 'Ranks and roles help us seed groups and plan the broadcast.',
    fields: [
      q('team_tag'),
      q('captain_discord'),
      q('team_logo'),
      { id: 'rank', type: 'dropdown', label: 'Current rank', required: true, scope: 'player', options: RANKS_VALORANT },
      { id: 'role', type: 'dropdown', label: 'Main role', required: false, scope: 'player', options: opts('Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex') },
      q('player_discord'),
      q('substitute'),
      q('stream_consent'),
      q('rules_consent'),
    ],
  },
  'honor-of-kings': {
    name: 'Honor of Kings — standard',
    intro: 'Lanes and ranks help us seed groups and plan the broadcast.',
    fields: [
      q('team_tag'),
      q('captain_discord'),
      q('team_logo'),
      { id: 'lane', type: 'dropdown', label: 'Main lane', required: true, scope: 'player', options: opts('Clash lane', 'Jungle', 'Mid lane', 'Farm lane', 'Roam') },
      { id: 'rank', type: 'dropdown', label: 'Current rank', required: false, scope: 'player', options: RANKS_HOK },
      q('substitute'),
      q('stream_consent'),
      q('rules_consent'),
    ],
  },
  'tekken-8': {
    name: 'TEKKEN 8 — standard',
    intro: 'Tell us how you play so we can plan the bracket and the broadcast.',
    fields: [
      { id: 'main_character', type: 'short_text', label: 'Main character', required: true, scope: 'entry', maxLength: 40 },
      { id: 'platform', type: 'dropdown', label: 'Platform you play on', required: true, scope: 'entry', options: opts('PC', 'PlayStation 5', 'Xbox Series X|S') },
      { id: 'discord', type: 'short_text', label: 'Discord username', required: true, scope: 'entry', maxLength: 40 },
      q('city'),
      q('stream_consent'),
      q('rules_consent'),
    ],
  },
  'ea-fc': {
    name: 'EA SPORTS FC — standard',
    intro: 'Tell us how you play so we can plan the bracket and the broadcast.',
    fields: [
      { id: 'platform', type: 'dropdown', label: 'Platform you play on', required: true, scope: 'entry', options: opts('PlayStation 5', 'Xbox Series X|S', 'PC') },
      { id: 'club', type: 'short_text', label: 'Club you usually play with (optional)', required: false, scope: 'entry', maxLength: 60 },
      { id: 'discord', type: 'short_text', label: 'Discord username', required: true, scope: 'entry', maxLength: 40 },
      q('city'),
      q('stream_consent'),
      q('rules_consent'),
    ],
  },
}

export function presetSchema(gameId: string): FormSchema | null {
  const p = GAME_PRESETS[gameId]
  return p ? { version: 1, intro: p.intro, fields: structuredClone(p.fields) } : null
}

/** A library question with a key that does not collide with the fields already on the form. */
export function libraryField(key: string, existing: FormField[]): FormField {
  const f = q(key)
  let id = f.id
  let n = 2
  while (existing.some((x) => x.id === id)) id = `${f.id.slice(0, 36)}_${n++}`
  return { ...f, id }
}
