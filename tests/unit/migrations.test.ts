import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sql } from './support/fixtures'

const dir = join(process.cwd(), 'supabase/migrations')
const files = readdirSync(dir).filter((f) => f.endsWith('.sql'))
const stripComments = (s: string) => s.replace(/--.*$/gm, '')

// The database is shared with ZenithHisaab and the legacy site. These guards
// make it impossible to merge a migration that reaches outside `zenith`.
describe('migration safety', () => {
  it.each(files)('%s never references public.* or auth.* objects', (f) => {
    const body = stripComments(readFileSync(join(dir, f), 'utf8'))
    expect(body).not.toMatch(/\bpublic\s*\.\s*\w/i)
    expect(body).not.toMatch(/\bauth\s*\.\s*\w/i)
    expect(body).not.toMatch(/hisaab/i)
  })

  it.each(files)('%s never truncates and only drops zenith-scoped objects', (f) => {
    const body = stripComments(readFileSync(join(dir, f), 'utf8'))
    expect(body).not.toMatch(/\btruncate\b/i)
    for (const m of body.matchAll(/\bdrop\s+(table|schema|function|view|type|trigger|policy)\b[^;]*/gi)) {
      const stmt = m[0]
      // triggers/policies are dropped "on zenith.x"; everything else must name zenith.
      expect(stmt, stmt).toMatch(/zenith\.|zenith\s*\.|on zenith\.%I|on zenith\./i)
    }
  })

  it('zenith tables are invisible to the Supabase API roles', async () => {
    const s = sql()
    const rows = await s<{ tablename: string; rowsecurity: boolean }[]>`
      select tablename, rowsecurity from pg_tables where schemaname = 'zenith'
    `
    expect(rows.length).toBeGreaterThan(25)
    expect(rows.filter((r) => !r.rowsecurity).map((r) => r.tablename)).toEqual([])
    const [{ granted }] = await s<{ granted: number }[]>`
      select count(*)::int as granted from information_schema.role_table_grants
       where table_schema = 'zenith' and grantee in ('anon', 'authenticated', 'PUBLIC')
    `
    expect(granted).toBe(0)
    const [{ usage }] = await s<{ usage: boolean }[]>`select has_schema_privilege('anon', 'zenith', 'usage') as usage`
    expect(usage).toBe(false)
    await s.end()
  })

  it('seeds the six portfolio games and the required formats', async () => {
    const s = sql()
    const formats = await s<{ gameId: string; code: string }[]>`select game_id as "gameId", code from zenith.game_formats order by 1, 2`
    const by = (g: string) => formats.filter((f) => f.gameId === g).map((f) => f.code).sort()
    expect(by('pubg-mobile')).toEqual(['duo', 'solo', 'squad'])
    expect(by('free-fire')).toEqual(['duo', 'solo', 'squad'])
    expect(by('tekken-8')).toEqual(['solo'])
    expect(by('ea-fc-26')).toEqual(['duo', 'solo'])
    expect(by('valorant')).toEqual(['lft', 'team5'])
    expect(by('honor-of-kings')).toEqual(['lft', 'team5'])
    // Reference data only: no invented tournaments, players, teams or statistics.
    const seed = files.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n')
    expect(seed).not.toMatch(/insert\s+into\s+zenith\.(tournaments|players|teams|registrations|ac_\w+|org_members)/i)
    await s.end()
  })

  it('audit log is append-only', async () => {
    const s = sql()
    await s`insert into zenith.audit_events (actor_label, action) values ('t', 'test.append')`
    await expect(s`update zenith.audit_events set action = 'tampered' where action = 'test.append'`).rejects.toThrow(/append-only/)
    await expect(s`delete from zenith.audit_events where action = 'test.append'`).rejects.toThrow(/append-only/)
    await s.end()
  })
})
