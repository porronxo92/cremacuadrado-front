#!/usr/bin/env node
// Generates routes.txt, read by angular.json's prerender.routesFile.
//
// Angular 18 doesn't have getPrerenderParams (that's 19+), so parameterized
// routes (/tienda/:slug) have to be listed explicitly here instead of
// derived declaratively. Tries the live API for the current product catalog;
// falls back to the known slugs if the API is unreachable at build time, so
// `ng build` never fails because of this and a product is never silently
// dropped from prerendering.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_URL = process.env.PRERENDER_API_URL ?? process.env.SEO_TEST_API_URL ?? 'http://localhost:8000/api/v1';

// Known today from header.component.ts routerLinks (:36, :45). Used whenever
// the API can't be reached at build time.
const FALLBACK_PRODUCT_SLUGS = ['crema-pistacho-pura', 'crema-pistacho-crunchy'];

// Content that's stable enough to prerender (Fase 4 de la auditoría SSR):
// precio y stock cambian cada semanas/meses, según confirmó el equipo.
// /el-archivo, /el-archivo/:slug y /puntos-de-venta quedan FUERA a propósito
// — esas se sirven por SSR en cada petición (server.ts), no prerenderizadas,
// porque crecen con cada post/tienda nueva sin pasar por un rebuild.
const STATIC_ROUTES = [
  '/',
  '/nuestro-metodo',
  '/tienda',
  '/para-tiendas',
  '/contacto',
  '/privacidad',
  '/aviso-legal',
  '/cookies',
  '/devoluciones',
  '/condiciones-venta',
  '/desistimiento',
];

async function resolveProductSlugs() {
  try {
    const res = await fetch(`${API_URL}/products?page_size=100`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const slugs = data?.items?.map((p) => p.slug).filter(Boolean);
    if (!slugs || slugs.length === 0) throw new Error('respuesta sin productos');
    return slugs;
  } catch (err) {
    console.warn(
      `[generate-prerender-routes] no se pudo leer el catálogo de ${API_URL} (${err.message}); usando el fallback estático: ${FALLBACK_PRODUCT_SLUGS.join(', ')}`
    );
    return FALLBACK_PRODUCT_SLUGS;
  }
}

const productSlugs = await resolveProductSlugs();
const routes = [...STATIC_ROUTES, ...productSlugs.map((slug) => `/tienda/${slug}`)];

const outPath = join(__dirname, '..', 'routes.txt');
writeFileSync(outPath, routes.join('\n') + '\n', 'utf8');
console.log(`[generate-prerender-routes] ${routes.length} rutas escritas en routes.txt:`);
routes.forEach((r) => console.log(`  ${r}`));
