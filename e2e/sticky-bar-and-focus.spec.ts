import { test, expect } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Locator, Page } from '@playwright/test';

/** Sin `networkidle`: se espera a elementos concretos. */
const go = (page: Page, url: string) => page.goto(url, { waitUntil: 'domcontentloaded' });

const isMobile = (info: { project: { name: string } }) => info.project.name.startsWith('mobile');

// ------------------------------------------------------------ 1. Barra fija de compra (móvil)
test.describe('barra fija de compra en la ficha (móvil)', () => {
  test.beforeEach(({}, info) => test.skip(!isMobile(info), 'La barra fija solo existe en móvil'));

  const bar = (page: Page) => page.locator('.pd__sticky-bar');
  const scrollPastPurchase = async (page: Page) => {
    await page.locator('.pd__cta').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  };

  // En móvil el botón de compra queda bajo el pliegue: arriba del todo la barra SÍ se ve (diseño).
  // «Volver arriba» = volver al bloque de compra, que es cuando debe desaparecer.
  const showPurchaseBlock = (page: Page) =>
    page.locator('.pd__cta').first().evaluate((el) => el.scrollIntoView({ block: 'center' }));

  test('(a) carga directa: aparece al pasar el bloque de compra y desaparece al volver arriba', async ({ page }) => {
    await mockApi(page);
    await go(page, '/tienda/crema-pistacho-pura');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/pura/i);
    await scrollPastPurchase(page);
    await expect(bar(page)).toBeVisible();
    await expect(bar(page)).toContainText('Crema de Pistacho Pura');
    await showPurchaseBlock(page);
    await expect(bar(page)).toHaveCount(0); // (d)
  });

  test('(b) navegación de cliente desde /tienda: la barra funciona', async ({ page }) => {
    await mockApi(page);
    await go(page, '/tienda');
    await page.locator('.prod-card__name-link').first().click();
    await expect(page).toHaveURL(/\/tienda\/crema-pistacho-pura$/);
    await scrollPastPurchase(page);
    await expect(bar(page)).toBeVisible();
    await expect(bar(page)).toContainText('Crema de Pistacho Pura');
    await showPurchaseBlock(page);
    await expect(bar(page)).toHaveCount(0);
  });

  test('(b2) navegación de cliente desde la home', async ({ page }) => {
    await mockApi(page);
    await go(page, '/');
    const link = page.locator('#productos a[href="/tienda/crema-pistacho-pura"]').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(/\/tienda\/crema-pistacho-pura$/);
    await scrollPastPurchase(page);
    await expect(bar(page)).toBeVisible();
  });

  test('(c) de Pura a Crunchy por el cliente: la barra sigue funcionando con el nombre correcto', async ({ page }) => {
    await mockApi(page);
    await go(page, '/tienda');
    await page.locator('.prod-card__name-link').first().click();
    await expect(page).toHaveURL(/pura$/);
    await scrollPastPurchase(page);
    await expect(bar(page)).toContainText('Crema de Pistacho Pura');

    await page.goBack();
    await expect(page).toHaveURL(/\/tienda$/);
    await page.locator('.prod-card__name-link').nth(1).click();
    await expect(page).toHaveURL(/crunchy$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/crunchy/i);
    await page.evaluate(() => window.scrollTo(0, 0));
    await showPurchaseBlock(page);
    await expect(bar(page)).toHaveCount(0);
    await scrollPastPurchase(page);
    await expect(bar(page)).toBeVisible();
    await expect(bar(page)).toContainText('Crema de Pistacho Crunchy');
    await expect(bar(page)).not.toContainText('Pura');
    await showPurchaseBlock(page);
    await expect(bar(page)).toHaveCount(0);
  });
});

// ------------------------------------------------------------ 2. Foco al cerrar el mini-carrito
/** Tab hasta que el foco cae en `target` (máx. 150 pulsaciones). */
async function tabTo(page: Page, target: Locator) {
  const handle = await target.elementHandle();
  for (let i = 0; i < 150; i++) {
    await page.keyboard.press('Tab');
    if (await handle!.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error('El foco no llegó al botón con Tab');
}

const focusedIs = (page: Page, target: Locator) =>
  expect.poll(async () => (await target.elementHandle())!.evaluate((el) => el === document.activeElement)).toBe(true);

type Case = { name: string; url: string; button: (p: Page) => Locator };
const CASES: Case[] = [
  { name: 'ficha', url: '/tienda/crema-pistacho-pura', button: (p) => p.locator('.pd__cta') },
  { name: '/tienda', url: '/tienda', button: (p) => p.locator('.prod-card').first().getByRole('button', { name: 'Añadir al carrito' }) },
  { name: 'home', url: '/', button: (p) => p.locator('#productos .product-card').first().getByRole('button', { name: /^Añadir al carrito/ }) },
];

test.describe('foco al cerrar el mini-carrito (teclado)', () => {
  for (const c of CASES) {
    for (const how of ['Escape', 'botón cerrar'] as const) {
      test(`${c.name}: Tab + Enter y cerrar con ${how} devuelve el foco al botón`, async ({ page }) => {
        await mockApi(page);
        await go(page, c.url);
        const btn = c.button(page);
        await btn.waitFor();
        await tabTo(page, btn);
        await page.keyboard.press('Enter');
        const mini = page.locator('.mini-cart.is-open');
        await expect(mini).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cerrar carrito' })).toBeFocused();

        if (how === 'Escape') await page.keyboard.press('Escape');
        else await page.getByRole('button', { name: 'Cerrar carrito' }).click();

        await expect(page.locator('.mini-cart.is-open')).toHaveCount(0);
        await focusedIs(page, btn);
        await expect(btn).toBeEnabled();
      });
    }
  }
});
