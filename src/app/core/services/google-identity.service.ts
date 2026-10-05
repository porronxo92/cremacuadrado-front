import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Carga Google Identity Services solo cuando hace falta: si el usuario aceptó
 * los servicios externos o cuando pulsa «Continuar con Google» (petición
 * expresa del servicio). Nunca en la carga inicial de la web.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loading: Promise<any> | null = null;

  load(): Promise<any> {
    if (!this.isBrowser) return Promise.reject(new Error('SSR'));
    const existing = (window as any).google;
    if (existing?.accounts?.id) return Promise.resolve(existing);
    if (this.loading) return this.loading;
    this.loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve((window as any).google);
      script.onerror = () => { this.loading = null; reject(new Error('No se pudo cargar Google')); };
      document.head.appendChild(script);
    });
    return this.loading;
  }
}
