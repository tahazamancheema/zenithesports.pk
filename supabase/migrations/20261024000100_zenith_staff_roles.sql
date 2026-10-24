-- One admin panel, more precise staff roles.
--
-- Existing role values keep their meaning (and labels change in the app):
--   super_admin → Owner, senior_admin → Administrator,
--   tournament_admin → Tournament manager, anticheat_reviewer → AntiCheat reviewer.
-- New roles:
--   game_manager          runs tournaments for the games assigned to them (zenith.staff_game_scopes)
--   registration_reviewer approves, rejects and waitlists entries; moderates Looking for Team
--   inbox_manager         contact messages, production bookings and inquiries, the Points waitlist
--   production_manager    ZenithProduction bookings, inquiries and its product page
--   website_developer     site settings, announcement, media and team pages
--   app_manager           ZenithPoints: launch waitlist and its product page

alter table zenith.staff_roles drop constraint if exists staff_roles_role_check;
alter table zenith.staff_roles add constraint staff_roles_role_check check (role in (
  'super_admin', 'senior_admin', 'tournament_admin', 'anticheat_reviewer',
  'game_manager', 'registration_reviewer', 'inbox_manager', 'production_manager', 'website_developer', 'app_manager'
));

-- Which games a game manager (or a scoped reviewer) works on. No rows = every game.
create table if not exists zenith.staff_game_scopes (
  user_id     uuid not null references zenith.staff_users (id) on delete cascade,
  game_id     text not null references zenith.games (id) on delete cascade on update cascade,
  granted_by  uuid references zenith.staff_users (id) on delete set null,
  granted_at  timestamptz not null default now(),
  primary key (user_id, game_id)
);
alter table zenith.staff_game_scopes enable row level security;

select zenith.apply_app_role_grants();
