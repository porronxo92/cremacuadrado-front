#!/usr/bin/env node
// Prueba de humo del SSR (migración Angular 18 → 22, Fase 0.4).
//
// Por qué existe: si a CommonEngine le falta `allowedHosts` (19.2.21+,
// 20.3.17+, 21.1.5+), Angular deja de renderizar en el servidor, responde 200
// con `<app-root></app-root>` vacío y solo deja un console.error
// (angular/angular#68391). Los e2e no lo ven porque el navegador pinta la
// página igual; Google indexaría páginas vacías. Este script mira el HTML
// CRUDO que devuelve el servidor, sin ejecutar JS, que es lo que ve un crawler.
//
// Uso:
//   node scripts/ssr-smoke.mjs [baseUrl] [--out <dir>] [--compare <dir>] [--strict-host]
//
//   baseUrl        Por defecto $SSR_BASE_URL o http://localhost:4000.
//   --out <dir>    Guarda el HTML de cada ruta y un summary.json.
//   --compare <dir> Compara con el summary.json de una ejecución anterior y
//                  muestra solo las diferencias (informativas: no cambian el
//                  código de salida).
//   --strict-host  Un host falso reflejado en la respuesta (o una petición
//                  SSRF observada) pasa a ser un fallo. Sin la opción se anota
//                  como «VULNERABLE (esperado en línea base)».
//
// Contra un build local:
//   npm run build:prod
//   node dist/cremacuadrado/server/server.mjs      (puerto 4000)
//   node scripts/ssr-smoke.mjs --out migration-baseline/ssr
//
// Nota para redes con inspección TLS (proxy corporativo): el servidor SSR
// necesita llegar al API de verdad para pintar productos, posts y los 404 de
// slugs inexistentes. Si Node rechaza el certificado (SELF_SIGNED_CERT_IN_CHAIN),
// arrancar el servidor con NODE_USE_SYSTEM_CA=1.
//
// Código de salida: 0 si todo pasa, 1 si falla alguna comprobación, 2 si no se
// puede contactar con el servidor o los argumentos son incorrectos.
//
// Node puro (fetch nativo, node:http para las pruebas de cabecera Host): sin
// dependencias, para que funcione igual en todas las fases de la migración.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import http from 'node:http';
import https from 'node:https';

// ── Argumentos ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { baseUrl: null, out: null, compare: null, strictHost: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = argv[++i];
    else if (a === '--compare') opts.compare = argv[++i];
    else if (a === '--strict-host') opts.strictHost = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a.startsWith('--')) throw new Error(`opción desconocida: ${a}`);
    else opts.baseUrl = a;
  }
  if ((argv.includes('--out') && !opts.out) || (argv.includes('--compare') && !opts.compare)) {
    throw new Error('--out y --compare necesitan un directorio');
  }
  return opts;
}

let opts;
try {
  opts = parseArgs(process.argv.slice(2));
} catch (err) {
  console.error(`ssr-smoke: ${err.message}`);
  process.exit(2);
}
if (opts.help) {
  console.log('node scripts/ssr-smoke.mjs [baseUrl] [--out <dir>] [--compare <dir>] [--strict-host]');
  process.exit(0);
}

const BASE_URL = (opts.baseUrl ?? process.env.SSR_BASE_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 30_000;
// Host que nunca debe acabar en el HTML ni en una petición saliente del SSR.
const EVIL_HOST = 'evil.example';

// ── Rutas y expectativas ────────────────────────────────────────────────────

// Páginas que tienen que llegar renderizadas (SSR por petición o
// prerenderizadas en el build: las dos valen para un crawler).
const SSR_PAGES = [
  '/', '/tienda', '/el-archivo', '/nuestro-metodo', '/para-tiendas', '/puntos-de-venta',
  '/contacto', '/privacidad', '/aviso-legal', '/condiciones-venta', '/cookies', '/devoluciones',
];
const NOT_FOUND = ['/tienda/no-existe-xyz', '/ruta-inventada-xyz'];
const REDIRECTS = [
  { path: '/catalog', to: '/tienda' },
  { path: '/blog/x', to: '/el-archivo/x' },
  { path: '/nosotros', to: '/nuestro-metodo' },
];
// Rutas solo cliente (server.ts → CLIENT_ONLY_PREFIXES): aquí lo correcto ES
// la shell vacía.
const SHELL = ['/carrito', '/checkout'];
const ARTICLE_TYPES = ['Article', 'BlogPosting', 'NewsArticle'];

// ── HTTP ────────────────────────────────────────────────────────────────────

// fetch con redirect manual: queremos ver el 301 y su Location, no seguirlo.
async function get(path) {
  const res = await fetch(BASE_URL + path, {
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'user-agent': 'cc-ssr-smoke/1.0', accept: 'text/html,application/xhtml+xml,*/*' },
  });
  return { status: res.status, headers: res.headers, body: await res.text() };
}

