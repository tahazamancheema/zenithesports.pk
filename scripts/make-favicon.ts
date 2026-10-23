/**
 * Writes src/app/icon.svg from the Zenith mark: no background, white on dark
 * browser themes and black on light ones (prefers-color-scheme inside the SVG).
 * Run: npx tsx scripts/make-favicon.ts
 */
import { writeFileSync } from 'node:fs'
import { MARK_PATH, MARK_VIEWBOX } from '../src/components/brand/mark-path'

const [, , w, h] = MARK_VIEWBOX.split(' ').map(Number)
const side = Math.max(w, h) * 1.04
const box = [(w - side) / 2, (h - side) / 2, side, side].map((n) => Math.round(n)).join(' ')
// Integer coordinates are invisible at favicon sizes and halve the file.
const d = MARK_PATH.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n))))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><style>path{fill:#000}@media (prefers-color-scheme:dark){path{fill:#fff}}</style><path fill-rule="evenodd" d="${d}"/></svg>\n`
writeFileSync('src/app/icon.svg', svg)
console.log(`src/app/icon.svg ${svg.length} bytes`)
