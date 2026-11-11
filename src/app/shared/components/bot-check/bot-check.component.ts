import { Component, ChangeDetectionStrategy, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { environment } from '@env/environment';

export const BOT_CHECK_PENDING = 'Espera un momento a que termine la comprobación antispam y vuelve a intentarlo.';

export interface BotCheckPayload {
  website: string;
  turnstile_token: string;
}

/**
 * Antispam de los formularios públicos: honeypot (`website`) + Cloudflare Turnstile.
 * Se pone dentro del <form>; al enviar, el padre llama a `payload()` y lo añade al cuerpo.
 * El backend lo valida en `services/antispam.py`. Sin `environment.turnstileSiteKey`
 * solo queda el honeypot.
 */
@Component({
  selector: 'app-bot-check',
  template: `
    <div class="hp" aria-hidden="true">
      <label>No rellenes este campo
        <input #hp type="text" name="website" tabindex="-1" autocomplete="off">
      </label>
    </div>
    @if (enabled) { <div #box></div> }
    @if (loadError()) {
      <p class="bot-check__error" role="alert">
        No se ha podido cargar la comprobación antispam. Recarga la página o escríbenos a info&#64;cremacuadrado.com.
      </p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: block; }
    .hp { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
    .bot-check__error { font-family: 'Poppins', sans-serif; font-size: 0.8rem; color: #A01C1C; margin: 0.75rem 0 0; }
  `],
})
export class BotCheckComponent {
  readonly enabled = !!environment.turnstileSiteKey;
  readonly loadError = signal(false);

  private hp = viewChild.required<ElementRef<HTMLInputElement>>('hp');
  private box = viewChild<ElementRef<HTMLElement>>('box');
  private widgetId: string | null = null;
  private token = '';

  constructor() {
    // Solo en el navegador; el widget no se muestra salvo que Cloudflare pida interacción
    afterNextRender(() => {
      const box = this.box()?.nativeElement;
      if (!box) return;
      loadTurnstile().then(ts => {
        this.widgetId = ts.render(box, {
          sitekey: environment.turnstileSiteKey,
          language: 'es',
          appearance: 'interaction-only',
          callback: (token: string) => { this.token = token; },
          'expired-callback': () => { this.token = ''; },
          'error-callback': () => { this.token = ''; },
        });
      }).catch(() => this.loadError.set(true));
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.widgetId) (window as any).turnstile?.remove(this.widgetId);
    });
  }

  /** Campos para el cuerpo de la petición, o null si Turnstile aún no ha dado el token. */
  payload(): BotCheckPayload | null {
    if (this.enabled && !this.token) return null;
    return { website: this.hp().nativeElement.value, turnstile_token: this.token };
  }

  /** El token es de un solo uso: llamar tras cada envío fallido. */
  reset(): void {
    this.token = '';
    if (this.widgetId) (window as any).turnstile?.reset(this.widgetId);
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileLoading: Promise<any> | null = null;

function loadTurnstile(): Promise<any> {
  if ((window as any).turnstile) return Promise.resolve((window as any).turnstile);
  turnstileLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = () => resolve((window as any).turnstile);
    script.onerror = () => { turnstileLoading = null; reject(new Error('Turnstile')); };
    document.head.appendChild(script);
  });
  return turnstileLoading;
}
