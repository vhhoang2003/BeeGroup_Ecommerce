import { test, expect } from '@playwright/test';

test.describe('MegaMart E2E Flow', () => {
  test('homepage loads reference sections properly', async ({ page }) => {
    await page.goto('/');

    // Check MegaMart branding and top utility
    await expect(page.locator('text=Welcome to worldwide Megamart!')).toBeVisible();

    // Check Hero Banner
    await expect(page.locator('text=SMART WEARABLE.')).toBeVisible();
    await expect(page.locator('text=UP to 80% OFF').first()).toBeVisible();

    // Check Section Titles
    await expect(page.locator('text=Grab the best deal on')).toBeVisible();
    await expect(page.locator('text=Smartphones').first()).toBeVisible();

    await expect(page.locator('text=Shop From')).toBeVisible();
    await expect(page.locator('text=Top Categories').first()).toBeVisible();

    await expect(page.locator('text=Top Electronics Brands')).toBeVisible();
    await expect(page.locator('text=Daily Essentials').first()).toBeVisible();
  });

  test('search input triggers auto suggestions', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[placeholder*="Search essentials"]');
    await searchInput.fill('Galaxy');

    // Suggestions dropdown should appear
    await expect(page.locator('text=Matching results')).toBeVisible();
    await expect(page.locator('text=Galaxy S22 Ultra').first()).toBeVisible();
  });

  test('cart drawer opens and shows items', async ({ page }) => {
    await page.goto('/');

    // Click cart button
    await page.click('button:has-text("Cart")');
    await expect(page.locator('text=Your Cart')).toBeVisible();
  });

  test('navigates to product detail and checkout', async ({ page }) => {
    await page.goto('/products/galaxy-s22-ultra-blue');

    await expect(page.locator('h1')).toContainText('Galaxy S22 Ultra');
    await expect(page.locator('text=Specifications')).toBeVisible();

    // Click Buy Now
    await page.click('button:has-text("Buy Now")');
    await expect(page).toHaveURL(/.*checkout/);
    await expect(page.locator('text=Shipping Address')).toBeVisible();
  });
});
