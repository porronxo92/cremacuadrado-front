import { Component, OnInit, OnDestroy, ElementRef, ViewChildren, QueryList, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

interface TimelineEvent {
  year: string;
  title: string;
  content: string;
  image: string;
}

@Component({
    selector: 'app-about',
    imports: [CommonModule, RouterModule],
    template: `
    <div class="about-page">
      <!-- Hero Banner -->
      <section class="about-hero">
        <img
          src="assets/images/nosotros/principal-quienes.somos2_.jpg"
          alt="Stefano y Lucas, fundadores de CremaCuadrado"
          class="about-hero__img"
        >
        <div class="about-hero__overlay"></div>
        <div class="about-hero__content">
          <span class="about-hero__tag">Nuestra historia</span>
          <h1>La Génesis de<br>CremaCuadrado</h1>
          <p class="about-hero__sub">De Terni a Ciudad Real: cómo empezó CremaCuadrado</p>
        </div>
      </section>

      <!-- Timeline -->
      <section class="timeline-section">
        <div class="container">
          <div class="timeline">
            <!-- Línea central animada -->
            <div class="timeline__line" [style.height.%]="lineProgress"></div>

            @for (event of timelineEvents; track event.title; let i = $index) {
              <div
                #timelineItem
                class="timeline__item"
                [class.timeline__item--visible]="visibleItems[i]"
                [class.timeline__item--right]="i % 2 !== 0"
              >
                <!-- Marker año -->
                <div class="timeline__marker">
                  <span class="timeline__year">{{ event.year }}</span>
                </div>

                <!-- Contenido -->
                <div class="timeline__content">
                  <div class="timeline__card">
                    <div class="timeline__image">
                      <img [src]="event.image" [alt]="event.title" loading="lazy">
                    </div>
                    <div class="timeline__text">
                      <span class="timeline__step">{{ i + 1 }} / {{ timelineEvents.length }}</span>
                      <h3>{{ event.title }}</h3>
                      <p>{{ event.content }}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="about-cta">
        <div class="container">
          <h2>Prueba el pistacho manchego</h2>
          <div class="about-cta__divider"></div>
          <p>Crema de pistacho 100% natural, elaborada en Ciudad Real.</p>
          <a routerLink="/tienda" class="btn btn--cta">Ver productos</a>
        </div>
      </section>
    </div>
  `,
    styles: [`
    // ── Variables locales ───────────────────────────────
    $brand:   #7B1716;
    $accent:  #E6C15A;
    $bg:      #F4F1E9;
    $bg-alt:  #EDE9DD;
    $text:    #1A1208;
    $text-lt: #5A4F3E;
    $text-mt: #8C7F6A;

    .about-page {
      background: $bg;
      min-height: 100vh;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    // ── Hero Banner ─────────────────────────────────────
    .about-hero {
      position: relative;
      width: 100%;
      height: 65vh;
      min-height: 400px;
      max-height: 600px;
      overflow: hidden;

      @media (max-width: 768px) {
        height: 55vh;
        min-height: 340px;
      }
    }

    .about-hero__img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 20%;
    }

    .about-hero__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(26, 18, 8, 0.1) 0%,
        rgba(26, 18, 8, 0.5) 70%,
        rgba(26, 18, 8, 0.75) 100%
      );
    }

    .about-hero__content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 3.5rem;
      text-align: center;
      z-index: 1;
    }

    .about-hero__tag {
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: $accent;
      margin-bottom: 0.75rem;
    }

    .about-hero__content h1 {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 3.5rem;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      line-height: 1;
      color: #F4F1E9;
      margin: 0 0 0.75rem;

      @media (max-width: 768px) {
        font-size: 2.5rem;
      }
    }

    .about-hero__sub {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1.1rem;
      color: rgba(244, 241, 233, 0.85);
      margin: 0;
    }

    // ── Timeline Section ────────────────────────────────
    .timeline-section {
      padding: 5rem 0 6rem;
    }

    .timeline {
      position: relative;
      max-width: 900px;
      margin: 0 auto;
    }

    // Línea central animada
    .timeline__line {
      position: absolute;
      left: 50%;
      top: 0;
      width: 3px;
      background: linear-gradient(to bottom, $brand, $accent);
      transform: translateX(-50%);
      border-radius: 2px;
      transition: height 100ms ease-out;

      @media (max-width: 768px) {
        left: 16px;
      }
    }

    // Cada item
    .timeline__item {
      position: relative;
      margin-bottom: 4rem;
      display: flex;
      justify-content: flex-start;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.6s ease, transform 0.6s ease;

      &--visible {
        opacity: 1;
        transform: translateY(0);
      }

      &--right {
        justify-content: flex-end;

        @media (max-width: 768px) {
          justify-content: flex-start;
        }
      }

      @media (max-width: 768px) {
        padding-left: 50px;
        margin-bottom: 3rem;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    // Marker año
    .timeline__marker {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;

      @media (max-width: 768px) {
        left: 16px;
      }
    }

    .timeline__year {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 66px;
      height: 66px;
      background: $brand;
      color: $accent;
      border-radius: 50%;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.8rem;
      letter-spacing: 0.02em;
      box-shadow: 0 4px 18px rgba(123, 23, 22, 0.25);
      border: 3px solid $bg;
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      @media (max-width: 768px) {
        width: 48px;
        height: 48px;
        font-size: 0.65rem;
      }
    }

    .timeline__item--visible .timeline__year {
      animation: pulse-year 0.6s ease forwards;
    }

    @keyframes pulse-year {
      0%   { transform: scale(0.8); }
      50%  { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    // Contenido
    .timeline__content {
      width: calc(50% - 55px);

      @media (max-width: 768px) {
        width: 100%;
      }
    }

    .timeline__item--right .timeline__content {
      @media (min-width: 769px) {
        margin-left: auto;
      }
    }

    .timeline__card {
      background: #fff;
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 6px 24px rgba(26, 18, 8, 0.08);
      transition: transform 0.35s ease, box-shadow 0.35s ease;

      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 14px 36px rgba(26, 18, 8, 0.13);
      }
    }

    .timeline__image {
      position: relative;
      height: 200px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      &:hover img {
        transform: scale(1.05);
      }

      @media (max-width: 768px) {
        height: 160px;
      }
    }

    .timeline__text {
      padding: 1.5rem;

      @media (max-width: 768px) {
        padding: 1.25rem;
      }
    }

    .timeline__step {
      font-family: 'Poppins', sans-serif;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: $text-mt;
    }

    .timeline__text h3 {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 1.5rem;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: $brand;
      margin: 0.35rem 0 0.6rem;
    }

    .timeline__text p {
      font-family: 'Lora', serif;
      font-size: 0.95rem;
      line-height: 1.7;
      color: $text-lt;
      margin: 0;
    }

    // ── CTA Section ─────────────────────────────────────
    .about-cta {
      background: $brand;
      padding: 4.5rem 0;
      text-align: center;

      h2 {
        font-family: 'Teko', sans-serif;
        font-weight: 700;
        font-size: 2.5rem;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        color: $accent;
        margin: 0;

        @media (max-width: 768px) {
          font-size: 2rem;
        }
      }
    }

    .about-cta__divider {
      width: 3rem;
      height: 2px;
      background: rgba(244, 241, 233, 0.3);
      margin: 1rem auto 1.25rem;
    }

    .about-cta p {
      font-family: 'Lora', serif;
      font-size: 1.05rem;
      color: rgba(244, 241, 233, 0.85);
      margin: 0 0 2rem;
    }

    .btn--cta {
      display: inline-flex;
      align-items: center;
      background-color: $accent;
      color: $brand;
      padding: 0.75rem 2.5rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-decoration: none;
      border-radius: 2px;
      border: 2px solid $accent;
      transition: background 200ms ease, color 200ms ease;

      &:hover {
        background-color: transparent;
        color: $accent;
      }
    }
  `]
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private seo = inject(SeoService);

  @ViewChildren('timelineItem') timelineItems!: QueryList<ElementRef>;

  visibleItems: boolean[] = [];
  lineProgress = 0;

  private observer!: IntersectionObserver;
  private scrollHandler = () => this.onScroll();

  timelineEvents: TimelineEvent[] = [
    {
      year: '2014',
      title: 'El encuentro',
      content: 'Stefano Armadoro, de Terni (Italia), y Lucas Anguita, de Ciudad Real, se conocieron en Ciudad Real en 2014. Unos meses después, cada uno vivía en casa del otro.',
      image: 'assets/images/nosotros/1.jpg'
    },
    {
      year: '2014',
      title: 'El experto en pistacho',
      content: 'Stefano llegó a Ciudad Real para estudiar la planta del pistacho. Con los años se convirtió en especialista y asesor. Adquirió los conocimientos técnicos en el centro de investigación agroambiental CIAG "El Chaparrillo".',
      image: 'assets/images/nosotros/2.jpg'
    },
    {
      year: '2015',
      title: 'El diseñador en Italia',
      content: 'Lucas se fue a Italia, donde perfeccionó su oficio de diseñador gráfico y aprendió marketing. Allí también descubrió la tradición culinaria del pistacho, con usos y sabores que más tarde fueron clave para el proyecto.',
      image: 'assets/images/nosotros/3.jpg'
    },
    {
      year: '2022',
      title: 'El reencuentro',
      content: 'Lucas volvió a Ciudad Real y se reencontró con Stefano. Los dos compartían interés por el pistacho, así que juntaron su formación y su experiencia para crear CremaCuadrado.',
      image: 'assets/images/nosotros/4.jpg'
    },
    {
      year: '2022',
      title: 'Nace CremaCuadrado',
      content: 'El pistacho está en auge en España, y Castilla-La Mancha produce alrededor del 80% del pistacho nacional. Stefano y Lucas quisieron darle más valor a ese fruto con nuevas formas de consumirlo.',
      image: 'assets/images/nosotros/5.jpg'
    },
    {
      year: '2023',
      title: 'El mayor desafío',
      content: 'Explicar para qué sirve el pistacho en la cocina. La cultura culinaria está muy arraigada y cuesta que entre algo nuevo. Con investigación y divulgación, quieren que el pistacho tenga un sitio en la despensa de cualquier casa.',
      image: 'assets/images/nosotros/6.jpg'
    },
    {
      year: 'Hoy',
      title: 'Seguimos',
      content: 'Seguimos investigando y desarrollando la crema, con la mirada puesta en la tradición pistachera de nuestra tierra.',
      image: 'assets/images/nosotros/7.jpg'
    }
  ];

  ngOnInit(): void {
    this.seo.set({
      title: 'Nuestro Método',
      description: 'Tostado, repelado mecánico y molino de piedra: así elaboramos la crema de pistacho manchego en nuestro obrador de Ciudad Real.',
      path: '/nuestro-metodo',
    });

    this.visibleItems = this.timelineEvents.map(() => false);

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // IntersectionObserver para animar cada item al entrar en viewport
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = this.timelineItems
              .toArray()
              .findIndex((el) => el.nativeElement === entry.target);
            if (idx !== -1) {
              this.visibleItems[idx] = true;
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    this.timelineItems.forEach((item) => this.observer.observe(item.nativeElement));
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.observer?.disconnect();
    }
  }

  private onScroll(): void {
    const scrollTop = window.scrollY;
    // Progreso de la línea del timeline
    const timelineSection = document.querySelector('.timeline-section') as HTMLElement;
    if (timelineSection) {
      const rect = timelineSection.getBoundingClientRect();
      const sectionTop = rect.top + scrollTop;
      const sectionHeight = timelineSection.offsetHeight;
      const relativeScroll = scrollTop - sectionTop + window.innerHeight * 0.5;
      this.lineProgress = Math.max(0, Math.min((relativeScroll / sectionHeight) * 100, 100));
    }
  }
}
