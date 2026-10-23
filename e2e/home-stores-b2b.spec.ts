import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Page } from '@playwright/test';

// Home: «¿Dónde comprar CremaCuadrado?» (mapa solo con consentimiento) y franja «Para tu negocio».

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
  test('lista corta en el HTML, mapa NO cargado sin consentimiento, enlaces correctos', async ({ page }, info) => {
    const tiles = await open(page);
    const section = page.locator('app-stores-block section.stores');
    await section.scrollIntoViewIfNeeded();

    await expect(section.getByRole('heading', { level: 2, name: '¿Dónde comprar CremaCuadrado?' })).toBeVisible();
    await expect(section.locator('.stores__list li')).toHaveCount(4); // 3 tiendas + «y 2 más»
    await expect(section.locator('.stores__list')).toContainText('Delicatessen Uno');
    await expect(section.locator('.stores__more')).toContainText('y 2 más');

    // Sin consentimiento: placeholder con «Ver mapa», sin Leaflet ni teselas
    await expect(section.getByRole('button', { name: 'Ver mapa' })).toBeVisible();
    await expect(page.locator('app-stores-block .leaflet-container')).toHaveCount(0);
    expect(tiles).toEqual([]);

    await expect(section.getByRole('link', { name: 'Ver todos los puntos de venta' })).toHaveAttribute('href', '/puntos-de-venta');
    await expect(section.getByRole('link', { name: 'o cómpralo online' })).toHaveAttribute('href', '/#productos');

    // Altura de la sección (medida para el informe)
    const storesHeight = await h(page, 'app-stores-block section.stores');
    console.log(`MEDIDA stores ${info.project.name} ${storesHeight}px`);
    expect(storesHeight).toBeLessThanOrEqual(info.project.name === 'desktop' ? 480 : 560);
    // Sin scroll horizontal
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('«Ver mapa» (clic expreso) carga Leaflet en la sección', async ({ page }) => {
    await open(page);
    const section = page.locator('app-stores-block section.stores');
    await section.scrollIntoViewIfNeeded();
    await section.getByRole('button', { name: 'Ver mapa' }).click();
    await expect(page.locator('app-stores-block .leaflet-container')).toBeVisible({ timeout: 15_000 });
  });

  test('«o cómpralo online» lleva a la sección de productos', async ({ page }) => {
    await open(page);
    const section = page.locator('app-stores-block section.stores');
    await section.scrollIntoViewIfNeeded();
    await section.getByRole('link', { name: 'o cómpralo online' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#productos h2')).toBeFocused();
  });

  test('si la API falla no queda un hueco: enlace a /puntos-de-venta y opción online', async ({ page }) => {
    await open(page, 500);
    const section = page.locator('app-stores-block section.stores');
    await expect(section.locator('.stores__list')).toHaveCount(0);
    await expect(page.locator('app-stores-block app-stores-map-gate')).toHaveCount(0);
    await expect(section.getByRole('link', { name: 'Ver todos los puntos de venta' })).toBeVisible();
    await expect(section.getByRole('link', { name: 'o cómpralo online' })).toBeVisible();
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
