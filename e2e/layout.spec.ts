import { test, expect, PUBLIC_ROUTES, settle } from './fixtures';

for (const route of PUBLIC_ROUTES) {
  test(`sin scroll horizontal en ${route}`, async ({ page }, info) => {
    await settle(page, route);
    const res = await page.evaluate(() => {
      const iw = window.innerWidth;
      const sel = (el: Element) => {
        let s = el.tagName.toLowerCase();
        if (el.id) s += `#${el.id}`;
        const c = (el.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (c.length) s += '.' + c.join('.');
        return s;
      };
      const offenders: string[] = [];
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > iw + 0.5) offenders.push(`${sel(el)} (right=${Math.round(r.right)}, width=${Math.round(r.width)})`);
      });
      return { scrollWidth: document.documentElement.scrollWidth, iw, offenders: offenders.slice(0, 15) };
    });
    expect(
      res.scrollWidth,
      `[${info.project.name}] ${route}: scrollWidth=${res.scrollWidth} > innerWidth=${res.iw}. Elementos que se salen:\n${res.offenders.join('\n')}`,
    ).toBeLessThanOrEqual(res.iw);
  });
}

test('capturas de la home', async ({ page }, info) => {
  await settle(page, '/');
  await page.screenshot({ path: `e2e/.artifacts/home-${info.project.name}.png`, fullPage: true });
});
