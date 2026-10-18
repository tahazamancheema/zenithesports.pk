import type { Metadata } from 'next'
import { NewPasswordForm } from '@/components/auth/sign-in'
import { requireAccount } from '@/server/auth/account'

export const metadata: Metadata = { title: 'Set a new password', robots: { index: false } }

export default async function NewPasswordPage() {
  const account = await requireAccount('/account/password')
  return (
    <section className="shell grid min-h-[calc(100svh-4rem)] place-items-center py-16">
      <div className="w-full max-w-[420px] rounded-2xl border border-line-2 bg-ink-1 p-8">
        <h1 className="t-title text-2xl">Set a new password</h1>
        <p className="mb-6 mt-2 text-fg-2">for {account.email}</p>
        <NewPasswordForm />
        <a href="/account" className="mt-6 block text-center text-[14px] text-fg-2 hover:text-fg">
          Back to my registrations
        </a>
      </div>
    </section>
  )
}
