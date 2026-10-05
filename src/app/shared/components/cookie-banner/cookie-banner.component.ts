import { Component, ElementRef, HostListener, ViewChild, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';

/**
 * Banner de cookies conforme a la guía de la AEPD (2023):
 * - «Aceptar», «Rechazar» y «Configurar» en la primera capa, con el mismo peso visual.
 * - Ninguna categoría opcional premarcada; nada no esencial se carga antes de decidir.
 * - Barra inferior (no bloquea la navegación ni es un modal a pantalla completa).
 * - Revocable en cualquier momento desde «Configurar cookies» en el pie.
 */
@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [RouterModule],
  template: `
    @if (!consent.hasDecided() && !consent.settingsOpen()) {
      <section class="cb" role="region" aria-label="Aviso de cookies">
        <p class="cb__text">
          Usamos cookies técnicas necesarias para que la tienda funcione. Con tu permiso, cargaremos también
          servicios de Google (mapa de puntos de venta e inicio de sesión con Google) que instalan sus propias cookies.
          No usamos cookies publicitarias. Más información en la <a routerLink="/cookies">política de cookies</a>.
        </p>
        <div class="cb__actions">
          <button type="button" class="cb__btn" (click)="consent.rejectAll()">Rechazar</button>
          <button type="button" class="cb__btn" (click)="openSettings()">Configurar</button>
          <button type="button" class="cb__btn" (click)="consent.acceptAll()">Aceptar</button>
        </div>
      </section>
    }

    @if (consent.settingsOpen()) {
      <div class="cb-backdrop" (click)="close()" aria-hidden="true"></div>
      <section #panel class="cb-panel" role="dialog" aria-modal="true" aria-labelledby="cb-title" tabindex="-1">
        <h2 id="cb-title">Configurar cookies</h2>

        <div class="cb-cat">
          <div class="cb-cat__head">
            <strong>Técnicas (necesarias)</strong>
            <span class="cb-cat__always">Siempre activas</span>
          </div>
          <p>Carrito, sesión de usuario, pago seguro y recordar esta elección. Sin ellas la tienda no funciona.</p>
        </div>

        <label class="cb-cat">
          <div class="cb-cat__head">
            <strong>Servicios externos de Google</strong>
            <input type="checkbox" role="switch" [checked]="external()" (change)="external.set($any($event.target).checked)"
                   aria-describedby="cb-external-desc">
          </div>
          <p id="cb-external-desc">Mapa de Google Maps en «Puntos de venta» e inicio de sesión con Google. Google LLC puede
            tratar datos fuera del EEE (EE. UU., Marco de Privacidad de Datos UE-EE. UU.).</p>
        </label>

        <div class="cb-panel__actions">
          <button type="button" class="cb__btn" (click)="consent.rejectAll()">Rechazar todas</button>
          <button type="button" class="cb__btn" (click)="consent.save({ external: external(), analytics: false })">Guardar selección</button>
          <button type="button" class="cb__btn" (click)="consent.acceptAll()">Aceptar todas</button>
        </div>
      </section>
    }
  `,
  styles: [`
    .cb {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 1000;
      background: #1C1A14; color: #F4F1E9;
      padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom, 0px));
      display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: center;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
    }
    .cb__text { margin: 0; max-width: 760px; font-family: 'Poppins', sans-serif; font-size: 0.82rem; line-height: 1.55; }
    .cb__text a { color: #E6C15A; }
    .cb__actions, .cb-panel__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    /* Mismo tamaño y estilo para todas las opciones (sin "dark patterns") */
    .cb__btn {
      min-height: 48px; min-width: 120px; padding: 0 1.1rem; border-radius: 20px;
      border: 1.5px solid #E6C15A; background: #E6C15A; color: #1C1A14;
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 0.85rem; cursor: pointer;
    }
    .cb__btn:hover { background: #F4F1E9; border-color: #F4F1E9; }
    .cb__btn:focus-visible { outline: 3px solid #F4F1E9; outline-offset: 2px; }

    .cb-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000; }
    .cb-panel {
      position: fixed; z-index: 1001; left: 50%; bottom: 0; transform: translateX(-50%);
      width: min(560px, 100%); max-height: 85vh; overflow: auto;
      background: #1C1A14; color: #F4F1E9; border-radius: 12px 12px 0 0;
      padding: 1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
      font-family: 'Poppins', sans-serif;
    }
    .cb-panel h2 { margin: 0 0 1rem; font-size: 1.1rem; color: #E6C15A; }
    .cb-cat { display: block; padding: 0.9rem 0; border-top: 1px solid rgba(244,241,233,0.15); cursor: default; }
    label.cb-cat { cursor: pointer; }
    .cb-cat__head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .cb-cat__always { font-size: 0.75rem; color: #A2BA1C; }
    .cb-cat p { margin: 0.4rem 0 0; font-size: 0.78rem; line-height: 1.5; opacity: 0.85; }
    .cb-cat input { width: 22px; height: 22px; accent-color: #E6C15A; }
    .cb-panel__actions { margin-top: 1rem; }
    .cb-panel__actions .cb__btn { flex: 1 1 140px; }
  `],
})
export class CookieBannerComponent {
  consent = inject(CookieConsentService);
  external = signal(this.consent.external());
  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

  constructor() {
    // Al abrir el panel, refleja la elección actual y lleva el foco dentro
    effect(() => {
      if (this.consent.settingsOpen()) {
        this.external.set(this.consent.external());
        setTimeout(() => this.panel?.nativeElement.focus());
      }
    }, { allowSignalWrites: true });
  }

  openSettings(): void {
    this.consent.openSettings();
  }

  close(): void {
    this.consent.settingsOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.consent.settingsOpen()) this.close();
  }
}
