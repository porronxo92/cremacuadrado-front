import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';

test.describe('home: sección de cremas', () => {
  test('elegir cantidad y añadir: envía la cantidad, abre el mini-carrito y vuelve a 1', async ({ page }) => {
    const api = await mockApi(page);
    await settle(page, '/');
    const card = page.locator('#productos .product-card').first();
    await card.scrollIntoViewIfNeeded();

    const qty = card.getByRole('group', { name: /^Cantidad de / });
    await qty.getByRole('button', { name: /^Añadir una unidad/ }).click();
    await qty.getByRole('button', { name: /^Añadir una unidad/ }).click();
    await expect(qty).toContainText('3');

    await card.getByRole('button', { name: /^Añadir al carrito: 3 × / }).click();
    await expect(page.locator('.mini-cart.is-open')).toBeVisible();
    expect(api.addRequests.at(-1)?.quantity).toBe(3);
    await expect(qty).toContainText('1');
  });

  test('móvil: tarjetas compactas, miniatura cuadrada y sin scroll horizontal', async ({ page }, info) => {
    test.skip(!info.project.name.startsWith('mobile'), 'Solo en móvil');
    await mockApi(page);
    await settle(page, '/');
    const card = page.locator('#productos .product-card').first();
    await card.scrollIntoViewIfNeeded();

    const cardBox = (await card.boundingBox())!;
    expect(cardBox.height, `alto de la tarjeta ${Math.round(cardBox.height)}px`).toBeLessThanOrEqual(220);

    const img = (await card.locator('.product-card__img-wrap').boundingBox())!;
    expect(Math.abs(img.width - img.height)).toBeLessThanOrEqual(1);

    // Controles de compra: mínimo 44px; el botón de añadir, 48px
    for (const btn of await card.locator('.qty__btn').all()) {
      expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    }
    expect((await card.locator('.product-card__cta').boundingBox())!.height).toBeGreaterThanOrEqual(47.5);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.locator('#productos').screenshot({ path: `e2e/.artifacts/home-products-${info.project.name}.png` });
  });
});
