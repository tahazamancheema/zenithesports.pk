/**
 * Visual identity per game: generated key art (no trademarks, made for Zenith),
 * an accent colour, and how the game is marked when no official logo has been
 * uploaded in the Registrations console.
 */
export type GameArt = {
  art: string
  thumb: string
  accent: string
  /** Two-line wordmark used when there is no glyph and no uploaded logo. */
  word: [string, string?]
  genre: string
  /** Official wordmark supplied by Zenith (transparent, for dark backgrounds). */
  logo?: string
  /** Square official emblem, used for small icons. */
  emblem?: string
}

export const GAME_ART: Record<string, GameArt> = {
  'pubg-mobile': { art: '/visuals/games/pubg-mobile.webp', thumb: '/visuals/games/pubg-mobile-sm.webp', accent: '#f2b33d', word: ['PUBG', 'MOBILE'], genre: 'Battle royale' },
  'free-fire': { art: '/visuals/games/free-fire.webp', thumb: '/visuals/games/free-fire-sm.webp', accent: '#ff7a2f', word: ['FREE', 'FIRE'], genre: 'Battle royale', logo: '/games/free-fire-logo.png' },
  valorant: { art: '/visuals/games/valorant.webp', thumb: '/visuals/games/valorant-sm.webp', accent: '#ff4655', word: ['VALORANT'], genre: 'Tactical shooter' },
  'honor-of-kings': { art: '/visuals/games/honor-of-kings.webp', thumb: '/visuals/games/honor-of-kings-sm.webp', accent: '#e9c46a', word: ['HONOR', 'OF KINGS'], genre: 'Mobile MOBA', logo: '/games/honor-of-kings-logo.png', emblem: '/games/honor-of-kings-emblem.png' },
  'tekken-8': { art: '/visuals/games/tekken-8.webp', thumb: '/visuals/games/tekken-8-sm.webp', accent: '#5b8cff', word: ['TEKKEN', '8'], genre: 'Fighting', logo: '/games/tekken-8-logo.png' },
  'ea-fc-26': { art: '/visuals/games/ea-fc-26.webp', thumb: '/visuals/games/ea-fc-26-sm.webp', accent: '#3ddc84', word: ['EA SPORTS', 'FC 26'], genre: 'Football' },
}

const FALLBACK: GameArt = { art: '/visuals/arena.webp', thumb: '/visuals/arena.webp', accent: '#d9b25f', word: ['ZENITH'], genre: 'Esports' }

export const gameArt = (id: string | null | undefined): GameArt => (id && GAME_ART[id]) || FALLBACK
