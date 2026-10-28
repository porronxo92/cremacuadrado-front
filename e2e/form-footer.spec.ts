import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Locator } from '@playwright/test';

/** Propiedades visuales que deben coincidir entre campos del mismo formulario. */
async function fieldStyle(el: Locator) {
  return el.evaluate((node) => {
    const s = getComputedStyle(node);
    return {
      border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      radius: s.borderTopLeftRadius,
      background: s.backgroundColor,
      fontSize: s.fontSize,
      height: Math.round(node.getBoundingClientRect().height),
    };
  });
}

test.describe('teléfono del checkout con el mismo estilo que el resto de campos', () => {
  test('prefijo y número se ven como el campo de email', async ({ page }) => {
    await mockApi(page, { cartWithItem: true });
    await settle(page, '/checkout');

    const email = page.locator('input[type="email"]').first();
    const prefix = page.locator('app-phone-input select.phone__prefix');
    const number = page.locator('app-phone-input input.phone__number');
    await expect(number).toBeVisible();

    const ref = await fieldStyle(email);
    for (const field of [prefix, number]) {
      const got = await fieldStyle(field);
      expect(got.border).toBe(ref.border);
      expect(got.radius).toBe(ref.radius);
      expect(got.background).toBe(ref.background);
      expect(got.fontSize).toBe(ref.fontSize);
      expect(Math.abs(got.height - ref.height)).toBeLessThanOrEqual(2);
    }
  });
});

test.describe('sin franja después del pie', () => {
  for (const route of ['/', '/tienda', '/contacto', '/auth/login']) {
    test(`${route}: el pie llega al final del documento`, async ({ page }) => {
      await mockApi(page);
      await settle(page, route);
      const gap = await page.evaluate(() => {
        const footer = document.querySelector('app-footer footer, app-footer .footer') as HTMLElement | null;
        if (!footer) return null;
        const bottom = footer.getBoundingClientRect().bottom + window.scrollY;
        return Math.round(document.documentElement.scrollHeight - bottom);
      });
      expect(gap, 'no se encontró el pie').not.toBeNull();
      expect(gap!).toBeLessThanOrEqual(1);
    });
  }
});
