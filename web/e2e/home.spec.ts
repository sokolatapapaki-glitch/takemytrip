import { test, expect } from '@playwright/test';

test('homepage loads with title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});

test('homepage has no broken images', async ({ page }) => {
  await page.goto('/');
  const images = page.locator('img');
  const count = await images.count();

  for (let i = 0; i < count; i++) {
    const naturalWidth = await images.nth(i).evaluate(
      (img: HTMLImageElement) => img.naturalWidth
    );
    expect(naturalWidth).toBeGreaterThan(0);
  }
});
