import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

const USER = { id: 11, email: 'cliente@test.com', first_name: 'Ana', last_name: 'García', role: 'customer', email_verified: true };
const ADDRESS = { first_name: 'Ana', last_name: 'García', street: 'Calle Mayor 1', city: 'Castellón', province: 'Castellón', postal_code: '12006', country: 'ES' };
const ITEMS = [{ id: 1, product_id: 1, product_name: 'Crema Pistacho Pura', product_sku: 'CP-PURA-100', product_image_url: null, quantity: 2, unit_price: '9.90', total: '19.80' }];

const PENDING = {
  id: 60, order_number: 'CC-261020-PEND01', status: 'pending_payment', created_at: '2026-10-20T09:00:00Z',
  subtotal: '19.80', shipping_cost: '4.95', discount: '0.00', tax: '2.25', total: '24.75', coupon_code: null,
  tracking_number: null, paid_at: null, shipped_at: null, shipping_address: ADDRESS, items: ITEMS,
};
const PAID = {
  ...PENDING, id: 59, order_number: 'CC-261016-PAID01', status: 'paid', paid_at: '2026-10-16T09:58:00Z',
};

const listItem = (o: typeof PENDING) => ({
  id: o.id, order_number: o.order_number, status: o.status, total: o.total, item_count: 2, created_at: o.created_at, primary_image_url: null,
});

async function setup(page: Page, resume: { status: number; body: unknown }) {
  await mockApi(page);
  const calls: string[] = [];
  await page.addInitScript((user) => {
    localStorage.setItem('cc_access_token', 'e2e-token');
    localStorage.setItem('cc_user', JSON.stringify(user));
  }, USER);
  await page.route(/\/api\/v1\/(auth|users)\/me$/, (r) => r.fulfill({ json: USER }));
  await page.route(/\/api\/v1\/orders(\?.*)?$/, (r) => r.fulfill({ json: {
    items: [listItem(PENDING), listItem(PAID)], total: 2, page: 1, page_size: 10, total_pages: 1,
  } }));
  await page.route(/\/api\/v1\/orders\/CC-261020-PEND01$/, (r) => r.fulfill({ json: PENDING }));
  await page.route(/\/api\/v1\/orders\/CC-261016-PAID01$/, (r) => r.fulfill({ json: PAID }));
  await page.route(/\/api\/v1\/orders\/CC-261016-PAID01\/invoices$/, (r) => r.fulfill({ json: [] }));
  await page.route(/\/api\/v1\/orders\/CC-261020-PEND01\/resume-payment$/, (r) => {
    calls.push(r.request().method());
    return r.fulfill({ status: resume.status, json: resume.body });
  });
  return calls;
}

test.describe('Continuar con el pago (pedidos pendientes)', () => {
  test('el botón solo sale en el pedido pendiente, con aviso y ≥ 48px', async ({ page }) => {
    await setup(page, { status: 200, body: {} });
    await settle(page, '/account/orders');
    const cards = page.locator('.order-card');
    await expect(cards).toHaveCount(2);
    const pending = cards.filter({ hasText: 'CC-261020-PEND01' });
    const paid = cards.filter({ hasText: 'CC-261016-PAID01' });
    await expect(pending.getByText('Pago pendiente', { exact: true })).toBeVisible();
    await expect(pending.getByText(/se cancelará si no lo completas/)).toBeVisible();
    const btn = pending.getByRole('button', { name: /Continuar con el pago/ });
    await expect(btn).toBeVisible();
    expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
    await expect(paid.getByRole('button', { name: /Continuar con el pago/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('el clic llama al endpoint, avisa de las líneas omitidas y navega a /checkout', async ({ page }) => {
    const calls = await setup(page, { status: 200, body: {
      order_number: 'CC-261020-PEND01', items_added: 1, skipped: ['Crema Crunchy 1kg'], message: 'Listo',
    } });
    await settle(page, '/account/orders');
    await page.locator('.order-card').filter({ hasText: 'CC-261020-PEND01' })
      .getByRole('button', { name: /Continuar con el pago/ }).click();
    await page.waitForURL('**/checkout');
    expect(calls).toEqual(['POST']);
    await expect(page.getByText(/Crema Crunchy 1kg/)).toBeVisible();
  });

  test('un 409 muestra el mensaje del backend y se queda en Mis pedidos', async ({ page }) => {
    await setup(page, { status: 409, body: { detail: 'Este pedido ya no está pendiente de pago.' } });
    await settle(page, '/account/orders');
    await page.locator('.order-card').filter({ hasText: 'CC-261020-PEND01' })
      .getByRole('button', { name: /Continuar con el pago/ }).click();
    await expect(page.getByText('Este pedido ya no está pendiente de pago.')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/account/orders');
  });

  test('deep link ?pedido= abre el detalle con foco en el diálogo; Esc limpia la URL', async ({ page }) => {
    await setup(page, { status: 200, body: {} });
    await settle(page, '/account/orders?pedido=CC-261020-PEND01');
    const dialog = page.getByRole('dialog', { name: 'CC-261020-PEND01' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar detalle del pedido' })).toBeFocused();
    const cta = dialog.getByRole('button', { name: 'Continuar con el pago' });
    await expect(cta).toBeVisible();
    expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
    await expect(dialog.getByText(/se cancelará si no lo completas/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/pedido=/);
  });

  test('sin sesión, el authGuard conserva ?pedido= en returnUrl', async ({ page }) => {
    await mockApi(page);
    await settle(page, '/account/orders?pedido=CC-261020-PEND01');
    await expect(page).toHaveURL(/\/auth\/login/);
    const returnUrl = new URL(page.url()).searchParams.get('returnUrl');
    expect(returnUrl).toBe('/account/orders?pedido=CC-261020-PEND01');
  });
});
