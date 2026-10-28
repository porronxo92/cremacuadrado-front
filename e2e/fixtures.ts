import { test as base, expect, request } from '@playwright/test';

export const PUBLIC_ROUTES = ['/', '/tienda', '/nuestro-metodo', '/para-tiendas', '/auth/login', '/carrito', '/contacto'];

export const API_BASE = process.env['E2E_API'] ?? 'http://localhost:8000';

/** Precarga el consentimiento de cookies (clave y formato de cookie-consent.service.ts). */
const COOKIES_VERSION = '2026-10';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((version) => {
      try {
        localStorage.setItem('cc_cookie_consent', JSON.stringify({
          version, external: false, analytics: false, decidedAt: new Date().toISOString(),
        }));
      } catch { /* sin storage */ }
    }, COOKIES_VERSION);
    await use(page);
  },
});

export { expect };

/** Comprueba si el backend local responde; úsalo con test.skip(!(await backendUp()), msg). */
export async function backendUp(): Promise<boolean> {
  try {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API_BASE}/api/v1/products`, { timeout: 4000 });
    await ctx.dispose();
    return res.ok();
  } catch {
    return false;
  }
}

export const BACKEND_SKIP_MSG = `Backend local no disponible en ${API_BASE} (GET /api/v1/products falló): se salta la prueba que necesita datos del API.`;

export async function settle(page: import('@playwright/test').Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
}
