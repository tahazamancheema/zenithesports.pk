-- ════════════════════════════════════════════════════════════════════════════
-- Reference data only: games, formats and empty settings.
-- No tournaments, players, statistics or contact details are invented here.
-- ON CONFLICT DO NOTHING keeps administrator edits when re-run.
-- ════════════════════════════════════════════════════════════════════════════

insert into zenith.games (id, name, short_name, availability, uid_label, uid_hint, uid_pattern, uid_kind, description, sort_order) values
  ('pubg-mobile',    'PUBG Mobile',     'PUBGM', 'active',   'Character ID', 'Numeric ID from your in-game profile (10–14 digits).', '^[0-9]{10,14}$', 'game_uid',
   'Battle royale. Squads drop, rotate and fight for placement and eliminations.', 10),
  ('free-fire',      'Free Fire',       'FF',    'active',   'Free Fire UID', 'Numeric UID from your in-game profile (8–12 digits).', '^[0-9]{8,12}$', 'game_uid',
   'Fast battle royale. Short matches, tight circles, constant pressure.', 20),
  ('valorant',       'VALORANT',        'VAL',   'active',   'Riot ID', 'Your full Riot ID including the tag, e.g. Name#TAG.', '^[^#]{3,16}#[A-Za-z0-9]{3,5}$', 'riot_id',
   'Tactical 5v5. Precise gunplay, utility and coordinated executes.', 30),
  ('honor-of-kings', 'Honor of Kings',  'HOK',   'upcoming', 'Player ID', 'Numeric player ID from your in-game profile.', '^[0-9]{5,20}$', 'game_uid',
   'Mobile MOBA. Five-player teams, lanes, objectives and drafts.', 40),
  ('tekken-8',       'TEKKEN 8',        'T8',    'upcoming', 'TEKKEN ID', 'The ID on your in-game player card, or your platform ID.', '^[A-Za-z0-9_-]{4,32}$', 'platform_id',
   '1v1 fighting. Bracket play, set counts and frame-perfect decisions.', 50),
  ('ea-fc-26',       'EA SPORTS FC 26', 'FC26',  'upcoming', 'EA ID', 'Your EA ID or platform username.', '^[A-Za-z0-9_.-]{3,32}$', 'platform_id',
   'Football. Solo and duo competition on the pitch.', 60)
on conflict (id) do nothing;

insert into zenith.game_formats (game_id, code, label, min_players, max_players, max_substitutes, enabled) values
  ('pubg-mobile',    'solo',  'Solo',              1, 1, 0, true),
  ('pubg-mobile',    'duo',   'Duo',               2, 2, 0, true),
  ('pubg-mobile',    'squad', 'Squad',             4, 4, 2, true),
  ('free-fire',      'solo',  'Solo',              1, 1, 0, true),
  ('free-fire',      'duo',   'Duo',               2, 2, 0, true),
  ('free-fire',      'squad', 'Squad',             4, 4, 1, true),
  ('tekken-8',       'solo',  'Solo',              1, 1, 0, true),
  ('ea-fc-26',       'solo',  'Solo',              1, 1, 0, true),
  ('ea-fc-26',       'duo',   'Duo',               2, 2, 0, true),
  ('valorant',       'team5', '5v5 Team',          5, 5, 2, true),
  ('valorant',       'lft',   'Looking for Team',  1, 1, 0, true),
  ('honor-of-kings', 'team5', '5v5 Team',          5, 5, 2, true),
  ('honor-of-kings', 'lft',   'Looking for Team',  1, 1, 0, true)
on conflict (game_id, code) do nothing;

-- Public configuration. Empty values render as clearly-marked placeholders
-- until an administrator fills them in from the HQ console.
insert into zenith.settings (key, value) values
  ('contact', '{"email": "", "phone": "", "whatsapp": "", "city": "", "responseNote": ""}'),
  ('social', '{"youtube": "", "instagram": "", "facebook": "", "tiktok": "", "discord": "", "x": "", "whatsappChannel": ""}'),
  ('product.production', '{"status": "available", "headline": "", "primaryCta": "inquire"}'),
  ('product.points', '{"status": "coming_soon", "playStoreUrl": "", "appStoreUrl": "", "launchNote": ""}'),
  ('product.anticheat', '{"status": "pilot", "games": ["pubg-mobile"]}'),
  ('seo', '{"titleSuffix": "Zenith Esports", "description": "Zenith Esports is a Pakistani multi-gaming organisation building the systems competitive esports runs on: registrations, broadcast production, competitive integrity and scoring."}'),
  ('notify', '{"staffEmail": "", "inquiryEmail": ""}'),
  ('about', '{"founded": "", "mission": "", "vision": ""}'),
  ('announcement', '{"enabled": false, "text": "", "href": ""}')
on conflict (key) do nothing;
