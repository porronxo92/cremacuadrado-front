import { test } from './fixtures';
import { mockApi } from './mocks/api-mock';
import { settle } from './fixtures';
test('medir', async ({ page }, info) => {
  await mockApi(page);
  await settle(page, '/');
  const tag = process.env['MTAG'] ?? 'antes';
  const h = await page.locator('app-trilogia-block').evaluate(e => Math.round(e.getBoundingClientRect().height));
  const py = await page.locator('section.products h2').evaluate(e => Math.round(e.getBoundingClientRect().top + window.scrollY));
  console.log(`MEDIDA ${tag} ${info.project.name} trilogia=${h}px h2-productos-top=${py}px viewport=${page.viewportSize()?.height}`);
  await page.screenshot({ path: `e2e/.artifacts/home-${tag}-${info.project.name}.png`, fullPage: true });
});
