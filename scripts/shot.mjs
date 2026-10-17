// Dev helper: node scripts/shot.mjs <url> <out.png> [width] [fullPage=1] [reducedMotion=0]
import { chromium } from '@playwright/test'
const [url, out, width = '1440', full = '1', reduce = '0'] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(width) < 600 ? 860 : 900 }, reducedMotion: reduce === '1' ? 'reduce' : 'no-preference' })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500) // hydration in dev
// reveal everything (scroll-triggered) before a full-page capture
if (full === '1') {
  const h = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < h; y += 300) { await page.mouse.wheel(0, 300); await page.waitForTimeout(90) }
  await page.evaluate(() => window.scrollTo(0, 0))
}
await page.waitForTimeout(2600)
await page.screenshot({ path: out, fullPage: full === '1' })
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors')
await browser.close()
