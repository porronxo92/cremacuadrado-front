import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { COOKIES_VERSION } from '../legal';

/**
 * Consentimiento de cookies y servicios de terceros (LSSI art. 22.2 + guía AEPD 2023).
 *
 * - Las técnicas (carrito, sesión, preferencias de consentimiento) no lo necesitan.
 * - `external`: servicios de Google que instalan cookies de terceros (mapa de
 *   puntos de venta, botón «Continuar con Google»). Nada de esto se carga antes
 *   de aceptar. Hoy NO hay analítica ni píxeles publicitarios; si se añaden,
 *   crear su categoría aquí y no cargarlos hasta que `analytics()` sea true.
 *
 * La elección caduca a los 13 meses o al cambiar COOKIES_VERSION, y se puede
 * cambiar en cualquier momento desde «Configurar cookies» en el pie.
 */
export interface CookieChoice {
  version: string;
  external: boolean;
  analytics: boolean;
  decidedAt: string; // ISO
}

const STORAGE_KEY = 'cc_cookie_consent';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 395; // ~13 meses

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly choice = signal<CookieChoice | null>(this.read());

  /** Panel de configuración abierto (desde el banner o el enlace del pie). */
  readonly settingsOpen = signal(false);

  readonly hasDecided = computed(() => this.choice() !== null);
  readonly external = computed(() => !!this.choice()?.external);
  readonly analytics = computed(() => !!this.choice()?.analytics);

  acceptAll(): void { this.save({ external: true, analytics: true }); }
  rejectAll(): void { this.save({ external: false, analytics: false }); }
  save(prefs: { external: boolean; analytics: boolean }): void {
    const value: CookieChoice = { version: COOKIES_VERSION, ...prefs, decidedAt: new Date().toISOString() };
    this.choice.set(value);
    this.settingsOpen.set(false);
    if (!this.isBrowser) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* storage bloqueado */ }
  }

  openSettings(): void { this.settingsOpen.set(true); }

  private read(): CookieChoice | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CookieChoice;
      const expired = Date.now() - new Date(parsed.decidedAt).getTime() > MAX_AGE_MS;
      return parsed.version === COOKIES_VERSION && !expired ? parsed : null;
    } catch {
      return null;
    }
  }
}
