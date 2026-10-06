import { Component, OnInit, OnDestroy, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { runAfterStable } from '../../../core/utils/after-stable';

const MESSAGES = [
  '🚚 Envío gratis en pedidos +48€ — Península',
  '⏱️ Entrega en 48-72h · Pistacho manchego de Ciudad Real',
  '🌿 100% natural · Sin aditivos · Sin conservantes',
];

@Component({
  selector: 'app-announcement-bar',
  standalone: true,
  template: `
    <div class="announcement-bar" role="region" aria-label="Avisos" [attr.aria-live]="paused() ? 'polite' : 'off'" aria-atomic="true">
      <div class="announcement-bar__track">
        @for (msg of messages; track $index) {
          <span
            class="announcement-bar__msg"
            [class.is-active]="currentIndex() === $index"
            [attr.aria-hidden]="currentIndex() !== $index ? 'true' : null">
            {{ msg }}
          </span>
        }
      </div>
      @if (rotating()) {
        <!-- WCAG 2.2.2: el contenido que cambia solo debe poder pausarse -->
        <button type="button" class="announcement-bar__pause" (click)="togglePause()"
                [attr.aria-label]="paused() ? 'Reanudar avisos' : 'Pausar avisos'">
          {{ paused() ? '▶' : '❚❚' }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .announcement-bar {
      height: 32px;
      background: #7B1716;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      z-index: 201;
    }

    .announcement-bar__track {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .announcement-bar__msg {
      position: absolute;
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: #F4F1E9;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 400ms ease, transform 400ms ease;
      pointer-events: none;

      &.is-active {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
    }

    .announcement-bar__pause {
      position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
      min-width: 32px; height: 28px; border: 0; border-radius: 4px; background: transparent;
      color: #F4F1E9; font-size: 0.65rem; cursor: pointer;
      &:hover, &:focus-visible { background: rgba(255,255,255,0.15); }
    }

    @media (max-width: 768px) {
      .announcement-bar__msg {
        font-size: 0.68rem;
        white-space: normal;
        text-align: center;
        padding: 0 1rem;
        position: relative;
        display: none;

        &:first-child { display: block; opacity: 1; transform: none; }
      }
    }
  `]
})
export class AnnouncementBarComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);

  readonly messages = MESSAGES;
  readonly currentIndex = signal(0);
  readonly rotating = signal(false);
  readonly paused = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // El intervalo arranca cuando la app ya está estable: si no, la hidratación
    // nunca limpia el HTML del servidor (ver core/utils/after-stable.ts).
    runAfterStable(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (window.matchMedia('(max-width: 768px)').matches) return;
      // Sin rotación automática si el usuario pide menos movimiento
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.rotating.set(true);
      this.start();
    });
  }

  ngOnInit(): void {}

  togglePause(): void {
    this.paused.update(p => !p);
    if (this.paused()) this.stop();
    else this.start();
  }

  private start(): void {
    this.stop();
    this.intervalId = setInterval(() => {
      this.currentIndex.update(i => (i + 1) % this.messages.length);
    }, 4000);
  }

  private stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
