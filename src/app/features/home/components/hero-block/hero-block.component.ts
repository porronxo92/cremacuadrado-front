import { Component, Input, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero-block',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  `]
})
export class HeroBlockComponent implements AfterViewInit {
  @Input() videoSrc = '';
  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const video = this.videoEl?.nativeElement;
    if (video) {
      video.muted = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        video.pause();  // WCAG 2.2.2 / 2.3.3: sin vídeo en bucle si el usuario pide menos movimiento
        return;
      }
      video.play().catch(() => {});
    }
  }
}
