import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { MiniCartService } from '../../core/services/mini-cart.service';
import { ToastService } from '../../core/services/toast.service';
import { SeoService } from '../../core/services/seo.service';
import { NewsletterService } from '../../core/services/newsletter.service';
import { PrivacyNoticeComponent } from '../../shared/components/privacy-notice/privacy-notice.component';
import { FormsModule } from '@angular/forms';
import { ProductListItem, ProductVariant } from '../../core/models';
import { HeroBlockComponent } from './components/hero-block/hero-block.component';
import { TrilogiaBlockComponent } from './components/trilogia-block/trilogia-block.component';
import { StoresBlockComponent } from './components/stores-block/stores-block.component';
import { environment } from '@env/environment';

@Component({
    selector: 'app-home',
    imports: [CommonModule, NgOptimizedImage, RouterModule, FormsModule, HeroBlockComponent, TrilogiaBlockComponent, StoresBlockComponent, PrivacyNoticeComponent],
    template: `
    <!-- Bloque 1: Hero + método («¿Por qué sabe así CremaCuadrado?») -->
    <app-hero-block videoSrc="assets/videos/crema-pistacho-artesanal-hero.mp4" />
    <app-trilogia-block />

    <!-- Bloque 2: Los dos productos -->
    <section class="products" id="productos">
      <div class="container">
        <div class="products__header">
          <h2 class="products__title" tabindex="-1">LAS CREMAS</h2>
          <p class="products__sub">Dos cremas de pistacho manchego: Pura y Crunchy.</p>
        </div>

        @if (loadingProducts()) {
          <div class="products__loading">
            <div class="spinner"></div>
          </div>
        } @else {
          <div class="products__grid">
            @for (product of featuredProducts(); track product.id) {
              <article class="product-card">
                <a [routerLink]="['/tienda', product.slug]" class="product-card__img-wrap">
                  <img
                    [ngSrc]="product.primary_image || '/assets/images/placeholder.jpg'"
                    [alt]="product.name + ', crema de pistacho manchego'"
                    fill>
                  @if (getSelectedVariant(product)?.compare_price; as prior) {
                    <span class="product-card__badge">Antes {{ prior | currency:'EUR' }}</span>
                  }
                </a>
                <div class="product-card__body">
                  <a [routerLink]="['/tienda', product.slug]" class="product-card__name">{{ product.name }}</a>
                  <p class="product-card__tagline">{{ product.short_description }}</p>
                  @if (product.variants && product.variants.length > 1) {
                    <div class="product-card__variants">
                      @for (variant of product.variants; track variant.id) {
                        <button
                          class="variant-btn"
                          [class.variant-btn--active]="getSelectedVariant(product)?.id === variant.id"
                          [disabled]="!variant.is_in_stock"
                          (click)="selectVariant(product, variant, $event)">
                          {{ variant.format }}
                          @if (!variant.is_in_stock) { <span class="variant-btn__oos">Agotado</span> }
                        </button>
                      }
                    </div>
                  }
                  <div class="product-card__footer">
                    <span class="product-card__price">{{ (getSelectedVariant(product)?.price ?? 0) | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                    @if (getSelectedVariant(product); as sv) {
                      @if (sv.is_in_stock) {
                        <div class="qty" role="group" [attr.aria-label]="'Cantidad de ' + product.name">
                          <button type="button" class="qty__btn" (click)="changeQty(product, sv, -1)"
                            [disabled]="quantity(product) <= 1"
                            [attr.aria-label]="'Quitar una unidad de ' + product.name + ' ' + sv.format">−</button>
                          <span class="qty__val" aria-live="polite" aria-atomic="true"><span class="sr-only">Cantidad: </span>{{ quantity(product) }}</span>
                          <button type="button" class="qty__btn" (click)="changeQty(product, sv, 1)"
                            [disabled]="quantity(product) >= maxQty(sv)"
                            [attr.aria-label]="'Añadir una unidad de ' + product.name + ' ' + sv.format">+</button>
                        </div>
                      }
                    }
                    <button type="button" class="product-card__cta" (click)="addToCart(product)"
                      [disabled]="!(getSelectedVariant(product)?.is_in_stock) || addingId() === product.id"
                      [attr.aria-busy]="addingId() === product.id"
                      [attr.aria-label]="(getSelectedVariant(product)?.is_in_stock) ? 'Añadir al carrito: ' + quantity(product) + ' × ' + product.name + ' ' + (getSelectedVariant(product)?.format ?? '') : null">
                      @if (!(getSelectedVariant(product)?.is_in_stock)) { Sin stock }
                      @else if (addingId() === product.id) { Añadiendo… }
                      @else { <span class="product-card__cta-long">Añadir al carrito</span><span class="product-card__cta-short" aria-hidden="true">Añadir</span> }
                    </button>
                  </div>
                </div>
              </article>
            }
          </div>
        }

        <div class="products__more">
          <a routerLink="/tienda" class="btn-outline">Ver toda la tienda</a>
        </div>
      </div>
    </section>

    <!-- Bloque 3: Dónde comprar (mapa en diferido y con consentimiento) -->
    <app-stores-block />

    <!-- Bloque 4: B2B (franja breve; los argumentos viven en /para-tiendas) -->
    <section class="b2b" aria-labelledby="b2b-title">
      <div class="container b2b__inner">
        <div class="b2b__text">
          <h2 class="b2b__title" id="b2b-title">Para tu negocio</h2>
          <p class="b2b__sub">Tiendas, restaurantes y obradores también pueden trabajar con CremaCuadrado.</p>
        </div>
        <a routerLink="/para-tiendas" class="b2b__cta">Ver condiciones</a>
      </div>
    </section>

    <!-- Bloque 5: Captura de email -->
    <section class="newsletter">
      <div class="container">
        <div class="newsletter__inner">
          <div class="newsletter__text">
            <h2 class="newsletter__title">RECETAS Y NOVEDADES</h2>
            <p class="newsletter__offer">Suscríbete y te enviamos un código con un <strong>10&nbsp;% de descuento</strong> para tu primer pedido. <em>Sin spam.</em></p>
          </div>
          <form class="newsletter__form" (submit)="subscribeNewsletter($event)">
            <input
              type="email"
              class="newsletter__input"
              placeholder="tu@email.com"
              name="newsletterEmail"
              [(ngModel)]="newsletterEmail"
              required
              aria-label="Tu email">
            <button type="submit" class="newsletter__btn" [disabled]="newsletterSending() || !newsletterConsent">Suscribirme</button>
            <label class="newsletter__consent">
              <input type="checkbox" name="newsletterConsent" [(ngModel)]="newsletterConsent">
              <span>Acepto recibir recetas, novedades y ofertas por email. Puedo darme de baja cuando quiera.</span>
            </label>
            <app-privacy-notice purpose="enviarte comunicaciones comerciales" legalBasis="tu consentimiento" />
          </form>
        </div>
      </div>
    </section>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    $brand:  #7B1716;
    $accent: #E6C15A;
    $bg:     #F4F1E9;
    $bg-alt: #EDE9DF;
    $ink:    #1C1A14;
    $muted:  #6B6456;
    $border: rgba(28, 26, 20, 0.1);

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    // ── Productos ─────────────────────────────────────────
    .products {
      padding: 2.5rem 0 5rem;
      background: white;
      scroll-margin-top: 105px;  // cabecera sticky + barra de anuncio

      @media (max-width: 768px) { padding: 1.75rem 0 4rem; }
    }

    .products__header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .products__title:focus { outline: none; }
    .products__title:focus-visible { outline: revert; }

    .products__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(2rem, 4vw, 2.8rem);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $brand;
      margin: 0 0 0.4rem;
    }

    .products__sub {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1rem;
      color: $muted;
      margin: 0;
    }

    .products__loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 2px solid $border;
      border-top-color: $brand;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg) } }

    .products__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
        max-width: 420px;
        margin: 0 auto;
      }
    }

    .product-card {
      border: 1px solid $border;
      border-radius: 6px;
      overflow: hidden;
      transition: box-shadow 200ms, transform 200ms;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          box-shadow: 0 12px 32px rgba($ink, 0.08);
          transform: translateY(-2px);
        }
      }
    }

    .product-card__img-wrap {
      display: block;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: $bg-alt;
      position: relative;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 300ms ease;
      }

      &:hover img { transform: scale(1.04); }
    }

    .product-card__badge {
      position: absolute;
      top: 0.6rem;
      left: 0.6rem;
      background: $brand;
      color: $accent;
      font-family: 'Poppins', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.2rem 0.5rem;
      border-radius: 3px;
    }

    .product-card__body {
      padding: 1.25rem;
    }

    .product-card__name {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 1.5rem;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: $ink;
      text-decoration: none;
      display: block;
      margin-bottom: 0.2rem;

      &:hover { color: $brand; }
    }

    .product-card__tagline {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.8rem;
      color: $muted;
      margin: 0 0 0.75rem;
    }

    .product-card__variants {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-bottom: 0.9rem;
    }

    .variant-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      min-width: 56px;
      padding: 0.25rem 1rem;
      border: 1.5px solid $border;
      border-radius: 22px;
      background: transparent;
      color: $ink;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 150ms, color 150ms, background 150ms;
      line-height: 1.4;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;

      // Hover solo en dispositivos con puntero real: en táctil se quedaba «pegado»
      @media (hover: hover) and (pointer: fine) {
        &:hover:not(:disabled):not(.variant-btn--active) {
          border-color: $brand;
          color: $brand;
        }
      }

      // Activo: blanco sobre granate (≈ 11:1), mismo aspecto con o sin hover/foco
      &--active,
      &--active:hover,
      &--active:focus,
      &--active:active {
        border-color: $brand;
        background: $brand;
        color: $bg;
      }

      &:disabled {
        border-color: rgba($ink, 0.12);
        color: $muted;
        cursor: not-allowed;
        text-decoration: line-through;
      }

      &__oos {
        display: none;  // etiqueta oculta, accesibilidad via disabled+strikethrough
      }
    }

    .product-card__footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    // Selector de cantidad (mismo patrón que la compra rápida de /tienda)
    .qty {
      display: inline-flex;
      align-items: center;
      margin-left: auto;
      border: 1.5px solid $brand;
      border-radius: 24px;
      background: $bg;
      overflow: hidden;
    }

    .qty__btn {
      width: 44px;
      height: 44px;
      border: none;
      background: $bg;
      color: $brand;
      font-family: 'Poppins', sans-serif;
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;

      @media (hover: hover) and (pointer: fine) {
        &:hover:not(:disabled) { background: $brand; color: $bg; }
      }
      &:disabled { opacity: 0.35; cursor: default; }
    }

    .qty__val {
      min-width: 2rem;
      text-align: center;
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: $ink;
    }

    .product-card__price {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 1.6rem;
      color: $brand;
      letter-spacing: -0.01em;
      line-height: 1;
    }

    .product-card__cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0.6rem 1.25rem;
      background: $bg;
      color: $brand;
      border: 1.5px solid $brand;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms, color 150ms;
      white-space: nowrap;

      &:hover:not(:disabled) { background: $brand; color: $bg; }

      &:disabled {
        border-color: rgba($ink, 0.2);
        color: rgba($ink, 0.35);
        cursor: not-allowed;
      }
    }

    .product-card__cta-short { display: none; }

    // ── Móvil: tarjeta compacta (miniatura centrada + formatos, y fila de compra debajo)
    @media (max-width: 600px) {
      .products__header { margin-bottom: 1.25rem; }
      .products__grid { gap: 0.75rem; }

      .product-card {
        display: grid;
        grid-template-columns: 96px minmax(0, 1fr);
        grid-template-areas:
          "img name"
          "img variants"
          "footer footer";
        column-gap: 0.85rem;
        row-gap: 0.35rem;
        align-items: start;
        padding: 0.75rem;
      }

      .product-card__body { display: contents; }

      .product-card__img-wrap {
        grid-area: img;
        width: 96px;
        aspect-ratio: 1;
        border-radius: 6px;

        img { object-fit: cover; object-position: center; }
      }

      .product-card__badge {
        top: 0.3rem;
        left: 0.3rem;
        font-size: 0.75rem;
        padding: 0.1rem 0.35rem;
      }

      .product-card__name {
        grid-area: name;
        font-size: 1.3rem;
        line-height: 1.05;
        margin: 0.1rem 0 0;
      }

      .product-card__tagline { display: none; }

      .product-card__variants {
        grid-area: variants;
        gap: 0.35rem;
        margin: 0;
      }

      .variant-btn {
        min-width: 48px;
        padding: 0.2rem 0.7rem;
        font-size: 0.78rem;
      }

      .product-card__footer {
        grid-area: footer;
        gap: 0.5rem;
        padding-top: 0.65rem;
        margin-top: 0.3rem;
        border-top: 1px solid $border;
        flex-wrap: nowrap;
      }

      .product-card__price { font-size: 1.5rem; }

      .product-card__cta {
        flex: 1 1 auto;
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
      }

      .product-card__cta-long { display: none; }
      .product-card__cta-short { display: inline; }

      .products__more { margin-top: 1.5rem; }
    }

    @media (max-width: 360px) {
      .product-card { grid-template-columns: 80px minmax(0, 1fr); column-gap: 0.65rem; }
      .product-card__img-wrap { width: 80px; }
      .product-card__name { font-size: 1.15rem; }
      .product-card__variants { gap: 0.25rem; flex-wrap: nowrap; }
      .variant-btn { min-width: 44px; padding: 0.2rem 0.45rem; font-size: 0.75rem; }
      .qty__btn { width: 40px; height: 44px; }
      .qty__val { min-width: 1.6rem; }
      .product-card__cta { padding: 0.5rem; }
    }

    .products__more {
      text-align: center;
      margin-top: 2.5rem;
    }

    .btn-outline {
      display: inline-block;
      padding: 0.7rem 2rem;
      background: transparent;
      color: $brand;
      border: 1.5px solid $brand;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 150ms, color 150ms;

      &:hover { background: $brand; color: $bg; }
    }

    // ── B2B (franja compacta) ─────────────────────────────
    .b2b {
      padding: 2rem 0;
      background: $ink;
    }

    .b2b__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;

      @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }
    }

    .b2b__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(1.8rem, 3.5vw, 2.4rem);
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $accent;
      margin: 0 0 0.3rem;
    }

    .b2b__sub {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1rem;
      line-height: 1.5;
      color: rgba(#F4F1E9, 0.8);
      max-width: 52ch;
      margin: 0;
    }

    .b2b__cta {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0 1.75rem;
      background: $accent;
      color: $ink;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 150ms;

      &:hover { opacity: 0.9; }
    }

    // ── Newsletter ────────────────────────────────────────
    .newsletter {
      padding: 2.5rem 0;
      background: $bg;

      @media (max-width: 600px) { padding: 1.75rem 0; }
    }

    .newsletter__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem 2rem;
      flex-wrap: wrap;
    }

    .newsletter__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(1.8rem, 3.5vw, 2.4rem);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $brand;
      margin: 0 0 0.35rem;
    }

    .newsletter__offer {
      font-family: 'Lora', serif;
      font-size: 1rem;
      line-height: 1.5;
      color: $ink;
      margin: 0;
      strong { color: $brand; }
      em { color: $muted; }
    }

    .newsletter__consent { flex-basis: 100%; display: flex; gap: 0.5rem; align-items: flex-start; font-family: 'Poppins', sans-serif; font-size: 0.75rem; line-height: 1.45; cursor: pointer;
      input { margin-top: 0.15rem; width: 16px; height: 16px; flex-shrink: 0; } }
    .newsletter__form app-privacy-notice { flex-basis: 100%; }

    .newsletter__form {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      flex: 1;
      max-width: 480px;

      // Móvil: email y botón siguen en una fila; consentimiento y aviso debajo
      @media (max-width: 600px) {
        width: 100%;
        max-width: 100%;
      }
    }

    .newsletter__input {
      flex: 1 1 0;
      min-width: 0;
      min-height: 48px;
      padding: 0 1rem;
      font-size: 1rem;  // ≥ 16px: evita el zoom de iOS
      border: 1.5px solid $border;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      background: white;
      color: $ink;
      outline: none;
      transition: border-color 150ms;

      &:focus { border-color: $brand; }
      &::placeholder { color: rgba($muted, 0.55); }
    }

    .newsletter__btn {
      flex: 0 0 auto;
      min-height: 48px;
      padding: 0 1.25rem;
      background: $brand;
      color: $accent;
      border: none;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 150ms;

      &:hover { background: lighten($brand, 6%); }
    }
  `]
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private miniCartService = inject(MiniCartService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private seo = inject(SeoService);

  readonly featuredProducts = signal<ProductListItem[]>([]);
  readonly loadingProducts = signal(true);
  readonly newsletterSending = signal(false);
  newsletterEmail = '';
  newsletterConsent = false;
  private newsletterService = inject(NewsletterService);
  readonly selectedVariants = new Map<number, ProductVariant>();
  readonly quantities = signal<Record<number, number>>({});
  readonly addingId = signal<number | null>(null);

  ngOnInit(): void {
    this.seo.set({
      title: 'Crema de Pistacho Manchego Artesanal',
      description: 'Crema de pistacho manchego artesanal elaborada en Ciudad Real. Pura, con 100% pistacho, y Crunchy. Envíos a península y Baleares.',
      path: '/',
    });
    this.seo.setJsonLd('ld-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'CremaCuadrado',
      url: `${environment.siteUrl}`,
      logo: `${environment.siteUrl}/assets/images/logocrema2-100x100.png`,
    });
    this.seo.setJsonLd('ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'CremaCuadrado',
      url: `${environment.siteUrl}`,
    });

    this.productService.getFeaturedProducts().subscribe({
      next: (products) => {
        const featured = products.slice(0, 2);
        featured.forEach(p => {
          // prefer first in-stock variant; fallback to first if all OOS
          const def = p.variants?.find(v => v.is_in_stock) ?? p.variants?.[0] ?? null;
          if (def) this.selectedVariants.set(p.id, def);
        });
        this.featuredProducts.set(featured);
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  getSelectedVariant(product: ProductListItem): ProductVariant | null {
    return this.selectedVariants.get(product.id) ?? product.variants?.[1] ?? product.variants?.[0] ?? null;
  }

  selectVariant(product: ProductListItem, variant: ProductVariant, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedVariants.set(product.id, variant);
    // La cantidad nunca supera el stock del formato elegido
    if (this.quantity(product) > this.maxQty(variant)) {
      this.quantities.update(q => ({ ...q, [product.id]: this.maxQty(variant) }));
    }
  }

  quantity(product: ProductListItem): number {
    return this.quantities()[product.id] ?? 1;
  }

  maxQty(variant: ProductVariant): number {
    return Math.max(1, variant.stock ?? 1);
  }

  changeQty(product: ProductListItem, variant: ProductVariant, delta: number): void {
    const next = Math.min(this.maxQty(variant), Math.max(1, this.quantity(product) + delta));
    this.quantities.update(q => ({ ...q, [product.id]: next }));
  }

  addToCart(product: ProductListItem): void {
    const variant = this.getSelectedVariant(product);
    if (!variant) {
      this.toastService.error('Selecciona un formato antes de añadir al carrito');
      this.router.navigate(['/tienda', product.slug]);
      return;
    }

    if (this.addingId() !== null) return;
    const opener = document.activeElement;
    this.addingId.set(product.id);
    this.cartService.addItem(variant.id, this.quantity(product)).subscribe({
      next: () => {
        this.addingId.set(null);
        this.quantities.update(q => ({ ...q, [product.id]: 1 }));
        this.miniCartService.open(opener);
      },
      error: (err) => {
        this.addingId.set(null);
        this.toastService.error(err?.message || 'No hemos podido añadir el producto. Inténtalo de nuevo.');
      },
    });
  }

  subscribeNewsletter(event: Event): void {
    event.preventDefault();
    if (!this.newsletterEmail || !this.newsletterConsent || this.newsletterSending()) return;
    this.newsletterSending.set(true);
    this.newsletterService.subscribe(this.newsletterEmail, true, 'homepage_footer').subscribe({
      next: (res) => {
        this.newsletterSending.set(false);
        this.toastService.success(res.message);
        this.newsletterEmail = '';
        this.newsletterConsent = false;
      },
      error: (err) => {
        this.newsletterSending.set(false);
        this.toastService.error(err?.message || 'No hemos podido completar la suscripción');
      },
    });
  }

}
