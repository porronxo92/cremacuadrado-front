import * as cheerio from 'cheerio';
import { FORBIDDEN_TERMS, META_DESCRIPTION_MAX_LENGTH } from './config.mjs';

const PASS = 'PASS';
const FAIL = 'FAIL';
const SKIP = 'SKIP';

function check(id, phase, status, message) {
  return { id, phase, status, message };
}

/**
 * Runs every check for one content-bearing route (the ones that must
 * deliver full HTML without JS). Returns a flat array of check results.
 * `html` must be the RAW response body — never a post-hydration DOM — so a
 * failure here means a crawler that doesn't execute JS would see the same.
 */
export function checkContentRoute({ routeId, path, canonicalUrl, html, status, jsonldTypes, requiresTextList }) {
  const results = [];
  // Every message is a function of the actual observed state, not of
  // pass/fail — otherwise a passing check can print its own failure text
  // (e.g. "✅ title-present — falta <title>").
  const r = (id, phase, ok, message) => results.push(check(id, phase, ok ? PASS : FAIL, message));

  r('http-200', 'baseline', status === 200, `esperaba 200, recibí ${status}`);

  if (status !== 200) {
    results.push(check('h1', 'ssr', SKIP, 'sin respuesta 200'));
    return results;
  }

  const $ = cheerio.load(html);

  // --- Fase C: contenido real sin JS ---
  const h1s = $('h1');
  r('h1-count', 'ssr', h1s.length === 1, `hay ${h1s.length} <h1> (se espera exactamente 1)`);
  const h1Text = h1s.first().text().trim();
  r('h1-nonempty', 'ssr', h1Text.length > 0, h1Text.length > 0 ? `texto: "${h1Text}"` : 'el <h1> está vacío o ausente');

  const htmlLang = $('html').attr('lang');
  r('html-lang', 'ssr', htmlLang === 'es', `<html lang="${htmlLang ?? '(ausente)'}">, se esperaba "es"`);

  if (requiresTextList) {
    // CLAUDE.md: el mapa embed no es indexable, tiene que haber una lista de
    // texto real (fuera del <iframe>) con las tiendas.
    const bodyWithoutIframes = $('body').clone();
    bodyWithoutIframes.find('iframe').remove();
    const textLen = bodyWithoutIframes.text().replace(/\s+/g, ' ').trim().length;
    r(
      'text-list-present',
      'ssr',
      textLen > 200,
      textLen > 200 ? `${textLen} caracteres de texto fuera del <iframe>` : 'no se detecta una lista de texto de tiendas fuera del mapa embed'
    );
  }

  // --- Fase D · T-15: metadatos únicos por ruta ---
  const title = $('title').text().trim();
  r('title-present', 'seo-meta', title.length > 0, title.length > 0 ? `"${title}"` : 'falta <title>');

  const description = $('meta[name="description"]').attr('content')?.trim() ?? '';
  r(
    'description-present',
    'seo-meta',
    description.length > 0,
    description.length > 0 ? `"${description.slice(0, 60)}${description.length > 60 ? '…' : ''}"` : 'falta <meta name="description">'
  );
  r(
    'description-length',
    'seo-meta',
    description.length > 0 && description.length <= META_DESCRIPTION_MAX_LENGTH,
    `${description.length} caracteres, máximo ${META_DESCRIPTION_MAX_LENGTH}`
  );

  const canonical = $('link[rel="canonical"]').attr('href') ?? '';
  r('canonical-present', 'seo-meta', canonical.length > 0, canonical.length > 0 ? canonical : 'falta <link rel="canonical">');
  r(
    'canonical-matches',
    'seo-meta',
    canonical === canonicalUrl,
    canonical === canonicalUrl ? `"${canonical}"` : `canonical="${canonical || '(ausente)'}", se esperaba "${canonicalUrl}"`
  );

  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  r(
    'og-tags-present',
    'seo-meta',
    !!ogTitle && !!ogDescription,
    ogTitle && ogDescription ? 'og:title y og:description presentes' : 'faltan og:title / og:description'
  );

  // --- Fase D · T-16: datos estructurados ---
  const ldScripts = $('script[type="application/ld+json"]');
  if (jsonldTypes && jsonldTypes.length > 0) {
    const foundTypes = new Set();
    ldScripts.each((_, el) => {
      try {
        const parsed = JSON.parse($(el).contents().text());
        const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
        for (const node of nodes) {
          if (node && node['@type']) {
            const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
            types.forEach((t) => foundTypes.add(t));
          }
        }
      } catch {
        // invalid JSON handled by jsonld-valid check below
      }
    });
    for (const expected of jsonldTypes) {
      const found = foundTypes.has(expected);
      r('jsonld-' + expected.toLowerCase(), 'seo-jsonld', found, found ? `@type="${expected}" presente` : `no se encontró JSON-LD @type="${expected}"`);
    }
  } else {
    results.push(check('jsonld-not-required', 'seo-jsonld', SKIP, 'esta ruta no requiere JSON-LD en la matriz de rutas'));
  }

  let jsonldAllValid = true;
  ldScripts.each((_, el) => {
    try {
      JSON.parse($(el).contents().text());
    } catch {
      jsonldAllValid = false;
    }
  });
  if (ldScripts.length > 0) {
    r('jsonld-valid-json', 'seo-jsonld', jsonldAllValid, 'uno o más bloques <script type="application/ld+json"> no son JSON válido');
  }

  // --- Reglas de marca (CLAUDE.md) ---
  const bodyText = $('body').text().toLowerCase();
  if (bodyText.trim().length === 0) {
    results.push(check('brand-terms', 'brand', SKIP, 'sin texto de cuerpo que analizar (precondición: h1/contenido debe existir primero)'));
  } else {
    for (const { term, reason } of FORBIDDEN_TERMS) {
      const absent = !bodyText.includes(term.toLowerCase());
      r(`brand-term:${term}`, 'brand', absent, absent ? `"${term}" no aparece` : `se encontró el término prohibido "${term}" — ${reason}`);
    }
  }

  return results;
}

