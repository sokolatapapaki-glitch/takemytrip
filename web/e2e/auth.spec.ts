import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass1!';
const TEST_NAME = 'Test User';

async function fillSignupForm(page: any, email: string, password: string, confirm: string, name: string) {
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', confirm);
  await page.fill('#name', name);
}

test.describe('Authentication', () => {

  test('signup with valid credentials redirects away from signup', async ({ page }) => {
    await page.goto('/auth/signup');
    await fillSignupForm(page, TEST_EMAIL, TEST_PASSWORD, TEST_PASSWORD, TEST_NAME);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL('/auth/signup', { timeout: 10000 });
  });

  test('signup rejects mismatched passwords', async ({ page }) => {
    await page.goto('/auth/signup');
    await fillSignupForm(page, `mismatch_${Date.now()}@example.com`, TEST_PASSWORD, 'DifferentPass1!', TEST_NAME);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('signup rejects weak password', async ({ page }) => {
    await page.goto('/auth/signup');
    await fillSignupForm(page, `weak_${Date.now()}@example.com`, 'weak', 'weak', TEST_NAME);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/must be at least|special character/i')).toBeVisible();
  });

  test('signin with valid credentials redirects to home', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('signin rejects wrong password and stays on signin', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', 'WrongPass1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/signin/);
  });

  test('signout flow returns to home', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Then sign out
    await page.goto('/auth/signout');
    await page.click('button:has-text("Ναι")');
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('password reset page loads with email field', async ({ page }) => {
    await page.goto('/auth/email-reset-input');
    await expect(page.locator('#email')).toBeVisible();
  });

  test('password reset shows message for unknown email', async ({ page }) => {
    await page.goto('/auth/email-reset-input');
    await page.fill('#email', 'nobody@nowhere.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/Σφάλμα|error|failed/i')).toBeVisible({ timeout: 10000 });
  });

});
