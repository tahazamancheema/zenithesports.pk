import 'server-only'
import { cache } from 'react'
import { getAccount } from './auth/account'
import { staffProfileFor } from './services/account'

export type Viewer = { name: string; avatarUrl: string | null; staff: boolean }

/** Who is looking at the page, for the header. Never fails the page: on any error it shows signed-out. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  try {
    const a = await getAccount()
    if (!a) return null
    const staff = await staffProfileFor(a)
    return { name: a.displayName ?? a.email.split('@')[0], avatarUrl: a.avatarUrl, staff: Boolean(staff?.consoles.length) }
  } catch {
    return null
  }
})
