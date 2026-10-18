import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import sharp from 'sharp'

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@zenith.local'
const FIRST_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? ''
const NEW_PASSWORD = process.env.E2E_ADMIN_NEW_PASSWORD ?? 'correct horse battery staple 42'
const run = Date.now().toString(36)
const UID_BASE = 5_200_000_000 + (Date.now() % 1_000_000) * 10
const uid = (n: number) => String(UID_BASE + n) // stable across tests in one run

/** Signs in to one console, handling the first-login password change. */
async function signIn(page: Page, consolePath: string) {
  await page.goto(consolePath)
  if (!page.url().includes('/login')) return // already signed in to this console
  // The password may or may not have been changed by an earlier test; try the new one first.
  for (const pw of [NEW_PASSWORD, FIRST_PASSWORD].filter(Boolean)) {
    await page.goto(`${consolePath}/login`)
    await page.getByLabel('Email').fill(EMAIL)
    await page.getByLabel('Password', { exact: true }).fill(pw)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await Promise.race([
      page.waitForURL((u) => !u.pathname.endsWith('/login')),
      page.getByText('Email or password is incorrect').waitFor(),
    ])
    if (!page.url().endsWith('/login')) break
  }
  // Wait for the redirect chain to settle on either the console or the forced password change.
  const changeHeading = page.getByRole('heading', { name: /change your password/i })
  await Promise.race([changeHeading.waitFor(), page.getByRole('button', { name: 'Sign out' }).waitFor()])
  if (await changeHeading.isVisible()) {
    await page.getByLabel('Current password').fill(FIRST_PASSWORD)
    await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD)
    await page.getByLabel('Repeat new password').fill(NEW_PASSWORD)
    await page.getByRole('button', { name: 'Change password' }).click()
  }
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
}

async function png(seed: number) {
  return sharp({ create: { width: 320, height: 240, channels: 3, background: { r: seed * 40, g: 90, b: 160 - seed * 20 } } })
    .png()
    .toBuffer()
}

