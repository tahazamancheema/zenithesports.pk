-- ════════════════════════════════════════════════════════════════════════════
-- Game status as of October 2026: PUBG Mobile, VALORANT and Honor of Kings are
-- operational; Free Fire is coming soon. ZenithAntiCheat takes reports for
-- PUBG Mobile, Free Fire, VALORANT and Honor of Kings.
-- Each update only applies while the value is still the earlier default, so an
-- administrator's own choice in the console is never overwritten.
-- ════════════════════════════════════════════════════════════════════════════

update zenith.games set availability = 'active'   where id = 'honor-of-kings' and availability = 'upcoming';
update zenith.games set availability = 'upcoming' where id = 'free-fire'      and availability = 'active';

update zenith.settings
   set value = jsonb_set(value, '{games}', '["pubg-mobile", "free-fire", "valorant", "honor-of-kings"]'::jsonb)
 where key = 'product.anticheat'
   and value -> 'games' in ('["pubg-mobile"]'::jsonb,
                            '["pubg-mobile", "free-fire", "valorant", "honor-of-kings", "tekken-8", "ea-fc-26"]'::jsonb);
