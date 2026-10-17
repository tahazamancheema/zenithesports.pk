import { ViewTransition } from 'react'

/** Page transition: the outgoing page lifts away, the new one rises in (disabled for reduced motion in CSS). */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="zx-page" exit="zx-page" default="none">
      {children}
    </ViewTransition>
  )
}
