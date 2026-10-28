import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

/** Checkout de invitado con un producto (Pura 100g, 6,95 €) y las zonas de envío. */
async function openCheckout(page: Page, cart?: unknown) {
  await mockApi(page, { cartWithItem: true });
  if (cart) await page.route(/\/api\/v1\/cart$/, (r) => r.fulfill({ json: cart }));
  const calls = { paymentIntent: 0, shippingCost: [] as string[] };
  await page.route('**/api/v1/checkout/shipping-cost**', (r) => {
    const cp = new URL(r.request().url()).searchParams.get('postal_code') ?? '';
    calls.shippingCost.push(cp);
    const baleares = cp.startsWith('07');
    return r.fulfill({
      json: {
        cost: baleares ? '7.95' : '4.95', shipping_zone: baleares ? 'baleares' : 'peninsula',
        free_shipping_threshold: '48.00', amount_for_free_shipping: '41.05', message: null,
      },
    });
  });
  await page.route('**/api/v1/checkout/create-payment-intent', (r) => {
    calls.paymentIntent++;
    return r.fulfill({ status: 400, json: { detail: 'sin pago en pruebas' } });
  });
  await page.route('**/api/v1/auth/email-status', (r) => r.fulfill({ json: { registered: false } }));
  await settle(page, '/checkout');
  return calls;
}

async function fillAddress(page: Page, postalCode: string) {
  await page.locator('#email').fill('cliente@test.com');
  await page.locator('#firstName').fill('Ana');
  await page.locator('#lastName').fill('García');
  await page.locator('#phone').fill('612345678');
  await page.locator('#address').fill('Calle Mayor 1');
  await page.locator('#city').fill('Ciudad');
  await page.locator('#postalCode').fill(postalCode);
  await page.locator('#postalCode').blur();
}

test.describe('checkout: zonas de envío', () => {
  test('Baleares: aviso informativo y envío de 7,95 € en el resumen', async ({ page }) => {
    const calls = await openCheckout(page);
    await fillAddress(page, '07001');

    const notice = page.getByRole('status').filter({ hasText: 'Envío a Islas Baleares: 7,95 €' });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('El envío gratis desde 48 € es solo para la península.');

    const summary = page.locator('.order-summary');
    await expect(summary.locator('.summary-row', { hasText: 'Envío' })).toContainText('7,95');
    // 6,95 € de producto + 7,95 € de envío
    await expect(summary.locator('.summary-row--total')).toContainText('14,90');
    expect(calls.shippingCost).toContain('07001');
    await expect(page.getByLabel('País')).toContainText('España');
    await expect(page.getByLabel('País')).not.toContainText('península');
    // Baleares es un destino válido: no hay panel de presupuesto
    await expect(page.locator('#quote-panel')).toHaveCount(0);
  });

  test('Baleares con ENVIOGRATIS: el cupón es solo para la península y se cobran 7,95 €', async ({ page }) => {
    // El carrito (sin CP) calcula como península: ahí el cupón sí anula los 4,95 €.
    await openCheckout(page, {
      id: 1, item_count: 1, subtotal: '6.95', discount: '0.00', shipping_discount: '4.95',
      shipping_cost: '0.00', shipping_message: 'Envío gratis con el cupón ENVIOGRATIS', total: '6.95',
      coupon: { code: 'ENVIOGRATIS', discount_type: 'free_shipping', discount_value: '0.00', discount_amount: '4.95', applies: true, message: null },
      updated_at: '2026-10-28T09:00:00Z',
      items: [{
        id: 1, product_id: 1, product_variant_id: 1, product_name: 'Crema de Pistacho Pura', variant_format: '100g',
        product_slug: 'crema-pistacho-pura', product_image: null, product_price: '6.95', unit_price: '6.95',
        quantity: 1, price_at_add: '6.95', total: '6.95', is_available: true, stock_available: 10,
      }],
    });
    await fillAddress(page, '07001');

    const notice = page.getByRole('status').filter({ hasText: 'Envío a Islas Baleares: 7,95 €' });
    await expect(notice).toContainText('El cupón ENVIOGRATIS también es solo para la península.');
    const summary = page.locator('.order-summary');
    const shipping = summary.locator('.summary-row', { hasText: 'Envío' });
    await expect(shipping).toContainText('7,95');
    await expect(shipping.locator('.ship-free')).toHaveCount(0);
    await expect(summary.locator('.summary-row--total')).toContainText('14,90');
  });

  test('Canarias: panel de WhatsApp y el pago queda bloqueado con el error en el resumen', async ({ page }) => {
    const calls = await openCheckout(page);
    await fillAddress(page, '35001');

    const panel = page.locator('#quote-panel');
    await expect(panel.getByRole('heading', { name: 'Envíos a Canarias, Ceuta y Melilla' })).toBeVisible();
    await expect(panel).toContainText('Hay trámites de aduana y calculamos el envío a medida.');

    const link = panel.getByRole('link', { name: /Pedir presupuesto por WhatsApp/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link.locator('.sr-only')).toHaveText('(se abre en WhatsApp)');
    const href = (await link.getAttribute('href'))!;
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    const text = decodeURIComponent(href.split('?text=')[1]);
    expect(text).toContain('Las Palmas');
    expect(text).toContain('35001');
    expect(text).toContain('1 × Crema de Pistacho Pura 100g');
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(48);

    const summary = page.locator('.order-summary');
    await expect(summary.locator('.summary-row', { hasText: 'Envío' })).toContainText('A presupuestar');

    // El botón sigue activo: al pulsarlo se explica el bloqueo y no se crea el pago.
    const pay = page.getByRole('button', { name: 'Confirmar y pagar' });
    await expect(pay).toBeEnabled();
    await page.locator('#acceptTerms').check();
    await pay.click();
    const errors = page.locator('.error-summary');
    await expect(errors).toBeVisible();
    await expect(errors.getByRole('link', { name: /No podemos cobrar envíos a Canarias, Ceuta ni Melilla/ })).toBeVisible();
    await errors.getByRole('link', { name: /No podemos cobrar envíos/ }).click();
    await expect(panel).toBeFocused();
    expect(calls.paymentIntent).toBe(0);
  });
});
