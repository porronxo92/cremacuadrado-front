import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

// Cupón en el resumen del checkout: solo clientes con cuenta (como en /carrito).

const USER = { id: 11, email: 'cliente@test.com', first_name: 'Ana', last_name: 'García', phone: '612345678', role: 'customer', email_verified: true };

function cartBody(over: Record<string, unknown> = {}) {
  return {
    id: 1, item_count: 1, subtotal: '30.00', discount: '0.00', shipping_discount: '0.00',
    shipping_cost: '4.95', shipping_message: null, total: '34.95', coupon: null, updated_at: '2026-10-23T09:00:00Z',
    items: [{
      id: 1, product_id: 1, product_variant_id: 1, product_name: 'Crema Pistacho Pura', variant_format: '100g',
      product_slug: 'crema-pistacho-pura', product_image: null, product_price: '10.00', unit_price: '10.00',
      quantity: 3, price_at_add: '10.00', total: '30.00', is_available: true, stock_available: 10,
    }],
    ...over,
  };
}

const WITH_COUPON = cartBody({
  discount: '3.00', total: '31.95',
  coupon: { code: 'DIEZ', discount_type: 'percent', discount_value: '10', applies: true, message: null },
});

async function blockPayment(page: Page) {
  await page.route('**/api/v1/checkout/create-payment-intent', (r) => r.fulfill({ status: 400, json: { detail: 'sin pago en pruebas' } }));
  await page.route('**/api/v1/checkout/shipping-cost**', (r) => r.fulfill({
    json: { cost: '4.95', shipping_zone: 'peninsula', free_shipping_threshold: '48.00', amount_for_free_shipping: '18.00', message: null },
  }));
}

async function openAsCustomer(page: Page) {
  await mockApi(page);
  await page.addInitScript((user) => {
    localStorage.setItem('cc_access_token', 'e2e-token');
    localStorage.setItem('cc_user', JSON.stringify(user));
  }, USER);
  await page.route(/\/api\/v1\/(auth|users)\/me$/, (r) => r.fulfill({ json: USER }));
  await page.route(/\/api\/v1\/users\/me\/addresses$/, (r) => r.fulfill({ json: [] }));
  let cart = cartBody();
  const applied: string[] = [];
  await page.route(/\/api\/v1\/cart$/, (r) => r.fulfill({ json: cart }));
  await page.route(/\/api\/v1\/cart\/apply-coupon$/, (r) => {
    applied.push(r.request().postDataJSON()?.code ?? '');
    cart = WITH_COUPON;
    return r.fulfill({ json: cart });
  });
  await page.route(/\/api\/v1\/cart\/(remove-coupon|coupon)$/, (r) => { cart = cartBody(); return r.fulfill({ json: cart }); });
  await blockPayment(page);
  await settle(page, '/checkout');
  return applied;
}

test.describe('checkout: cupón en el resumen', () => {
  test('cliente con cuenta: aplica el cupón y el resumen muestra el descuento y el nuevo total', async ({ page }) => {
    const applied = await openAsCustomer(page);
    const summary = page.locator('.order-summary');
    await summary.getByRole('button', { name: '¿Tienes un código de descuento?' }).click();
    await summary.getByLabel('Código de descuento').fill('diez');
    await summary.getByRole('button', { name: 'Aplicar', exact: true }).click();

    expect(applied).toEqual(['DIEZ']);
    await expect(summary.locator('.summary-row--discount')).toContainText('3,00');
    await expect(summary.locator('.summary-row--total')).toContainText('31,95');
    await expect(summary.getByText('Cupón DIEZ aplicado')).toBeVisible();

    // Y se puede quitar
    await summary.getByRole('button', { name: 'Quitar el cupón DIEZ' }).click();
    await expect(summary.locator('.summary-row--total')).toContainText('34,95');
  });

  test('invitado: invitación a iniciar sesión o registrarse que vuelve al checkout', async ({ page }) => {
    await mockApi(page, { cartWithItem: true });
    await blockPayment(page);
    await page.route('**/api/v1/auth/email-status', (r) => r.fulfill({ json: { registered: false } }));
    await settle(page, '/checkout');
    const summary = page.locator('.order-summary');
    await summary.getByRole('button', { name: '¿Tienes un código de descuento?' }).click();
    await expect(summary.getByLabel('Código de descuento')).toHaveCount(0);
    await expect(summary.getByText('Los códigos de descuento son para clientes con cuenta.')).toBeVisible();
    await expect(summary.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute('href', '/auth/login?returnUrl=%2Fcheckout');
    await expect(summary.getByRole('link', { name: 'crea una cuenta' })).toHaveAttribute('href', '/auth/register?returnUrl=%2Fcheckout');
  });

  test('sin desborde horizontal con el formulario abierto', async ({ page }) => {
    await openAsCustomer(page);
    const summary = page.locator('.order-summary');
    await summary.getByRole('button', { name: '¿Tienes un código de descuento?' }).click();
    await summary.getByLabel('Código de descuento').fill('BIENVENIDO10');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBeLessThanOrEqual(0);
  });
});
