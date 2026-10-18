'use client'

import Link from 'next/link'

/** Never shows internal error details; the digest lets staff find the server log entry. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="shell grid min-h-[70svh] place-content-center py-20 text-center">
      <p className="t-label">Something went wrong</p>
      <h1 className="t-display mt-6 text-[clamp(1.6rem,3.6vw,2.6rem)]">Signal interrupted</h1>
      <p className="mx-auto mt-5 max-w-md text-fg-2">We couldn’t load this page. Nothing you submitted was lost unless you saw a confirmation. Try again in a moment.</p>
      {error.digest && <p className="mt-4 font-mono text-xs text-fg-3">Reference {error.digest}</p>}
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </div>
    </main>
  )
}
