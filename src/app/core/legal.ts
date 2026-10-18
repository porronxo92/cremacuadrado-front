/**
 * Versiones vigentes de los textos legales. Deben coincidir con
 * TERMS_VERSION / PRIVACY_VERSION del backend (app/config.py): súbelas
 * en ambos sitios cuando cambie el texto publicado.
 */
export const TERMS_VERSION = '2026-10c';
export const PRIVACY_VERSION = '2026-10b';
export const COOKIES_VERSION = '2026-10';

/** Datos del titular (LSSI art. 10). Única fuente para las páginas legales. */
export const COMPANY = {
  name: 'CREMACUADRADO SL',
  nif: 'B56673700',
  address: 'Camino del Arca 18, 13005 Ciudad Real (España)',
  registry: 'Registro Mercantil de Ciudad Real, Tomo 725, Hoja CR-33764',
  email: 'info@cremacuadrado.com',
  privacyEmail: 'info@cremacuadrado.com',
  phone: '623 924 886',
} as const;

/** Zonas de envío. El importe real lo calcula siempre el backend (shipping_zone / shipping_cost). */
export type ShippingZone = 'peninsula' | 'baleares' | 'quote';

/** Islas Baleares: envío fijo, sin envío gratis por importe. */
export const BALEARES_POSTCODE_PREFIXES = ['07'];
/** Canarias, Ceuta y Melilla: no se cobra en la web (aduana); presupuesto por WhatsApp. */
export const QUOTE_POSTCODE_PREFIXES = ['35', '38', '51', '52'];
/** Solo para mostrar el importe tachado cuando un cupón anula el envío; el cobro lo decide el backend. */
export const BALEARES_SHIPPING_COST = 7.95;

/** Zona de envío de un código postal (2 primeros dígitos). Sin CP válido: península. */
export function shippingZone(cp: string | null | undefined): ShippingZone {
  const prefix = String(cp ?? '').trim().slice(0, 2);
  if (BALEARES_POSTCODE_PREFIXES.includes(prefix)) return 'baleares';
  if (QUOTE_POSTCODE_PREFIXES.includes(prefix)) return 'quote';
  return 'peninsula';
}

/**
 * Envío gratis a partir de este subtotal (tras descuentos). Solo se usa para
 * pintar la barra de progreso del carrito: el coste real lo calcula siempre
 * el backend. Debe coincidir con FREE_SHIPPING_THRESHOLD de app/config.py.
 */
export const FREE_SHIPPING_THRESHOLD = 48;
