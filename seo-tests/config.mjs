// Route matrix for the SEO test harness — mirrors the rendering-mode table
// agreed in the SSR migration audit (Fase 4). Each check is tagged with the
// migration phase it belongs to, so the report can show progress phase by
// phase instead of one flat pass/fail count.
//
// Phases:
//   baseline   — server responds at all (should pass even pre-SSR)
//   ssr        — HTML contains real content without executing JS (Fase C)
//   seo-meta   — title/description/canonical/OG unique per route (Fase D · T-15)
//   seo-jsonld — structured data present and parseable (Fase D · T-16)
//   seo-infra  — robots.txt / sitemap.xml (Fase D · T-17)
//   http-status— real 404s and 301s, no soft-404 (Fase D · T-18)
//   brand      — forbidden brand/legal claims absent from rendered text

export const PRODUCTION_ORIGIN = 'https://cremacuadrado.com';

// Terms CLAUDE.md explicitly forbids anywhere in rendered page text.
// Checked case-insensitively against the visible text of content routes.
export const FORBIDDEN_TERMS = [
  { term: 'ibérico', reason: 'el pistacho se describe como "español" o "manchego", nunca "ibérico"' },
  { term: 'ibérica', reason: 'el pistacho se describe como "española" o "manchega", nunca "ibérica"' },
  { term: 'hecho a mano', reason: 'se usa maquinaria; no es "hecho a mano"' },
  { term: 'hecha a mano', reason: 'se usa maquinaria; no es "hecha a mano"' },
  { term: 'pistacho manchego certificado', reason: 'la certificación está pendiente, no se puede afirmar' },
  { term: 'molienda lenta', reason: 'la molienda en piedra nunca se describe como "lenta"' },
];

// Content-bearing public routes: these are the ones that must deliver full
// HTML (h1, title, meta, JSON-LD) without JavaScript for Google/GPTBot/etc.
export const CONTENT_ROUTES = [
  { id: 'home', path: '/', jsonld: ['Organization', 'WebSite'] },
  { id: 'about', path: '/nuestro-metodo', jsonld: [] },
  { id: 'catalog', path: '/tienda', jsonld: [] },
  { id: 'product-pura', path: '/tienda/crema-pistacho-pura', jsonld: ['Product', 'FAQPage'] },
  { id: 'product-crunchy', path: '/tienda/crema-pistacho-crunchy', jsonld: ['Product', 'FAQPage'] },
  { id: 'blog-list', path: '/el-archivo', jsonld: [] },
  { id: 'blog-detail', path: '/el-archivo/{blogSlug}', dynamic: 'blogSlug', jsonld: ['Article'] },
  { id: 'puntos-de-venta', path: '/puntos-de-venta', jsonld: ['LocalBusiness'], requiresTextList: true },
  { id: 'para-tiendas', path: '/para-tiendas', jsonld: [] },
  { id: 'contacto', path: '/contacto', jsonld: ['FAQPage'] },
  { id: 'privacidad', path: '/privacidad', jsonld: [] },
  { id: 'aviso-legal', path: '/aviso-legal', jsonld: [] },
  { id: 'cookies', path: '/cookies', jsonld: [] },
  { id: 'devoluciones', path: '/devoluciones', jsonld: [] },
];

// Public routes with zero SEO value: must stay reachable (CSR) but must
// eventually carry noindex. Not required to have h1/title/JSON-LD.
export const CLIENT_ONLY_ROUTES = [
  '/carrito',
  '/checkout',
  '/gracias',
  '/auth/login',
  '/auth/register',
  '/account',
  '/admin',
];

// Routes that must return a REAL HTTP 404 (not a 200 "soft 404" SPA shell).
export const NOT_FOUND_ROUTES = [
  '/ruta-que-no-existe-xyz',
  '/tienda/slug-que-no-existe-xyz',
  '/el-archivo/slug-que-no-existe-xyz',
];

// Legacy English routes that must redirect with a real HTTP 301, matching
// app.routes.ts:92-105. `dynamic` routes only check the static prefix.
export const REDIRECTS = [
  { from: '/catalog', to: '/tienda' },
  { from: '/catalog/crema-pistacho-pura', to: '/tienda/crema-pistacho-pura' },
  { from: '/cart', to: '/carrito' },
  { from: '/blog', to: '/el-archivo' },
  { from: '/blog/{blogSlug}', to: '/el-archivo/{blogSlug}', dynamic: 'blogSlug' },
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

export const META_DESCRIPTION_MAX_LENGTH = 155;
