'use client'

import Link from 'next/link'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { hrefFor, isExternalHref, type LinkMode, type Surface } from '@/lib/surfaces'

const LinkModeContext = createContext<LinkMode>({ mode: 'path', current: 'hq' })

export function LinkModeProvider({ value, children }: { value: LinkMode; children: ReactNode }) {
  return <LinkModeContext.Provider value={value}>{children}</LinkModeContext.Provider>
}

export const useLinkMode = () => useContext(LinkModeContext)

export function useHref(surface: Surface, path = '/') {
  return hrefFor(useLinkMode(), surface, path)
}

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { surface?: Surface; to: string }

/**
 * Surface-aware link. Same surface → client navigation; another product →
 * its subdomain in production (a normal page load into that experience).
 */
export function ZLink({ surface, to, children, ...rest }: Props) {
  const mode = useLinkMode()
  const href = hrefFor(mode, surface ?? mode.current, to)
  if (isExternalHref(href)) {
    // Next-only props have no meaning on a plain anchor.
    const { transitionTypes: _t, prefetch: _p, scroll: _s, replace: _r, ...anchor } = rest as typeof rest & { transitionTypes?: unknown }
    void [_t, _p, _s, _r]
    return (
      <a href={href} {...(anchor as ComponentProps<'a'>)}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}
