import { test, expect, PUBLIC_ROUTES, settle } from './fixtures';

for (const route of PUBLIC_ROUTES) {
  test(`SEO básico en ${route}`, async ({ page }) => {
    await settle(page, route);
    await expect(page.locator('h1'), 'debe haber exactamente un h1').toHaveCount(1);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc, 'falta meta description').toBeTruthy();
    expect(desc!.length, `meta description de ${desc!.length} caracteres (máx. 155)`).toBeLessThanOrEqual(155);
  });
}
