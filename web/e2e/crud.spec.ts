import { test, expect, Page } from '@playwright/test';

const EMAIL = `crud_${Date.now()}@example.com`;
const PASSWORD = 'TestPass1!';
const NAME = 'Crud Tester';

async function signUp(page: Page) {
  await page.goto('/auth/signup');
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.fill('#confirmPassword', PASSWORD);
  await page.fill('#name', NAME);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 15000 });
}

async function signIn(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 15000 });
}

// Each section on the dashboard begins with an <h2> heading.
// "New Product" → DataForm trigger button (opens create modal)
// "Products"    → list of product cards
// Use these headings to scope actions to the right section.

async function openCreateModal(page: Page, sectionHeading: string) {
  // Use the heading's immediate parent — the section wrapper that holds just
  // this heading + its DataForm Create button.
  const section = page.locator(`h2:text-is("${sectionHeading}")`).locator('..');
  await section.getByRole('button', { name: 'Create' }).click();
  // Modal opens with title "New <table>"
  await expect(page.locator('h2', { hasText: /^New /i }).last()).toBeVisible();
}

async function submitCreateModal(page: Page) {
  // The modal renders its own "Create" submit button at the bottom.
  // After the modal opens, there are multiple Create buttons; the modal's is the last in DOM.
  await page.getByRole('button', { name: 'Create' }).last().click();
}

test.describe('CRUD — Products', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await signUp(page);
    } catch (err) {
      console.log('Signup may have failed (user might already exist):', err);
    }
    await page.close();
  });

  test('dashboard loads with Products section', async ({ page }) => {
    await signIn(page);
    await expect(page.locator('h2:text-is("Products")')).toBeVisible();
    await expect(page.locator('h2:text-is("New Product")')).toBeVisible();
  });

  test('create a product appears in the list', async ({ page }) => {
    await signIn(page);

    const productName = `Test Product ${Date.now()}`;

    await openCreateModal(page, 'New Product');

    // Inside the modal: first text input is "name", first number input is "price".
    const modal = page.locator('div.fixed.z-50').last();
    await modal.locator('input[type="text"]').first().fill(productName);
    await modal.locator('input[type="number"]').first().fill('19.99');

    await submitCreateModal(page);

    await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 10000 });
  });

  test('edit a product name inline', async ({ page }) => {
    await signIn(page);

    const original = `Edit Me ${Date.now()}`;
    const renamed = `Renamed ${Date.now()}`;

    // Create one first
    await openCreateModal(page, 'New Product');
    const modal = page.locator('div.fixed.z-50').last();
    await modal.locator('input[type="text"]').first().fill(original);
    await modal.locator('input[type="number"]').first().fill('1.00');
    await submitCreateModal(page);
    await expect(page.locator(`text=${original}`)).toBeVisible();

    // Find the product row containing that text and click its Edit
    const row = page.locator('div.bg-white', { hasText: original }).first();
    await row.getByRole('button', { name: 'Edit' }).first().click();

    // Replace the value in the now-visible input
    const input = row.locator('input[type="text"]').first();
    await input.fill(renamed);
    await row.getByRole('button', { name: 'Save' }).click();

    await expect(page.locator(`text=${renamed}`)).toBeVisible({ timeout: 10000 });
  });

  test('delete a product removes it from the list', async ({ page }) => {
    await signIn(page);

    const name = `Delete Me ${Date.now()}`;

    await openCreateModal(page, 'New Product');
    const modal = page.locator('div.fixed.z-50').last();
    await modal.locator('input[type="text"]').first().fill(name);
    await modal.locator('input[type="number"]').first().fill('1.00');
    await submitCreateModal(page);
    await expect(page.locator(`text=${name}`)).toBeVisible();

    const row = page.locator('div.bg-white', { hasText: name }).first();
    await row.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator(`text=${name}`)).not.toBeVisible({ timeout: 10000 });
  });

});
