import { expect, test, type BrowserContext, type Page } from '@playwright/test'

/*
 * Every remaining user journey, end to end through the real UI:
 * the public forms, Looking for Team, the HQ console's queues and settings,
 * the Registrations console's tournament tooling and the AntiCheat console.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@zenith.local'
const FIRST_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? ''
const NEW_PASSWORD = process.env.E2E_ADMIN_NEW_PASSWORD ?? 'correct horse battery staple 42'
const run = `j${Date.now().toString(36)}`
const HUMAN = 2600 // the anti-spam timing token rejects instant submissions
const UID_BASE = 5_300_000_000 + (Date.now() % 1_000_000) * 10
const uid = (n: number) => String(UID_BASE + n)

async function signIn(page: Page, consolePath: string) {
  await page.goto(consolePath)
  if (!page.url().includes('/login')) return
  for (const pw of [NEW_PASSWORD, FIRST_PASSWORD].filter(Boolean)) {
    await page.goto(`${consolePath}/login`)
    await page.getByLabel('Email').fill(EMAIL)
    await page.getByLabel('Password', { exact: true }).fill(pw)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await Promise.race([page.waitForURL((u) => !u.pathname.endsWith('/login')), page.getByText('Email or password is incorrect').waitFor()])
    if (!page.url().endsWith('/login')) break
  }
  // A fresh database forces the first-login password change.
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

/** The action form that contains a given piece of text (console rows are self-contained forms). */
const rowWith = (page: Page, text: string) => page.locator('li, tr, section, article').filter({ hasText: text }).last()

