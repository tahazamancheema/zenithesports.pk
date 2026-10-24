import Image from 'next/image'
import type { ReactNode } from 'react'

/** The admin panel's sign-in and password screens. */
export function AuthPage({ title, children, note }: { surface?: string; title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center px-4 py-16">
      <div aria-hidden className="grid-field absolute inset-0 opacity-50" />
      <div className="panel-raised relative w-full max-w-sm p-8">
        <div className="flex items-center gap-3">
          <Image src="/brand/zenith-mark-160.webp" alt="" width={30} height={30} unoptimized />
          <div>
            <p className="font-display text-[12px] tracking-[0.28em]">ZENITH</p>
            <p className="t-label !text-[var(--color-gold)]">Admin</p>
          </div>
        </div>
        <h1 className="t-title mt-8 text-lg">{title}</h1>
        {note && <div className="mt-3 text-sm text-fg-2">{note}</div>}
        <div className="mt-7">{children}</div>
      </div>
      <p className="t-label relative mt-6 text-center">Authorised staff only · access is logged</p>
    </main>
  )
}
