import { test, expect } from '@playwright/test';

test.describe('Authentication and Protected Routes', () => {
  test('redirects to login when accessing protected dashboard route', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Since we are not authenticated, the middleware should redirect to /?login=true
    await expect(page).toHaveURL('http://localhost:3000/?login=true');
    
    // Ensure the Auth Modal is visible
    const authModal = page.locator('div[role="dialog"]');
    await expect(authModal).toBeVisible();
    await expect(authModal).toContainText('Access Portal');
  });

  test('redirects to login when accessing protected admin route', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    
    // Should redirect to /?login=true
    await expect(page).toHaveURL('http://localhost:3000/?login=true');
  });
});