// Petición con node:http(s) para poder fijar la cabecera Host a mano (fetch no
// garantiza respetarla). Se conecta a BASE_URL, pero anuncia otro host.
function rawGet(path, headers) {
  const base = new URL(BASE_URL);
  const lib = base.protocol === 'https:' ? https : http;
  return new Promise((resolvePromise, reject) => {
    const req = lib.request(
      {
        protocol: base.protocol,
        hostname: base.hostname,
        port: base.port || undefined,
        path,
        method: 'GET',
        // SNI con el host real aunque la cabecera Host diga otra cosa.
        servername: base.hostname,
        headers: { 'user-agent': 'cc-ssr-smoke/1.0', accept: 'text/html', ...headers },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolvePromise({
            status: res.statusCode,
            location: res.headers.location ?? null,
            headersText: JSON.stringify(res.headers),
            body: Buffer.concat(chunks).toString('utf8'),
          })
        );
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

// ── Análisis del HTML (regex, sin parser: el HTML lo genera Angular y es
// regular; si algún día no basta, mejor cheerio desde seo-tests) ───────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? decode(m[2] ?? m[3]) : null;
}
function findTag(html, re, attrName) {
  for (const tag of html.match(re) ?? []) {
    const v = attr(tag, attrName);
    if (v !== null) return v;
  }
  return null;
}

function analyzeHtml(html) {
  // <app-root ...> ... </app-root>: lo que hay dentro es lo que ve el crawler.
  const open = html.match(/<app-root\b([^>]*)>/i);
  let appRoot = { present: false, empty: true, serverContext: null };
  if (open) {
    const start = open.index + open[0].length;
    const end = html.lastIndexOf('</app-root>');
    const inner = end > start ? html.slice(start, end) : '';
    appRoot = {
      present: true,
      empty: inner.replace(/<!--[\s\S]*?-->/g, '').trim() === '',
      // "ssr" = renderizada por petición, "ssg" = prerenderizada en el build.
      serverContext: attr(open[0], 'ng-server-context'),
    };
  }

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]));
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const jsonldTypes = [];
  const jsonldErrors = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      // Solo los tipos de primer nivel (y los de @graph): ListItem, Offer y
      // compañía son ruido para esta comprobación.
      const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
      for (const n of nodes) {
        const t = n?.['@type'];
        if (t) jsonldTypes.push(...(Array.isArray(t) ? t : [t]));
      }
    } catch (err) {
      jsonldErrors.push(err.message);
    }
  }

  const bodyText = stripTags(
    (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  );

  return {
    appRoot,
    h1: h1s[0] ?? null,
    h1Count: h1s.length,
    title: titleMatch ? stripTags(titleMatch[1]) : null,
    description: findTag(html, /<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/gi, 'content'),
    canonical: findTag(html, /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/gi, 'href'),
    ogUrl: findTag(html, /<meta\b[^>]*property\s*=\s*["']og:url["'][^>]*>/gi, 'content'),
    jsonldTypes: [...new Set(jsonldTypes)].sort(),
    jsonldErrors,
    textLength: bodyText.length,
  };
}

// ── Registro de resultados ──────────────────────────────────────────────────

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  strictHost: opts.strictHost,
  slugs: {},
  routes: {},
  hostProbes: {},
  warnings: [],
  failures: 0,
};
const htmlById = {};

const pad = (s, n) => (s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length));
function report(id, path, ok, detail, label) {
  const tag = label ?? (ok ? 'OK' : 'FALLA');
  if (!ok) summary.failures++;
  console.log(`${pad(tag, 6)}${pad(path, 34)}${detail}`);
}
function warn(msg) {
  summary.warnings.push(msg);
  console.log(`${pad('AVISO', 6)}${msg}`);
}
const idFor = (path) => (path === '/' ? 'home' : path.slice(1).replace(/[^a-z0-9]+/gi, '_'));
const short = (s, n = 60) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);

