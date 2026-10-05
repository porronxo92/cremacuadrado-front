/**
 * Versiones vigentes de los textos legales. Deben coincidir con
 * TERMS_VERSION / PRIVACY_VERSION del backend (app/config.py): súbelas
 * en ambos sitios cuando cambie el texto publicado.
 */
export const TERMS_VERSION = '2026-10';
export const PRIVACY_VERSION = '2026-10';
export const COOKIES_VERSION = '2026-10';

/** Datos del titular (LSSI art. 10). Única fuente para las páginas legales. */
export const COMPANY = {
  name: 'CREMACUADRADO SL',
  nif: 'B56673700',
  address: 'Camino del Arca 18, 13005 Ciudad Real (España)',
  registry: 'Registro Mercantil de Ciudad Real, Tomo 725, Hoja CR-33764',
  email: 'info@cremacuadrado.com',
  privacyEmail: 'info@cremacuadrado.com',
  phone: '623 294 886',
} as const;

/** Prefijos de código postal fuera del ámbito de envío (Baleares, Canarias, Ceuta, Melilla). */
export const EXCLUDED_POSTCODE_PREFIXES = ['07', '35', '38', '51', '52'];
