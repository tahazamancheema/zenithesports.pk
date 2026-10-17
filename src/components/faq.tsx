/** Native <details> accordion: accessible, works without JavaScript, animated with CSS. */
export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="border-t border-line">
      {items.map((it, i) => (
        <details key={it.q} className="group border-b border-line" data-reveal style={{ '--i': i } as React.CSSProperties}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-lg font-medium marker:hidden [&::-webkit-details-marker]:hidden">
            <span>{it.q}</span>
            <span aria-hidden className="mt-2 grid h-4 w-4 shrink-0 place-items-center">
              <span className="node transition-transform duration-500 group-open:rotate-[225deg] group-open:bg-[var(--accent)]" />
            </span>
          </summary>
          <div className="pb-7 pr-10 text-fg-2" style={{ animation: 'rise 500ms var(--ease-out-expo) both' }}>
            {it.a}
          </div>
        </details>
      ))}
    </div>
  )
}
