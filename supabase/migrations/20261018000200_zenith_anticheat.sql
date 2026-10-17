-- ════════════════════════════════════════════════════════════════════════════
-- ZenithAntiCheat — flags, disciplinary records, public reports, alerts, scans.
-- All objects in schema `zenith`. See 20261018000100 for the safety note.
-- ════════════════════════════════════════════════════════════════════════════

create table zenith.ac_disciplinary_records (
  id             uuid primary key default gen_random_uuid(),
  game_id        text not null references zenith.games (id) on delete restrict,
  title          text not null check (char_length(title) between 3 and 160),
  decision       text not null,
  decided_at     timestamptz not null default now(),
  decided_by     uuid references zenith.staff_users (id) on delete set null,
  tournament_id  uuid references zenith.tournaments (id) on delete restrict,
  team_id        uuid references zenith.teams (id) on delete restrict,
  created_at     timestamptz not null default now()
);

create table zenith.ac_reports (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique check (reference ~ '^ZA-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  game_id                text not null references zenith.games (id) on delete restrict,
  reported_uid_raw       text not null,
  reported_uid_norm      text not null,
  reported_ign           text check (char_length(reported_ign) <= 40),
  explanation            text check (char_length(explanation) <= 2000),
  reporter_contact       text check (char_length(reporter_contact) <= 120),
  status                 text not null default 'pending'
                           check (status in ('pending', 'needs_clarification', 'approved', 'rejected', 'withdrawn')),
  uid_match_verified     boolean,
  duplicate_of           uuid references zenith.ac_reports (id) on delete set null,
  evidence_reused        boolean not null default false,
  reviewer_id            uuid references zenith.staff_users (id) on delete set null,
  reviewed_at            timestamptz,
  decision_reason        text,
  flag_id                uuid,                    -- fk added below
  retention_until        timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  ip_hash                text,
  -- A report can only be approved once a reviewer has confirmed the UID matches the evidence.
  check (status <> 'approved' or uid_match_verified is true),
  check (status = 'pending' or status = 'withdrawn' or reviewer_id is not null)
);
create index ac_reports_queue on zenith.ac_reports (status, created_at);
create index ac_reports_uid on zenith.ac_reports (game_id, reported_uid_norm);
create trigger ac_reports_touch before update on zenith.ac_reports
  for each row execute function zenith.touch_updated_at();

create table zenith.ac_report_evidence (
  report_id  uuid not null references zenith.ac_reports (id) on delete restrict,
  kind       text not null check (kind in ('report_confirmation', 'uid_proof')),
  file_id    uuid not null references zenith.files (id) on delete restrict,
  primary key (report_id, kind)
);

create table zenith.ac_flags (
  id                 uuid primary key default gen_random_uuid(),
  game_id            text not null references zenith.games (id) on delete restrict,
  player_id          uuid references zenith.players (id) on delete restrict,
  team_id            uuid references zenith.teams (id) on delete restrict,
  category           text not null check (category in ('cheating', 'ban_evasion', 'account_sharing', 'misconduct', 'other')),
  severity           text not null check (severity in ('watch', 'suspended', 'banned')),
  summary            text not null check (char_length(summary) between 3 and 300),
  record_id          uuid references zenith.ac_disciplinary_records (id) on delete restrict,
  source_report_id   uuid references zenith.ac_reports (id) on delete restrict,
  status             text not null default 'active' check (status in ('active', 'lifted', 'expired')),
  starts_at          timestamptz not null default now(),
  expires_at         timestamptz,
  created_by         uuid references zenith.staff_users (id) on delete set null,
  created_at         timestamptz not null default now(),
  lifted_at          timestamptz,
  lifted_by          uuid references zenith.staff_users (id) on delete set null,
  lift_reason        text
);
create index ac_flags_status on zenith.ac_flags (status, game_id);

alter table zenith.ac_reports
  add constraint ac_reports_flag_fk foreign key (flag_id) references zenith.ac_flags (id) on delete restrict;

create table zenith.ac_flag_identifiers (
  id          uuid primary key default gen_random_uuid(),
  flag_id     uuid not null references zenith.ac_flags (id) on delete restrict,
  kind        text not null check (kind in ('game_uid', 'phone', 'team_name', 'ign')),
  value_norm  text not null,
  confidence  text not null check (confidence in ('confirmed', 'strong', 'indicator')),
  note        text,
  created_at  timestamptz not null default now(),
  unique (flag_id, kind, value_norm)
);
create index ac_flag_identifiers_lookup on zenith.ac_flag_identifiers (kind, value_norm);

create table zenith.ac_alerts (
  id                  uuid primary key default gen_random_uuid(),
  dedupe_key          text not null unique,
  flag_id             uuid not null references zenith.ac_flags (id) on delete restrict,
  game_id             text not null references zenith.games (id) on delete restrict,
  match_kind          text not null check (match_kind in ('game_uid', 'phone', 'team_name', 'ign', 'team_history')),
  confidence          text not null check (confidence in ('confirmed', 'strong', 'indicator')),
  entity_type         text not null check (entity_type in ('registration', 'registration_member', 'player', 'team', 'lft_profile')),
  entity_id           uuid not null,
  registration_id     uuid references zenith.registrations (id) on delete restrict,
  tournament_id       uuid references zenith.tournaments (id) on delete restrict,
  matched_value       text not null,
  status              text not null default 'open' check (status in ('open', 'acknowledged', 'dismissed', 'resolved')),
  first_detected_at   timestamptz not null default now(),
  last_detected_at    timestamptz not null default now(),
  detection_count     integer not null default 1,
  last_scan_id        uuid,
  reviewed_by         uuid references zenith.staff_users (id) on delete set null,
  reviewed_at         timestamptz,
  resolution_note     text
);
create index ac_alerts_queue on zenith.ac_alerts (status, last_detected_at desc);
create index ac_alerts_registration on zenith.ac_alerts (registration_id) where registration_id is not null;
create index ac_alerts_tournament on zenith.ac_alerts (tournament_id) where tournament_id is not null;

create table zenith.ac_alert_history (
  id           bigserial primary key,
  alert_id     uuid not null references zenith.ac_alerts (id) on delete restrict,
  from_status  text,
  to_status    text not null,
  changed_by   uuid references zenith.staff_users (id) on delete set null,
  note         text,
  at           timestamptz not null default now()
);

create table zenith.ac_scan_runs (
  id               uuid primary key default gen_random_uuid(),
  trigger          text not null check (trigger in ('flag_created', 'manual', 'rule_update', 'import', 'registration', 'manual_entry')),
  flag_id          uuid references zenith.ac_flags (id) on delete restrict,
  status           text not null default 'running' check (status in ('running', 'completed', 'failed')),
  cursor_flag_id   uuid,
  flags_total      integer not null default 0,
  flags_done       integer not null default 0,
  alerts_created   integer not null default 0,
  alerts_updated   integer not null default 0,
  error            text,
  requested_by     uuid references zenith.staff_users (id) on delete set null,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz
);
create index ac_scan_runs_recent on zenith.ac_scan_runs (started_at desc);

create table zenith.ac_notes (
  id            uuid primary key default gen_random_uuid(),
  subject_type  text not null check (subject_type in ('report', 'flag', 'alert', 'player', 'team')),
  subject_id    uuid not null,
  author_id     uuid references zenith.staff_users (id) on delete set null,
  body          text not null check (char_length(body) between 1 and 4000),
  created_at    timestamptz not null default now()
);
create index ac_notes_subject on zenith.ac_notes (subject_type, subject_id, created_at);

-- ─── matching engine ────────────────────────────────────────────────────────
-- Candidate matches for one flag. When p_registration is given, only that
-- registration's rows are considered (used at ingestion time); otherwise the
-- whole historical dataset is scanned.

create or replace function zenith.ac_candidates(p_flag uuid, p_registration uuid default null)
returns table (
  match_kind       text,
  confidence       text,
  entity_type      text,
  entity_id        uuid,
  registration_id  uuid,
  tournament_id    uuid,
  matched_value    text
)
language sql stable as $$
  with f as (
    select id, game_id, player_id from zenith.ac_flags where id = p_flag and status = 'active'
  ),
  ids as (
    select i.kind, i.value_norm, i.confidence from zenith.ac_flag_identifiers i join f on f.id = i.flag_id
  )
  -- game UID → registration roster rows (current and historical)
  select 'game_uid', ids.confidence, 'registration_member', m.id, m.registration_id, m.tournament_id, ids.value_norm
    from ids
    join zenith.registration_members m on m.game_uid_norm = ids.value_norm
    join zenith.tournaments t on t.id = m.tournament_id
    join f on f.game_id = t.game_id
   where ids.kind = 'game_uid' and (p_registration is null or m.registration_id = p_registration)
  union all
  -- game UID → known players (covers manual entries and imports)
  select 'game_uid', ids.confidence, 'player', pi.player_id, null::uuid, null::uuid, ids.value_norm
    from ids
    join zenith.player_identifiers pi on pi.value_norm = ids.value_norm
    join f on f.game_id = pi.game_id
   where ids.kind = 'game_uid' and p_registration is null
     and pi.player_id is distinct from (select player_id from f)
  union all
  -- game UID → looking-for-team listings
  select 'game_uid', ids.confidence, 'lft_profile', l.id, null::uuid, null::uuid, ids.value_norm
    from ids
    join zenith.lft_profiles l on l.game_uid_norm = ids.value_norm
    join f on f.game_id = l.game_id
   where ids.kind = 'game_uid' and p_registration is null
  union all
  -- phone → registration contact numbers
  select 'phone', ids.confidence, 'registration', r.id, r.id, r.tournament_id, ids.value_norm
    from ids
    join zenith.registrations r on r.contact_phone_e164 = ids.value_norm
    join zenith.tournaments t on t.id = r.tournament_id
    join f on f.game_id = t.game_id
   where ids.kind = 'phone' and (p_registration is null or r.id = p_registration)
  union all
  -- phone → roster member numbers
  select 'phone', ids.confidence, 'registration_member', m.id, m.registration_id, m.tournament_id, ids.value_norm
    from ids
    join zenith.registration_members m on m.phone_e164 = ids.value_norm
    join zenith.tournaments t on t.id = m.tournament_id
    join f on f.game_id = t.game_id
   where ids.kind = 'phone' and (p_registration is null or m.registration_id = p_registration)
  union all
  -- phone → players linked to that number
  select 'phone', ids.confidence, 'player', l.player_id, null::uuid, null::uuid, ids.value_norm
    from ids
    join zenith.phone_numbers pn on pn.e164 = ids.value_norm
    join zenith.player_phone_links l on l.phone_id = pn.id
    join zenith.players p on p.id = l.player_id
    join f on f.game_id = p.game_id
   where ids.kind = 'phone' and p_registration is null
     and l.player_id is distinct from (select player_id from f)
  union all
  -- phone → LFT listings
  select 'phone', ids.confidence, 'lft_profile', l.id, null::uuid, null::uuid, ids.value_norm
    from ids
    join zenith.lft_profiles l on l.contact_phone_e164 = ids.value_norm
    join f on f.game_id = l.game_id
   where ids.kind = 'phone' and p_registration is null
  union all
  -- team name → registrations and known teams
  select 'team_name', ids.confidence, 'registration', r.id, r.id, r.tournament_id, ids.value_norm
    from ids
    join zenith.registrations r on r.team_name_norm = ids.value_norm
    join zenith.tournaments t on t.id = r.tournament_id
    join f on f.game_id = t.game_id
   where ids.kind = 'team_name' and (p_registration is null or r.id = p_registration)
  union all
  select 'team_name', ids.confidence, 'team', tm.id, null::uuid, null::uuid, ids.value_norm
    from ids
    join zenith.teams tm on tm.name_norm = ids.value_norm
    join f on f.game_id = tm.game_id
   where ids.kind = 'team_name' and p_registration is null
  union all
  -- in-game name → roster rows (weak signal, names are not unique)
  select 'ign', 'indicator', 'registration_member', m.id, m.registration_id, m.tournament_id, ids.value_norm
    from ids
    join zenith.registration_members m on m.ign_norm = ids.value_norm
    join zenith.tournaments t on t.id = m.tournament_id
    join f on f.game_id = t.game_id
   where ids.kind = 'ign' and (p_registration is null or m.registration_id = p_registration)
  union all
  -- the flagged player's historical teams (association, never proof)
  select 'team_history', 'indicator', 'team', tm.team_id, null::uuid, null::uuid, p.display_ign
    from f
    join zenith.team_memberships tm on tm.player_id = f.player_id
    join zenith.players p on p.id = f.player_id
   where f.player_id is not null and p_registration is null
$$;

-- Upsert alerts for one flag; returns (created, updated). Re-detection never
-- duplicates an alert and never reopens one a reviewer has closed.
create or replace function zenith.ac_scan_flag(p_flag uuid, p_scan uuid default null, p_registration uuid default null)
returns table (created integer, updated integer)
language plpgsql as $$
declare
  v_game text;
  v_created integer := 0;
  v_updated integer := 0;
begin
  select game_id into v_game from zenith.ac_flags where id = p_flag and status = 'active';
  if v_game is null then
    return query select 0, 0;
    return;
  end if;

  with c as (
    select distinct on (cand.match_kind, cand.entity_type, cand.entity_id) cand.*
      from zenith.ac_candidates(p_flag, p_registration) cand
     order by cand.match_kind, cand.entity_type, cand.entity_id,
              case cand.confidence when 'confirmed' then 0 when 'strong' then 1 else 2 end
  ),
  up as (
    insert into zenith.ac_alerts as a
      (dedupe_key, flag_id, game_id, match_kind, confidence, entity_type, entity_id,
       registration_id, tournament_id, matched_value, last_scan_id)
    select p_flag::text || ':' || c.match_kind || ':' || c.entity_type || ':' || c.entity_id::text,
           p_flag, v_game, c.match_kind, c.confidence, c.entity_type, c.entity_id,
           c.registration_id, c.tournament_id, c.matched_value, p_scan
      from c
    on conflict (dedupe_key) do update
       set last_detected_at = now(),
           detection_count  = a.detection_count + 1,
           last_scan_id     = excluded.last_scan_id
    returning (xmax = 0) as inserted, a.id, a.registration_id
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted)
    into v_created, v_updated
    from up;

  if v_created > 0 then
    perform zenith.emit('anticheat', 'alert.detected', p_flag, jsonb_build_object('created', v_created));
  end if;
  return query select v_created, v_updated;
end $$;

-- Ingestion-time check: every active flag whose identifiers touch this registration.
create or replace function zenith.ac_scan_registration(p_registration uuid)
returns table (created integer, updated integer)
language plpgsql as $$
declare
  v_flag uuid;
  v_c integer := 0;
  v_u integer := 0;
  r record;
begin
  for v_flag in
    select distinct i.flag_id
      from zenith.ac_flag_identifiers i
      join zenith.ac_flags fl on fl.id = i.flag_id and fl.status = 'active'
     where (i.kind = 'game_uid'  and i.value_norm in (select game_uid_norm from zenith.registration_members where registration_id = p_registration))
        or (i.kind = 'ign'       and i.value_norm in (select ign_norm from zenith.registration_members where registration_id = p_registration))
        or (i.kind = 'phone'     and i.value_norm in (select contact_phone_e164 from zenith.registrations where id = p_registration
                                                      union select phone_e164 from zenith.registration_members where registration_id = p_registration and phone_e164 is not null))
        or (i.kind = 'team_name' and i.value_norm in (select team_name_norm from zenith.registrations where id = p_registration and team_name_norm is not null))
  loop
    select * into r from zenith.ac_scan_flag(v_flag, null, p_registration);
    v_c := v_c + r.created;
    v_u := v_u + r.updated;
  end loop;
  return query select v_c, v_u;
end $$;

-- ─── products & intake ──────────────────────────────────────────────────────

create table zenith.product_inquiries (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique check (reference ~ '^ZQ-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  product         text not null check (product in ('production', 'points', 'general')),
  name            text not null check (char_length(name) between 2 and 80),
  email           text check (char_length(email) <= 254),
  phone_e164      text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  organization    text check (char_length(organization) <= 120),
  game            text check (char_length(game) <= 60),
  intended_use    text check (char_length(intended_use) <= 120),
  requirements    text check (char_length(requirements) <= 3000),
  message         text check (char_length(message) <= 3000),
  status          text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  internal_note   text,
  assigned_to     uuid references zenith.staff_users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  ip_hash         text,
  check (email is not null or phone_e164 is not null)
);
create index product_inquiries_queue on zenith.product_inquiries (status, created_at desc);
create trigger product_inquiries_touch before update on zenith.product_inquiries
  for each row execute function zenith.touch_updated_at();

create table zenith.production_bookings (
  id                      uuid primary key default gen_random_uuid(),
  reference               text not null unique check (reference ~ '^ZB-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  tournament_name         text not null check (char_length(tournament_name) between 2 and 120),
  game                    text not null check (char_length(game) between 2 and 60),
  event_date              date not null,
  start_time              time not null,
  timezone                text not null default 'Asia/Karachi',
  contact_name            text not null check (char_length(contact_name) between 2 and 80),
  email                   text check (char_length(email) <= 254),
  phone_e164              text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  organization            text check (char_length(organization) <= 120),
  broadcast_requirements  text not null check (char_length(broadcast_requirements) between 5 and 3000),
  event_scope             text check (char_length(event_scope) <= 1000),
  notes                   text check (char_length(notes) <= 2000),
  status                  text not null default 'requested'
                            check (status in ('requested', 'under_review', 'needs_info', 'confirmed', 'declined', 'cancelled')),
  admin_note              text,
  decided_by              uuid references zenith.staff_users (id) on delete set null,
  decided_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  ip_hash                 text,
  check (email is not null or phone_e164 is not null),
  -- A booking is only confirmed by a named administrator.
  check (status <> 'confirmed' or decided_by is not null)
);
create index production_bookings_queue on zenith.production_bookings (status, event_date);
create trigger production_bookings_touch before update on zenith.production_bookings
  for each row execute function zenith.touch_updated_at();

create table zenith.booking_history (
  id           bigserial primary key,
  booking_id   uuid not null references zenith.production_bookings (id) on delete restrict,
  from_status  text,
  to_status    text not null,
  changed_by   uuid references zenith.staff_users (id) on delete set null,
  note         text,
  at           timestamptz not null default now()
);

create table zenith.waitlist_signups (
  id                     uuid primary key default gen_random_uuid(),
  product                text not null default 'points' check (product in ('points')),
  email                  text not null check (char_length(email) <= 254),
  name                   text check (char_length(name) <= 80),
  platform               text not null check (platform in ('android', 'ios', 'both')),
  audience               text check (audience in ('organizer', 'team', 'player', 'other')),
  consent_text           text not null,
  consent_at             timestamptz not null default now(),
  unsubscribe_token_hash text not null unique,
  created_at             timestamptz not null default now(),
  ip_hash                text
);
create unique index waitlist_signups_email on zenith.waitlist_signups (product, lower(email));

create table zenith.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  reference   text not null unique check (reference ~ '^ZC-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  name        text not null check (char_length(name) between 2 and 80),
  email       text not null check (char_length(email) <= 254),
  topic       text not null check (topic in ('general', 'tournaments', 'partnership', 'media', 'anticheat', 'privacy')),
  message     text not null check (char_length(message) between 10 and 4000),
  status      text not null default 'new' check (status in ('new', 'replied', 'closed', 'spam')),
  created_at  timestamptz not null default now(),
  ip_hash     text
);
create index contact_messages_queue on zenith.contact_messages (status, created_at desc);

-- intake → realtime for the HQ console
create or replace function zenith.hq_intake_created() returns trigger
language plpgsql as $$
begin
  perform zenith.emit('hq', tg_table_name || '.created', new.id, '{}'::jsonb);
  return new;
end $$;
create trigger product_inquiries_created after insert on zenith.product_inquiries
  for each row execute function zenith.hq_intake_created();
create trigger production_bookings_created after insert on zenith.production_bookings
  for each row execute function zenith.hq_intake_created();
create trigger contact_messages_created after insert on zenith.contact_messages
  for each row execute function zenith.hq_intake_created();

create or replace function zenith.ac_report_created() returns trigger
language plpgsql as $$
begin
  perform zenith.emit('anticheat', 'report.created', new.id, '{}'::jsonb);
  return new;
end $$;
create trigger ac_reports_created after insert on zenith.ac_reports
  for each row execute function zenith.ac_report_created();

-- ─── lock everything down ───────────────────────────────────────────────────
-- RLS on, no policies: anon/authenticated (PostgREST) see nothing even if the
-- schema were ever exposed. The website connects as a privileged server role.

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'zenith' loop
    execute format('alter table zenith.%I enable row level security', t.tablename);
    execute format('revoke all on zenith.%I from public', t.tablename);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on zenith.%I from anon', t.tablename);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on zenith.%I from authenticated', t.tablename);
    end if;
  end loop;
end $$;

-- Optional least-privilege login role for the website (see supabase/setup/app_role.sql).
-- When `zenith_app` exists it gets full access to schema `zenith` and nothing else,
-- so the website cannot read public.hisaab_* or the legacy tables.
create or replace function zenith.apply_app_role_grants() returns void
language plpgsql as $$
declare t record;
begin
  if not exists (select 1 from pg_roles where rolname = 'zenith_app') then
    return;
  end if;
  execute 'grant usage on schema zenith to zenith_app';
  execute 'grant select, insert, update, delete on all tables in schema zenith to zenith_app';
  execute 'grant usage, select on all sequences in schema zenith to zenith_app';
  execute 'grant execute on all functions in schema zenith to zenith_app';
  for t in select tablename from pg_tables where schemaname = 'zenith' loop
    execute format('drop policy if exists zenith_app_all on zenith.%I', t.tablename);
    execute format('create policy zenith_app_all on zenith.%I for all to zenith_app using (true) with check (true)', t.tablename);
  end loop;
end $$;

select zenith.apply_app_role_grants();
