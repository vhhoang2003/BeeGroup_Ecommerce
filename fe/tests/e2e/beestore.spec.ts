import { test, expect } from '@playwright/test';

test.describe('Bee Store E2E Flow', () => {
  test('homepage shows the real catalog', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Chào mừng đến Bee Store')).toBeVisible();
    await expect(page.getByText('CPU SERVER EPYC.')).toBeVisible();
    await expect(page.getByText('Danh mục').first()).toBeVisible();
    await expect(page.getByText('nổi bật').first()).toBeVisible();
    await expect(page.getByText('AMD EPYC 7402').first()).toBeVisible();
  });

  test('search input triggers auto suggestions', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByLabel('Tìm sản phẩm').first();
    await searchInput.fill('7B13');

    await expect(page.getByText('Kết quả gợi ý')).toBeVisible();
    await expect(page.getByText('AMD EPYC 7B13').first()).toBeVisible();
  });

  test('category page filters by sub-category', async ({ page }) => {
    await page.goto('/category/cpu?sub=zen-3');

    await expect(page.locator('h1')).toContainText('CPU');
    await expect(page.getByText('4 sản phẩm')).toBeVisible();
  });

  test('product detail shows specs and image credits', async ({ page }) => {
    await page.goto('/products/amd-epyc-7402');

    await expect(page.locator('h1')).toContainText('AMD EPYC 7402');
    await expect(page.getByText('3.380.000 ₫')).toBeVisible();
    await expect(page.getByText('Thông số kỹ thuật')).toBeVisible();
    await expect(page.getByText('Nguồn ảnh & giấy phép')).toBeVisible();
  });
});
