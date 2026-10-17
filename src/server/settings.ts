import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { safeUrl } from '@/lib/normalize'
import { audit, type Actor } from './audit'
import { db, hasDatabase } from './db'

const url = z
  .string()
  .max(500)
  .transform((v) => (v.trim() ? (safeUrl(v) ?? '') : ''))
  .default('')
const text = (max: number) => z.string().max(max).transform((v) => v.trim()).default('')

export const SETTINGS_SCHEMA = {
  contact: z.object({
    email: text(254),
    phone: text(40),
    whatsapp: text(40),
    city: text(80),
    responseNote: text(200),
  }),
  social: z.object({
    youtube: url,
    instagram: url,
    facebook: url,
    tiktok: url,
    discord: url,
    x: url,
    whatsappChannel: url,
  }),
  'product.production': z.object({
    status: z.enum(['available', 'limited', 'paused']).default('available'),
    headline: text(160),
    primaryCta: z.enum(['inquire', 'book']).default('inquire'),
  }),
  'product.points': z.object({
    status: z.enum(['coming_soon', 'beta', 'available']).default('coming_soon'),
    playStoreUrl: url,
    appStoreUrl: url,
    launchNote: text(240),
  }),
  'product.anticheat': z.object({
    status: z.enum(['pilot', 'active']).default('pilot'),
    games: z.array(z.string()).default(['pubg-mobile']),
  }),
  seo: z.object({ titleSuffix: text(60), description: text(300) }),
  notify: z.object({ staffEmail: text(254), inquiryEmail: text(254) }),
  about: z.object({ founded: text(40), mission: text(600), vision: text(600) }),
  announcement: z.object({ enabled: z.boolean().default(false), text: text(160), href: url }),
} as const

export type SettingsKey = keyof typeof SETTINGS_SCHEMA
export type Settings = { [K in SettingsKey]: z.infer<(typeof SETTINGS_SCHEMA)[K]> }

function defaults(): Settings {
  return Object.fromEntries(
    Object.entries(SETTINGS_SCHEMA).map(([k, s]) => [k, (s as z.ZodTypeAny).parse({})]),
  ) as Settings
}

/** Settings with safe defaults. Works (with defaults) even before the DB is configured. */
export const getSettings = cache(async (): Promise<Settings> => {
  const out = defaults()
  if (!hasDatabase()) return out
  try {
    const rows = await db()<{ key: string; value: unknown }[]>`select key, value from zenith.settings`
    for (const r of rows) {
      const schema = SETTINGS_SCHEMA[r.key as SettingsKey]
      if (!schema) continue
      const parsed = (schema as z.ZodTypeAny).safeParse(r.value)
      if (parsed.success) (out as Record<string, unknown>)[r.key] = parsed.data
    }
  } catch {
    // Render with defaults if the database is unreachable.
  }
  return out
})

export async function saveSetting<K extends SettingsKey>(key: K, value: unknown, actor: Actor) {
  const parsed = (SETTINGS_SCHEMA[key] as z.ZodTypeAny).parse(value)
  await db().begin(async (tx) => {
    await tx`
      insert into zenith.settings (key, value, updated_by) values (${key}, ${tx.json(parsed)}, ${actor.id})
      on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
    `
    await audit(tx, actor, 'settings.update', { type: 'setting', id: key })
  })
  return parsed as Settings[K]
}
