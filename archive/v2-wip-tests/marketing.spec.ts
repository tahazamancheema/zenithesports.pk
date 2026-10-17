import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
  test('homepage has correct title and hero section', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Zenith Esports/);

    // Expect the hero heading to be visible
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('FORGED IN OBSIDIAN');
  });

  test('mark47 page loads properly', async ({ page }) => {
    await page.goto('http://localhost:3000/mark47');
    
    await expect(page).toHaveTitle(/Mark47 Production/);
    
    // Ensure the enquiry form is present
    const submitButton = page.locator('button', { hasText: 'Submit Enquiry' });
    await expect(submitButton).toBeVisible();
  });

  test('tournaments page loads and displays tournaments', async ({ page }) => {
    await page.goto('http://localhost:3000/tournaments');
    
    const heading = page.locator('h1', { hasText: 'TOURNAMENTS' });
    await expect(heading).toBeVisible();
    
    // Check if the mock tournament is visible
    await expect(page.locator('text=PUBG Mobile Pro League')).toBeVisible();
  });
});
