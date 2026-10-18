-- ════════════════════════════════════════════════════════════════════════════
-- The football title's id (used in page links) loses its yearly version:
-- ea-fc-26 → ea-fc. The new game row is created first, every row that refers
-- to the old id is moved across (found from the foreign keys themselves, so
-- nothing is missed), then the old row is removed. Skipped when already done.
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare fk record;
begin
  if not exists (select 1 from zenith.games where id = 'ea-fc-26') then
    return;
  end if;

  insert into zenith.games (id, name, short_name, availability, uid_label, uid_hint, uid_pattern, uid_kind,
                            description, sort_order, logo_file_id, cover_file_id, accent)
  select 'ea-fc', name, short_name, availability, uid_label, uid_hint, uid_pattern, uid_kind,
         description, sort_order, logo_file_id, cover_file_id, accent
    from zenith.games where id = 'ea-fc-26'
  on conflict (id) do nothing;

  for fk in
    select c.conrelid::regclass as tbl, a.attname as col
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and c.confrelid = 'zenith.games'::regclass
  loop
    execute format('update %s set %I = %L where %I = %L', fk.tbl, fk.col, 'ea-fc', fk.col, 'ea-fc-26');
  end loop;

  delete from zenith.games where id = 'ea-fc-26';
end $$;