// ── Comprobaciones ──────────────────────────────────────────────────────────

async function checkSsrPage(id, path, { requireTypes } = {}) {
  const res = await get(path);
  const a = analyzeHtml(res.body);
  htmlById[id] = res.body;
  summary.routes[id] = {
    kind: 'ssr',
    path,
    status: res.status,
    appRootEmpty: a.appRoot.empty,
    serverContext: a.appRoot.serverContext,
    h1: a.h1,
    h1Count: a.h1Count,
    title: a.title,
    description: a.description,
    canonical: a.canonical,
    ogUrl: a.ogUrl,
    jsonldTypes: a.jsonldTypes,
    xRobotsTag: res.headers.get('x-robots-tag'),
    textLength: a.textLength,
  };

  const problems = [];
  if (res.status !== 200) problems.push(`estado ${res.status}, se esperaba 200`);
  // La comprobación clave: shell vacía con 200 = SSR caído en silencio.
  if (!a.appRoot.present) problems.push('no hay <app-root>');
  else if (a.appRoot.empty) problems.push('<app-root> VACÍO: el servidor no ha renderizado (¿allowedHosts?)');
  if (!a.h1) problems.push('sin <h1>');
  if (!a.title) problems.push('sin <title>');
  if (!a.description) problems.push('sin meta description');
  if (!a.canonical) problems.push('sin <link rel="canonical">');
  if (a.jsonldErrors.length) problems.push(`JSON-LD inválido (${a.jsonldErrors[0]})`);
  if (requireTypes && !requireTypes.some((t) => a.jsonldTypes.includes(t))) {
    problems.push(`falta JSON-LD ${requireTypes.join('/')} (hay: ${a.jsonldTypes.join(', ') || 'ninguno'})`);
  }

  const ctx = a.appRoot.serverContext ?? '-';
  report(
    id,
    path,
    problems.length === 0,
    problems.length ? problems.join('; ') : `${res.status} ${ctx}  h1 «${short(a.h1, 40)}»  ld: ${a.jsonldTypes.join(',') || '-'}`
  );
}

async function checkNotFound(path) {
  const id = idFor(path);
  const res = await get(path);
  const a = analyzeHtml(res.body);
  htmlById[id] = res.body;
  summary.routes[id] = {
    kind: '404',
    path,
    status: res.status,
    appRootEmpty: a.appRoot.empty,
    serverContext: a.appRoot.serverContext,
    h1: a.h1,
    title: a.title,
    xRobotsTag: res.headers.get('x-robots-tag'),
  };
  report(id, path, res.status === 404, res.status === 404 ? `404  ${a.h1 ? `h1 «${short(a.h1, 40)}»` : 'sin <h1>'}` : `estado ${res.status}, se esperaba 404 (soft 404)`);
}

async function checkRedirect({ path, to }) {
  const id = idFor(path);
  const res = await get(path);
  const location = res.headers.get('location');
  // Location puede ser relativa ("/tienda") o absoluta: se compara la ruta.
  const locPath = location ? new URL(location, BASE_URL + '/').pathname : null;
  summary.routes[id] = { kind: '301', path, status: res.status, location };
  const problems = [];
  if (res.status !== 301) problems.push(`estado ${res.status}, se esperaba 301`);
  if (locPath !== to) problems.push(`Location ${location ?? '(ausente)'}, se esperaba ${to}`);
  report(id, path, problems.length === 0, problems.length ? problems.join('; ') : `301 → ${location}`);
}

