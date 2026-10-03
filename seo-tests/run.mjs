#!/usr/bin/env node
// SEO test harness — Fase A de la migración SSR.
//
// Qué mide: exactamente lo que un crawler que NO ejecuta JavaScript vería.
// Nunca ejecuta la SPA en un navegador: hace fetch() crudo y parsea el HTML
// de la respuesta con cheerio. Si una comprobación pasa aquí, pasa para
// Google, GPTBot, ClaudeBot, etc. Si falla, es exactamente lo que ellos ven.
//
// Uso:
//   node seo-tests/run.mjs                        # contra dist/ local (baseline pre-SSR)
//   node seo-tests/run.mjs --build                 # fuerza `ng build` antes de medir
//   node seo-tests/run.mjs --base-url=https://cremacuadrado-front.vercel.app
//   node seo-tests/run.mjs --base-url=https://cremacuadrado.com --production
//
// Salida: tabla por ruta y fase, resumen por fase (Fase C/D del plan de
// migración), código de salida = nº de FAIL (0 si todo verde).
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { startStaticServer } from './static-server.mjs';
import {
  CONTENT_ROUTES,
  CLIENT_ONLY_ROUTES,
  NOT_FOUND_ROUTES,
  REDIRECTS,
  PRODUCTION_ORIGIN,
} from './config.mjs';
import {
  checkContentRoute,
  checkClientOnlyRoute,
  checkNotFoundRoute,
  checkRedirect,
  checkRobotsTxt,
  checkSitemapXml,
  checkGlobalUniqueness,
  PASS,
  FAIL,
  SKIP,
} from './checks.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, '..');
const DIST_DIR = join(FRONTEND_ROOT, 'dist', 'cremacuadrado', 'browser');

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const hasFlag = (name) => args.includes(`--${name}`);

const explicitBaseUrl = flag('base-url');
const apiUrl = flag('api-url') ?? process.env.SEO_TEST_API_URL ?? 'http://localhost:8000/api/v1';
const isProductionRun = hasFlag('production');
const shouldBuild = hasFlag('build');

async function resolveBlogSlug() {
  try {
    const res = await fetch(`${apiUrl}/blog/posts?page_size=1`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.items?.[0]?.slug ?? null;
  } catch {
    return null;
  }
}

function fillDynamic(path, slugMap) {
  return path.replace(/\{(\w+)\}/g, (_, key) => slugMap[key] ?? '__unresolved__');
}

async function fetchRoute(baseUrl, path) {
  const res = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'CremaCuadradoSeoHarness/1.0 (+Googlebot-style check)' },
  });
  const body = await res.text().catch(() => '');
  return { status: res.status, headers: res.headers, body };
}

function printSection(title) {
  console.log(`\n${'─'.repeat(70)}\n${title}\n${'─'.repeat(70)}`);
}

function icon(status) {
  if (status === PASS) return '✅';
  if (status === FAIL) return '❌';
  return '⏭️ ';
}

