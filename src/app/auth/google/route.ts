import { NextResponse, type NextRequest } from 'next/server'
import { markActive, supabaseConfigured, supabaseServer } from '@/server/auth/account'
import { exchangeCode, finalUrl, googleDirect, takePending } from '@/server/auth/google'

/**
 * Google returns here (our own domain) after the account chooser. The code is
 * exchanged for an ID token, which Supabase verifies before opening the session.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const pending = await takePending(url.searchParams.get('state'))
  const fail = (reason: string) => {
    const next = pending?.next ?? '/account'
    return NextResponse.redirect(new URL(`/login?error=${reason}&next=${encodeURIComponent(next)}`, pending?.origin ?? url))
  }
  if (!googleDirect() || !supabaseConfigured()) return fail('unavailable')
  if (!pending) return fail('expired')
  if (url.searchParams.get('error')) return fail('denied')
  const code = url.searchParams.get('code')
  if (!code) return fail('missing')

  const idToken = await exchangeCode(code, pending)
  if (!idToken) return fail('expired')
  const { error } = await (await supabaseServer()).auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: pending.nonce })
  if (error) return fail('oauth')
  await markActive()
  return NextResponse.redirect(finalUrl(pending))
}