async function checkShell(path) {
  const id = idFor(path);
  const res = await get(path);
  const a = analyzeHtml(res.body);
  htmlById[id] = res.body;
  summary.routes[id] = {
    kind: 'shell',
    path,
    status: res.status,
    appRootEmpty: a.appRoot.empty,
    serverContext: a.appRoot.serverContext,
    h1: a.h1,
    title: a.title,
    canonical: a.canonical,
  };
  const problems = [];
  if (res.status !== 200) problems.push(`estado ${res.status}, se esperaba 200`);
  if (!a.appRoot.present) problems.push('no hay <app-root>');
  else if (!a.appRoot.empty) {
    problems.push(
      `se esperaba la shell vacía y llega HTML renderizado (ng-server-context=${a.appRoot.serverContext ?? '-'}, ` +
        `h1 «${short(a.h1, 30)}», canonical ${a.canonical ?? '-'})`
    );
  }
  report(id, path, problems.length === 0, problems.length ? problems.join('; ') : '200 shell vacía (solo cliente)');
}

async function checkText(path, kind, needle) {
  const id = idFor(path);
  const res = await get(path);
  htmlById[id] = res.body;
  summary.routes[id] = {
    kind,
    path,
    status: res.status,
    contentType: res.headers.get('content-type'),
    xRobotsTag: res.headers.get('x-robots-tag'),
    length: res.body.length,
  };
  const problems = [];
  if (res.status !== 200) problems.push(`estado ${res.status}, se esperaba 200`);
  if (!res.body.includes(needle)) problems.push(`no contiene «${needle}»`);
  report(id, path, problems.length === 0, problems.length ? problems.join('; ') : `200 ${res.headers.get('content-type') ?? ''}`);
  return res.body;
}

// Slugs reales: primero del sitemap; si no hay, del HTML del listado (y se
// avisa, porque un sitemap sin productos o posts es un problema de SEO).
async function resolveSlug(sitemapXml, prefix, listingPath) {
  const re = new RegExp(`<loc>[^<]*?${prefix}/([^<\\s/]+)</loc>`);
  const fromSitemap = sitemapXml?.match(re)?.[1];
  if (fromSitemap) return { slug: decodeURIComponent(fromSitemap), source: 'sitemap' };

  warn(`el sitemap no tiene ninguna URL ${prefix}/<slug>; se busca en ${listingPath}`);
  try {
    const res = await get(listingPath);
    const links = [...res.body.matchAll(new RegExp(`href="${prefix}/([^"/?#]+)"`, 'g'))]
      .map((m) => m[1])
      .filter((s) => s !== 'categoria');
    if (links.length) return { slug: decodeURIComponent(links[0]), source: listingPath };
  } catch {
    // se trata abajo como «sin slug»
  }
  return null;
}

// ── Seguridad: cabecera Host / X-Forwarded-Host (GHSA-x288-3778-4hhx) ───────

// Una respuesta es vulnerable si el host falso acaba en el HTML o en las
// cabeceras (canonical, og:url, Location…) o si el servidor SSR hace una
// petición saliente hacia él (SSRF). Aceptar el host sin reflejarlo no es un
// fallo por sí solo: tras la fase 1 el render usa el origen fijo del entorno y
// el host puede seguir dando 200; y Angular 19.2.21+ con allowedHosts
// devuelve la shell (200, app-root vacío) a los hosts no permitidos.
function classifyHost(res, needle, canaryHits) {
  const reflected = res.body.includes(needle) || res.headersText.includes(needle);
  const a = analyzeHtml(res.body);
  let verdict;
  if (reflected || canaryHits.length) verdict = 'VULNERABLE';
  else if (res.status >= 400 && res.status < 500) verdict = 'RECHAZADO';
  else if (res.status === 200 && a.appRoot.present && a.appRoot.empty) verdict = 'SHELL';
  else verdict = 'ACEPTADO';
  return {
    host: needle,
    status: res.status,
    location: res.location,
    reflected,
    ssrfRequests: canaryHits,
    serverContext: a.appRoot.serverContext,
    appRootEmpty: a.appRoot.empty,
    canonical: a.canonical,
    verdict,
  };
}

