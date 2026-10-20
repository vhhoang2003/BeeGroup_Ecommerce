import { test, expect } from '@playwright/test';

/** Public catalog pages; work against the in-app mock API or the real one. */
test.describe('Bee Store catalog', () => {
  test.use({ locale: 'vi-VN' });

  test('redirects to the default locale and shows the catalog', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/vi$/);

    await expect(page.getByText('Chào mừng đến Bee Store')).toBeVisible();
    await expect(page.getByText('CPU SERVER EPYC.')).toBeVisible();
    await expect(page.getByText('nổi bật').first()).toBeVisible();
    await expect(page.getByText('AMD EPYC 7402').first()).toBeVisible();
  });

  test('picks the locale from Accept-Language on the first visit', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'zh-CN' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/zh$/);
    await expect(page.getByText('欢迎来到 Bee Store')).toBeVisible();
    await context.close();
  });

  test('switches language and keeps the page', async ({ page }) => {
    await page.goto('/vi/products');
    await page.getByRole('button', { name: 'Ngôn ngữ' }).first().click();
    await page.getByRole('option', { name: 'English' }).click();

    await expect(page).toHaveURL(/\/en\/products$/);
    await expect(page.locator('h1')).toHaveText('All products');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });

  test('search input triggers auto suggestions', async ({ page }) => {
    await page.goto('/vi');
    // The header renders one search box for desktop and one for mobile; use the visible one.
    const searchInput = page.getByLabel('Tìm sản phẩm').locator('visible=true').first();
    await searchInput.fill('7B13');

    await expect(page.getByText('Kết quả gợi ý')).toBeVisible();
    await expect(page.getByText('AMD EPYC 7B13').first()).toBeVisible();
  });

  test('category page filters by sub-category', async ({ page }) => {
    await page.goto('/vi/category/cpu?sub=zen-3');

    await expect(page.locator('h1')).toContainText('CPU');
    await expect(page.getByText('4 sản phẩm')).toBeVisible();
  });

  test('product detail is server-rendered with specs, SEO tags and JSON-LD', async ({ page }) => {
    await page.goto('/zh/products/amd-epyc-7402');

    await expect(page.locator('h1')).toContainText('AMD EPYC 7402');
    await expect(page.getByText('3.380.000 ₫').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: '技术规格' })).toBeVisible();
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/products\/amd-epyc-7402$/);
    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.offers.priceCurrency).toBe('VND');
  });

  test('unknown pages show the localized 404', async ({ page }) => {
    const response = await page.goto('/en/no-such-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Page not found')).toBeVisible();
  });
});
