import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

// Home: «¿Dónde comprar CremaCuadrado?» (filtros por ciudad + mapa solo con consentimiento) y franja «Para tu negocio».

const STORES = [
  { id: 1, name: 'Delicatessen Uno', city: 'Madrid', instagram_url: 'https://instagram.com/uno', maps_url: 'https://maps.google.com/?q=uno', address: null, latitude: 40.4, longitude: -3.7 },
  { id: 2, name: 'Herbolario Dos', city: 'Madrid', instagram_url: 'https://instagram.com/dos', maps_url: 'https://maps.google.com/?q=dos', address: null, latitude: 40.41, longitude: -3.71 },
  { id: 3, name: 'Tienda Tres', city: 'Ciudad Real', instagram_url: 'https://instagram.com/tres', maps_url: 'https://maps.google.com/?q=tres', address: null, latitude: 38.98, longitude: -3.93 },
  { id: 4, name: 'Gourmet Cuatro', city: 'Valencia', instagram_url: 'https://instagram.com/cuatro', maps_url: 'https://maps.google.com/?q=cuatro', address: null, latitude: 39.47, longitude: -0.37 },
  { id: 5, name: 'Despensa Cinco', city: 'Sevilla', instagram_url: 'https://instagram.com/cinco', maps_url: 'https://maps.google.com/?q=cinco', address: null, latitude: 37.39, longitude: -5.98 },
];

async function open(page: Page, stores: unknown[] | 500 = STORES) {
  await mockApi(page);
  await page.route('**/api/v1/points-of-sale', (route) =>
    stores === 500
      ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"error"}' })
      : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stores) }));
  const tiles: string[] = [];
  page.on('request', (r) => { if (/basemaps\.cartocdn\.com|tile\.openstreetmap/.test(r.url())) tiles.push(r.url()); });
  await settle(page, '/');
  return tiles;
}

const h = (page: Page, sel: string) => page.locator(sel).evaluate((e) => Math.round(e.getBoundingClientRect().height));

test.describe('home: dónde comprar', () => {
  test('filtros por ciudad, mapa NO cargado sin consentimiento y sin botones extra', async ({ page }, info) => {
    const tiles = await open(page);
    const section = page.locator('app-stores-block section.stores');
    await section.scrollIntoViewIfNeeded();

    await expect(section.getByRole('heading', { level: 2, name: '¿Dónde comprar CremaCuadrado?' })).toBeVisible();
    const tags = section.locator('.stores__tag');
    await expect(tags).toHaveText(['Madrid', 'Ciudad Real', 'Valencia', 'Sevilla']);
    await expect(section.locator('.stores__status')).toHaveText('5 puntos de venta en 4 ciudades');
    // Solo el mapa: sin enlaces a /puntos-de-venta ni «cómpralo online»
    await expect(section.getByRole('link')).toHaveCount(0);

    // Sin consentimiento: placeholder con «Ver mapa», sin Leaflet ni teselas
    await expect(section.getByRole('button', { name: 'Ver mapa' })).toBeVisible();
    await expect(page.locator('app-stores-block .leaflet-container')).toHaveCount(0);
    expect(tiles).toEqual([]);

    for (const box of await tags.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) {
      expect(box).toBeGreaterThanOrEqual(44);
    }
    const storesHeight = await h(page, 'app-stores-block section.stores');
    console.log(`MEDIDA stores ${info.project.name} ${storesHeight}px`);
    expect(storesHeight).toBeLessThanOrEqual(info.project.name === 'desktop' ? 480 : 560);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('elegir una ciudad filtra y se puede volver a todas', async ({ page }) => {
    await open(page);
    const section = page.locator('app-stores-block section.stores');
    await section.scrollIntoViewIfNeeded();
    const madrid = section.getByRole('button', { name: 'Madrid' });
    await madrid.click();
    await expect(madrid).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('.stores__status')).toHaveText('2 puntos de venta en Madrid');
    await madrid.click();
    await expect(madrid).toHaveAttribute('aria-pressed', 'false');
    await expect(section.locator('.stores__status')).toHaveText('5 puntos de venta en 4 ciudades');
  });

  test('«Ver mapa» (clic expreso) carga Leaflet en la sección', async ({ page }) => {
    await open(page);
    const section = page.locator('app-stores-block section.stores');
    await section.scrollIntoViewIfNeeded();
    await section.getByRole('button', { name: 'Ver mapa' }).click();
    await expect(page.locator('app-stores-block .leaflet-container')).toBeVisible({ timeout: 15_000 });
  });

  test('si la API falla la sección no se pinta', async ({ page }) => {
    await open(page, 500);
    await expect(page.locator('app-stores-block section.stores')).toHaveCount(0);
  });

  test('ya no hay sección de reseñas en la home', async ({ page }) => {
    await open(page);
    await expect(page.getByText('LO QUE DICEN', { exact: false })).toHaveCount(0);
  });
});

test.describe('home: Para tu negocio', () => {
  test('franja única con un solo enlace a /para-tiendas', async ({ page }, info) => {
    await open(page);
    const strip = page.locator('section.b2b');
    await strip.scrollIntoViewIfNeeded();
    await expect(strip.getByRole('heading', { level: 2, name: 'Para tu negocio' })).toBeVisible();
    const links = strip.getByRole('link');
    await expect(links).toHaveCount(1);
    await expect(links.first()).toHaveAttribute('href', '/para-tiendas');
    const box = await links.first().boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    const height = await h(page, 'section.b2b');
    console.log(`MEDIDA b2b ${info.project.name} ${height}px`);
    expect(height).toBeLessThanOrEqual(info.project.name === 'desktop' ? 220 : 320);
  });
});