function reportHost(id, label, r) {
  summary.hostProbes[id] = r;
  const detail =
    `${r.status} ${r.serverContext ?? '-'}  ` +
    (r.reflected ? `«${r.host}» reflejado en la respuesta` : 'sin reflejo') +
    (r.ssrfRequests.length ? `; SSRF: ${r.ssrfRequests.join(', ')}` : '') +
    (r.verdict === 'ACEPTADO' ? '; host aceptado sin validar' : '');
  if (r.verdict === 'VULNERABLE') {
    if (opts.strictHost) report(id, label, false, `VULNERABLE: ${detail}`);
    else report(id, label, true, `VULNERABLE (esperado en línea base): ${detail}`, 'VULN');
  } else if (r.verdict === 'ACEPTADO') {
    report(id, label, true, detail, 'AVISO');
  } else {
    report(id, label, true, `${r.verdict}: ${detail}`);
  }
}

// Escucha local que hace de «evil host» alcanzable: si el SSR resuelve alguna
// petición relativa contra el Host recibido, llegará aquí. Solo tiene sentido
// cuando el servidor bajo prueba corre en esta máquina.
async function startCanary() {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(`${req.method} ${req.url}`);
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, hits, host: `127.0.0.1:${server.address().port}` };
}

async function hostProbes(ssrPaths) {
  const probePaths = ['/', ...ssrPaths, '/catalog'];
  for (const path of probePaths) {
    for (const [hdr, label] of [
      ['host', 'Host'],
      ['x-forwarded-host', 'X-Forwarded-Host'],
    ]) {
      const id = `evil-${hdr}_${idFor(path)}`;
      try {
        const res = await rawGet(path, { [hdr]: EVIL_HOST });
        htmlById[id] = res.body;
        reportHost(id, `${path} [${label}: ${EVIL_HOST}]`, classifyHost(res, EVIL_HOST, []));
      } catch (err) {
        report(id, `${path} [${label}]`, false, `error de red: ${err.message}`);
      }
    }
  }

  const base = new URL(BASE_URL);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) {
    warn('prueba SSRF con escucha local omitida: el servidor no corre en esta máquina');
    return;
  }
  const canary = await startCanary();
  try {
    for (const path of ssrPaths) {
      for (const [hdr, label] of [
        ['host', 'Host'],
        ['x-forwarded-host', 'X-Forwarded-Host'],
      ]) {
        const id = `ssrf-${hdr}_${idFor(path)}`;
        canary.hits.length = 0;
        try {
          const res = await rawGet(path, { [hdr]: canary.host });
          // Margen para peticiones que el render dispare y no espere.
          await new Promise((r) => setTimeout(r, 500));
          const r = classifyHost(res, canary.host, [...canary.hits]);
          reportHost(id, `${path} [${label}: escucha local]`, r);
        } catch (err) {
          report(id, `${path} [${label}]`, false, `error de red: ${err.message}`);
        }
      }
    }
  } finally {
    canary.server.close();
  }
}

// ── Comparación con una ejecución anterior ──────────────────────────────────

