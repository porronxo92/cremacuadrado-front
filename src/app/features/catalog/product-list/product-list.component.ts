import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ProductListItem } from '../../../core/models';

const PRODUCT_SLUGS = ['crema-pura', 'crema-crunchy'];

const TAGLINES: Record<string, string> = {
  'crema-pura':   'Pistacho manchego tostado al natural, sin nada más',
  'crema-crunchy': 'Con trozos crujientes de pistacho para los que quieren más',
};

const LINE_COLOR: Record<string, string> = {
  'crema-pura':    '#A2BA1C',
  'crema-crunchy': '#F5A542',
};

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="tienda">
      <div class="tienda__hero">
        <p class="tienda__eyebrow">La tienda</p>
        <h1 class="tienda__title">DOS CREMAS.<br>UN ORIGEN.</h1>
        <p class="tienda__subtitle">Pistacho manchego. Obrador en Ciudad Real. Sin aditivos.</p>
      </div>

      @if (loading()) {
        <div class="tienda__loading">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="tienda__grid">
          @for (p of products(); track p.id) {
            <article class="prod-card" [style.--line]="lineColor(p.slug)">
              <a [routerLink]="['/tienda', p.slug]" class="prod-card__image-wrap">
                <img
                  [src]="p.primary_image || '/assets/images/placeholder.jpg'"
                  [alt]="p.name"
                  class="prod-card__image"
                  loading="lazy">
                <div class="prod-card__overlay">
                  <span class="prod-card__cta">Ver producto →</span>
                </div>
              </a>

              <div class="prod-card__body">
                <div class="prod-card__line-indicator"></div>
                <h2 class="prod-card__name">{{ p.name | uppercase }}</h2>
                <p class="prod-card__tagline">{{ tagline(p.slug) }}</p>
                <div class="prod-card__price-row">
                  <span class="prod-card__price">{{ p.price / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                  <span class="prod-card__per100">desde 100g</span>
                </div>
                <a [routerLink]="['/tienda', p.slug]" class="prod-card__btn">
                  Elegir formato
                </a>
              </div>
            </article>
          }
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
    $card:   #EDE9DF;
    $border: rgba(28,26,20,0.1);

    :host { display: block; background: $bg; min-height: 100vh; }

    /* ── Hero ── */
    .tienda__hero {
      text-align: center;
      padding: 5rem 1.5rem 3rem;
    }

    .tienda__eyebrow {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: $muted;
      margin-bottom: 0.75rem;
    }

    .tienda__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(3rem, 8vw, 6rem);
      line-height: 1;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      color: $brand;
      margin: 0 0 1rem;
    }

    .tienda__subtitle {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1rem;
      color: $muted;
      max-width: 440px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ── Loading ── */
    .tienda__loading {
      display: flex;
      justify-content: center;
      padding: 6rem;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid $border;
      border-top-color: $brand;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Grid ── */
    .tienda__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2px;
      max-width: 1200px;
      margin: 0 auto 5rem;
      padding: 0 1.5rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 0 1rem;
      }
    }

    /* ── Product card ── */
    .prod-card {
      background: $card;
      overflow: hidden;
      border-radius: 4px;
    }

    .prod-card__image-wrap {
      display: block;
      position: relative;
      aspect-ratio: 4/5;
      overflow: hidden;
      background: darken($card, 3%);
    }

    .prod-card__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .prod-card__image-wrap:hover .prod-card__image {
      transform: scale(1.04);
    }

    .prod-card__overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      padding: 1.5rem;
      background: linear-gradient(to top, rgba(28,26,20,0.55) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.3s;
    }

    .prod-card__image-wrap:hover .prod-card__overlay { opacity: 1; }

    .prod-card__cta {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: $accent;
      letter-spacing: 0.04em;
    }

    .prod-card__body {
      padding: 1.75rem 1.75rem 2rem;
    }

    .prod-card__line-indicator {
      width: 36px;
      height: 3px;
      background: var(--line, #A2BA1C);
      border-radius: 2px;
      margin-bottom: 1rem;
    }

    .prod-card__name {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 2rem;
      letter-spacing: -0.01em;
      color: $ink;
      margin: 0 0 0.4rem;
      line-height: 1;
    }

    .prod-card__tagline {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.88rem;
      color: $muted;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    .prod-card__price-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .prod-card__price {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 1.8rem;
      color: $brand;
      line-height: 1;
    }

    .prod-card__per100 {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 300;
      color: $muted;
    }

    .prod-card__btn {
      display: inline-flex;
      align-items: center;
      padding: 0.65rem 1.5rem;
      background: $bg;
      color: $brand;
      border: 1.5px solid $brand;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 150ms, color 150ms;

      &:hover {
        background: $brand;
        color: $bg;
      }
    }
  `]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products = signal<ProductListItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.productService.getProducts({ page_size: 10 }).subscribe({
      next: (response) => {
        const ordered = PRODUCT_SLUGS
          .map(slug => response.items.find(p => p.slug === slug))
          .filter((p): p is ProductListItem => !!p);
        this.products.set(ordered.length ? ordered : response.items.slice(0, 2));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  tagline(slug: string): string {
    return TAGLINES[slug] ?? '';
  }

  lineColor(slug: string): string {
    return LINE_COLOR[slug] ?? '#A2BA1C';
  }
}
