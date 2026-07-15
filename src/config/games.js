/**
 * ZENITH ESPORTS — Game Divisions Config
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for every game-specific rule across the site:
 * routing slugs, accent colors, roster sizes, and per-game player-ID
 * validation. The landing page, game hubs, tournament cards, the
 * registration form, and the admin dashboard all read from here so the
 * three divisions stay consistent.
 *
 * The `aliases` list maps historical `tournaments.game` string values to
 * a division so old records keep working after this multi-game refactor.
 */

export const GAMES = {
  pubg: {
    slug: 'pubg',
    name: 'PUBG Mobile',
    aliases: ['PUBG Mobile', 'PUBG', 'PUBGM', 'BGMI'],
    short: 'PUBGM',
    tagline: 'Drop. Loot. Dominate.',
    description:
      "Pakistan's flagship battle-royale circuit. Squads of four fight across Erangel and beyond for placement points and the crown.",
    accent: '#f9d07a',
    accentSoft: 'rgba(249, 208, 122, 0.12)',
    gradient: 'linear-gradient(135deg, #dbb462 0%, #f9d07a 100%)',
    icon: 'Crosshair',
    formats: ['Squad', 'Duo', 'Solo'],
    defaultFormat: 'Squad',
    roster: { label: 'Squad', teamWord: 'Squad', min: 4, max: 6, requiredCount: 4 },
    playerId: {
      label: 'Character ID',
      placeholder: '10–14 digit numeric ID',
      pattern: '^\\d{10,14}$',
      help: 'Your numeric PUBG Mobile character ID (10–14 digits).',
      example: '5123456789',
    },
    ign: { label: 'In-Game Name', placeholder: 'IGN' },
    perspectives: ['TPP', 'FPP'],
  },

  freefire: {
    slug: 'freefire',
    name: 'Free Fire',
    aliases: ['Free Fire', 'FreeFire', 'FF', 'Free Fire Max'],
    short: 'FF',
    tagline: 'Fast. Fierce. Fearless.',
    description:
      'The high-tempo battle royale. Four-player squads, ten-minute matches, and a relentless push for Booyah.',
    accent: '#ff7a3d',
    accentSoft: 'rgba(255, 122, 61, 0.12)',
    gradient: 'linear-gradient(135deg, #ff7a3d 0%, #ffb347 100%)',
    icon: 'Flame',
    formats: ['Squad', 'Duo', 'Solo', 'Clash Squad'],
    defaultFormat: 'Squad',
    roster: { label: 'Squad', teamWord: 'Squad', min: 4, max: 5, requiredCount: 4 },
    playerId: {
      label: 'Free Fire UID',
      placeholder: '8–12 digit numeric UID',
      pattern: '^\\d{8,12}$',
      help: 'Your numeric Free Fire UID from your in-game profile (8–12 digits).',
      example: '812345678',
    },
    ign: { label: 'In-Game Name', placeholder: 'IGN' },
    perspectives: ['TPP'],
  },

  valorant: {
    slug: 'valorant',
    name: 'Valorant',
    aliases: ['Valorant', 'VALORANT', 'Valo'],
    short: 'VAL',
    tagline: 'Defy the limits.',
    description:
      "Tactical 5v5 character-based shooting. Precise gunplay, agent abilities, and the sharpest teamwork in Pakistan's PC scene.",
    accent: '#ff4655',
    accentSoft: 'rgba(255, 70, 85, 0.12)',
    gradient: 'linear-gradient(135deg, #ff4655 0%, #ff8894 100%)',
    icon: 'Target',
    formats: ['5v5', '3v3', '1v1'],
    defaultFormat: '5v5',
    roster: { label: 'Team', teamWord: 'Team', min: 5, max: 7, requiredCount: 5 },
    playerId: {
      label: 'Riot ID',
      placeholder: 'Name#TAG',
      pattern: '^.{3,16}#[A-Za-z0-9]{3,5}$',
      help: 'Your full Riot ID including the tagline, e.g. Phoenix#PK1.',
      example: 'Phoenix#PK1',
    },
    ign: { label: 'Player Alias', placeholder: 'Display name' },
    perspectives: ['FPP'],
  },
};

/** Ordered list for menus, hubs, and the divisions grid. */
export const GAME_LIST = Object.values(GAMES);

/** Canonical `tournaments.game` string values, for the admin selector. */
export const GAME_NAMES = GAME_LIST.map((g) => g.name);

const _aliasIndex = (() => {
  const idx = {};
  for (const g of GAME_LIST) {
    idx[g.name.toLowerCase()] = g.slug;
    idx[g.slug.toLowerCase()] = g.slug;
    for (const a of g.aliases) idx[a.toLowerCase()] = g.slug;
  }
  return idx;
})();

/** Resolve any game name / alias / slug to a division config (defaults to PUBG). */
export function getGame(value) {
  if (!value) return GAMES.pubg;
  const slug = _aliasIndex[String(value).trim().toLowerCase()];
  return slug ? GAMES[slug] : GAMES.pubg;
}

/** Resolve by slug only; returns null when not a known division. */
export function getGameBySlug(slug) {
  return slug && GAMES[slug] ? GAMES[slug] : null;
}

/** Validate a single player ID against a game's rule. */
export function isValidPlayerId(gameValue, id) {
  const g = getGame(gameValue);
  try {
    return new RegExp(g.playerId.pattern).test(String(id).trim());
  } catch {
    return false;
  }
}