function compareWith(dir) {
  const file = join(resolve(dir), 'summary.json');
  if (!existsSync(file)) {
    console.log(`\nComparación: no existe ${file}`);
    return;
  }
  const old = JSON.parse(readFileSync(file, 'utf8'));
  const diffs = [];
  const fmt = (v) => (v === undefined ? '(ausente)' : JSON.stringify(v));
  const cmpGroup = (group, ignore = []) => {
    const ids = new Set([...Object.keys(old[group] ?? {}), ...Object.keys(summary[group] ?? {})]);
    for (const id of [...ids].sort()) {
      const a = old[group]?.[id];
      const b = summary[group]?.[id];
      if (!a) { diffs.push(`+ ${group}.${id}: nueva`); continue; }
      if (!b) { diffs.push(`- ${group}.${id}: ya no se comprueba`); continue; }
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (ignore.includes(k)) continue;
        if (k === 'textLength' || k === 'length') {
          // El texto varía un poco (precios, fechas): solo cambios > 20 %.
          const x = a[k] ?? 0;
          const y = b[k] ?? 0;
          if (Math.abs(x - y) > Math.max(x, y) * 0.2) diffs.push(`~ ${group}.${id}.${k}: ${x} → ${y}`);
          continue;
        }
        if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) diffs.push(`~ ${group}.${id}.${k}: ${fmt(a[k])} → ${fmt(b[k])}`);
      }
    }
  };
  cmpGroup('routes');
  // 'host' lleva el puerto aleatorio de la escucha local: cambia en cada ejecución.
  cmpGroup('hostProbes', ['host']);
  console.log(`\nComparación con ${old.generatedAt ?? '?'} (${file}):`);
  console.log(diffs.length ? diffs.map((d) => '  ' + d).join('\n') : '  sin diferencias');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`SSR smoke → ${BASE_URL}${opts.strictHost ? '  (--strict-host)' : ''}\n`);

  try {
    await get('/robots.txt');
  } catch (err) {
    console.error(`No se puede contactar con ${BASE_URL}: ${err.cause?.code ?? err.message}`);
    console.error('¿Está arrancado node dist/cremacuadrado/server/server.mjs?');
    process.exit(2);
  }

  await checkText('/robots.txt', 'robots', 'Sitemap:');
  const sitemap = await checkText('/sitemap.xml', 'sitemap', '<urlset');

  for (const path of SSR_PAGES) await checkSsrPage(idFor(path), path);

  const product = await resolveSlug(sitemap, '/tienda', '/tienda');
  const post = await resolveSlug(sitemap, '/el-archivo', '/el-archivo');
  summary.slugs = { product, post };
  const extraSsr = [];
  if (product) {
    // Id fijo (no el slug) para que --compare funcione aunque cambie el producto.
    await checkSsrPage('tienda_producto', `/tienda/${product.slug}`, { requireTypes: ['Product'] });
  } else warn('no hay ningún producto ni en el sitemap ni en /tienda: se omite la ficha de producto');
  if (post) {
    await checkSsrPage('el-archivo_post', `/el-archivo/${post.slug}`, { requireTypes: ARTICLE_TYPES });
    extraSsr.push(`/el-archivo/${post.slug}`);
  } else warn('no hay ningún post ni en el sitemap ni en /el-archivo: se omite el post');

  for (const path of NOT_FOUND) await checkNotFound(path);
  for (const r of REDIRECTS) await checkRedirect(r);
  for (const path of SHELL) await checkShell(path);

  console.log('');
  // /el-archivo y /puntos-de-venta pasan siempre por el motor (no se
  // prerenderizan); "/" suele salir del prerender estático.
  await hostProbes(['/el-archivo', '/puntos-de-venta', ...extraSsr]);

  if (opts.out) {
    const dir = resolve(opts.out);
    mkdirSync(dir, { recursive: true });
    for (const [id, html] of Object.entries(htmlById)) {
      // robots_txt → robots.txt, sitemap_xml → sitemap.xml; el resto, .html.
      const file = /_(txt|xml)$/.test(id) ? id.replace(/_(txt|xml)$/, '.$1') : `${id}.html`;
      writeFileSync(join(dir, file), html, 'utf8');
    }
    writeFileSync(join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
    console.log(`\nGuardado en ${dir}`);
  }

  if (opts.compare) compareWith(opts.compare);

  const vuln = Object.values(summary.hostProbes).filter((r) => r.verdict === 'VULNERABLE').length;
  const accepted = Object.values(summary.hostProbes).filter((r) => r.verdict === 'ACEPTADO').length;
  console.log(
    `\n${summary.failures === 0 ? 'OK' : 'FALLA'}: ${summary.failures} fallo(s), ${summary.warnings.length} aviso(s), ` +
      `${vuln} prueba(s) de host vulnerable(s)${vuln && !opts.strictHost ? ' (no cuentan como fallo sin --strict-host)' : ''}, ` +
      `${accepted} con el host falso aceptado sin reflejo`
  );
  process.exit(summary.failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`ssr-smoke: error inesperado: ${err.stack ?? err.message}`);
  process.exit(2);
});
