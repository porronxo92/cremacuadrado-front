#!/usr/bin/env node
// Comprobación posterior al prerender (se ejecuta tras `ng build`).
//
// Por qué existe: el prerender de /tienda/:slug (y de /el-archivo/:slug si
// algún día entra en routes.txt) pide los datos al API durante el build. Si el
// API no responde (caído, TLS interceptado, URL mal configurada), el
// componente pinta «Producto no encontrado», el prerender lo guarda como HTML
// estático y `ng build` termina con éxito: se publicaría una ficha vacía con
// 200 que Google indexa. Este script hace fallar el build en ese caso.
//
// Qué mira, ruta a ruta de routes.txt, en dist/cremacuadrado/browser/<ruta>/index.html:
//   - todas: que el fichero exista y que <app-root> no esté vacío;
//   - producto y post: que no haya contenido de «no encontrado» y que haya
//     exactamente un <h1> con texto (en producto, el h1.pd__title de la ficha).
//
// Uso: node scripts/check-prerender.mjs [distBrowserDir]
// Código de salida: 0 si todo está bien, 1 si alguna ruta falla.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserDir = resolve(process.argv[2] ?? join(root, 'dist', 'cremacuadrado', 'browser'));
const routesFile = join(root, 'routes.txt');

const NOT_FOUND_MARKERS = [
  /Producto no encontrado/i,
  /Artículo no encontrado/i,
  /class="[^"]*\bpd__not-found\b/,
  /class="[^"]*\bnot-found\b/,
];

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function check(route) {
  const file = route === '/' ? join(browserDir, 'index.html') : join(browserDir, ...route.split('/').filter(Boolean), 'index.html');
  if (!existsSync(file)) return [`no existe ${file}`];
  const html = readFileSync(file, 'utf8');
  const problems = [];

  const open = html.match(/<app-root\b[^>]*>/i);
  const end = html.lastIndexOf('</app-root>');
  const inner = open && end > open.index ? html.slice(open.index + open[0].length, end) : '';
  if (inner.replace(/<!--[\s\S]*?-->/g, '').trim() === '') problems.push('<app-root> vacío');

  const isProduct = route.startsWith('/tienda/');
  const isPost = route.startsWith('/el-archivo/');
  if (isProduct || isPost) {
    for (const re of NOT_FOUND_MARKERS) if (re.test(html)) problems.push(`contenido de «no encontrado» (${re})`);
    const h1s = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
    const texts = h1s.map((m) => stripTags(m[2])).filter(Boolean);
    if (texts.length !== 1) problems.push(`se esperaba 1 <h1> con texto y hay ${texts.length}`);
    if (isProduct && !h1s.some((m) => /\bpd__title\b/.test(m[1]) && stripTags(m[2]))) {
      problems.push('falta el <h1 class="pd__title"> de la ficha de producto');
    }
  }
  return problems;
}

if (!existsSync(routesFile)) {
  console.error(`[check-prerender] no existe ${routesFile}`);
  process.exit(1);
}
const routes = readFileSync(routesFile, 'utf8').split(/\r?\n/).map((r) => r.trim()).filter(Boolean);

let failures = 0;
for (const route of routes) {
  const problems = check(route);
  if (problems.length) {
    failures++;
    console.error(`[check-prerender] FALLA ${route}: ${problems.join('; ')}`);
  }
}

if (failures) {
  console.error(
    `[check-prerender] ${failures} de ${routes.length} rutas prerenderizadas no son válidas. ` +
      '¿Respondía el API durante el build? (en redes con inspección TLS: NODE_USE_SYSTEM_CA=1)'
  );
  process.exit(1);
}
console.log(`[check-prerender] ${routes.length} rutas prerenderizadas OK`);
