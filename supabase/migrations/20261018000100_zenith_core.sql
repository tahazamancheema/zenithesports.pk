-- ════════════════════════════════════════════════════════════════════════════
-- Zenith ecosystem — core schema
--
-- SAFETY: this project's database is shared with the legacy website tables in
-- `public` and with ZenithHisaab (`public.hisaab_*`, `auth.users`).
-- Every object below lives in the dedicated `zenith` schema. Nothing here
-- creates, alters, truncates or drops anything in `public` or `auth`.
-- Rollback for this whole migration set is: DROP SCHEMA zenith CASCADE;
-- ════════════════════════════════════════════════════════════════════════════

create schema if not exists zenith;

-- The Data API (PostgREST) must never reach this schema. Default-deny.
revoke all on schema zenith from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema zenith from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema zenith from authenticated';
  end if;
end $$;

-- ─── helpers ────────────────────────────────────────────────────────────────

create or replace function zenith.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Lower-cased, whitespace-free identifier (game UIDs, Riot IDs, platform IDs).
create or replace function zenith.norm_id(v text) returns text
language sql immutable as $$
  select nullif(lower(regexp_replace(coalesce(v, ''), '\s+', '', 'g')), '')
$$;

-- Lower-cased, single-spaced display name (team names, in-game names).
create or replace function zenith.norm_name(v text) returns text
language sql immutable as $$
  select nullif(lower(regexp_replace(btrim(coalesce(v, '')), '\s+', ' ', 'g')), '')
$$;

-- ─── realtime outbox ────────────────────────────────────────────────────────
-- Payloads carry ids and kinds only. Never personal data.

create table zenith.events (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  topic       text not null check (topic in ('registrations', 'anticheat', 'hq')),
  kind        text not null,
  entity_id   uuid,
  payload     jsonb not null default '{}'::jsonb
);
create index events_topic_id on zenith.events (topic, id);