test.describe.serial('user journeys', () => {
  let context: BrowserContext
  let page: Page
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
  })
  test.afterAll(async () => context.close())

  test('a contact message reaches the HQ console and is handled', async () => {
    await page.goto('/contact')
    await page.getByLabel('Name').fill(`Journey Visitor ${run}`)
    await page.getByLabel('Email').fill(`visitor-${run}@test.local`)
    await page.getByLabel('Topic').selectOption('partnership')
    await page.getByLabel('Message').fill('We would like to sponsor your next PUBG Mobile event.')
    await page.waitForTimeout(HUMAN)
    await page.getByRole('button', { name: /Send message/ }).click()
    await expect(page.getByText('Message received')).toBeVisible()

    await signIn(page, '/admin')
    await page.goto('/admin/messages')
    const row = rowWith(page, `Journey Visitor ${run}`)
    await expect(row).toBeVisible()
    await row.getByLabel('Status').selectOption({ index: 1 })
    await row.getByRole('button', { name: 'Set' }).click()
    await expect(row.getByText(/Saved|updated/i).first()).toBeVisible()
  })

  test('the ZenithPoints launch list: join, see it in HQ, delete', async () => {
    await page.goto('/points#launch')
    const launch = page.locator('#launch')
    await launch.locator('input[name="email"]').fill(`launch-${run}@test.local`)
    await launch.getByLabel('Platform').selectOption('android')
    await launch.locator('input[name="consent"]').check()
    await page.waitForTimeout(HUMAN)
    await launch.getByRole('button', { name: /Notify me at launch/ }).click()
    await expect(page.getByText('You’re on the launch list')).toBeVisible()

    await page.goto('/admin/waitlist')
    const row = rowWith(page, `launch-${run}@test.local`)
    await expect(row).toBeVisible()
    page.once('dialog', (d) => d.accept())
    await row.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(`launch-${run}@test.local`)).toHaveCount(0)
  })

  test('Looking for Team: a player lists, a captain requests, the player shares contact', async () => {
    await page.goto('/registrations/lft/new?game=valorant')
    await page.locator('input[name="ign"]').fill(`Ace${run}`)
    await page.locator('input[name="uid"]').fill(`Ace${run.slice(-6)}#PK1`)
    await page.locator('input[name="roles"]').first().check()
    await page.locator('input[name="discord"]').fill(`ace_${run}`)
    await page.locator('input[name="consent"]').check()
    await page.waitForTimeout(HUMAN)
    await page.getByRole('button', { name: /Create my listing/ }).click()
    await expect(page.getByText('You’re listed')).toBeVisible()
    const manage = (await page.locator('a[href*="/lft/manage/"]').getAttribute('href'))!

    await page.goto('/registrations/lft?game=valorant')
    const card = page.locator('li, article').filter({ hasText: `Ace${run}` }).last()
    await card.getByRole('button', { name: 'Request contact' }).click()
    await card.getByLabel('Your name').fill('Captain Journey')
    await card.getByLabel('Your contact').fill('captain@test.local')
    await page.waitForTimeout(HUMAN)
    await card.getByRole('button', { name: 'Send request' }).click()
    await expect(card.getByText(/Request sent/)).toBeVisible()

    await page.goto(manage)
    await page.getByRole('button', { name: 'Share my contact' }).click()
    // The page updates in place: the request now shows its decision instead of the buttons.
    await expect(page.getByRole('button', { name: 'Share my contact' })).toHaveCount(0)
    await expect(page.locator('li').filter({ hasText: 'Captain Journey' }).locator('.chip')).toBeVisible()

    // Staff see the listing in the Registrations console.
    await signIn(page, '/registrations/admin')
    await page.goto('/registrations/admin/lft')
    await expect(page.getByText(`Ace${run}`).first()).toBeVisible()
  })

  test('a player edits their roster, staff waitlist the entry, the player withdraws, the CSV export lists it', async () => {
    const name = `Journey Cup ${run}`
    const team = `Waypoint ${run}`
    await signIn(page, '/registrations/admin')
    await page.goto('/registrations/admin/tournaments/new')
    await page.getByLabel('Name', { exact: true }).fill(name)
    await page.getByLabel('Game & format').selectOption({ label: 'PUBG Mobile · Squad' })
    const at = (days: number) => new Date(Date.now() + days * 86400_000 + 5 * 3600_000).toISOString().slice(0, 16)
    await page.getByLabel('Registration opens').fill(at(-1))
    await page.getByLabel('Registration closes').fill(at(5))
    await page.getByLabel('Starts').fill(at(7))
    await page.getByLabel('Capacity (entries)').fill('16')
    await page.getByLabel('Rules', { exact: true }).fill('Standard Zenith rules.')
    await page.getByRole('button', { name: 'Create draft' }).click()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible()
    const slug = `journey-cup-${run}`

    // A signed-in captain registers.
    await page.goto(`/login?next=${encodeURIComponent(`/registrations/t/${slug}/register`)}`)
    await page.getByLabel('Email').fill(`captain-${run}@test.local`)
    await page.getByLabel('Name').fill('Journey Captain')
    await page.getByRole('button', { name: /Sign in \(local test\)/ }).click()
    await expect(page).toHaveURL(new RegExp(`/t/${slug}/register`))
    await page.getByText('I have read the rules').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Team name').fill(team)
    await page.getByLabel('Captain’s WhatsApp number').fill('0300 7654300')
    await page.getByRole('button', { name: 'Continue' }).click()
    for (let i = 0; i < 4; i++) {
      await page.getByLabel('In-game name').nth(i).fill(`Way${i + 1}_${run}`)
      await page.getByLabel('Character ID').nth(i).fill(uid(i))
    }
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForTimeout(HUMAN)
    await page.getByRole('button', { name: /Submit registration/ }).click()
    await expect(page.getByText('Registration received')).toBeVisible()

    // The captain fixes a typo in a player's name from their account.
    await page.goto('/account')
    const entry = page.locator('li.panel-raised').filter({ hasText: team })
    const second = entry.locator('form').filter({ has: page.locator(`input[value="Way2_${run}"]`) })
    await second.getByLabel('In-game name').fill(`Way2fixed_${run}`)
    await second.getByRole('button', { name: 'Save' }).click()
    await expect(entry.getByText('Saved.')).toBeVisible()

    // Staff see the corrected roster and waitlist the entry.
    await page.goto(`/registrations/admin/registrations?q=${encodeURIComponent(team)}`)
    await page.getByRole('link', { name: team }).click()
    await expect(page.getByText(`Way2fixed_${run}`).first()).toBeVisible()
    await page.getByLabel('New status').selectOption('waitlisted')
    await page.getByRole('button', { name: 'Update status' }).click()
    await expect(page.getByText('1 updated.')).toBeVisible()

    // A rejection needs a reason the team will see.
    await page.getByLabel('New status').selectOption('rejected')
    await page.getByRole('button', { name: 'Update status' }).click()
    await expect(page.getByText('Give a reason — the team will see it.')).toBeVisible()

    // The player sees the decision and withdraws.
    await page.goto('/account')
    await expect(entry.getByText('Waitlisted')).toBeVisible()
    page.once('dialog', (d) => d.accept())
    await entry.getByRole('button', { name: 'Withdraw entry' }).click()
    await expect(entry.getByText('Withdrawn')).toBeVisible()

    // The CSV export carries the entry.
    const csv = await page.request.get(`/registrations/admin/export?q=${encodeURIComponent(team)}`)
    expect(csv.status()).toBe(200)
    expect(csv.headers()['content-type']).toContain('text/csv')
    expect(await csv.text()).toContain(team)
  })

  test('AntiCheat: a recorded decision catches an offline entry, and the alert is resolved', async () => {
    const flagged = uid(9)
    const summary = `Journey ruling ${run}`
    await signIn(page, '/anticheat/admin')
    await page.goto('/anticheat/admin/flags/new')
    await page.locator('input[name="subjectUid"]').fill(flagged)
    await page.locator('input[name="subjectIgn"]').fill(`Flagged${run}`)
    await page.locator('input[name="summary"]').fill(summary)
    await page.getByRole('button', { name: 'Create flag & scan history' }).click()
    await expect(page).toHaveURL(/\/anticheat\/admin\/flags\/[0-9a-f-]{36}$/)
    await expect(page.getByText(summary).first()).toBeVisible()

    await page.goto('/anticheat/admin/entry')
    await page.locator('input[name="teamName"]').fill(`Offline ${run}`)
    await page.getByLabel('Player 1 in-game name').fill(`Offline1${run}`)
    await page.getByLabel('Player 1 UID').fill(flagged)
    await page.getByLabel('Player 2 in-game name').fill(`Offline2${run}`)
    await page.getByLabel('Player 2 UID').fill(uid(8))
    await page.getByRole('button', { name: 'Save & check against flags' }).click()
    await expect(page.getByText(/Saved\. 1 flag\(s\) matched; 1 new alert\(s\) raised\./)).toBeVisible()

    await page.goto('/anticheat/admin/alerts?status=open')
    const alert = page.locator('li.panel').filter({ hasText: summary })
    await expect(alert).toBeVisible()
    await alert.getByLabel('New status').selectOption('resolved')
    await alert.getByLabel('Note').fill('Team removed from the offline bracket.')
    await alert.getByRole('button', { name: 'Update' }).click()
    await expect(page.locator('li.panel').filter({ hasText: summary })).toHaveCount(0)
    await page.goto('/anticheat/admin/alerts?status=resolved')
    await expect(page.locator('li.panel').filter({ hasText: summary })).toBeVisible()

    await page.goto('/anticheat/admin/scans')
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Run full scan' }).click()
    await expect(page.getByText(/Scanned \d+ flag\(s\)/)).toBeVisible()
  })

  test('HQ: an announcement goes live and comes down, staff are added, and the audit log records it', async () => {
    const notice = `Journey notice ${run}`
    await signIn(page, '/admin')
    await page.goto('/admin/settings')
    const box = page.locator('section').filter({ hasText: 'Show the announcement bar' })
    await box.getByLabel('Show the announcement bar').check()
    await box.getByLabel('Text').fill(notice)
    await box.getByRole('button', { name: 'Save' }).click()
    await expect(box.getByText('Saved.')).toBeVisible()
    await page.goto('/')
    await expect(page.getByText(notice)).toBeVisible()

    await page.goto('/admin/settings')
    await box.getByLabel('Show the announcement bar').uncheck()
    await box.getByLabel('Text').fill('')
    await box.getByRole('button', { name: 'Save' }).click()
    await expect(box.getByText('Saved.')).toBeVisible()
    await page.goto('/')
    await expect(page.getByText(notice)).toHaveCount(0)

    await page.goto('/admin/staff')
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Create account' }) })
    await form.getByLabel('Display name').fill(`Journey Reviewer ${run}`)
    await form.getByLabel('Email').fill(`reviewer-${run}@test.local`)
    await form.locator('input[name="roles"]').first().check()
    await form.getByRole('button', { name: 'Create account' }).click()
    await expect(form.getByText(/Account created/)).toBeVisible()
    await expect(page.getByText(`reviewer-${run}@test.local`).first()).toBeVisible()

    await page.goto('/admin/audit?action=staff.')
    await expect(page.getByText(/staff\./).first()).toBeVisible()
    await page.goto('/admin/audit?action=settings.')
    await expect(page.getByText(/settings\./).first()).toBeVisible()
  })

  test('ready-made forms: a game template, quick-add questions, and a tournament that uses one', async () => {
    await signIn(page, '/registrations/admin')
    await page.goto('/registrations/admin/forms')
    await page.getByLabel('Name').fill(`Valorant extras ${run}`)
    await page.getByLabel('Start from').selectOption('preset:valorant')
    await page.getByRole('button', { name: 'Create & open builder' }).click()
    await expect(page).toHaveURL(/\/admin\/forms\/[0-9a-f-]{36}$/)
    await expect(page.getByText('Current rank').first()).toBeVisible()
    // Adding fields never breaks the builder, including the first one on an empty form.
    await page.getByRole('button', { name: '+ City' }).click()
    await page.getByRole('button', { name: '+ Add field' }).click()
    await expect(page.getByText(/Signal interrupted/i)).toHaveCount(0)
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Draft saved.')).toBeVisible()

    // A tournament picks the ready-made form directly; players then see its questions.
    await page.goto('/registrations/admin/tournaments/new')
    await page.getByLabel('Name', { exact: true }).fill(`Preset Cup ${run}`)
    await page.getByLabel('Game & format').selectOption({ label: 'PUBG Mobile · Squad' })
    const at = (days: number) => new Date(Date.now() + days * 86400_000 + 5 * 3600_000).toISOString().slice(0, 16)
    await page.getByLabel('Registration opens').fill(at(-1))
    await page.getByLabel('Registration closes').fill(at(5))
    await page.getByLabel('Starts').fill(at(7))
    await page.getByLabel('Capacity (entries)').fill('16')
    await page.getByLabel('Registration form').selectOption('preset')
    await page.getByRole('button', { name: 'Create draft' }).click()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible()

    await page.goto(`/login?next=${encodeURIComponent(`/registrations/t/preset-cup-${run}/register`)}`)
    if (await page.getByRole('button', { name: /Sign in \(local test\)/ }).isVisible()) {
      await page.getByLabel('Email').fill(`preset-${run}@test.local`)
      await page.getByLabel('Name').fill('Preset Captain')
      await page.getByRole('button', { name: /Sign in \(local test\)/ }).click()
    }
    await page.goto(`/registrations/t/preset-cup-${run}/register`)
    await page.getByText('I have read the rules').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Team name').fill(`Preset Squad ${run}`)
    await page.getByLabel('Captain’s WhatsApp number').fill('0300 7654311')
    await page.getByRole('button', { name: 'Continue' }).click()
    for (let i = 0; i < 4; i++) {
      await page.getByLabel('In-game name').nth(i).fill(`Pre${i}_${run}`)
      await page.getByLabel('Character ID').nth(i).fill(uid(20 + i))
      // The ready-made form's per-player question appears right in the roster.
      await page.getByLabel('Device').nth(i).selectOption('phone')
    }
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Team tag').first()).toBeVisible()
  })

  test('the header offers Login / Register, and staff get the admin account page', async ({ browser }) => {
    const visitor = await browser.newPage()
    await visitor.goto('/about')
    await expect(visitor.getByRole('link', { name: 'Login / Register' })).toBeVisible()
    await visitor.close()

    // The local test sign-in stands in for Google; the bootstrap admin is on the staff list.
    const admin = await browser.newPage()
    await admin.goto('/login?next=/account')
    await admin.getByLabel('Email').fill(EMAIL)
    await admin.getByLabel('Name').fill('Local Admin')
    await admin.getByRole('button', { name: /Sign in \(local test\)/ }).click()
    await expect(admin).toHaveURL(/\/account$/)
    await expect(admin.getByText('Admin', { exact: true }).first()).toBeVisible()
    await expect(admin.getByText('Registrations console').first()).toBeVisible()
    await expect(admin.getByRole('link', { name: 'Login / Register' })).toHaveCount(0)
    await admin.close()
  })
})
