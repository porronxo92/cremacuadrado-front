import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

const USER = { id: 11, email: 'cliente@test.com', first_name: 'Ana', last_name: 'García', role: 'customer', email_verified: true };

function cartBody(over: Record<string, unknown> = {}) {
  return {
    id: 1, item_count: 1, subtotal: '9.90', discount: '0.00', shipping_discount: '0.00',
    shipping_cost: '4.95', shipping_message: null, total: '14.85', coupon: null, updated_at: '2026-10-16T09:00:00Z',
    items: [{
      id: 1, product_id: 1, product_variant_id: 1, product_name: 'Crema de Pistacho Pura', variant_format: '100g',
      product_slug: 'crema-pistacho-pura', product_image: null, product_price: '9.90', unit_price: '9.90',
      quantity: 1, price_at_add: '9.90', total: '9.90', is_available: true, stock_available: 10,
    }],
    ...over,
  };
}

async function openCart(page: Page, cart: unknown) {
  await mockApi(page);
  await page.addInitScript((user) => {
    localStorage.setItem('cc_access_token', 'e2e-token');
    localStorage.setItem('cc_user', JSON.stringify(user));
  }, USER);
  await page.route(/\/api\/v1\/(auth|users)\/me$/, (r) => r.fulfill({ json: USER }));
  await page.route(/\/api\/v1\/cart$/, (r) => r.fulfill({ json: cart }));
  await settle(page, '/carrito');
}

async function noHorizontalScroll(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
}

test.describe('cupón del carrito en móvil', () => {
  test('formulario: input y botón caben, 48px y sin desborde', async ({ page }, info) => {
    await openCart(page, cartBody());
    await page.getByRole('button', { name: '¿Tienes un código de descuento?' }).click();
    const input = page.getByLabel('Código de descuento');
    const btn = page.getByRole('button', { name: 'Aplicar', exact: true });
    await input.fill('BIENVENIDO10');
    await expect(btn).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/cupon-${process.env['SHOT'] ?? 'DESPUES'}-${info.project.name}.png` });

    const vw = page.viewportSize()!.width;
    const ib = (await input.boundingBox())!;
    const bb = (await btn.boundingBox())!;
    expect(ib.height).toBeGreaterThanOrEqual(47.5);
    expect(bb.height).toBeGreaterThanOrEqual(47.5);
    expect(ib.x).toBeGreaterThanOrEqual(0);
    expect(bb.x + bb.width).toBeLessThanOrEqual(vw + 0.5);
    expect(ib.x + ib.width).toBeLessThanOrEqual(vw + 0.5);
    // La caja del formulario contiene a los dos
    const fb = (await page.locator('.coupon-input').boundingBox())!;
    expect(bb.x + bb.width).toBeLessThanOrEqual(fb.x + fb.width + 0.5);
    // font-size >= 16px (sin zoom en iOS)
    expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await noHorizontalScroll(page);
    // El resumen entero cabe en el viewport (antes se ensanchaba y recortaba precios y botón)
    const sb = (await page.locator('.cart-summary').boundingBox())!;
    expect(sb.x + sb.width).toBeLessThanOrEqual(vw + 0.5);
    await page.locator('.coupon-section').screenshot({ path: `e2e/screenshots/cupon-form-${info.project.name}.png` });
  });

  test('error del cupón: mensaje visible y sin desborde', async ({ page }, info) => {
    await openCart(page, cartBody());
    await page.route(/\/api\/v1\/cart\/apply-coupon$/, (r) =>
      r.fulfill({ status: 400, json: { detail: 'El cupón no es válido o ha caducado. Revisa el código e inténtalo de nuevo.' } }));
    await page.getByRole('button', { name: '¿Tienes un código de descuento?' }).click();
    await page.getByLabel('Código de descuento').fill('NOEXISTE');
    await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: /cupón|código/i })).toBeVisible();
    await noHorizontalScroll(page);
    await page.locator('.coupon-section').screenshot({ path: `e2e/screenshots/cupon-error-${info.project.name}.png` });
  });

  test('cupón aplicado: línea con «Quitar» cabe y botón ≥ 44px', async ({ page }, info) => {
    await openCart(page, cartBody({
      discount: '1.00', total: '13.85',
      coupon: { code: 'BIENVENIDO10-PRUEBA-LARGO', discount_type: 'percentage', discount_value: '10', discount_amount: '1.00', applies: true, message: null },
    }));
    const quitar = page.getByRole('button', { name: /Quitar el cupón/ });
    await expect(quitar).toBeVisible();
    const vw = page.viewportSize()!.width;
    const qb = (await quitar.boundingBox())!;
    expect(qb.height).toBeGreaterThanOrEqual(43.5);
    expect(qb.x + qb.width).toBeLessThanOrEqual(vw + 0.5);
    await noHorizontalScroll(page);
    await page.locator('.coupon-section').screenshot({ path: `e2e/screenshots/cupon-aplicado-${info.project.name}.png` });
  });
});