export function checkClientOnlyRoute({ path, status }) {
  return [check('http-200', 'baseline', status === 200 ? PASS : FAIL, `esperaba 200 (SPA), recibí ${status}`)];
}

export function checkNotFoundRoute({ path, status }) {
  return [
    check(
      'http-404',
      'http-status',
      status === 404 ? PASS : FAIL,
      status === 200
        ? `recibí 200 — esto es un "soft 404": Google indexará esta URL como válida (SSR-09)`
        : `esperaba 404, recibí ${status}`
    ),
  ];
}

export function checkRedirect({ from, to, status, location }) {
  const results = [];
  results.push(
    check(
      'http-301',
      'http-status',
      status === 301 || status === 308 ? PASS : FAIL,
      status === 200
        ? `recibí 200 — es una redirección del lado del cliente (JS), no un 301 HTTP (SSR-24)`
        : `esperaba 301/308, recibí ${status}`
    )
  );
  if (status === 301 || status === 308) {
    const matches = location === to || (location && location.startsWith(to));
    results.push(check('location-correct', 'http-status', matches ? PASS : FAIL, `Location: "${location}", se esperaba "${to}"`));
  }
  return results;
}

// Both of these treat a 200 response that is actually the SPA's index.html
// shell (served by the catch-all fallback) as if the real file was missing —
// otherwise the SPA fallback masks "this route doesn't exist yet" as a pass.
function looksLikeSpaShell(body) {
  return /<app-root/i.test(body);
}

export function checkRobotsTxt({ status, body }) {
  const results = [];
  const isReal = status === 200 && !looksLikeSpaShell(body);
  results.push(
    check(
      'robots-200',
      'seo-infra',
      isReal ? PASS : FAIL,
      isReal ? 'respondió 200 con contenido propio' : status !== 200 ? `esperaba 200, recibí ${status}` : 'recibí 200 pero es el shell de la SPA (el fichero no existe realmente)'
    )
  );
  if (isReal) {
    const hasSitemap = /sitemap:/i.test(body);
    results.push(check('robots-has-sitemap', 'seo-infra', hasSitemap ? PASS : FAIL, hasSitemap ? 'declara "Sitemap:"' : 'robots.txt no declara una línea "Sitemap:"'));
    const protectedPaths = ['/carrito', '/checkout', '/account', '/admin'];
    const disallowsPrivate = protectedPaths.every((p) => new RegExp(`Disallow:\\s*${p}`, 'i').test(body));
    results.push(
      check(
        'robots-disallows-private',
        'seo-infra',
        disallowsPrivate ? PASS : FAIL,
        disallowsPrivate ? 'excluye carrito/checkout/account/admin' : 'robots.txt no excluye explícitamente carrito/checkout/account/admin'
      )
    );
  } else {
    results.push(check('robots-has-sitemap', 'seo-infra', SKIP, 'sin robots.txt real que analizar'));
    results.push(check('robots-disallows-private', 'seo-infra', SKIP, 'sin robots.txt real que analizar'));
  }
  return results;
}

export function checkSitemapXml({ status, body }) {
  const results = [];
  const isReal = status === 200 && !looksLikeSpaShell(body);
  results.push(
    check(
      'sitemap-200',
      'seo-infra',
      isReal ? PASS : FAIL,
      isReal ? 'respondió 200 con contenido propio' : status !== 200 ? `esperaba 200, recibí ${status}` : 'recibí 200 pero es el shell de la SPA (el fichero no existe realmente)'
    )
  );
  if (isReal) {
    const validXml = body.trim().startsWith('<?xml') || body.trim().startsWith('<urlset');
    results.push(check('sitemap-well-formed', 'seo-infra', validXml ? PASS : FAIL, validXml ? 'XML bien formado' : 'el contenido no parece un sitemap XML válido'));
    const noPrivate = !/\/(carrito|checkout|account|admin)/.test(body);
    results.push(check('sitemap-no-private-routes', 'seo-infra', noPrivate ? PASS : FAIL, noPrivate ? 'sin rutas privadas' : 'el sitemap incluye rutas privadas/sin valor SEO'));
  } else {
    results.push(check('sitemap-well-formed', 'seo-infra', SKIP, 'sin sitemap.xml real que analizar'));
    results.push(check('sitemap-no-private-routes', 'seo-infra', SKIP, 'sin sitemap.xml real que analizar'));
  }
  return results;
}

/** Global cross-route checks: run once, after every content route is fetched. */
export function checkGlobalUniqueness(pageData) {
  const results = [];
  const titles = pageData.map((p) => p.title).filter(Boolean);
  const uniqueTitles = new Set(titles);
  results.push(
    check(
      'titles-unique',
      'seo-meta',
      titles.length > 0 && uniqueTitles.size === titles.length,
      `${titles.length - uniqueTitles.size} título(s) duplicado(s) entre rutas de contenido`
    )
  );

  const canonicals = pageData.map((p) => p.canonical).filter(Boolean);
  const uniqueCanonicals = new Set(canonicals);
  results.push(
    check(
      'canonicals-unique',
      'seo-meta',
      canonicals.length > 0 && uniqueCanonicals.size === canonicals.length,
      `${canonicals.length - uniqueCanonicals.size} canonical(es) duplicado(s) entre rutas de contenido`
    )
  );

  return results;
}

export { PASS, FAIL, SKIP };
