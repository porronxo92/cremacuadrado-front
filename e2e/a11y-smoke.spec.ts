import { test, expect, PUBLIC_ROUTES, settle } from './fixtures';

for (const route of PUBLIC_ROUTES) {
  test(`botones con nombre accesible en ${route}`, async ({ page }) => {
    await settle(page, route);
    const unnamed = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll('button, [role="button"]').forEach((el) => {
        const h = el as HTMLElement;
        const r = h.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // oculto
        const labelledby = el.getAttribute('aria-labelledby');
        const byId = labelledby ? labelledby.split(/\s+/).map(i => document.getElementById(i)?.textContent ?? '').join('').trim() : '';
        const name = (el.getAttribute('aria-label') ?? '').trim() || byId || (h.innerText ?? '').trim() || (el.getAttribute('title') ?? '').trim()
          || (el.querySelector('img[alt]')?.getAttribute('alt') ?? '').trim();
        if (!name) bad.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${(el.getAttribute('class') ?? '').split(/\s+/).slice(0, 2).join('.')}`);
      });
      return bad;
    });
    expect(unnamed, `botones sin nombre accesible:\n${unnamed.join('\n')}`).toEqual([]);
  });
}
