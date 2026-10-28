/**
 * Simulación del API (el backend local apunta a una base de datos remota, así que no se arranca).
 * Los datos se construyen a partir de src/app/core/models/index.ts y backend/app/schemas/{product,cart}.py.
 * Dos productos (Pura y Crunchy) con variantes 100g/200g/1kg:
 *   Pura:    100g stock 50, 200g stock 2 (poco stock), 1kg agotada.
 *   Crunchy: 100g stock 50, 200g agotada (variante por defecto de la tienda), 1kg stock 10.
 */
import type { Page, Route } from '@playwright/test';

type Variant = {
  id: number; format: string; price: number; compare_price: number | null; stock: number;
  is_in_stock: boolean; is_low_stock: boolean; images: never[];
};

const variant = (id: number, format: string, price: number, stock: number): Variant => ({
  id, format, price, compare_price: null, stock, is_in_stock: stock > 0, is_low_stock: stock > 0 && stock <= 5, images: [],
});

export const VARIANTS = {
  pura: [variant(1, '100g', 6.95, 50), variant(2, '200g', 11.9, 2), variant(3, '1kg', 49.9, 0)],
  crunchy: [variant(4, '100g', 7.5, 50), variant(5, '200g', 12.9, 0), variant(6, '1kg', 52.9, 10)],
};

const base = (id: number, slug: string, name: string, variants: Variant[], color: string) => ({
  id, sku: `SKU-${id}`, slug, name, badge_color: color,
  short_description: 'Pistacho manchego tostado y molido.', description: 'Descripción de prueba.',
  price: variants[1].price, compare_price: null, stock: variants.reduce((s, v) => s + v.stock, 0), weight: 200,
  is_active: true, is_featured: true,
  is_in_stock: variants.some((v) => v.is_in_stock), is_low_stock: false,
  variants, category: null, images: [], audio_url: null, nutrition: null,
  average_rating: null, review_count: 0, category_slug: null, primary_image: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
});

export const PRODUCTS = [
  base(1, 'crema-pistacho-pura', 'Crema de Pistacho Pura', VARIANTS.pura, '#A2BA1C'),
  base(2, 'crema-pistacho-crunchy', 'Crema de Pistacho Crunchy', VARIANTS.crunchy, '#F5A542'),
];

const allVariants = [...PRODUCTS[0].variants, ...PRODUCTS[1].variants];

export interface CartState { items: any[]; }

export function buildCart(items: any[]) {
  const subtotal = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
  const shipping = subtotal === 0 || subtotal >= 48 ? 0 : 4.95;
  return {
    id: 1, item_count: items.reduce((s, i) => s + i.quantity, 0), items, subtotal, coupon: null, discount: 0,
    shipping_cost: shipping, shipping_message: null, total: Math.round((subtotal + shipping) * 100) / 100,
    updated_at: '2026-01-01T00:00:00Z',
  };
}

export interface ApiMock {
  /** Cuerpos de los POST /cart/items recibidos. */
  addRequests: { product_variant_id: number; quantity: number }[];
  /** Si se define, el siguiente POST /cart/items responde 400 con este detail. */
  failNextAdd: string | null;
  /** Peticiones al API no previstas (para depurar). */
  unhandled: string[];
}

export async function mockApi(page: Page, opts: { cartWithItem?: boolean } = {}): Promise<ApiMock> {
  const state: ApiMock = { addRequests: [], failNextAdd: null, unhandled: [] };
  const items: any[] = [];
  const addItem = (variantId: number, quantity: number) => {
    const v = allVariants.find((x) => x.id === variantId)!;
    const p = PRODUCTS.find((x) => x.variants.some((y) => y.id === variantId))!;
    const existing = items.find((i) => i.product_variant_id === variantId);
    if (existing) { existing.quantity += quantity; existing.total = existing.quantity * v.price; return; }
    items.push({
      id: items.length + 1, product_id: p.id, product_variant_id: v.id, product_name: p.name, variant_format: v.format,
      product_slug: p.slug, product_image: null, product_price: v.price, unit_price: v.price, quantity,
      price_at_add: v.price, total: v.price * quantity, is_available: true, stock_available: v.stock,
    });
  };
  if (opts.cartWithItem) addItem(1, 1);

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204 });

    if (path === '/products' && method === 'GET') {
      return json(route, { items: PRODUCTS, total: 2, page: 1, page_size: 10, total_pages: 1 });
    }
    if (path === '/products/featured') return json(route, PRODUCTS);
    if (path === '/products/categories') return json(route, []);
    if (path === '/products/reviews/featured') return json(route, []);
    const detail = path.match(/^\/products\/([^/]+)$/);
    if (detail && method === 'GET') {
      const p = PRODUCTS.find((x) => x.slug === detail[1]);
      return p ? json(route, p) : json(route, { detail: 'Producto no encontrado' }, 404);
    }
    if (/^\/products\/[^/]+\/reviews$/.test(path)) return json(route, []);

    if (path === '/cart' && method === 'GET') return json(route, buildCart(items), 200);
    if (path === '/cart/items' && method === 'POST') {
      const body = req.postDataJSON();
      state.addRequests.push(body);
      if (state.failNextAdd) {
        const detail = state.failNextAdd;
        state.failNextAdd = null;
        return json(route, { detail }, 400);
      }
      addItem(body.product_variant_id, body.quantity);
      return json(route, buildCart(items));
    }
    state.unhandled.push(`${method} ${path}`);
    return json(route, method === 'GET' ? [] : {});
  });
  return state;
}
