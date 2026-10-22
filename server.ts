import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { environment } from '@env/environment';
import { RESPONSE_STATUS, ResponseStatus } from './src/app/core/tokens/response-status.token';

const SITE_ORIGIN = environment.siteUrl;
const SITE_URL_ORIGIN = new URL(SITE_ORIGIN).origin;

// URL handed to the render (becomes document.location). Built with new URL()
// and checked, never concatenated: a request line like `GET //evil.example/x`
// gives originalUrl "//evil.example/x", and new URL() on that string — with
// any base — is a *protocol-relative* URL that swaps the origin for
// evil.example (same for "/\evil.example": WHATWG treats "\" as "/"). So the
// leading slashes/backslashes are collapsed to one first, making it a plain
// path, and the resulting origin is asserted as a last line of defence.
function renderUrl(originalUrl: string): string {
  const url = new URL('/' + originalUrl.replace(/^[/\\]+/, ''), SITE_URL_ORIGIN);
  if (url.origin !== SITE_URL_ORIGIN) throw new Error(`render URL fuera de ${SITE_URL_ORIGIN}: ${originalUrl}`);
  return url.href;
}

// Legacy English routes (app.routes.ts:92-105) — those are client-side
// Angular Router redirects, which means a crawler sees a 200 and never
// consolidates link authority onto the new URL. These need a real HTTP 301,
// served before the request ever reaches the Angular engine.
const LEGACY_REDIRECTS: Array<{ from: string; to: string }> = [
  { from: '/catalog', to: '/tienda' },
  { from: '/catalog/:slug', to: '/tienda/:slug' },
  { from: '/cart', to: '/carrito' },
  { from: '/blog', to: '/el-archivo' },
  { from: '/blog/:slug', to: '/el-archivo/:slug' },
  { from: '/checkout/success', to: '/gracias' },
  { from: '/pages/sobre-nosotros', to: '/nuestro-metodo' },
  { from: '/nosotros', to: '/nuestro-metodo' },
  { from: '/pages/contacto', to: '/contacto' },
  { from: '/pages/politica-privacidad', to: '/privacidad' },
  { from: '/pages/condiciones', to: '/aviso-legal' },
  { from: '/pages/cookies', to: '/cookies' },
  { from: '/pages/envios', to: '/devoluciones' },
  { from: '/pages/puntos-de-venta', to: '/puntos-de-venta' },
];

// In-process cache so a burst of crawler requests doesn't hammer the API —
// regenerated at most once every 10 minutes.
let sitemapCache: { xml: string; generatedAt: number } | null = null;
const SITEMAP_CACHE_MS = 10 * 60 * 1000;

// GET /blog/posts caps page_size at 50 (backend/app/api/v1/blog.py, le=50):
// asking for more is a 422, not a truncated list — which is how the sitemap
// silently lost every post. Walk the pages via total_pages instead, with a
// hard cap so a misbehaving API can't keep a crawler request open forever
// (20 × 50 = 1000 posts, far beyond what the blog will reach).
const BLOG_SITEMAP_PAGE_SIZE = 50;
const BLOG_SITEMAP_MAX_PAGES = 20;

