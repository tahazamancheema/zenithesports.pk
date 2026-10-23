import { expect, test } from '@playwright/test'

const PAGES = ['/', '/registrations', '/production', '/anticheat', '/anticheat/report', '/points', '/about', '/contact']

test('public pages fit a phone screen without sideways scrolling', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path)
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    expect(sw, `${path} overflows horizontally`).toBeLessThanOrEqual(cw)
  }
})

test('the mobile menu opens, lists every platform and closes on navigation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  const nav = page.locator('#mobile-nav')
  for (const name of ['ZenithRegistrations', 'ZenithAntiCheat', 'ZenithProduction', 'ZenithPoints']) {
    await expect(nav.getByText(name, { exact: true })).toBeVisible()
  }
  await nav.getByText('ZenithPoints', { exact: true }).click()
  await expect(page).toHaveURL(/\/points/)
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
})
