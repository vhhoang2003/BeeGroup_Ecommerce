import { test, expect, type Page } from '@playwright/test';

/**
 * README §15 E2E: register -> verify (via the Mailpit API) -> login -> browse -> inquiry -> wishlist -> logout, and
 * an admin edit. Needs the real API (NEXT_PUBLIC_USE_MOCK=false) and Mailpit; set E2E_API=1 to run, plus
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD for the admin part.
 */
const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

test.skip(!process.env.E2E_API, 'Set E2E_API=1 with the API and Mailpit running');
// One project only: the API allows 5 registrations per hour per IP (SEC-08).
test.skip(({ isMobile }) => isMobile, 'Desktop only');
test.describe.configure({ mode: 'serial' });
test.use({ locale: 'vi-VN' });

async function linkFromEmail(to: string, path: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
      const match = new RegExp(`https?://[^"\\s<>]*${path}\\?token=[A-Za-z0-9_-]+`).exec(message.HTML ?? message.Text);
      if (match) return match[0];
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No ${path} email for ${to}`);
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/vi/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

const email = `e2e-${Date.now()}@example.com`;
const password = 'Beestore2026e2e';

test('a guest registers, verifies the email and signs in', async ({ page }) => {
  await page.goto('/vi/auth/register');
  await page.getByLabel('Họ và tên').fill('Khách E2E');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByLabel('Nhập lại mật khẩu').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByText('Kiểm tra hộp thư')).toBeVisible();

  // Unverified accounts cannot sign in yet (AUTH-04).
  await login(page, email, password);
  await expect(page.getByText('Email chưa được xác minh')).toBeVisible();

  const link = new URL(await linkFromEmail(email, '/auth/verify-email'));
  await page.goto(`${link.pathname}${link.search}`);
  await expect(page).toHaveURL(/\/vi\/auth\/verify-email\?token=/);
  await expect(page.getByText('Email đã được xác minh')).toBeVisible();

  await login(page, email, password);
  await expect(page).toHaveURL(/\/vi\/account$/);
  await expect(page.getByRole('heading', { name: 'Thông tin cá nhân' })).toBeVisible();

  // The access token lives in memory only; a reload restores the session from the refresh cookie.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Thông tin cá nhân' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.length + localStorage.length)).toBe(0);
});

test('a member requests a quote, saves a product and signs out', async ({ page }) => {
  await login(page, email, password);
  await expect(page).toHaveURL(/\/vi\/account$/);

  await page.goto('/vi/products/amd-epyc-7402');
  // The header link appears once the page is hydrated and the session restored.
  await expect(page.getByRole('link', { name: 'Sản phẩm đã lưu' })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu sản phẩm' }).click();
  await expect(page.getByRole('button', { name: 'Đã lưu' })).toBeVisible();

  await page.getByRole('button', { name: 'Yêu cầu báo giá' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Số lượng').fill('2');
  await dialog.getByLabel('Số điện thoại').fill('0901 234 567');
  await dialog.getByLabel('Lời nhắn').fill('Cần 2 CPU cho cụm Proxmox.');
  await dialog.getByRole('button', { name: 'Gửi yêu cầu' }).click();
  await expect(dialog.getByText(/Mã yêu cầu: INQ-\d{4}-\d+/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Đóng' }).first().click();

  await page.goto('/vi/account/inquiries');
  await expect(page.getByText('AMD EPYC 7402')).toBeVisible();
  await expect(page.getByText('Mới', { exact: true }).first()).toBeVisible();

  await page.goto('/vi/account/wishlist');
  await expect(page.getByText('AMD EPYC 7402')).toBeVisible();

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/vi$/);
  await page.goto('/vi/account');
  await expect(page).toHaveURL(/\/vi\/auth\/login\?returnUrl=/);
});

test('customers cannot open the admin area', async ({ page }) => {
  await login(page, email, password);
  await expect(page).toHaveURL(/\/vi\/account$/);
  await page.goto('/vi/admin');
  await expect(page.getByText('Không có quyền truy cập')).toBeVisible();
});

test('an admin edits a product and handles the inquiry', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');
  await login(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
  await expect(page).toHaveURL(/\/vi\/admin$/);

  await page.goto('/en/admin/products');
  await page.getByPlaceholder('Search by name or slug').fill('7402');
  await page.getByRole('link', { name: 'AMD EPYC 7402' }).click();
  await expect(page.getByRole('heading', { name: 'AMD EPYC 7402' })).toBeVisible();

  const note = `E2E edit ${Date.now()}`;
  await page.getByRole('tab', { name: 'English' }).click();
  await page.locator('#pf-en-notes').fill(note);
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(page.getByText('Saved. The public pages will refresh.')).toBeVisible();

  // On-demand revalidation (README §6.7) makes the change visible right away.
  await expect(async () => {
    await page.goto('/en/products/amd-epyc-7402');
    await expect(page.getByText(note)).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30000 });

  await page.goto('/en/admin/inquiries');
  await page.getByPlaceholder('Search code, name, email, phone').fill(email);
  await page.getByRole('link', { name: /INQ-/ }).first().click();
  await page.getByLabel('Status').selectOption('CONTACTED');
  await page.getByLabel('Internal note').fill('Called the customer.');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Updated.')).toBeVisible();
  await expect(page.getByText('Called the customer.')).toBeVisible();
});