test.describe.serial('ecosystem flows', () => {
  let slug = ''
  let context: BrowserContext
  let page: Page
  // One browser session for the whole suite, like a real administrator (and the login rate limit).
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
  })
  test.afterAll(async () => context.close())

  test('consoles are separately authenticated', async () => {
    await page.goto('/registrations/admin')
    await expect(page).toHaveURL(/\/registrations\/admin\/login/)
    await signIn(page, '/registrations/admin')
    // A Registrations session grants nothing in the HQ or AntiCheat consoles.
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
    await page.goto('/anticheat/admin')
    await expect(page).toHaveURL(/\/anticheat\/admin\/login/)
  })

  test('an administrator creates and publishes a tournament', async () => {
    await signIn(page, '/registrations/admin')
    await page.goto('/registrations/admin/tournaments/new')
    await page.getByLabel('Name', { exact: true }).fill(`E2E Squad Cup ${run}`)
    await page.getByLabel('Game & format').selectOption({ label: 'PUBG Mobile · Squad' })
    const at = (days: number) => new Date(Date.now() + days * 86400_000 + 5 * 3600_000).toISOString().slice(0, 16)
    await page.getByLabel('Registration opens').fill(at(-1))
    await page.getByLabel('Registration closes').fill(at(5))
    await page.getByLabel('Starts').fill(at(7))
    await page.getByLabel('Capacity (entries)').fill('16')
    await page.getByLabel('Rules', { exact: true }).fill('Standard Zenith rules. No emulators.')
    await page.getByRole('button', { name: 'Create draft' }).click()
    await expect(page.getByText('Lifecycle')).toBeVisible()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible()
    await expect(page.getByText(/Registration open · /)).toBeVisible()
    slug = `e2e-squad-cup-${run}` // slugified from the name
  })

  test('a captain registers a squad through the public flow', async () => {
    await page.goto(`/registrations/t/${slug}`)
    await expect(page.getByRole('heading', { name: new RegExp(`E2E Squad Cup ${run}`, 'i') })).toBeVisible()
    await page.getByRole('link', { name: /Register your team/ }).click()

    // Step 1: requirements
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible() // must acknowledge rules first
    await page.getByText('I have read the rules').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    // Step 2: team & contact
    await page.getByLabel('Team name').fill(`Meridian ${run}`)
    await page.getByLabel('Captain’s WhatsApp number').fill('0300 7654321')
    await page.getByRole('button', { name: 'Continue' }).click()
    // Step 3: roster
    const igns = page.getByLabel('In-game name')
    const ids = page.getByLabel('Character ID')
    for (let i = 0; i < 4; i++) {
      await igns.nth(i).fill(`Player${i + 1}_${run}`)
      await ids.nth(i).fill(uid(i))
    }
    await page.getByRole('button', { name: 'Continue' }).click()
    // Step 5: confirm & submit (no extra questions on this tournament)
    await expect(page.getByText(`Meridian ${run}`)).toBeVisible()
    await page.waitForTimeout(2600) // a human-paced submission; the anti-spam token rejects faster ones
    await page.getByRole('button', { name: /Submit registration/ }).click()
    await expect(page.getByText('Registration received')).toBeVisible()
    await expect(page.getByText(/ZR-[A-Z0-9]{4}-[A-Z0-9]{4}/)).toBeVisible()

    // The private status link works.
    const manage = await page.locator('a[href*="/manage/"]').getAttribute('href')
    await page.goto(manage!)
    await expect(page.getByText('Pending review').first()).toBeVisible()
  })

  test('the same players cannot register twice', async () => {
    await page.goto(`/registrations/t/${slug}/register`)
    await page.getByText('I have read the rules').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Team name').fill(`Copycats ${run}`)
    await page.getByLabel('Captain’s WhatsApp number').fill('0300 1112299')
    await page.getByRole('button', { name: 'Continue' }).click()
    for (let i = 0; i < 4; i++) {
      await page.getByLabel('In-game name').nth(i).fill(`Dup${i}`)
      await page.getByLabel('Character ID').nth(i).fill(uid(i))
    }
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForTimeout(2600)
    await page.getByRole('button', { name: /Submit registration/ }).click()
    await expect(page.getByText(/already registered in this tournament/).first()).toBeVisible()
  })

  test('registrations appear in the console and can be approved', async () => {
    await signIn(page, '/registrations/admin')
    await page.goto('/registrations/admin/registrations?q=' + encodeURIComponent(`Meridian ${run}`))
    await page.getByRole('link', { name: `Meridian ${run}` }).click()
    await expect(page.getByText('Roster')).toBeVisible()
    await page.getByLabel('New status').selectOption('approved')
    await page.getByRole('button', { name: 'Update status' }).click()
    await expect(page.getByText('1 updated.')).toBeVisible()
  })

  test('a public report is reviewed into a verified flag that matches history', async () => {
    const reported = uid(2) // a player who already registered above
    await page.goto('/anticheat/report')
    await page.getByLabel('Player Character ID').fill(reported)
    await page.locator('input[name="reportScreenshot"]').setInputFiles({ name: 'report.png', mimeType: 'image/png', buffer: await png(1) })
    await page.locator('input[name="uidScreenshot"]').setInputFiles({ name: 'uid.png', mimeType: 'image/png', buffer: await png(2) })
    await page.waitForTimeout(2600) // the anti-spam timing token rejects instant submissions
    await page.getByRole('button', { name: /Submit report/ }).click()
    await expect(page.getByText('Report submitted for review')).toBeVisible()

    await signIn(page, '/anticheat/admin')
    await page.goto('/anticheat/admin/reports?status=pending')
    await page.getByRole('row', { name: new RegExp(reported) }).getByRole('link').click()
    await expect(page.getByRole('img', { name: 'UID evidence' })).toBeVisible()

    // Approval without confirming the UID match is refused.
    await page.getByText('Approve — create a verified flag').click()
    await page.getByLabel('Reason').fill('UID visible in profile screenshot')
    await page.getByRole('button', { name: 'Record decision' }).click()
    await expect(page.getByText(/only be approved after you confirm the UID/)).toBeVisible()

    await page.getByText(/I have confirmed that UID/).click()
    await page.getByRole('button', { name: 'Record decision' }).click()
    await expect(page.getByRole('link', { name: 'Open flag' })).toBeVisible() // decided; the flag exists

    // The historical scan matched the earlier registration.
    await page.goto('/anticheat/admin/alerts?status=open')
    await expect(page.getByText(`Meridian ${run}`).first()).toBeVisible()
  })
})