async function fetchBlogSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 1; page <= BLOG_SITEMAP_MAX_PAGES; page++) {
    const res = await fetch(
      `${environment.serverApiUrl}/blog/posts?page=${page}&page_size=${BLOG_SITEMAP_PAGE_SIZE}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`GET /blog/posts page=${page} → HTTP ${res.status}`);
    const data = await res.json();
    const items: Array<{ slug: string }> = data?.items ?? [];
    slugs.push(...items.map((p) => p.slug).filter(Boolean));
    if (items.length === 0 || page >= (data?.total_pages ?? 0)) return slugs;
  }
  console.error(`[sitemap] /blog/posts tiene más de ${BLOG_SITEMAP_MAX_PAGES} páginas; el sitemap solo lleva las primeras`);
  return slugs;
}

async function fetchProductSlugs(): Promise<string[]> {
  const res = await fetch(`${environment.serverApiUrl}/products?page_size=100`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`GET /products → HTTP ${res.status}`);
  const data = await res.json();
  return (data?.items ?? []).map((p: { slug: string }) => p.slug).filter(Boolean);
}

async function generateSitemap(): Promise<string> {
  if (sitemapCache && Date.now() - sitemapCache.generatedAt < SITEMAP_CACHE_MS) {
    return sitemapCache.xml;
  }

  const STATIC_URLS = [
    '/', '/nuestro-metodo', '/tienda', '/para-tiendas', '/contacto',
    '/puntos-de-venta', '/el-archivo',
    '/privacidad', '/aviso-legal', '/cookies', '/devoluciones',
  ];

  // Each source fails on its own: API unreachable or erroring → that part is
  // left out rather than failing the whole sitemap (better partial than a 500
  // for every crawler), but it's logged — a sitemap quietly missing every
  // post is exactly the bug this used to hide.
  let partial = false;
  const [productSlugs, blogSlugs] = await Promise.all([
    fetchProductSlugs().catch((err) => {
      partial = true;
      console.error(`[sitemap] productos omitidos: ${err?.message ?? err}`);
      return [] as string[];
    }),
    fetchBlogSlugs().catch((err) => {
      partial = true;
      console.error(`[sitemap] posts del blog omitidos: ${err?.message ?? err}`);
      return [] as string[];
    }),
  ]);

  const urls = [
    ...STATIC_URLS,
    ...productSlugs.map((slug) => `/tienda/${slug}`),
    ...blogSlugs.map((slug) => `/el-archivo/${slug}`),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('\n') +
    `\n</urlset>\n`;

  // A partial sitemap is served but not cached: one API timeout on a cold
  // start would otherwise hide every product from crawlers for 10 minutes.
  if (!partial) sitemapCache = { xml, generatedAt: Date.now() };
  return xml;
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  // allowedHosts (GHSA-x288-3778-4hhx / CVE-2026-27739): from @angular/ssr
  // 19.2.21 on, render() checks the hostname of the render URL against this
  // list. With an EMPTY list it doesn't fail: it logs a console.error and
  // returns the bare index.server.html — <app-root> empty, status 200, no
  // H1/meta/JSON-LD (angular/angular#68391) — so a missing entry silently
  // turns SSR off for that environment and only Google notices. With a
  // non-empty list an unknown hostname throws instead (→ 500 via next(err)).
  // The render URL is always SITE_ORIGIN (renderUrl()), never the request's
  // Host, so this only needs the siteUrl hostname of each environment
  // (environment*.ts) — previews on *.vercel.app render with the staging
  // origin and need no entry. cremacuadrado.com / www. are here ahead of the
  // domain cutover (CUTOVER note in environment.prod.ts). Adding a new
  // environment = add its siteUrl hostname here, or its SSR goes blank.
  // NG_ALLOWED_HOSTS, if set, REPLACES this list (it doesn't extend it).
  const commonEngine = new CommonEngine({
    allowedHosts: [
      'prd.cremacuadrado.com',
      'staging.cremacuadrado.com',
      'cremacuadrado.com',
      'www.cremacuadrado.com',
      'localhost',
    ],
  });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Preview/staging must never be indexed, and neither must a production
  // deployment that isn't the public site yet (environment.allowIndexing is
  // false while it is served from prd.cremacuadrado.com). VERCEL_ENV is unset
  // locally, which also resolves to "not production" — correct, since there's
  // no case where localhost should be crawled either.
  const indexable = process.env['VERCEL_ENV'] === 'production' && environment.allowIndexing;
  server.use((req, res, next) => {
    if (!indexable) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  server.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /carrito',
        'Disallow: /checkout',
        'Disallow: /gracias',
        'Disallow: /account',
        'Disallow: /admin',
        'Disallow: /auth',
        '',
        'User-agent: GPTBot',
        'Allow: /',
        'User-agent: OAI-SearchBot',
        'Allow: /',
        'User-agent: PerplexityBot',
        'Allow: /',
        'User-agent: ClaudeBot',
        'Allow: /',
        '',
        `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
        '',
      ].join('\n')
    );
  });

  server.get('/sitemap.xml', async (req, res) => {
    const xml = await generateSitemap();
    res.type('application/xml').send(xml);
  });

  // Legacy English routes → real 301s, resolved before the SPA/SSR fallback
  // so a crawler following them consolidates authority onto the new URL.
  for (const { from, to } of LEGACY_REDIRECTS) {
    const fromPattern = from.replace(':slug', '*');
    const toBuilder = (req: express.Request) =>
      from.includes(':slug') ? to.replace(':slug', req.params[0] as string) : to;
    server.get(fromPattern, (req, res) => res.redirect(301, toBuilder(req)));
  }

  // Local-only /api proxy. In production this code path never runs: Vercel's
  // `vercel.json` rewrite for /api/:path* intercepts at the edge before the
  // request ever reaches this SSR function. But when running
  // `node dist/cremacuadrado/server/server.mjs` directly on a dev machine,
  // there's no edge layer — without this, a browser fetch to the relative
  // apiUrl ('/api/v1/...') resolves against this server's own origin, finds
  // no matching route, falls through to the Angular engine below, and gets
  // a 404 HTML page from NotFoundComponent instead of ever reaching the
  // real backend. LOCAL_API_PROXY_TARGET overrides where it forwards to —
  // useful when testing a production build (environment.prod.ts) against a
  // local backend instead of the live one.
  // Registered only off Vercel (VERCEL is set in every Vercel build and
  // function). The /api/:path* edge rewrite described above no longer exists
  // in vercel.json — everything, /api/* included, is rewritten to this
  // function — and apiUrl is absolute in prod/staging, so nothing legitimate
  // uses it there. Left mounted, it was a forwarder of any request and its
  // headers (Authorization, cookies) from the SSR function to the backend.
  const apiProxyTarget = process.env['LOCAL_API_PROXY_TARGET'] ?? new URL(environment.serverApiUrl).origin;
  if (!process.env['VERCEL']) server.use('/api', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
    try {
      const upstream = await fetch(`${apiProxyTarget}${req.originalUrl}`, {
        method: req.method,
        headers: Object.fromEntries(
          Object.entries(req.headers).filter(
            ([key, value]) => typeof value === 'string' && !['host', 'content-length', 'connection'].includes(key)
          ) as [string, string][]
        ),
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : (req.body as Buffer),
      });
      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key)) res.setHeader(key, value);
      });
      res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.status(502).json({ detail: `No se pudo conectar con ${apiProxyTarget} — ¿está arrancado el backend?` });
    }
  });

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
    // serve-static's default (redirect: true) 301s a bare prerendered path
    // like /tienda to /tienda/ before serving its index.html — an extra hop
    // for every single prerendered page. Serve it directly instead.
    redirect: false,
  }));

  // Routes with zero SEO value and/or that depend on browser-only state
  // (localStorage auth token, Stripe Elements, Google Identity Services).
  // Rendering them on the server is actively wrong, not just wasted work:
  // authGuard/adminGuard always see an anonymous user in Node (the JWT lives
  // in localStorage), so SSR would render a login redirect even for a
  // logged-in visitor, and only fix itself after hydration (SSR-11). These
  // get the plain CSR shell instead — the Angular Router takes over
  // client-side exactly as it does today, pre-SSR.
  // index.csr.html, not index.html: once "/" is prerendered, the builder
  // writes the home page's rendered HTML to browser/index.html and keeps the
  // untouched shell as index.csr.html. Sending index.html here served the
  // full home (canonical "/", home H1, ng-server-context="ssg") at /carrito,
  // /checkout… and hydration then fought the router over the wrong DOM.
  const CLIENT_ONLY_PREFIXES = ['/carrito', '/checkout', '/gracias', '/auth', '/account', '/admin'];
  const csrShell = join(browserDistFolder, 'index.csr.html');
  server.get('**', (req, res, next) => {
    // Same leading-slash collapse as renderUrl(): otherwise //carrito skips
    // this check but still renders /carrito on the server.
    const path = '/' + req.path.replace(/^[/\\]+/, '');
    if (CLIENT_ONLY_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) {
      res.sendFile(csrShell);
      return;
    }
    next();
  });

  // All remaining routes use the Angular engine (SSR, per-request)
  server.get('**', (req, res, next) => {
    const { originalUrl, baseUrl } = req;

    // RESPONSE_INIT (19+) only works with AngularNodeAppEngine, not with
    // CommonEngine — switching engines is phase 6 of the migration (see
    // docs/migracion-angular-22.md). Until then this plain mutable object
    // is provided into the component tree via RESPONSE_STATUS, and any
    // component that determines the route doesn't exist (not-found page, a
    // product/post that 404s) sets .code = 404 on it. Same object reference,
    // so the mutation is visible here once render() resolves.
    const responseStatus: ResponseStatus = { code: 200 };

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        // Fixed origin, never the client's Host / X-Forwarded-* headers
        // (GHSA-x288-3778-4hhx / CVE-2026-27739): this URL becomes
        // document.location inside the render, so any relative HttpClient
        // request, redirect or absolute link built from it would point at
        // whatever host the attacker sent — SSRF and cache poisoning. Previews
        // (*.vercel.app) and prd. still render fine: the origin only feeds
        // the render, it doesn't validate the incoming request, so there's
        // deliberately no 400 for unknown hosts here.
        // CommonEngine also checks this URL against `allowedHosts` (see the
        // constructor above): SITE_ORIGIN's hostname must be in that list.
        url: renderUrl(originalUrl),
        publicPath: browserDistFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: RESPONSE_STATUS, useValue: responseStatus },
        ],
      })
      .then((html) => res.status(responseStatus.code).send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Only listen when this file is executed directly (`node server.mjs`, our
// local SSR testing workflow). On Vercel, api/index.mjs imports `app` from
// this module instead — importing must NOT also bind a port, since the
// serverless runtime invokes the exported handler per request itself.
// pathToFileURL (not a raw `file://` template) is required for this to work
// on Windows: process.argv[1] is a backslash OS path, which doesn't match
// import.meta.url's forward-slash file:// form without it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