create or replace function zenith.emit(p_topic text, p_kind text, p_entity uuid, p_payload jsonb default '{}'::jsonb)
returns void language plpgsql as $$
declare v_id bigint;
begin
  insert into zenith.events (topic, kind, entity_id, payload)
  values (p_topic, p_kind, p_entity, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;
  perform pg_notify('zenith_events', json_build_object('id', v_id, 'topic', p_topic, 'kind', p_kind)::text);
end $$;

-- ─── staff accounts & sessions ──────────────────────────────────────────────
-- Deliberately separate from the shared auth.users (ZenithHisaab's login).

create table zenith.staff_users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null,
  display_name          text not null check (char_length(display_name) between 1 and 80),
  password_hash         text not null,
  status                text not null default 'active' check (status in ('active', 'disabled')),
  must_change_password  boolean not null default true,
  failed_attempts       integer not null default 0,
  locked_until          timestamptz,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references zenith.staff_users (id) on delete set null
);
create unique index staff_users_email on zenith.staff_users (lower(email));
create trigger staff_users_touch before update on zenith.staff_users
  for each row execute function zenith.touch_updated_at();

create table zenith.staff_roles (
  user_id     uuid not null references zenith.staff_users (id) on delete cascade,
  role        text not null check (role in ('super_admin', 'senior_admin', 'tournament_admin', 'anticheat_reviewer')),
  granted_by  uuid references zenith.staff_users (id) on delete set null,
  granted_at  timestamptz not null default now(),
  primary key (user_id, role)
);

create table zenith.sessions (
  id            text primary key,                  -- sha256(token), hex
  user_id       uuid not null references zenith.staff_users (id) on delete cascade,
  surface       text not null check (surface in ('hq', 'registrations', 'anticheat')),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  ip_hash       text,
  user_agent    text
);
create index sessions_user on zenith.sessions (user_id) where revoked_at is null;

create table zenith.rate_limits (
  key           text primary key,
  window_start  timestamptz not null,
  count         integer not null
);

-- ─── audit (append-only) ────────────────────────────────────────────────────

create table zenith.audit_events (
  id            bigserial primary key,
  at            timestamptz not null default now(),
  actor_id      uuid references zenith.staff_users (id) on delete set null,
  actor_label   text not null,
  surface       text,
  action        text not null,
  entity_type   text,
  entity_id     text,
  ip_hash       text,
  details       jsonb not null default '{}'::jsonb
);
create index audit_events_entity on zenith.audit_events (entity_type, entity_id, at desc);
create index audit_events_at on zenith.audit_events (at desc);

create or replace function zenith.audit_is_append_only() returns trigger
language plpgsql as $$
begin
  -- The FK's "on delete set null" is the only permitted rewrite.
  if tg_op = 'UPDATE'
     and new.actor_id is null and old.actor_id is not null
     and (new.at, new.actor_label, new.action, new.entity_type, new.entity_id, new.details)
         is not distinct from (old.at, old.actor_label, old.action, old.entity_type, old.entity_id, old.details) then
    return new;
  end if;
  raise exception 'audit_events is append-only';
end $$;
create trigger audit_events_append_only before update or delete on zenith.audit_events
  for each row execute function zenith.audit_is_append_only();

-- ─── notifications outbox ───────────────────────────────────────────────────

create table zenith.notifications (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null check (channel in ('email', 'discord')),
  recipient   text,
  subject     text not null,
  body        text not null,
  status      text not null default 'pending' check (status in ('pending', 'sent', 'skipped', 'failed')),
  error       text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index notifications_status on zenith.notifications (status, created_at);

-- ─── private file store ─────────────────────────────────────────────────────

create table zenith.files (
  id               uuid primary key default gen_random_uuid(),
  purpose          text not null check (purpose in ('evidence', 'registration', 'media')),
  sha256           text not null,
  mime             text not null check (mime in ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes       integer not null check (size_bytes > 0 and size_bytes <= 8388608),
  width            integer,
  height           integer,
  data             bytea,                                 -- null once purged
  created_at       timestamptz not null default now(),
  purged_at        timestamptz,
  retention_until  timestamptz
);
create index files_sha on zenith.files (sha256);

-- ─── site settings & content ────────────────────────────────────────────────

create table zenith.settings (
  key         text primary key check (key ~ '^[a-z0-9_.]{2,64}$'),
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references zenith.staff_users (id) on delete set null
);

create table zenith.org_members (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 80),
  role_title     text not null check (char_length(role_title) between 1 and 80),
  bio            text check (char_length(bio) <= 600),
  image_file_id  uuid references zenith.files (id) on delete set null,
  sort_order     integer not null default 0,
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger org_members_touch before update on zenith.org_members
  for each row execute function zenith.touch_updated_at();

create table zenith.product_media (
  id            uuid primary key default gen_random_uuid(),
  product       text not null check (product in ('production', 'points', 'home')),
  title         text not null check (char_length(title) between 1 and 120),
  caption       text check (char_length(caption) <= 400),
  is_authentic  boolean not null default false,   -- true only for approved real screenshots
  file_id       uuid not null references zenith.files (id) on delete restrict,
  sort_order    integer not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── games & formats ────────────────────────────────────────────────────────

create table zenith.games (
  id              text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name            text not null,
  short_name      text not null,
  availability    text not null default 'planned'
                    check (availability in ('active', 'upcoming', 'planned', 'paused')),
  uid_label       text not null,
  uid_hint        text not null,
  uid_pattern     text not null,                   -- POSIX regex applied to the trimmed raw value
  uid_kind        text not null default 'game_uid' check (uid_kind in ('game_uid', 'riot_id', 'platform_id')),
  description     text not null default '',
  sort_order      integer not null default 0,
  updated_at      timestamptz not null default now()
);
create trigger games_touch before update on zenith.games
  for each row execute function zenith.touch_updated_at();

create table zenith.game_formats (
  id               uuid primary key default gen_random_uuid(),
  game_id          text not null references zenith.games (id) on delete restrict,
  code             text not null check (code in ('solo', 'duo', 'squad', 'team5', 'lft')),
  label            text not null,
  min_players      integer not null check (min_players >= 1),
  max_players      integer not null,
  max_substitutes  integer not null default 0 check (max_substitutes >= 0),
  enabled          boolean not null default true,
  unique (game_id, code),
  check (max_players >= min_players)
);

-- ─── forms ──────────────────────────────────────────────────────────────────

create table zenith.form_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  description  text not null default '',
  game_id      text references zenith.games (id) on delete restrict,
  created_by   uuid references zenith.staff_users (id) on delete set null,
  created_at   timestamptz not null default now(),
  archived_at  timestamptz
);

create table zenith.form_versions (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references zenith.form_templates (id) on delete restrict,
  version       integer not null check (version >= 1),
  schema        jsonb not null,
  status        text not null default 'draft' check (status in ('draft', 'published', 'superseded')),
  created_by    uuid references zenith.staff_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  published_at  timestamptz,
  unique (template_id, version)
);
create unique index form_versions_one_draft on zenith.form_versions (template_id) where status = 'draft';

create or replace function zenith.form_version_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'published form versions cannot be deleted'; end if;
    return old;
  end if;
  if old.status <> 'draft' and new.schema is distinct from old.schema then
    raise exception 'published form versions are immutable';
  end if;
  if old.status = 'superseded' and new.status <> 'superseded' then
    raise exception 'superseded form versions cannot be revived';
  end if;
  return new;
end $$;
create trigger form_versions_guard before update or delete on zenith.form_versions
  for each row execute function zenith.form_version_guard();

-- ─── tournaments ────────────────────────────────────────────────────────────

create table zenith.tournaments (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  game_id                  text not null references zenith.games (id) on delete restrict,
  format_id                uuid not null references zenith.game_formats (id) on delete restrict,
  name                     text not null check (char_length(name) between 3 and 120),
  summary                  text not null default '' check (char_length(summary) <= 280),
  description              text not null default '',
  rules                    text not null default '',
  eligibility              text not null default '',
  prize_info               text not null default '',
  timezone                 text not null default 'Asia/Karachi',
  starts_at                timestamptz,
  ends_at                  timestamptz,
  registration_opens_at    timestamptz,
  registration_closes_at   timestamptz,
  capacity                 integer check (capacity is null or capacity > 0),
  roster_min               integer not null check (roster_min >= 1),
  roster_max               integer not null,
  substitutes_max          integer not null default 0 check (substitutes_max >= 0),
  substitutes_required     integer not null default 0 check (substitutes_required >= 0),
  entry_fee_pkr            integer check (entry_fee_pkr is null or entry_fee_pkr >= 0),
  fee_notes                text not null default '',
  requires_approval        boolean not null default true,
  waitlist_enabled         boolean not null default true,
  unique_phone             boolean not null default true,
  form_version_id          uuid references zenith.form_versions (id) on delete restrict,
  communication_links      jsonb not null default '[]'::jsonb,
  broadcast_url            text,
  status                   text not null default 'draft' check (status in ('draft', 'published', 'archived', 'cancelled')),
  cancel_reason            text,
  results_notes            text not null default '',
  admin_notes              text not null default '',
  created_by               uuid references zenith.staff_users (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  published_at             timestamptz,
  check (roster_max >= roster_min),
  check (substitutes_required <= substitutes_max),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check (registration_closes_at is null or registration_opens_at is null or registration_closes_at > registration_opens_at)
);
create index tournaments_listing on zenith.tournaments (status, starts_at);
create trigger tournaments_touch before update on zenith.tournaments
  for each row execute function zenith.touch_updated_at();

-- ─── identity graph (shared by Registrations & AntiCheat) ───────────────────

create table zenith.players (
  id           uuid primary key default gen_random_uuid(),
  game_id      text not null references zenith.games (id) on delete restrict,
  display_ign  text not null,
  source       text not null check (source in ('registration', 'manual', 'report', 'lft')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger players_touch before update on zenith.players
  for each row execute function zenith.touch_updated_at();

create table zenith.player_identifiers (
  id             uuid primary key default gen_random_uuid(),
  player_id      uuid not null references zenith.players (id) on delete restrict,
  game_id        text not null references zenith.games (id) on delete restrict,
  kind           text not null check (kind in ('game_uid', 'riot_id', 'platform_id')),
  value_raw      text not null,
  value_norm     text not null,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  unique (game_id, kind, value_norm)
);
create index player_identifiers_player on zenith.player_identifiers (player_id);
create index player_identifiers_value on zenith.player_identifiers (value_norm);

create table zenith.player_ign_history (
  id         bigserial primary key,
  player_id  uuid not null references zenith.players (id) on delete restrict,
  ign        text not null,
  ign_norm   text not null,
  seen_at    timestamptz not null default now(),
  unique (player_id, ign_norm)
);
create index player_ign_history_norm on zenith.player_ign_history (ign_norm);

create table zenith.phone_numbers (
  id     uuid primary key default gen_random_uuid(),
  e164   text not null unique check (e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table zenith.player_phone_links (
  player_id      uuid not null references zenith.players (id) on delete restrict,
  phone_id       uuid not null references zenith.phone_numbers (id) on delete restrict,
  source         text not null check (source in ('registration', 'manual', 'lft')),
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  primary key (player_id, phone_id)
);
create index player_phone_links_phone on zenith.player_phone_links (phone_id);

create table zenith.teams (
  id          uuid primary key default gen_random_uuid(),
  game_id     text not null references zenith.games (id) on delete restrict,
  name        text not null,
  name_norm   text not null,
  source      text not null check (source in ('registration', 'manual')),
  created_at  timestamptz not null default now(),
  unique (game_id, name_norm)
);

create table zenith.team_memberships (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references zenith.teams (id) on delete restrict,
  player_id        uuid not null references zenith.players (id) on delete restrict,
  role             text not null check (role in ('captain', 'player', 'substitute')),
  source           text not null check (source in ('registration', 'manual')),
  registration_id  uuid,                      -- fk added after registrations exists
  started_at       timestamptz not null default now(),
  ended_at         timestamptz
);
create index team_memberships_team on zenith.team_memberships (team_id);
create index team_memberships_player on zenith.team_memberships (player_id);

-- ─── registrations ──────────────────────────────────────────────────────────

create table zenith.registrations (
  id                   uuid primary key default gen_random_uuid(),
  reference            text not null unique check (reference ~ '^ZR-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  tournament_id        uuid not null references zenith.tournaments (id) on delete restrict,
  team_id              uuid references zenith.teams (id) on delete restrict,
  team_name            text,
  team_name_norm       text,
  status               text not null default 'pending'
                         check (status in ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn', 'disqualified', 'cancelled')),
  form_version_id      uuid references zenith.form_versions (id) on delete restrict,
  answers              jsonb not null default '{}'::jsonb,
  contact_phone_e164   text not null check (contact_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  contact_email        text,
  phone_unique_key     text,       -- = contact_phone_e164 when the tournament enforces it
  manage_token_hash    text not null unique,
  source               text not null default 'public' check (source in ('public', 'manual')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  decided_at           timestamptz,
  decided_by           uuid references zenith.staff_users (id) on delete set null,
  decision_reason      text,
  ip_hash              text
);
create index registrations_tournament on zenith.registrations (tournament_id, status, created_at desc);
create unique index registrations_active_team_name on zenith.registrations (tournament_id, team_name_norm)
  where team_name_norm is not null and status in ('pending', 'approved', 'waitlisted');
create unique index registrations_active_phone on zenith.registrations (tournament_id, phone_unique_key)
  where phone_unique_key is not null and status in ('pending', 'approved', 'waitlisted');
create index registrations_phone on zenith.registrations (contact_phone_e164);
create index registrations_team_name_norm on zenith.registrations (team_name_norm);
create trigger registrations_touch before update on zenith.registrations
  for each row execute function zenith.touch_updated_at();

alter table zenith.team_memberships
  add constraint team_memberships_registration_fk
  foreign key (registration_id) references zenith.registrations (id) on delete restrict;

create table zenith.registration_members (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null references zenith.registrations (id) on delete restrict,
  tournament_id    uuid not null references zenith.tournaments (id) on delete restrict,
  slot             integer not null check (slot >= 1),
  role             text not null check (role in ('captain', 'player', 'substitute')),
  player_id        uuid references zenith.players (id) on delete restrict,
  ign              text not null,
  ign_norm         text not null,
  game_uid_raw     text not null,
  game_uid_norm    text not null,
  phone_e164       text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  answers          jsonb not null default '{}'::jsonb,
  active           boolean not null default true,
  unique (registration_id, slot)
);
-- The concurrency-safe duplicate guard: one active entry per UID per tournament.
create unique index registration_members_active_uid on zenith.registration_members (tournament_id, game_uid_norm) where active;
create index registration_members_uid on zenith.registration_members (game_uid_norm);
create index registration_members_phone on zenith.registration_members (phone_e164) where phone_e164 is not null;
create index registration_members_ign on zenith.registration_members (ign_norm);
create index registration_members_player on zenith.registration_members (player_id);

create table zenith.registration_status_history (
  id               bigserial primary key,
  registration_id  uuid not null references zenith.registrations (id) on delete restrict,
  from_status      text,
  to_status        text not null,
  changed_by       uuid references zenith.staff_users (id) on delete set null,
  actor_label      text not null,
  reason           text,
  at               timestamptz not null default now()
);
create index registration_status_history_reg on zenith.registration_status_history (registration_id, at);

create or replace function zenith.registration_status_legal(p_from text, p_to text) returns boolean
language sql immutable as $$
  select case p_from
    when 'pending'      then p_to in ('approved', 'rejected', 'waitlisted', 'withdrawn', 'cancelled')
    when 'waitlisted'   then p_to in ('pending', 'approved', 'rejected', 'withdrawn', 'cancelled')
    when 'approved'     then p_to in ('withdrawn', 'disqualified', 'cancelled')
    when 'rejected'     then p_to in ('pending')
    else false            -- withdrawn, disqualified, cancelled are terminal
  end
$$;

create or replace function zenith.registration_status_guard() returns trigger
language plpgsql as $$
declare
  v_active boolean := new.status in ('pending', 'approved', 'waitlisted');
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not zenith.registration_status_legal(old.status, new.status) then
      raise exception 'illegal registration status transition % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;
    update zenith.registration_members set active = v_active where registration_id = new.id;
    update zenith.team_memberships set ended_at = coalesce(ended_at, now())
      where registration_id = new.id and not v_active;
    perform zenith.emit('registrations', 'registration.status', new.id,
      jsonb_build_object('tournament_id', new.tournament_id, 'status', new.status));
  end if;
  return new;
end $$;
create trigger registrations_status_guard after update of status on zenith.registrations
  for each row execute function zenith.registration_status_guard();

create or replace function zenith.registration_created() returns trigger
language plpgsql as $$
begin
  perform zenith.emit('registrations', 'registration.created', new.id,
    jsonb_build_object('tournament_id', new.tournament_id, 'status', new.status));
  return new;
end $$;
create trigger registrations_created after insert on zenith.registrations
  for each row execute function zenith.registration_created();

-- ─── looking for team ───────────────────────────────────────────────────────

create table zenith.lft_profiles (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique check (reference ~ '^ZL-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  game_id             text not null references zenith.games (id) on delete restrict,
  player_id           uuid references zenith.players (id) on delete restrict,
  ign                 text not null check (char_length(ign) between 2 and 40),
  game_uid_raw        text not null,
  game_uid_norm       text not null,
  roles               text[] not null default '{}',
  rank_label          text check (char_length(rank_label) <= 40),
  city                text check (char_length(city) <= 60),
  availability        text check (char_length(availability) <= 120),
  bio                 text check (char_length(bio) <= 400),
  contact_phone_e164  text check (contact_phone_e164 is null or contact_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  contact_discord     text check (char_length(contact_discord) <= 40),
  consent_listing     boolean not null check (consent_listing),
  consent_at          timestamptz not null default now(),
  status              text not null default 'active' check (status in ('active', 'matched', 'withdrawn', 'hidden')),
  manage_token_hash   text not null unique,
  admin_note          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  ip_hash             text
);
create unique index lft_profiles_active_uid on zenith.lft_profiles (game_id, game_uid_norm) where status = 'active';
create index lft_profiles_listing on zenith.lft_profiles (game_id, status, created_at desc);
create index lft_profiles_phone on zenith.lft_profiles (contact_phone_e164) where contact_phone_e164 is not null;
create trigger lft_profiles_touch before update on zenith.lft_profiles
  for each row execute function zenith.touch_updated_at();

create table zenith.lft_requests (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references zenith.lft_profiles (id) on delete restrict,
  requester_name      text not null check (char_length(requester_name) between 2 and 60),
  team_name           text check (char_length(team_name) <= 60),
  requester_contact   text not null check (char_length(requester_contact) between 4 and 80),
  message             text check (char_length(message) <= 500),
  status              text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  view_token_hash     text not null unique,
  created_at          timestamptz not null default now(),
  responded_at        timestamptz,
  ip_hash             text
);
create index lft_requests_profile on zenith.lft_requests (profile_id, status);
create unique index lft_requests_one_pending on zenith.lft_requests (profile_id, lower(requester_contact)) where status = 'pending';
