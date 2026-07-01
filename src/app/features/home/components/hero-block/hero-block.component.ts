import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../../../core/services/newsletter.service';

@Component({
  selector: 'app-hero-block',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <section class="hero">
      <video
        #videoEl
        class="hero__video"
        autoplay muted loop playsinline
        preload="none"
        aria-hidden="true">
        <source [src]="videoSrc" type="video/mp4">
      </video>
      <div class="hero__overlay" aria-hidden="true"></div>

      <div class="hero__content">
        <div class="hero__review">
          <span class="hero__stars">★★★★★</span>
          <span class="hero__review-text">"La mejor crema de frutos secos que he probado"</span>
        </div>
        <h1 class="hero__h1">CREMA DE<br>PISTACHO<br>MANCHEGO</h1>
        <p class="hero__tagline">100% natural · sin aditivos · Ciudad Real</p>
        <div class="hero__ctas">
          <a routerLink="/tienda" class="hero__btn-primary">Descubrir la crema</a>
          <a routerLink="/nuestro-metodo" class="hero__btn-secondary">
            Nuestro método
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>

      <!-- Email capture overlay (desktop only) -->
      @if (showPopup() && !emailSubmitted()) {
        <div class="hero__popup-overlay" (click)="closePopup()" aria-hidden="true"></div>
        <div class="hero__popup" role="dialog" aria-modal="true" aria-label="Oferta exclusiva suscriptores">
          <button class="hero__popup-close" (click)="closePopup()" aria-label="Cerrar oferta">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <p class="hero__popup-label">SOLO PARA SUSCRIPTORES</p>
          <p class="hero__popup-title">−10% en tu<br>primer pedido</p>
          <p class="hero__popup-sub">Únete a más de 400 clientes que ya disfrutan de la crema</p>
          <form class="hero__popup-form" (submit)="submitEmail($event)">
            <input
              type="email"
              class="hero__popup-input"
              placeholder="tu@email.com"
              [(ngModel)]="popupEmail"
              name="popupEmail"
              required
              aria-label="Tu email">
            <button type="submit" class="hero__popup-btn" [disabled]="submitting()">
              {{ submitting() ? 'Enviando...' : 'Quiero el descuento' }}
            </button>
          </form>
          <p class="hero__popup-legal">Sin spam. Baja cuando quieras.</p>
        </div>
      }

      @if (emailSubmitted()) {
        <div class="hero__popup-overlay" (click)="closePopup()" aria-hidden="true"></div>
        <div class="hero__popup hero__popup--success" role="dialog" aria-modal="true" aria-label="Confirmación">
          <button class="hero__popup-close" (click)="closePopup()" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="hero__popup-check">✓</div>
          <p class="hero__popup-title">¡Listo!</p>
          <p class="hero__popup-sub">Revisa tu email. Tu código de descuento llegará en breve.</p>
        </div>
      }
    </section>
  `,
  styles: [`
    $brand:  #7B1716;
    $accent: #E6C15A;
    $bg:     #F4F1E9;
    $ink:    #1C1A14;
    $muted:  #6B6456;

    :host { display: block; }

    .hero {
      position: relative;
      width: 100%;
      height: 100dvh;
      min-height: 560px;
      overflow: hidden;
      background: $ink;
    }

    .hero__video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }

    .hero__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba($ink, 0.15) 0%,
        rgba($ink, 0.35) 50%,
        rgba($ink, 0.72) 100%
      );
      pointer-events: none;
    }

    .hero__content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2.5rem 2rem 3.5rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1.25rem;
      max-width: 760px;

      @media (min-width: 769px) {
        padding: 3rem 5vw 5rem;
      }
    }

    .hero__review {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .hero__stars {
      color: $accent;
      font-size: 0.9rem;
      letter-spacing: 2px;
    }

    .hero__review-text {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.82rem;
      color: rgba(#F4F1E9, 0.85);
    }

    .hero__h1 {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(3.2rem, 8vw, 6rem);
      line-height: 0.92;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $bg;
      margin: 0;
    }

    .hero__tagline {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.9rem;
      color: rgba(#F4F1E9, 0.75);
      margin: 0;
      letter-spacing: 0.04em;
    }

    .hero__ctas {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .hero__btn-primary {
      display: inline-flex;
      align-items: center;
      background: $accent;
      color: $ink;
      padding: 0.8rem 2rem;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.82rem;
      text-decoration: none;
      transition: background 150ms, transform 150ms;
      white-space: nowrap;

      &:hover { background: lighten($accent, 6%); transform: translateY(-1px); }
    }

    .hero__btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: rgba(#F4F1E9, 0.9);
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 0.82rem;
      text-decoration: none;
      transition: color 150ms;

      &:hover { color: $accent; }
    }

    // ── Email pop-up ──────────────────────────────────────
    .hero__popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba($ink, 0.55);
      z-index: 400;
      animation: fadeIn 250ms ease;

      @media (max-width: 768px) { display: none; }
    }

    @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    @keyframes slideUpBanner { from { transform: translateY(100%) } to { transform: translateY(0) } }

    .hero__popup {
      position: fixed;
      z-index: 401;
      background: $bg;
      padding: 2rem 1.75rem 1.75rem;
      animation: slideUp 300ms ease;

      // Desktop: centered modal
      @media (min-width: 769px) {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(420px, 92vw);
        border-radius: 8px;
        box-shadow: 0 24px 64px rgba($ink, 0.28);
      }

      // Mobile: bottom banner
      @media (max-width: 768px) {
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 16px 16px 0 0;
        padding: 1.5rem 1.25rem 2rem;
        box-shadow: 0 -8px 32px rgba($ink, 0.2);
        animation: slideUpBanner 350ms cubic-bezier(0.32, 0.72, 0, 1);
      }

      &--success {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.75rem;
      }
    }

    .hero__popup-close {
      position: absolute;
      top: 0.85rem;
      right: 0.85rem;
      background: none;
      border: none;
      cursor: pointer;
      color: $muted;
      padding: 0.3rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 150ms, background 150ms;

      &:hover { color: $brand; background: rgba($brand, 0.06); }
    }

    .hero__popup-label {
      font-family: 'Poppins', sans-serif;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: $brand;
      margin: 0 0 0.25rem;
    }

    .hero__popup-title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 2.2rem;
      line-height: 0.95;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: $brand;
      margin: 0 0 0.5rem;
    }

    .hero__popup-sub {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.88rem;
      color: $muted;
      margin: 0 0 1rem;
      line-height: 1.5;
    }

    .hero__popup-form {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .hero__popup-input {
      width: 100%;
      padding: 0.7rem 1rem;
      border: 1.5px solid rgba($ink, 0.15);
      border-radius: 6px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      background: white;
      color: $ink;
      outline: none;
      transition: border-color 150ms;
      box-sizing: border-box;

      &:focus { border-color: $brand; }
      &::placeholder { color: rgba($muted, 0.6); }
    }

    .hero__popup-btn {
      width: 100%;
      padding: 0.8rem;
      background: $brand;
      color: $accent;
      border: none;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms;

      &:hover { background: lighten($brand, 6%); }
    }

    .hero__popup-legal {
      font-family: 'Poppins', sans-serif;
      font-size: 0.68rem;
      color: rgba($muted, 0.7);
      text-align: center;
      margin: 0.5rem 0 0;
    }

    .hero__popup-check {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba($brand, 0.08);
      color: $brand;
      font-size: 1.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class HeroBlockComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() videoSrc = '';
  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  private platformId = inject(PLATFORM_ID);
  private newsletterService = inject(NewsletterService);

  readonly showPopup = signal(false);
  readonly emailSubmitted = signal(false);
  readonly submitting = signal(false);
  popupEmail = '';

  private scrollCount = 0;
  private dismissed = false;
  private scrollHandler: (() => void) | null = null;
  private popupTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.popupTimer = setTimeout(() => {
      if (!this.dismissed && !this.showPopup() && !this.emailSubmitted()) {
        this.showPopup.set(true);
      }
    }, 30000);

    this.scrollHandler = () => {
      this.scrollCount++;
      if (this.scrollCount >= 2 && !this.dismissed && !this.showPopup() && !this.emailSubmitted()) {
        this.showPopup.set(true);
      }
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const video = this.videoEl?.nativeElement;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }

  ngOnDestroy(): void {
    if (this.popupTimer) clearTimeout(this.popupTimer);
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  closePopup(): void {
    this.dismissed = true;
    this.showPopup.set(false);
    this.emailSubmitted.set(false);
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
      this.popupTimer = null;
    }
  }

  submitEmail(event: Event): void {
    event.preventDefault();
    if (!this.popupEmail || this.submitting()) return;

    this.submitting.set(true);
    this.newsletterService.subscribe(this.popupEmail).subscribe({
      next: () => {
        this.submitting.set(false);
        this.dismissed = true;
        this.showPopup.set(false);
        this.emailSubmitted.set(true);
      },
      error: () => {
        // Best-effort: keep the UX simple, don't punish the user for a backend hiccup.
        this.submitting.set(false);
        this.dismissed = true;
        this.showPopup.set(false);
        this.emailSubmitted.set(true);
      },
    });
  }
}
