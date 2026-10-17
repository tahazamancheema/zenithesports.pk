import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import postgres from 'postgres'
import { migrate } from '../../../scripts/db'

/**
 * Boots a throwaway PostgreSQL (PGlite, in memory) and applies the real
 * migrations. Workers inherit DATABASE_URL.
 */
export default async function setup() {
  const db = await PGlite.create()
  await db.exec(`create role anon nologin; create role authenticated nologin;`)
  const port = 20000 + Math.floor(Math.random() * 20000)
  const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 16 } as never)
  await server.start()
  const url = `postgres://postgres:postgres@127.0.0.1:${port}/postgres`
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
  await migrate(sql, () => {})
  await sql.end()
  process.env.DATABASE_URL = url
  process.env.APP_SECRET = 'test-secret-test-secret-test-secret-0000'
  return async () => {
    await server.stop()
  }
}