async function main() {
  let baseUrl = explicitBaseUrl;
  let closeServer = null;

  if (!baseUrl) {
    if (shouldBuild) {
      console.log('Ejecutando `npm run build:prod`…');
      const build = spawnSync('npm', ['run', 'build:prod'], { cwd: FRONTEND_ROOT, stdio: 'inherit', shell: true });
      if (build.status !== 0) {
        console.error('\nEl build falló. Abortando.');
        process.exit(1);
      }
    }
    if (!existsSync(DIST_DIR)) {
      console.error(
        `\nNo existe ${DIST_DIR}.\nEjecuta "npm run build:prod" primero, o vuelve a lanzar con --build.\n`
      );
      process.exit(1);
    }
    const { server, baseUrl: localUrl } = await startStaticServer(DIST_DIR);
    baseUrl = localUrl;
    closeServer = () => server.close();
    console.log(`Midiendo HTML servido localmente en ${baseUrl} (sirviendo ${DIST_DIR}, fallback SPA tipo vercel.json).`);
    console.log('Nota: si @angular/ssr aún no está activado (Fase C), esperamos que casi todo falle — ese es el baseline.');
  } else {
    console.log(`Midiendo HTML servido en ${baseUrl}`);
  }

  // SeoService always emits the production origin as canonical, regardless
  // of which host actually served the request (deliberate — see SeoService
  // and the Fase 7 decision to never canonicalize onto a preview/local URL).
  const canonicalOrigin = PRODUCTION_ORIGIN;

  const blogSlug = await resolveBlogSlug();
  if (!blogSlug) {
    console.log(`(Aviso: no se pudo resolver un slug real de blog desde ${apiUrl} — se omiten las comprobaciones de /el-archivo/:slug)`);
  }
  const slugMap = { blogSlug: blogSlug ?? null };

  const allResults = []; // { routeId, path, results: [] }
  const pageDataForGlobalChecks = [];

  // --- Rutas de contenido público ---
  printSection('Rutas de contenido (deben entregar HTML completo sin JS)');
  for (const route of CONTENT_ROUTES) {
    if (route.dynamic && !slugMap[route.dynamic]) {
      allResults.push({ routeId: route.id, path: route.path, results: [check_skip(route.dynamic)] });
      continue;
    }
    const path = fillDynamic(route.path, slugMap);
    const { status, body } = await fetchRoute(baseUrl, path);
    const canonicalUrl = `${canonicalOrigin}${path}`;
    const results = checkContentRoute({
      routeId: route.id,
      path,
      canonicalUrl,
      html: body,
      status,
      jsonldTypes: route.jsonld,
      requiresTextList: route.requiresTextList,
    });
    allResults.push({ routeId: route.id, path, results });

    if (status === 200) {
      const cheerioData = extractForGlobalCheck(body);
      pageDataForGlobalChecks.push({ path, ...cheerioData });
    }
  }

  const globalResults = checkGlobalUniqueness(pageDataForGlobalChecks);
  allResults.push({ routeId: 'global', path: '(todas las rutas de contenido)', results: globalResults });

  // --- Rutas solo-cliente (sin requisitos de contenido) ---
  printSection('Rutas CSR (carrito/checkout/auth/account/admin — sin requisitos de contenido aún)');
  for (const path of CLIENT_ONLY_ROUTES) {
    const { status } = await fetchRoute(baseUrl, path);
    allResults.push({ routeId: `client-only:${path}`, path, results: checkClientOnlyRoute({ path, status }) });
  }

  // --- 404 reales ---
  printSection('Códigos de estado · 404 (nunca "soft 404")');
  for (const path of NOT_FOUND_ROUTES) {
    const { status } = await fetchRoute(baseUrl, path);
    allResults.push({ routeId: `404:${path}`, path, results: checkNotFoundRoute({ path, status }) });
  }

  // --- 301 en rutas legacy ---
  printSection('Códigos de estado · 301 (redirecciones legacy en inglés)');
  for (const redirect of REDIRECTS) {
    if (redirect.dynamic && !slugMap[redirect.dynamic]) continue;
    const from = fillDynamic(redirect.from, slugMap);
    const to = fillDynamic(redirect.to, slugMap);
    const { status, headers } = await fetchRoute(baseUrl, from);
    const location = headers.get('location');
    allResults.push({ routeId: `redirect:${from}`, path: `${from} → ${to}`, results: checkRedirect({ from, to, status, location }) });
  }

  // --- robots.txt / sitemap.xml ---
  printSection('Infraestructura SEO');
  {
    const { status, body } = await fetchRoute(baseUrl, '/robots.txt');
    allResults.push({ routeId: 'robots.txt', path: '/robots.txt', results: checkRobotsTxt({ status, body }) });
  }
  {
    const { status, body } = await fetchRoute(baseUrl, '/sitemap.xml');
    allResults.push({ routeId: 'sitemap.xml', path: '/sitemap.xml', results: checkSitemapXml({ status, body }) });
  }

  if (closeServer) closeServer();

  printReport(allResults);
}

function check_skip(dynamicKey) {
  return { id: 'dynamic-unresolved', phase: 'ssr', status: SKIP, message: `no se pudo resolver "${dynamicKey}" — ¿está la API en marcha? (${apiUrl})` };
}

function extractForGlobalCheck(html) {
  // Lightweight re-parse just for title/canonical, kept separate from
  // checks.mjs so run.mjs doesn't need to know about cheerio directly.
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
  return { title: titleMatch?.[1]?.trim(), canonical: canonicalMatch?.[1] };
}

function printReport(allResults) {
  printSection('Detalle por ruta');
  for (const { routeId, path, results } of allResults) {
    const hasFail = results.some((r) => r.status === FAIL);
    console.log(`\n${hasFail ? '❌' : '✅'} ${routeId}  (${path})`);
    for (const r of results) {
      console.log(`   ${icon(r.status)} [${r.phase}] ${r.id} — ${r.message}`);
    }
  }

  const flat = allResults.flatMap((r) => r.results);
  const phases = [...new Set(flat.map((r) => r.phase))];

  printSection('Resumen por fase del plan de migración');
  let totalFail = 0;
  for (const phase of phases) {
    const inPhase = flat.filter((r) => r.phase === phase);
    const pass = inPhase.filter((r) => r.status === PASS).length;
    const fail = inPhase.filter((r) => r.status === FAIL).length;
    const skip = inPhase.filter((r) => r.status === SKIP).length;
    totalFail += fail;
    const bar = fail === 0 && pass > 0 ? '✅' : fail > 0 ? '❌' : '⏭️ ';
    console.log(`${bar} ${phase.padEnd(12)} ${pass} pass · ${fail} fail · ${skip} skip   (${pass}/${pass + fail} sin contar skips)`);
  }

  console.log(`\nTotal: ${flat.filter((r) => r.status === PASS).length} pass · ${totalFail} fail · ${flat.filter((r) => r.status === SKIP).length} skip\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\nEl harness falló con un error inesperado:', err);
  process.exit(2);
});
