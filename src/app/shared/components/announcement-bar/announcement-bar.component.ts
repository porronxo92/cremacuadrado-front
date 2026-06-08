import { Component, OnInit, OnDestroy, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const MESSAGES = [
  '🚚 Envío gratis en pedidos +48€ — Península',
  '⏱️ Entrega en 48-72h · Pistacho manchego de Ciudad Real',
  '🌿 100% natural · Sin aditivos · Sin conservantes',
];

@Component({
  selector: 'app-announcement-bar',
  standalone: true,
  template: `
    <div class="announcement-bar" role="marquee" aria-live="polite" aria-atomic="true">
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

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

    this.intervalId = setInterval(() => {
      this.currentIndex.update(i => (i + 1) % this.messages.length);
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
