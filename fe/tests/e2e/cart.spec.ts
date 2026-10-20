import { test, expect } from '@playwright/test';

/** Cart and checkout: the cart lives in the browser, the pay button stays disabled until online payment exists. */
test.describe('cart and checkout', () => {
  test.use({ locale: 'vi-VN' });

  test('adds products, keeps them across reloads and totals them', async ({ page }) => {
    await page.goto('/vi/products/amd-epyc-7402');
    await page.getByRole('button', { name: 'Tăng số lượng' }).click();
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
    await expect(page.getByText('Đã thêm vào giỏ hàng.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Giỏ hàng (2 sản phẩm)' }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole('link', { name: 'Giỏ hàng (2 sản phẩm)' }).first()).toBeVisible();

    await page.goto('/vi/cart');
    await expect(page.getByRole('heading', { name: 'Giỏ hàng' })).toBeVisible();
    await expect(page.getByText('6.760.000 ₫').first()).toBeVisible();

    await page.getByRole('button', { name: 'Tăng số lượng' }).click();
    await expect(page.getByText('10.140.000 ₫').first()).toBeVisible();

    await page.getByRole('link', { name: 'Tiến hành thanh toán' }).click();
    await expect(page).toHaveURL(/\/vi\/checkout$/);
    await expect(page.getByRole('heading', { name: 'Thanh toán', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thanh toán' })).toBeDisabled();
    await expect(page.getByRole('radio', { name: /VNPay/ })).toBeDisabled();
  });

  test('switching language keeps the cart', async ({ page }) => {
    await page.goto('/vi/products/amd-epyc-7402');
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
    await page.goto('/en/cart');
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Proceed to checkout' })).toBeVisible();
    await page.goto('/en/checkout');
    await expect(page.getByRole('button', { name: 'Pay now' })).toBeDisabled();
  });

  test('a guest sends the cart as a quote request', async ({ page, isMobile }) => {
    test.skip(!process.env.E2E_API, 'Needs the real API (POST /contact)');
    // One project only: the API accepts 5 inquiries per hour per IP (SEC-08).
    test.skip(isMobile, 'Desktop only');
    await page.goto('/vi/products/amd-epyc-7402');
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
    await page.goto('/vi/checkout');

    await page.getByRole('button', { name: 'Gửi yêu cầu báo giá cho giỏ hàng' }).click();
    await expect(page.getByText('Vui lòng nhập thông tin này.').first()).toBeVisible();

    await page.getByRole('textbox', { name: 'Họ và tên' }).fill('Khách giỏ hàng');
    await page.getByRole('textbox', { name: 'Số điện thoại' }).fill('0901 234 567');
    await page.getByRole('textbox', { name: 'Email' }).fill(`cart-${Date.now()}@example.com`);
    await page.getByRole('textbox', { name: 'Địa chỉ' }).fill('1 Lê Lợi, Quận 1');
    await page.getByRole('textbox', { name: 'Tỉnh / Thành phố' }).fill('TP. Hồ Chí Minh');
    await page.getByRole('button', { name: 'Gửi yêu cầu báo giá cho giỏ hàng' }).click();

    await expect(page.getByText('Đã gửi giỏ hàng')).toBeVisible();
    await expect(page.getByText(/Mã yêu cầu: INQ-\d{4}-\d+/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Giỏ hàng', exact: true }).first()).toBeVisible();
  });
});
