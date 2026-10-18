/**
 * Creates the first super administrator. There is deliberately no public
 * sign-up route; this command is the only way to create the first account.
 *
 *   DATABASE_URL=… npm run admin:bootstrap -- --email you@zenithesports.pk --name "Your Name"
 *
 * It refuses to run once a super administrator exists (further accounts are
 * created from the HQ console).
 *
 * With Supabase Auth configured (NEXT_PUBLIC_SUPABASE_URL set, or --sso), no
 * password is created: sign in at /admin/login with Google or email using the
 * same address and the account links itself. Otherwise (local development) a
 * one-time password is printed once and must be changed at first sign-in.
 */
import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import postgres from 'postgres'

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>

// Must match src/server/crypto.ts hashPassword.
async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scryptAsync(password.normalize('NFKC'), salt, 64, { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 })
  return `scrypt$${2 ** 15}$8$1$${salt.toString('base64')}$${key.toString('base64')}`
}

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  const url = process.env.DATABASE_URL
  const email = arg('email')?.trim().toLowerCase()
  const name = arg('name')?.trim()
  if (!url) throw new Error('DATABASE_URL is not set')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Pass --email you@example.com')
  if (!name) throw new Error('Pass --name "Display Name"')
  const sso = process.argv.includes('--sso') || Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
  try {
    const password = sso ? null : randomBytes(15).toString('base64url')
    await sql.begin(async (tx) => {
      await tx`lock table zenith.staff_roles in exclusive mode`
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from zenith.staff_roles where role = 'super_admin'`
      if (n > 0) throw new Error('A super administrator already exists. Create further accounts from the HQ console.')
      const [u] = await tx<{ id: string }[]>`
        insert into zenith.staff_users (email, display_name, password_hash, must_change_password)
        values (${email}, ${name}, ${password ? await hashPassword(password) : null}, ${Boolean(password)}) returning id
      `
      await tx`insert into zenith.staff_roles (user_id, role) values (${u.id}, 'super_admin')`
      await tx`
        insert into zenith.audit_events (actor_label, action, entity_type, entity_id, details)
        values ('bootstrap', 'staff.bootstrap', 'staff_user', ${u.id}, '{}'::jsonb)
      `
    })
    if (password) console.log(`\nSuper administrator created: ${email}\nOne-time password (shown once): ${password}\nSign in at /admin/login and change it immediately.\n`)
    else console.log(`\nSuper administrator created: ${email}\nSign in at /admin/login with Google (or email) using exactly this address.\n`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
