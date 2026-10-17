/**
 * Database tooling.
 *
 *   npm run db:local     start a local PostgreSQL (PGlite) on 127.0.0.1:54329 and apply migrations
 *   npm run db:migrate   apply pending migrations to $DATABASE_URL
 *   npm run db:status    list applied / pending migrations on $DATABASE_URL
 *
 * Migrations only ever touch the `zenith` schema (enforced by tests/unit/migrations.test.ts).
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import postgres from 'postgres'

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase/migrations')
const LOCAL_PORT = Number(process.env.LOCAL_DB_PORT ?? 54329)
const LOCAL_DATA_DIR = resolve(process.cwd(), '.local/pgdata')

type Sql = ReturnType<typeof postgres>

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(MIGRATIONS_DIR, name), 'utf8')
      return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') }
    })
}

async function ensureLedger(sql: Sql) {
  await sql.unsafe(`
    create schema if not exists zenith;
    create table if not exists zenith.schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    );
    alter table zenith.schema_migrations enable row level security;
  `)
}

export async function migrate(sql: Sql, log = console.log) {
  await ensureLedger(sql)
  const applied = new Map(
    (await sql<{ name: string; checksum: string }[]>`select name, checksum from zenith.schema_migrations`).map((r) => [
      r.name,
      r.checksum,
    ]),
  )
  let count = 0
  for (const m of listMigrations()) {
    const prior = applied.get(m.name)
    if (prior) {
      if (prior !== m.checksum) {
        throw new Error(`Migration ${m.name} was edited after it was applied. Add a new migration instead.`)
      }
      continue
    }
    await sql.begin(async (tx) => {
      await tx.unsafe(m.sql)
      await tx`insert into zenith.schema_migrations (name, checksum) values (${m.name}, ${m.checksum})`
    })
    log(`applied ${m.name}`)
    count++
  }
  log(count ? `${count} migration(s) applied` : 'database is up to date')
}

async function status(sql: Sql) {
  await ensureLedger(sql)
  const applied = new Set((await sql<{ name: string }[]>`select name from zenith.schema_migrations`).map((r) => r.name))
  for (const m of listMigrations()) console.log(`${applied.has(m.name) ? 'applied ' : 'PENDING '} ${m.name}`)
}

async function startLocal() {
  const { PGlite } = await import('@electric-sql/pglite')
  const { PGLiteSocketServer } = await import('@electric-sql/pglite-socket')
  mkdirSync(LOCAL_DATA_DIR, { recursive: true })
  const db = await PGlite.create({ dataDir: LOCAL_DATA_DIR })
  // Mirror Supabase's API roles so the revoke/RLS statements behave as in production.
  await db.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    end $$;
  `)
  const server = new PGLiteSocketServer({ db, port: LOCAL_PORT, host: '127.0.0.1', maxConnections: 16 } as never)
  await server.start()
  const url = `postgres://postgres:postgres@127.0.0.1:${LOCAL_PORT}/postgres`
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
  await migrate(sql)
  await sql.end()
  console.log(`\nlocal database ready\n  DATABASE_URL=${url}\n  data: ${LOCAL_DATA_DIR}\n(ctrl+c to stop)`)
  const stop = async () => {
    await server.stop()
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

async function main() {
  const cmd = process.argv[2]
  if (cmd === 'local') return startLocal()
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
  try {
    if (cmd === 'migrate') await migrate(sql)
    else if (cmd === 'status') await status(sql)
    else throw new Error(`unknown command ${cmd}`)
  } finally {
    await sql.end()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? '')) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
}
