import 'server-only'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DATABASE_LISTEN_URL: z.string().url().optional(),
  APP_SECRET: z.string().min(32).optional(),
  ROOT_DOMAIN: z.string().default('zenithesports.pk'),
  HISAAB_URL: z.string().url().default('https://www.zenithesports.pk/hisaab/admin'),
  RESEND_API_KEY: z.string().optional(),
  NOTIFY_FROM_EMAIL: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const parsed = schema.safeParse({
  ...process.env,
  // Treat empty strings as unset so optional integrations stay off.
  ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v === '').map(([k]) => [k, undefined])),
})
if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'

/** HMAC/signing secret. Required in production; a fixed dev value keeps local runs reproducible. */
export function appSecret(): string {
  if (env.APP_SECRET) return env.APP_SECRET
  if (isProd) throw new Error('APP_SECRET must be set in production')
  return 'local-development-secret-not-for-production-use'
}

export const integrations = {
  email: Boolean(env.RESEND_API_KEY && env.NOTIFY_FROM_EMAIL),
  discord: Boolean(env.DISCORD_WEBHOOK_URL),
  database: Boolean(env.DATABASE_URL),
}
