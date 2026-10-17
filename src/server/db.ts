import 'server-only'
import postgres from 'postgres'
import { env } from './env'

export type Sql = postgres.Sql
export type Tx = postgres.TransactionSql
/** Anything that can run a tagged query: the pool or an open transaction. */
export type Db = Sql | Tx

declare global {
  var __zenithSql: Sql | undefined
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('The database is not configured (DATABASE_URL).')
  }
}

function create(): Sql {
  if (!env.DATABASE_URL) throw new DatabaseUnavailableError()
  return postgres(env.DATABASE_URL, {
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
    // Result rows come back camelCased; JSON column contents are left untouched.
    transform: { column: { from: postgres.toCamel }, undefined: null },
  })
}

/** Lazily created so pages can render a graceful "not configured" state. */
export function db(): Sql {
  globalThis.__zenithSql ??= create()
  return globalThis.__zenithSql
}

export function hasDatabase() {
  return Boolean(env.DATABASE_URL)
}

/** Postgres error helpers. */
export function pgError(e: unknown): { code?: string; constraint?: string; message: string } {
  const err = e as { code?: string; constraint_name?: string; message?: string }
  return { code: err?.code, constraint: err?.constraint_name, message: err?.message ?? String(e) }
}
export const isUniqueViolation = (e: unknown, constraint?: string) => {
  const p = pgError(e)
  return p.code === '23505' && (!constraint || p.constraint === constraint)
}
