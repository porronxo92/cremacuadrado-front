import { test, expect, settle } from './fixtures';
import type { Page } from '@playwright/test';

// «¿Por qué sabe así CremaCuadrado?» (home): ciclo automático de 3 pasos de 5 s, sin botón de pausa.
// Pensada para los proyectos `desktop` (1440×900) y `mobile-390`.

const SECTION = 'section.trilogia';
const STEPS = ['Tostado ligero', 'Repelado', 'Molino de piedra'];

async function openSection(page: Page) {
  await settle(page, '/');
  const section = page.locator(SECTION);
  await section.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);
  await mouseAway(page);
  return section;
}

/** Saca el puntero de la ventana para que el hover no pause el ciclo */
const mouseAway = (page: Page) => page.mouse.move(-5, -5);

const activeStep = (page: Page) =>
  page.locator(`${SECTION} .trilogia__step-btn[aria-current="step"]`).innerText().then((t) => t.trim());

async function waitForStepChange(page: Page, from: string, timeout = 8000) {
  await page.waitForFunction(
    ([sel, prev]) => document.querySelector(sel)?.textContent?.trim() !== prev,
    [`${SECTION} .trilogia__step-btn[aria-current="step"]`, from] as const,
    { timeout },
  );
  return activeStep(page);
}

/** Toca el segmento de progreso (móvil) o la fila (escritorio) del paso i */
const tapStep = (page: Page, i: number) =>
  page.locator(`${SECTION} .trilogia__step`).nth(i).locator('.trilogia__bar').click({ force: true });

test('avanza Tostado ligero → Repelado → Molino de piedra → Tostado ligero cada 5 s', async ({ page }) => {
  test.setTimeout(60_000);
  await openSection(page);
  await expect(page.locator(SECTION)).not.toHaveClass(/is-paused/);

  // Esperamos al primer cambio para medir intervalos completos
  let current = await waitForStepChange(page, await activeStep(page));
  const seen = [current];
  const times: number[] = [Date.now()];
  for (let i = 0; i < 3; i++) {
    current = await waitForStepChange(page, current);
    seen.push(current);
    times.push(Date.now());
  }

  const start = STEPS.indexOf(seen[0]);
  expect(seen).toEqual([0, 1, 2, 3].map((k) => STEPS[(start + k) % 3]));
  for (let i = 1; i < times.length; i++) {
    const dt = times[i] - times[i - 1];
    expect(dt, `intervalo ${i}: ${dt} ms`).toBeGreaterThan(4300);
    expect(dt, `intervalo ${i}: ${dt} ms`).toBeLessThan(5900);
  }
});

test('no hay botón de pausa ni enlace al método', async ({ page }) => {
  const section = await openSection(page);
  await expect(section.getByRole('button', { name: /Pausar|Reproducir/ })).toHaveCount(0);
  await expect(section.getByRole('link')).toHaveCount(0);
});

test('con el ratón encima no avanza', async ({ page }) => {
  test.setTimeout(30_000);
  const section = await openSection(page);
  await section.locator('.trilogia__title').hover();
  await expect(section).toHaveClass(/is-paused/);
  const before = await activeStep(page);
  await page.waitForTimeout(6500);
  expect(await activeStep(page)).toBe(before);

  await mouseAway(page);
  await expect(section).not.toHaveClass(/is-paused/);
});

test('tocar un paso salta a él', async ({ page }) => {
  const section = await openSection(page);
  await tapStep(page, 2);
  expect(await activeStep(page)).toBe('Molino de piedra');
  await expect(section.locator('.trilogia__now-name')).toHaveText('Molino de piedra');
  await expect(section.locator('.trilogia__now-step')).toHaveText('Paso 3 de 3');
});

test('título en dos líneas y, en móvil, solo el paso activo visible junto a la foto', async ({ page }, info) => {
  const section = await openSection(page);
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('¿Por qué sabe así CremaCuadrado?');
  const lines = await section.locator('.trilogia__title').evaluate((el) => {
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    return Math.round(el.getBoundingClientRect().height / lh);
  });
  expect(lines).toBe(2);   // «¿Por qué sabe así» / «CremaCuadrado?», sin partir ninguna
  if (info.project.name.startsWith('mobile')) {

    const opacities = await section.locator('.trilogia__step-text').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).opacity),
    );
    expect(opacities.filter((o) => o === '1')).toHaveLength(1);

    const stage = await section.locator('.trilogia__stage').boundingBox();
    const list = await section.locator('.trilogia__grid').boundingBox();
    expect(stage!.x + stage!.width).toBeLessThanOrEqual(list!.x);   // foto a la izquierda
    expect(Math.abs(stage!.y - list!.y)).toBeLessThan(2);           // en la misma fila
  }
});

test('swipe horizontal cambia de paso', async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, 'solo en proyectos táctiles');
  const section = await openSection(page);
  await section.locator('.trilogia__title').hover(); // pausa para que el ciclo no interfiera
  const before = await activeStep(page);

  const swipe = (dx: number) =>
    section.locator('.trilogia__stage').evaluate((el, d) => {
      const r = el.getBoundingClientRect();
      const y = r.top + r.height / 2;
      const x0 = r.left + r.width / 2;
      const t = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [t(x0)], changedTouches: [t(x0)], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(x0 + d)], bubbles: true }));
    }, dx);

  await swipe(-80);
  expect(await activeStep(page)).toBe(STEPS[(STEPS.indexOf(before) + 1) % 3]);
  await swipe(80);
  expect(await activeStep(page)).toBe(before);
  await swipe(-20); // por debajo del umbral de 40 px
  expect(await activeStep(page)).toBe(before);
});

test('sin scroll horizontal y capturas', async ({ page }, info) => {
  const section = await openSection(page);
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBe(innerWidth);

  // Paso 1 y ratón sobre el título (pausa) para una captura estable
  await tapStep(page, 0);
  await section.locator('.trilogia__title').hover();
  await page.waitForTimeout(1200);
  await section.screenshot({ path: `e2e/screenshots/trilogia-${info.project.name}.png` });
});

test.describe('con reducir movimiento', () => {
  test.use({ reducedMotion: 'reduce' });

  test('el ciclo sigue a ritmo normal', async ({ page }) => {
    test.setTimeout(30_000);
    const section = await openSection(page);
    await expect(section).not.toHaveClass(/is-paused/);
    // Sin el arreglo, el 0,01 ms global haría saltar los pasos de golpe
    await page.waitForTimeout(2000);
    expect(await activeStep(page)).toBe('Tostado ligero');
    expect(await waitForStepChange(page, 'Tostado ligero')).toBe('Repelado');
  });
});
