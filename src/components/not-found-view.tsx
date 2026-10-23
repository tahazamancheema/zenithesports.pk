import { ZLink } from './link'

/** 404. */
export function NotFoundView() {
  return (
    <section className="relative overflow-hidden">
      <div className="shell grid min-h-[70svh] items-center py-20">
        <div>
          <p className="t-label">Error 404 · Signal lost</p>
          <h1 className="t-display mt-6 text-[clamp(1.8rem,4vw,3rem)]">
            Page not
            <br />
            found
          </h1>
          <p className="t-lede mt-6 max-w-md">This page doesn’t exist, or it has moved. Head back to the ecosystem or find a tournament.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ZLink surface="hq" to="/" className="btn btn-primary">
              Back to Zenith
            </ZLink>
            <ZLink surface="registrations" to="/" className="btn btn-ghost">
              Tournaments
            </ZLink>
          </div>
        </div>
      </div>
    </section>
  )
}
