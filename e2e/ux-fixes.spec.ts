import { test, expect, settle } from './fixtures';
import { mockApi } from './mocks/api-mock';
import type { Locator, Page, TestInfo } from '@playwright/test';

const ART = 'e2e/.artifacts';
const SHOTS = 'e2e/screenshots';

const shot = (page: Page, info: TestInfo, name: string, copy = false) =>
  page.screenshot({ path: `${copy ? SHOTS : ART}/${name}-${info.project.name}.png` });

async function hScroll(page: Page) {
  return page.evaluate(() => {
    const iw = window.innerWidth;
    const offenders: string[] = [];
    document.querySelectorAll('body *').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.position === 'fixed') return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > iw + 0.5) {
        offenders.push(`${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(/\s+/)[0]} (right=${Math.round(r.right)})`);
      }
    });
    return { sw: document.documentElement.scrollWidth, iw, offenders: offenders.slice(0, 12) };
  });
}

/** Contraste WCAG; colores computados "rgb(r, g, b)" o "rgba(r, g, b, a)" (el fondo se compone sobre #F4F1E9). */
function parseRgb(c: string): [number, number, number, number] {
  const m = c.match(/[\d.]+/g)!.map(Number);
  return [m[0], m[1], m[2], m[3] ?? 1];
}
function lum([r, g, b]: number[]) {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(fg: string, bg: string, under: number[] = [244, 241, 233]) {
  const [br, bgc, bb, ba] = parseRgb(bg);
  const comp = [br * ba + under[0] * (1 - ba), bgc * ba + under[1] * (1 - ba), bb * ba + under[2] * (1 - ba)];
  const a = lum(parseRgb(fg)), b = lum(comp);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const styleOf = (loc: Locator, props: string[]) =>
  loc.evaluate((el, ps) => {
    const cs = getComputedStyle(el) as any;
    return Object.fromEntries(ps.map((p) => [p, cs[p]]));
  }, props);

const GRANATE = 'rgb(123, 23, 22)';

// ---------------------------------------------------------------- 1. Sin scroll horizontal
test.describe('1. sin scroll horizontal (con API simulado)', () => {
  const routes = ['/', '/tienda', '/tienda/crema-pistacho-pura', '/nuestro-metodo', '/para-tiendas', '/auth/login', '/auth/register', '/carrito'];
  for (const route of routes) {
    test(`${route}`, async ({ page }, info) => {
      await mockApi(page, { cartWithItem: route === '/carrito' });
      await settle(page, route);
      const r = await hScroll(page);
      expect(r.sw, `[${info.project.name}] ${route}: scrollWidth=${r.sw} > ${r.iw}\n${r.offenders.join('\n')}`).toBeLessThanOrEqual(r.iw);
    });
  }

  test('con el mini-carrito abierto', async ({ page }, info) => {
    await mockApi(page);
    await settle(page, '/tienda');
    await page.getByRole('button', { name: 'Añadir al carrito' }).first().click();
    await expect(page.locator('.mini-cart.is-open')).toBeVisible();
    await page.waitForTimeout(400); // fin de la animación de 300 ms del panel (sin alternativa observable)
    await shot(page, info, 'minicart');
    const r = await hScroll(page);
    expect(r.sw, `[${info.project.name}] mini-carrito: scrollWidth=${r.sw} > ${r.iw}\n${r.offenders.join('\n')}`).toBeLessThanOrEqual(r.iw);
    const box = await page.locator('.mini-cart').boundingBox();
    expect(box!.x + box!.width, 'el panel del mini-carrito cabe en el viewport').toBeLessThanOrEqual(r.iw + 0.5);
  });
});

// ---------------------------------------------------------------- 2. Cabecera
test.describe('2. cabecera móvil', () => {
  test('tagline oculta y menú móvil con aria-expanded/aria-label', async ({ page }, info) => {
    test.skip(info.project.name === 'desktop', 'Solo móvil (≤ 600 px la tagline se oculta; el toggle existe ≤ 960 px)');
    await mockApi(page);
    await settle(page, '/');
    await expect(page.locator('.header__logo-tagline')).toBeHidden();
    const toggle = page.locator('button.header__mobile-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-label', 'Abrir menú');
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('aria-label', 'Cerrar menú');
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await shot(page, info, 'menu-abierto');
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-label', 'Abrir menú');
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- 3. Hero
test.describe('3. hero', () => {
  test('CTA «Descubrir la crema» visible sin scroll (móvil y escritorio)', async ({ page }, info) => {
    await mockApi(page);
    await settle(page, '/');
    const cta = page.locator('.hero__btn-primary');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText(/Descubrir la crema/);
    await shot(page, info, 'hero', ['mobile-360', 'mobile-390', 'desktop'].includes(info.project.name));
    // En escritorio, además, un portátil de 1280×720
    const viewports = info.project.name === 'desktop' ? [null, { width: 1280, height: 720 }] : [null];
    for (const vp of viewports) {
      if (vp) await page.setViewportSize(vp);
      const box = (await cta.boundingBox())!;
      const ih = await page.evaluate(() => window.innerHeight);
      expect(box.y + box.height, `[${info.project.name}${vp ? ' 1280×720' : ''}] bottom del CTA=${Math.round(box.y + box.height)} debe ser < innerHeight=${ih}`).toBeLessThan(ih);
    }
  });
});

// ---------------------------------------------------------------- 4. Botones de formato
test.describe('4. botones de formato con táctil', () => {
  test.skip(({ hasTouch }) => !hasTouch, 'Requiere hasTouch (proyectos móviles)');

  test('home: el formato activo tiene contraste ≥ 4,5:1, el anterior no conserva hover y el precio cambia', async ({ page }, info) => {
    await mockApi(page);
    await settle(page, '/');
    const card = page.locator('.product-card').first();
    const btns = card.locator('.product-card__variants .variant-btn');
    await expect(btns).toHaveCount(3);
    await card.scrollIntoViewIfNeeded();
    const prev = card.locator('.variant-btn--active');
    await expect(prev).toHaveCount(1);
    const prevText = (await prev.innerText()).trim();
    const priceBefore = await card.locator('.product-card__price').innerText();
    const next = card.locator('.variant-btn:not(.variant-btn--active):not([disabled])').first();
    const nextText = (await next.innerText()).trim();
    await next.tap();
    await expect(card.locator('.variant-btn--active')).toHaveText(new RegExp(nextText));
    await page.waitForTimeout(250); // transición de 150 ms de los botones
    const active = card.locator('.variant-btn--active');
    const s = await styleOf(active, ['color', 'backgroundColor']);
    const ratio = contrast(s['color'], s['backgroundColor']);
    expect(ratio, `contraste activo ${ratio.toFixed(2)} (${s['color']} sobre ${s['backgroundColor']})`).toBeGreaterThanOrEqual(4.5);
    const old = card.locator('.variant-btn', { hasText: prevText }).first();
    await expect(old).not.toHaveClass(/variant-btn--active/);
    const so = await styleOf(old, ['color', 'borderTopColor']);
    expect(so['color'], 'el anterior no conserva el color de hover (granate)').not.toBe(GRANATE);
    expect(so['borderTopColor'], 'el anterior no conserva el borde de hover').not.toBe(GRANATE);
    await expect(card.locator('.product-card__price')).not.toHaveText(priceBefore);
    await card.screenshot({ path: `${ART}/home-card-${info.project.name}.png` });
  });

  test('ficha: el formato seleccionado mantiene contraste, el anterior no conserva hover y el precio cambia', async ({ page }) => {
    await mockApi(page);
    await settle(page, '/tienda/crema-pistacho-pura');
    const cards = page.locator('app-format-selector .fmt-card');
    await expect(cards).toHaveCount(3);
    const price = page.locator('app-price-display .price-display__total');
    const priceBefore = await price.innerText();
    const prev = page.locator('.fmt-card.is-active');
    await expect(prev).toHaveCount(1);
    const prevName = (await prev.locator('.fmt-card__name').innerText()).trim();
    await cards.filter({ hasText: '100g' }).first().tap();
    const active = page.locator('.fmt-card.is-active');
    await expect(active).toContainText('100g');
    await page.waitForTimeout(250);
    const bg = await styleOf(active, ['backgroundColor']);
    const fg = await styleOf(active.locator('.fmt-card__name'), ['color']);
    const ratio = contrast(fg['color'], bg['backgroundColor']);
    expect(ratio, `contraste nombre ${fg['color']} sobre ${bg['backgroundColor']} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    const old = cards.filter({ hasText: prevName }).first();
    await expect(old).not.toHaveClass(/is-active/);
    await expect(old).toHaveAttribute('aria-pressed', 'false');
    const so = await styleOf(old, ['borderTopColor']);
    expect(so['borderTopColor'], 'el anterior no conserva el borde granate').not.toBe(GRANATE);
    await expect(price).not.toHaveText(priceBefore);
  });
});

// ---------------------------------------------------------------- 5. Compra rápida de /tienda
test.describe('5. /tienda compra rápida', () => {
  const card = (page: Page, i: number) => page.locator('.prod-card').nth(i);

  test('estructura: sin «Elegir formato», formatos y botones −/+ de 48×48', async ({ page }, info) => {
    await mockApi(page);
    await settle(page, '/tienda');
    await expect(page.getByText('Elegir formato')).toHaveCount(0);
    const pura = card(page, 0);
    await expect(pura.locator('.prod-card__formats .prod-card__format-btn')).toHaveCount(3);
    for (const b of await pura.locator('.prod-card__qty-btn').all()) {
      const box = (await b.boundingBox())!;
      expect(Math.round(box.width), 'ancho botón −/+').toBeGreaterThanOrEqual(48);
      expect(Math.round(box.height), 'alto botón −/+').toBeGreaterThanOrEqual(48);
    }
    await pura.scrollIntoViewIfNeeded();
    await pura.screenshot({ path: `${SHOTS}/tienda-card-${info.project.name}.png` });
  });

  test('móvil: el botón flotante de WhatsApp no tapa «−» ni «Añadir al carrito» ni el final de la página', async ({ page }, info) => {
    test.skip(!info.project.name.startsWith('mobile'), 'solo móvil');
    await mockApi(page);
    await settle(page, '/tienda');
    const fab = page.locator('.whatsapp-bubble');
    await expect(fab).toBeVisible();
    const fb = (await fab.boundingBox())!;
    expect(Math.round(fb.width), 'FAB ≥ 48').toBeGreaterThanOrEqual(48);
    const hit = (b: { x: number; y: number; width: number; height: number }) =>
      b.x < fb.x + fb.width && b.x + b.width > fb.x && b.y < fb.y + fb.height && b.y + b.height > fb.y;
    const last = page.locator('.prod-card:has(.prod-card__qty-btn)').last();
    await last.scrollIntoViewIfNeeded();
    for (const loc of [last.locator('.prod-card__qty-btn').first(), last.getByRole('button', { name: /añadir al carrito/i })]) {
      await loc.scrollIntoViewIfNeeded();
      // Peor caso: el control queda abajo del viewport (como al enfocarlo con teclado); scroll-padding-bottom debe dejarlo libre.
      await loc.evaluate((el) => el.scrollIntoView({ block: 'end', behavior: 'instant' as ScrollBehavior }));
      await page.waitForTimeout(150);
      const b = (await loc.boundingBox())!;
      expect(hit(b), 'no intersecta con el FAB').toBe(false);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(600);
    const bottom = await page.evaluate(() => {
      const sel = 'footer a, footer button, footer input';
      const els = [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
      return els.map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height }));
    });
    const lastCtl = bottom.sort((a, b) => b.y + b.height - (a.y + a.height))[0];
    expect(hit(lastCtl), 'último control del pie no tapado por el FAB').toBe(false);
  });

  test('cantidad: − deshabilitado en 1, + deshabilitado al llegar al stock, aria-live y aria-label', async ({ page }) => {
    await mockApi(page);
    await settle(page, '/tienda');
    const pura = card(page, 0); // formato por defecto 200g, stock 2
    const minus = pura.getByRole('button', { name: /Quitar una unidad de .*Pura.* 200g/ });
    const plus = pura.getByRole('button', { name: /Añadir una unidad de .*Pura.* 200g/ });
    const val = pura.locator('.prod-card__qty-val');
    await expect(val).toHaveAttribute('aria-live', 'polite');
    await expect(val).toContainText('1');
    await expect(minus).toBeDisabled();
    await expect(plus).toBeEnabled();
    await plus.click();
    await expect(val).toContainText('2');
    await expect(plus).toBeDisabled();
    await expect(minus).toBeEnabled();
    await minus.click();
    await expect(val).toContainText('1');
  });

  test('«Añadir al carrito» envía variante y cantidad, abre el mini-carrito, sigue en /tienda y la cantidad vuelve a 1', async ({ page }) => {
    const api = await mockApi(page);
    await settle(page, '/tienda');
    const pura = card(page, 0);
    await pura.getByRole('button', { name: /Añadir una unidad/ }).click();
    await expect(pura.locator('.prod-card__qty-val')).toContainText('2');
    const post = page.waitForRequest((r) => r.url().endsWith('/cart/items') && r.method() === 'POST');
    await pura.getByRole('button', { name: 'Añadir al carrito' }).click();
    const body = (await post).postDataJSON();
    expect(body).toEqual({ product_variant_id: 2, quantity: 2 });
    expect(api.addRequests).toEqual([{ product_variant_id: 2, quantity: 2 }]);
    await expect(page.locator('.mini-cart.is-open')).toBeVisible();
    await expect(page).toHaveURL(/\/tienda$/);
    await expect(pura.locator('.prod-card__qty-val')).toContainText('1');
  });

  test('cambiar de formato y añadir usa la variante elegida', async ({ page }) => {
    const api = await mockApi(page);
    await settle(page, '/tienda');
    const pura = card(page, 0);
    await pura.getByRole('button', { name: '100g' }).click();
    await pura.getByRole('button', { name: 'Añadir al carrito' }).click();
    await expect(page.locator('.mini-cart.is-open')).toBeVisible();
    expect(api.addRequests).toEqual([{ product_variant_id: 1, quantity: 1 }]);
  });

  test('variante agotada: botón «Agotado» deshabilitado', async ({ page }) => {
    await mockApi(page);
    await settle(page, '/tienda');
    const crunchy = card(page, 1); // 200g agotada es la variante por defecto
    await expect(crunchy.locator('.prod-card__btn')).toBeDisabled();
    await expect(crunchy.locator('.prod-card__btn')).toContainText('Agotado');
  });

  test('error del API 400: p.prod-card__error[role=alert] con el mensaje', async ({ page }, info) => {
    const api = await mockApi(page);
    await settle(page, '/tienda');
    api.failNextAdd = 'Stock insuficiente para esta variante';
    const pura = card(page, 0);
    await pura.getByRole('button', { name: 'Añadir al carrito' }).click();
    const err = pura.locator('p.prod-card__error[role="alert"]');
    await expect(err).toHaveText('Stock insuficiente para esta variante');
    await expect(page.locator('.mini-cart.is-open')).toHaveCount(0);
    await pura.screenshot({ path: `${ART}/tienda-error-${info.project.name}.png` });
  });
});

// ---------------------------------------------------------------- 6. Autenticación
test.describe('6. login y registro', () => {
  for (const route of ['/auth/login', '/auth/register']) {
    test(`${route}: divisor «.auth-divider» con dos líneas y texto centrado, sin barra amarilla`, async ({ page }, info) => {
      await mockApi(page);
      await settle(page, route);
      const div = page.locator('.auth-divider');
      test.skip((await div.count()) === 0, 'El divisor solo se renderiza si environment.googleClientId está definido');
      await div.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await expect(div.locator('.auth-divider__line')).toHaveCount(2);
      await expect(div.locator('.auth-divider__text')).toHaveCount(1);
      const [l1, t, l2] = await Promise.all([
        div.locator('.auth-divider__line').nth(0).boundingBox(),
        div.locator('.auth-divider__text').boundingBox(),
        div.locator('.auth-divider__line').nth(1).boundingBox(),
      ]);
      expect(l1!.width, 'línea izquierda visible').toBeGreaterThan(8);
      expect(l2!.width, 'línea derecha visible').toBeGreaterThan(8);
      const gapL = t!.x - (l1!.x + l1!.width), gapR = l2!.x - (t!.x + t!.width);
      expect(Math.abs(gapL - gapR), 'texto centrado entre las líneas').toBeLessThanOrEqual(2);
      const yellow = await div.evaluate((el) => {
        const out: string[] = [];
        for (const e of [el, ...Array.from(el.querySelectorAll('*'))]) {
          for (const p of ['::before', '::after']) {
            const cs = getComputedStyle(e, p);
            if (cs.content !== 'none' && cs.content !== 'normal' && cs.backgroundColor === 'rgb(230, 193, 90)') out.push(`${e.className}${p}`);
          }
          if (getComputedStyle(e).backgroundColor === 'rgb(230, 193, 90)') out.push(String(e.className));
        }
        return out;
      });
      expect(yellow, 'ningún elemento del divisor usa el amarillo de marca como barra').toEqual([]);
      const dir = route === '/auth/login' ? SHOTS : ART;
      await page.screenshot({ path: `${dir}/divisor${route.replace(/\//g, '-')}-${info.project.name}.png` });
    });
  }

  for (const [name, route] of [['login', '/auth/login'], ['reset-password', '/auth/reset-password?token=token-de-prueba']] as const) {
    test(`${name}: .toggle-password alterna aria-label y aria-pressed`, async ({ page }) => {
      await mockApi(page);
      await settle(page, route);
      const t = page.locator('.toggle-password').first();
      await expect(t).toHaveAttribute('aria-label', 'Mostrar contraseña');
      await expect(t).toHaveAttribute('aria-pressed', 'false');
      await t.click();
      await expect(t).toHaveAttribute('aria-label', 'Ocultar contraseña');
      await expect(t).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('input#password')).toHaveAttribute('type', 'text');
      await t.click();
      await expect(t).toHaveAttribute('aria-label', 'Mostrar contraseña');
      await expect(t).toHaveAttribute('aria-pressed', 'false');
    });
  }

  test('register: ?email= precarga el correo y sin parámetro queda vacío', async ({ page }) => {
    await mockApi(page);
    await settle(page, '/auth/register?email=ana@example.com');
    await expect(page.locator('input[type="email"]')).toHaveValue('ana@example.com');
    await settle(page, '/auth/register');
    await expect(page.locator('input[type="email"]')).toHaveValue('');
  });
});

// ---------------------------------------------------------------- 7. Nuestro método
test.describe('7. /nuestro-metodo', () => {
  test('una sola línea de timeline, crece con el scroll y sin errores de consola', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await mockApi(page);
    await settle(page, '/nuestro-metodo');
    await expect(page.locator('.timeline-progress')).toHaveCount(0);
    await expect(page.locator('.timeline__line')).toHaveCount(1);
    const h = () => page.locator('.timeline__line').evaluate((e) => e.getBoundingClientRect().height);
    const h0 = await h();
    const scrollTo = (y: number) => page.evaluate((v) => window.scrollTo(0, v), y);
    await scrollTo(1000);
    await expect.poll(h, { message: 'la línea crece al hacer scroll' }).toBeGreaterThan(h0);
    const h1 = await h();
    await scrollTo(2200);
    await expect.poll(h, { message: 'la línea sigue creciendo' }).toBeGreaterThan(h1);
    await shot(page, info, 'metodo-timeline');
    expect(errors, `Errores de consola:\n${errors.join('\n')}`).toEqual([]);
  });
});
