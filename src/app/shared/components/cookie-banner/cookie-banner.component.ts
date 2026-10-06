import {
  Component, ElementRef, HostListener, PLATFORM_ID, ViewChild, afterNextRender, computed, effect, inject, signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';

/**
 * Modal de consentimiento de cookies (guía AEPD 2023 + LSSI art. 22.2).
 *
 * - Primera visita: modal bloqueante. Solo se cierra eligiendo «Aceptar»,
 *   «Rechazar» o «Configurar → Guardar selección». No se cierra con Esc, clic
 *   fuera ni botón ×. Rechazar es tan fácil como aceptar (mismo nivel y estilo),
 *   así que no es un "muro de cookies": la web se puede usar rechazándolas.
 * - Reabierta desde «Configurar cookies» (pie): ya hay una elección guardada,
 *   así que se puede cerrar sin cambiar nada (Esc, clic fuera o «Cerrar sin cambios»).
 * - Ninguna categoría opcional premarcada; nada no esencial se carga antes de decidir.
 * - Accesible: role="dialog" + aria-modal, foco atrapado dentro, scroll de fondo bloqueado.
 * - En móvil es una hoja inferior (no a pantalla completa). Los avisos legales de
 *   cookies están exentos de la penalización de Google a los intersticiales.
 */
@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="cm-backdrop" aria-hidden="true" (click)="onBackdrop()"></div>
      <section #dialog class="cm" role="dialog" aria-modal="true"
               aria-labelledby="cm-title" aria-describedby="cm-desc" tabindex="-1">

        @if (view() === 'main') {
          <h2 id="cm-title" class="cm__title">Tu privacidad</h2>
          <p id="cm-desc" class="cm__text">
            Usamos cookies técnicas necesarias para que la tienda funcione (carrito, sesión y pago seguro).
            Con tu permiso cargaremos también servicios externos: el mapa de puntos de venta
            (CARTO / OpenStreetMap) y el inicio de sesión con Google, que instala sus propias cookies.
            <strong>No usamos cookies publicitarias ni analíticas.</strong>
            Puedes cambiar tu elección cuando quieras desde «Configurar cookies», en el pie de la web.
            Más información en la <a href="/cookies" target="_blank" rel="noopener">política de cookies</a>.
          </p>
          <div class="cm__actions">
            <button type="button" class="cm__btn" (click)="consent.rejectAll()">Rechazar</button>
            <button type="button" class="cm__btn" (click)="showSettings()">Configurar</button>
            <button type="button" class="cm__btn" (click)="consent.acceptAll()">Aceptar</button>
          </div>
        } @else {
          <h2 id="cm-title" class="cm__title">Configurar cookies</h2>
          <p id="cm-desc" class="cm__text">Elige qué servicios opcionales quieres activar.</p>

          <div class="cm-cat">
            <div class="cm-cat__head">
              <strong>Técnicas (necesarias)</strong>
              <span class="cm-cat__always">Siempre activas</span>
            </div>
            <p>Carrito, sesión de usuario, pago seguro y recordar esta elección. Sin ellas la tienda no funciona.</p>
          </div>

          <label class="cm-cat cm-cat--toggle">
            <div class="cm-cat__head">
              <strong>Servicios externos</strong>
              <input type="checkbox" role="switch" [checked]="external()" (change)="external.set($any($event.target).checked)"
                     aria-describedby="cm-external-desc">
            </div>
            <p id="cm-external-desc">Mapa de «Puntos de venta» (CARTO / OpenStreetMap, sin cookies) e inicio de sesión con
              Google (instala cookies; Google LLC puede tratar datos en EE. UU., Marco de Privacidad de Datos UE-EE. UU.).</p>
          </label>

          <div class="cm__actions">
            <button type="button" class="cm__btn" (click)="consent.rejectAll()">Rechazar todas</button>
            <button type="button" class="cm__btn" (click)="consent.save({ external: external(), analytics: false })">Guardar selección</button>
            <button type="button" class="cm__btn" (click)="consent.acceptAll()">Aceptar todas</button>
          </div>
          <div class="cm__secondary">
            @if (blocking()) {
              <button type="button" class="cm__link" (click)="view.set('main')">← Volver</button>
            } @else {
              <button type="button" class="cm__link" (click)="close()">Cerrar sin cambios</button>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [`
    .cm-backdrop { position: fixed; inset: 0; z-index: 3000; background: rgba(28, 26, 20, 0.6); }
    .cm {
      position: fixed; z-index: 3001; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: min(560px, calc(100% - 2rem)); max-height: calc(100vh - 2rem); overflow: auto;
      background: #1C1A14; color: #F4F1E9; border-radius: 12px;
      padding: 1.75rem 1.5rem 1.5rem; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      font-family: 'Poppins', sans-serif;
      &:focus { outline: none; }
      /* Móvil: hoja inferior, nunca a pantalla completa */
      @media (max-width: 600px) {
        top: auto; bottom: 0; transform: translateX(-50%);
        width: 100%; max-height: 85vh; border-radius: 14px 14px 0 0;
        padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
      }
    }
    .cm__title { margin: 0 0 0.75rem; font-size: 1.15rem; color: #E6C15A; }
    .cm__text { margin: 0 0 1.25rem; font-size: 0.85rem; line-height: 1.6; }
    .cm__text a { color: #E6C15A; }
    .cm__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    /* Mismo tamaño y estilo para todas las opciones (sin "dark patterns") */
    .cm__btn {
      flex: 1 1 140px; min-height: 48px; padding: 0 1rem; border-radius: 20px;
      border: 1.5px solid #E6C15A; background: #E6C15A; color: #1C1A14;
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 0.88rem; cursor: pointer;
      &:hover { background: #F4F1E9; border-color: #F4F1E9; }
      &:focus-visible { outline: 3px solid #F4F1E9; outline-offset: 2px; }
    }
    .cm__secondary { margin-top: 0.75rem; text-align: center; }
    .cm__link { min-height: 44px; background: none; border: 0; color: #E6C15A; text-decoration: underline;
      font-family: 'Poppins', sans-serif; font-size: 0.82rem; cursor: pointer; }
    .cm-cat { display: block; padding: 0.9rem 0; border-top: 1px solid rgba(244, 241, 233, 0.15); }
    .cm-cat--toggle { cursor: pointer; margin-bottom: 1rem; }
    .cm-cat__head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .cm-cat__always { font-size: 0.75rem; color: #A2BA1C; }
    .cm-cat p { margin: 0.4rem 0 0; font-size: 0.78rem; line-height: 1.5; opacity: 0.85; }
    .cm-cat input { width: 22px; height: 22px; accent-color: #E6C15A; cursor: pointer; }
  `],
})
export class CookieBannerComponent {
  consent = inject(CookieConsentService);
  private document = inject(DOCUMENT);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @ViewChild('dialog') dialog?: ElementRef<HTMLElement>;

  /** Vista dentro de la modal: primera capa o configuración. */
  readonly view = signal<'main' | 'settings'>('main');
  readonly external = signal(this.consent.external());
  /**
   * Solo en el navegador y con la app ya hidratada: el servidor no puede saber si
   * el usuario ya decidió (está en localStorage), así que no pinta la modal.
   */
  private readonly ready = signal(false);

  /**
   * En las páginas de política de cookies y de privacidad la modal no aparece
   * sola (hay que poder leerlas); ambas tienen el botón «Configurar cookies».
   */
  private readonly url = toSignal(
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd), map(e => (e as NavigationEnd).urlAfterRedirects)),
    { initialValue: '' },
  );
  private readonly onPolicyPage = computed(() => /^\/(cookies|privacidad)(\?|#|$)/.test(this.url()));

  readonly visible = computed(() =>
    this.ready() && (this.consent.settingsOpen() || (!this.consent.hasDecided() && !this.onPolicyPage())));
  /** Bloqueante mientras no haya ninguna elección guardada. */
  readonly blocking = computed(() => !this.consent.hasDecided());

  constructor() {
    afterNextRender(() => this.ready.set(true));

    // Reabierta desde el pie → directamente en "Configurar", con la elección actual
    effect(() => {
      if (this.consent.settingsOpen()) {
        this.view.set('settings');
        this.external.set(this.consent.external());
      } else if (this.consent.hasDecided()) {
        this.view.set('main');
      }
    }, { allowSignalWrites: true });

    // Mientras está abierta: foco dentro y scroll de fondo bloqueado
    effect(() => {
      if (!this.isBrowser) return;
      const open = this.visible();
      this.document.body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(() => this.dialog?.nativeElement.focus());
    });
  }

  showSettings(): void {
    this.external.set(this.consent.external());
    this.view.set('settings');
    setTimeout(() => this.dialog?.nativeElement.focus());
  }

  /** Solo cuando ya existe una elección guardada (reabierta desde el pie). */
  close(): void {
    if (this.blocking()) return;
    this.consent.settingsOpen.set(false);
  }

  onBackdrop(): void {
    // Sin elección guardada, el clic fuera no cierra: hay que elegir una opción
    this.close();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.visible()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();  // no hace nada mientras sea bloqueante
      return;
    }
    if (event.key === 'Tab') this.trapFocus(event);
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialog?.nativeElement;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement as HTMLElement | null;
    if (event.shiftKey && (active === first || active === root)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
