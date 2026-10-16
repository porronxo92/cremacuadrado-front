import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

const USER = { id: 11, email: 'cliente@test.com', first_name: 'Ana', last_name: 'García', role: 'customer', email_verified: true };

// La API serializa los Decimal como texto.
function cartBody(over: Record<string, unknown>) {
  return {
    id: 1, item_count: 1, subtotal: '9.90', discount: '0.00', shipping_discount: '0.00',
    shipping_cost: '4.95', shipping_message: 'Te faltan 38,10 € para el envío gratis', total: '14.85',
    coupon: null, updated_at: '2026-10-16T09:00:00Z',
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

test.describe('carrito con cupón de envío gratis', () => {
  test('aplicado: envío tachado + Gratis, sin mensaje de progreso', async ({ page }, info) => {
    await openCart(page, cartBody({
      shipping_discount: '4.95', shipping_cost: '0.00', shipping_message: 'Envío gratis con el cupón ENVIOGRATIS',
      total: '9.90',
      coupon: { code: 'ENVIOGRATIS', discount_type: 'free_shipping', discount_value: '0.00', discount_amount: '4.95', applies: true, message: null },
    }));
    const summary = page.getByRole('region', { name: 'Resumen del pedido' });
    await expect(summary.locator('s')).toContainText('4,95');
    await expect(summary.locator('s .sr-only')).toHaveText(/antes/);
    await expect(summary.getByText('Gratis', { exact: true })).toBeVisible();
    await expect(summary.getByText('Cupón ENVIOGRATIS', { exact: true })).toBeVisible();
    await expect(summary.getByText(/Cupón ENVIOGRATIS aplicado/)).toBeVisible();
    await expect(summary.getByText(/envío gratis/i).first()).toBeVisible();
    await expect(summary.getByText(/Te faltan/)).toHaveCount(0);
    await expect(summary.getByRole('progressbar')).toHaveCount(0);
    await expect(summary.getByText(/Descuento/)).toHaveCount(0);
    await summary.screenshot({ path: `e2e/.artifacts/coupon-applied-${info.project.name}.png` });
  });

  test('no aplica: aviso informativo con el motivo y opción de quitarlo', async ({ page }, info) => {
    await openCart(page, cartBody({
      subtotal: '49.50', shipping_cost: '0.00', shipping_message: 'Envío gratis', total: '49.50',
      coupon: { code: 'ENVIOGRATIS', discount_type: 'free_shipping', discount_value: '0.00', discount_amount: '0.00', applies: false,
        message: 'Tu pedido ya tiene envío gratis (desde 48,00 €). Guarda el cupón ENVIOGRATIS para otro pedido.' },
    }));
    const summary = page.getByRole('region', { name: 'Resumen del pedido' });
    const notice = summary.getByRole('status').filter({ hasText: 'ya tiene envío gratis' });
    await expect(notice).toBeVisible();
    await expect(summary.getByText(/ENVIOGRATIS aplicado/)).toHaveCount(0);
    await expect(summary.getByRole('button', { name: 'Quitar el cupón ENVIOGRATIS' })).toBeVisible();
    await summary.screenshot({ path: `e2e/.artifacts/coupon-notapplies-${info.project.name}.png` });
  });
});
