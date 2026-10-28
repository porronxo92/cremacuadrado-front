import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MiniCartService {
  readonly isOpen = signal(false);
  private opener: HTMLElement | null = null;

  /**
   * `opener`: el botón que lo abre. Hay que capturarlo en el clic: mientras se
   * espera a la API el botón queda `disabled` y pierde el foco.
   */
  open(opener?: Element | null): void {
    this.opener = opener instanceof HTMLElement ? opener : null;
    this.isOpen.set(true);
  }

  /** Devuelve (una vez) el elemento que abrió el mini-carrito. */
  takeOpener(): HTMLElement | null {
    const el = this.opener;
    this.opener = null;
    return el;
  }

  close(): void { this.isOpen.set(false); }
  toggle(): void { this.isOpen.update(v => !v); }
}
