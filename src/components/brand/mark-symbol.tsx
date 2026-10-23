import { MARK_PATH, MARK_VIEWBOX } from './mark-path'

/**
 * The Zenith mark, defined once per page. Icons draw it with
 * `<use href="#zx-mark" fill="…" />` instead of repeating the 8 KB path,
 * which appears dozens of times across the header, menus, footer and cards.
 */
export function MarkSymbol() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <symbol id="zx-mark" viewBox={MARK_VIEWBOX}>
        <path d={MARK_PATH} fillRule="evenodd" />
      </symbol>
    </svg>
  )
}
