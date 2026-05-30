import { test, expect } from '@playwright/test';

test.describe('Navigation & UI', () => {

  test('homepage loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page).toHaveURL('/');
    expect(errors).toHaveLength(0);
  });

  test('navbar is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('theme switcher changes theme', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const before = await html.getAttribute('class');

    await page.click('[aria-label*="theme"], button:has-text("theme"), button:has-text("Theme")');
    await page.waitForTimeout(300);

    const after = await html.getAttribute('class');
    expect(before).not.toEqual(after);
  });

  test('signin page is accessible from navbar', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href*="signin"], a:has-text("Sign in"), a:has-text("Login")');
    await expect(page).toHaveURL(/signin|login/);
  });

  test('login-options page loads', async ({ page }) => {
    await page.goto('/auth/login-options');
    await expect(page.locator('text=/sign up|sign in|get started/i')).toBeVisible();
  });

  test('auth error page handles unknown error gracefully', async ({ page }) => {
    await page.goto('/auth/error/AccessDenied');
    await expect(page).not.toHaveURL(/500|404/);
  });

  test('404 page for unknown route', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
  });

});
