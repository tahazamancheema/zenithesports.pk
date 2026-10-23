/**
 * Loading boundaries. Every page renders on request, so without these a click
 * waits for the server with no feedback and links cannot be prefetched; with
 * them the layout stays put and the next page appears in place when ready.
 */

/** Public pages: a thin progress line under the header, holding the page height. */
export function PageLoading() {
  return (
    <div className="min-h-[70vh]" role="status" aria-label="Loading">
      <div className="route-bar" />
    </div>
  )
}

/** Consoles: the sidebar stays; the content area shows the shape of a queue. */
export function ConsoleLoading() {
  return (
    <div role="status" aria-label="Loading">
      <div className="route-bar" />
      <div className="skel h-7 w-56" />
      <div className="skel mt-3 h-4 w-80 max-w-full" />
      <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 bg-ink-1 p-5">
            <div className="skel h-4 w-40" />
            <div className="skel h-4 flex-1" />
            <div className="skel h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
