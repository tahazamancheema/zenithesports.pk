import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { markActive, safeNext, supabaseConfigured, supabaseServer } from '@/server/auth/account'

/**
 * Where Supabase sends people back: after Google sign-in (`code`), after
 * confirming an email or opening a reset link (`code` or `token_hash`).
 * The session cookies are written here, then we continue to `next`.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const next = safeNext(url.searchParams.get('next'))
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}&next=${encodeURIComponent(next)}`, url))
  if (!supabaseConfigured()) return fail('unavailable')
  if (url.searchParams.get('error')) return fail('denied')

  const sb = await supabaseServer()
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (error) return fail('expired')
  } else if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) return fail('expired')
  } else {
    return fail('missing')
  }
  await markActive()
  return NextResponse.redirect(new URL(next, url))
}
