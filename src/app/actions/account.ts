'use server'

import { refresh } from 'next/cache'
import { failure, type ActionState } from '@/server/action-guard'
import { getAccount } from '@/server/auth/account'
import { consume } from '@/server/rate-limit'
import { assertSameOrigin, ipHash } from '@/server/request'
import { updateMyMember, withdrawMine } from '@/server/services/account'

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

async function me() {
  await assertSameOrigin()
  const a = await getAccount()
  if (!a) throw new Error('signed-out')
  const ip = await ipHash()
  await consume(`account:${a.id}`, 30, 15 * 60)
  return { a, ip }
}

const signedOut = (e: unknown) => e instanceof Error && e.message === 'signed-out'

export async function withdrawMineAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { a, ip } = await me()
    const r = await withdrawMine(a.id, s(fd, 'registrationId'), ip)
    if (!r.ok) return { status: 'error', message: r.error }
    refresh()
    return { status: 'success', message: 'Registration withdrawn.' }
  } catch (e) {
    if (signedOut(e)) return { status: 'error', message: 'Sign in again to continue.' }
    return failure(e)
  }
}

export async function updateMyMemberAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { a, ip } = await me()
    const r = await updateMyMember(a.id, s(fd, 'registrationId'), s(fd, 'memberId'), { ign: s(fd, 'ign'), uid: s(fd, 'uid') }, ip)
    if (!r.ok) return { status: 'error', message: r.error }
    refresh()
    return { status: 'success', message: 'Saved.' }
  } catch (e) {
    if (signedOut(e)) return { status: 'error', message: 'Sign in again to continue.' }
    return failure(e)
  }
}
