import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { environment } from '@env/environment';
import { RESPONSE_STATUS, ResponseStatus } from './src/app/core/tokens/response-status.token';

const SITE_ORIGIN = 'https://cremacuadrado.com';

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
  { from: '/condiciones-venta', to: '/aviso-legal' },
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

async function generateSitemap(): Promise<string> {
  if (sitemapCache && Date.now() - sitemapCache.generatedAt < SITEMAP_CACHE_MS) {
    return sitemapCache.xml;
  }

  const STATIC_URLS = [
    '/', '/nuestro-metodo', '/tienda', '/para-tiendas', '/contacto',
    '/puntos-de-venta', '/el-archivo',
    '/privacidad', '/aviso-legal', '/cookies', '/devoluciones',
  ];

  let productSlugs: string[] = [];
  let blogSlugs: string[] = [];
  try {
    const [productsRes, postsRes] = await Promise.all([
      fetch(`${environment.serverApiUrl}/products?page_size=100`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${environment.serverApiUrl}/blog/posts?page_size=500`, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (productsRes.ok) {
      const data = await productsRes.json();
      productSlugs = (data?.items ?? []).map((p: { slug: string }) => p.slug);
    }
    if (postsRes.ok) {
      const data = await postsRes.json();
      blogSlugs = (data?.items ?? []).map((p: { slug: string }) => p.slug);
    }
  } catch {
    // API unreachable — serve the static URLs only rather than fail the
    // whole sitemap; better a partial sitemap than a 500 for every crawler.
  }

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

  sitemapCache = { xml, generatedAt: Date.now() };
  return xml;
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Preview/staging must never be indexed; production must never carry this
  // header. VERCEL_ENV is unset locally, which also resolves to "not
  // production" — correct, since there's no case where localhost should be
  // crawled either.
  server.use((req, res, next) => {
    if (process.env['VERCEL_ENV'] !== 'production') {
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
  const apiProxyTarget = process.env['LOCAL_API_PROXY_TARGET'] ?? new URL(environment.serverApiUrl).origin;
  server.use('/api', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
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
  const CLIENT_ONLY_PREFIXES = ['/carrito', '/checkout', '/gracias', '/auth', '/account', '/admin'];
  server.get('**', (req, res, next) => {
    if (CLIENT_ONLY_PREFIXES.some((p) => req.path === p || req.path.startsWith(p + '/'))) {
      res.sendFile(join(browserDistFolder, 'index.html'));
      return;
    }
    next();
  });

  // All remaining routes use the Angular engine (SSR, per-request)
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    // Angular 18 has no RESPONSE_INIT (that's 19+): this plain mutable object
    // is provided into the component tree via RESPONSE_STATUS, and any
    // component that determines the route doesn't exist (not-found page, a
    // product/post that 404s) sets .code = 404 on it. Same object reference,
    // so the mutation is visible here once render() resolves.
    const responseStatus: ResponseStatus = { code: 200 };

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
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
