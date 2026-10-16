import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

const USER = { id: 11, email: 'cliente@test.com', first_name: 'Ana', last_name: 'García', role: 'customer', email_verified: true };

// La API serializa los Decimal como texto: el envío llega como "0.00"
const ORDER = {
  id: 58, order_number: 'CC-261016-67BGHP', status: 'shipped', created_at: '2026-10-16T09:58:00Z',
  subtotal: '49.50', shipping_cost: '0.00', discount: '0.00', tax: '4.50', total: '49.50', coupon_code: null,
  tracking_number: 'PQ123456789ES', paid_at: '2026-10-16T09:58:00Z', shipped_at: '2026-10-17T09:00:00Z',
  shipping_address: { first_name: 'Ana', last_name: 'García', street: 'Calle Mayor 1', city: 'Castellón', province: 'Castellón', postal_code: '12006', country: 'ES' },
  items: [{ id: 1, product_id: 1, product_name: 'Crema Pistacho Pura', product_sku: 'CP-PURA-100', product_image_url: null, quantity: 5, unit_price: '9.90', total: '49.50' }],
};

async function openOrder(page: Page) {
  await mockApi(page);
  await page.addInitScript((user) => {
    localStorage.setItem('cc_access_token', 'e2e-token');
    localStorage.setItem('cc_user', JSON.stringify(user));
  }, USER);
  await page.route(/\/api\/v1\/(auth|users)\/me$/, (r) => r.fulfill({ json: USER }));
  await page.route(/\/api\/v1\/orders(\?.*)?$/, (r) => r.fulfill({ json: {
    items: [{ id: 58, order_number: ORDER.order_number, status: ORDER.status, total: ORDER.total, item_count: 5, created_at: ORDER.created_at, primary_image_url: null }],
    total: 1, page: 1, page_size: 10, total_pages: 1,
  } }));
  await page.route(/\/api\/v1\/orders\/CC-261016-67BGHP$/, (r) => r.fulfill({ json: ORDER }));
  await page.route(/\/api\/v1\/orders\/CC-261016-67BGHP\/invoices$/, (r) => r.fulfill({ json: [
    { invoice_number: 'F2026-000011', invoice_type: 'standard', issued_at: '2026-10-16T09:58:00', total: '49.50' },
  ] }));
  await settle(page, '/account/orders');
  const trigger = page.getByRole('button', { name: 'Ver detalles' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'CC-261016-67BGHP' });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

test.describe('modal del pedido en Mis pedidos', () => {
  test('diálogo accesible: foco dentro, Esc cierra y devuelve el foco', async ({ page }) => {
    const { dialog, trigger } = await openOrder(page);
    await expect(page.getByRole('button', { name: 'Cerrar detalle del pedido' })).toBeFocused();

    // Tab no sale del diálogo
    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('contenido: envío gratis, formato, precio unitario, progreso y factura', async ({ page }, info) => {
    const { dialog } = await openOrder(page);
    await expect(dialog.getByText('Gratis')).toBeVisible();
    await expect(dialog.getByText('100 g')).toBeVisible();
    await expect(dialog.getByText(/5 × 9,90/)).toBeVisible();
    await expect(dialog.locator('[aria-current="step"]')).toHaveText(/Enviado/);
    await expect(dialog.getByRole('link', { name: /Seguir el envío en Correos/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Descargar PDF de la factura F2026-000011' })).toBeVisible();

    // Objetivos táctiles del pie y del botón de cerrar ≥ 48px
    for (const name of ['Cerrar detalle del pedido', 'Cerrar']) {
      const box = await dialog.getByRole('button', { name, exact: true }).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }
    await page.screenshot({ path: `e2e/.artifacts/order-modal-${info.project.name}.png` });
  });
});
