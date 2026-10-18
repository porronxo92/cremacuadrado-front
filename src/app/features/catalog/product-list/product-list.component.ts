import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { SeoService } from '../../../core/services/seo.service';
import { CartService } from '../../../core/services/cart.service';
import { MiniCartService } from '../../../core/services/mini-cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductListItem, ProductVariant } from '../../../core/models';

const PRODUCT_SLUGS = ['crema-pistacho-pura', 'crema-pistacho-crunchy'];

const TAGLINES: Record<string, string> = {
  'crema-pistacho-pura': 'Pistacho manchego tostado, repelado y molido en piedra.',
  'crema-pistacho-crunchy': 'Con trozos crujientes de pistacho. Va bien de topping.',
};

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterModule],
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
          @for (p of products(); track p.id; let i = $index) {
            <article class="prod-card" [style.--line]="p.badge_color || '#A2BA1C'">
              <a [routerLink]="['/tienda', p.slug]" class="prod-card__image-wrap">
                <img
                  [ngSrc]="p.primary_image || '/assets/images/placeholder.jpg'"
                  [alt]="p.name"
                  class="prod-card__image"
                  fill
                  [priority]="i === 0">
                <span class="prod-card__badge" [style.background]="p.badge_color || '#A2BA1C'">
                  {{ selectedVariant(p)?.format || 'Formato' }}
                </span>
                <div class="prod-card__overlay">
                  <span class="prod-card__cta">Ver producto →</span>
                </div>
              </a>

              <div class="prod-card__body">
                <div class="prod-card__line-indicator"></div>
                <h2 class="prod-card__name"><a [routerLink]="['/tienda', p.slug]" class="prod-card__name-link">{{ p.name | uppercase }}</a></h2>
                <p class="prod-card__tagline">{{ tagline(p.slug) }}</p>

                @if ((p.variants?.length || 0) > 1) {
                  <div class="prod-card__formats" role="group" [attr.aria-label]="'Selecciona formato para ' + p.name">
                    @for (variant of p.variants || []; track variant.id) {
                      <button
                        type="button"
                        class="prod-card__format-btn"
                        [class.is-active]="selectedVariantId(p) === variant.id"
                        [class.is-disabled]="!variant.is_in_stock"
                        [disabled]="!variant.is_in_stock"
                        [attr.aria-pressed]="selectedVariantId(p) === variant.id"
                        (click)="selectVariant(p, variant)">
                        {{ variant.format }}
                      </button>
                    }
                  </div>
                }

                <div class="prod-card__price-row">
                  <span class="prod-card__price">{{ (selectedVariant(p)?.price ?? 0) | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                  <span class="prod-card__per100">{{ selectedVariant(p)?.format || 'Formato' }}</span>
                </div>
                @if (selectedVariant(p); as sv) {
                  <div class="prod-card__buy">
                    @if (sv.is_in_stock) {
                      @if (sv.is_low_stock) {
                        <p class="prod-card__stock">Solo quedan {{ sv.stock }} unidades</p>
                      }
                      <div class="prod-card__qty" role="group" [attr.aria-label]="'Cantidad de ' + p.name">
                        <button type="button" class="prod-card__qty-btn"
                          (click)="changeQty(p, sv, -1)"
                          [disabled]="quantity(p) <= 1"
                          [attr.aria-label]="'Quitar una unidad de ' + p.name + ' ' + sv.format">−</button>
                        <span class="prod-card__qty-val" aria-live="polite" aria-atomic="true">
                          <span class="sr-only">Cantidad: </span>{{ quantity(p) }}
                        </span>
                        <button type="button" class="prod-card__qty-btn"
                          (click)="changeQty(p, sv, 1)"
                          [disabled]="quantity(p) >= maxQty(sv)"
                          [attr.aria-label]="'Añadir una unidad de ' + p.name + ' ' + sv.format">+</button>
                      </div>
                    }
                    <button type="button" class="prod-card__btn"
                      (click)="addToCart(p, sv)"
                      [disabled]="!sv.is_in_stock || addingId() === p.id"
                      [attr.aria-busy]="addingId() === p.id">
                      @if (!sv.is_in_stock) { Agotado }
                      @else if (addingId() === p.id) { Añadiendo… }
                      @else { Añadir al carrito }
                    </button>
                    @if (errors()[p.id]; as err) {
                      <p class="prod-card__error" role="alert">{{ err }}</p>
                    }
                  </div>
                }
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

    .prod-card__badge {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      color: #1C1A14;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: 20px;
      z-index: 2;
    }

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

    .prod-card__formats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .prod-card__format-btn {
      min-height: 48px;
      border: 1.5px solid $border;
      border-radius: 24px;
      background: $bg;
      color: $ink;
      padding: 0.35rem 0.4rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 150ms, background 150ms, color 150ms;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;

      @media (hover: hover) and (pointer: fine) {
        &:hover:not(:disabled):not(.is-active) {
          border-color: $brand;
          color: $brand;
        }
      }

      &.is-active,
      &.is-active:hover,
      &.is-active:focus,
      &.is-active:active {
        border-color: $brand;
        background: $brand;
        color: $bg;
      }

      &.is-disabled {
        color: $muted;
        opacity: 0.6;
        text-decoration: line-through;
        cursor: not-allowed;
      }
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

    .prod-card__name-link {
      color: inherit;
      text-decoration: none;
      @media (hover: hover) and (pointer: fine) {
        &:hover { color: $brand; }
      }
    }

    .prod-card__buy {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .prod-card__stock {
      margin: 0;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      color: #8A5A00;
    }

    .prod-card__qty {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      border: 1.5px solid $brand;
      border-radius: 24px;
      background: $bg;
      overflow: hidden;
    }

    .prod-card__qty-btn {
      width: 48px;
      height: 48px;
      border: none;
      background: $bg;
      color: $brand;
      font-family: 'Poppins', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;

      @media (hover: hover) and (pointer: fine) {
        &:hover:not(:disabled) { background: $brand; color: $bg; }
      }
      &:disabled { opacity: 0.35; cursor: default; }
    }

    .prod-card__qty-val {
      min-width: 2.5rem;
      text-align: center;
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: $ink;
    }

    .prod-card__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 48px;
      padding: 0.65rem 1.5rem;
      background: $bg;
      color: $brand;
      border: 1.5px solid $brand;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      touch-action: manipulation;
      transition: background 150ms, color 150ms;

      @media (hover: hover) and (pointer: fine) {
        &:hover:not(:disabled) { background: $brand; color: $bg; }
      }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .prod-card__error {
      margin: 0;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      color: #9A1E1E;
    }
  `]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private seo = inject(SeoService);
  private cartService = inject(CartService);
  private miniCartService = inject(MiniCartService);
  private toastService = inject(ToastService);

  products = signal<ProductListItem[]>([]);
  loading = signal(true);
  selectedVariants = signal<Record<number, number>>({});
  quantities = signal<Record<number, number>>({});
  addingId = signal<number | null>(null);
  errors = signal<Record<number, string>>({});

  ngOnInit(): void {
    this.seo.set({
      title: 'Tienda: Crema de Pistacho Pura y Crunchy',
      description: 'Compra online crema de pistacho manchego: Pura (100% pistacho) o Crunchy. Formatos 100g, 200g y 1kg. Envíos a península y Baleares.',
      path: '/tienda',
    });

    this.productService.getProducts({ page_size: 10 }).subscribe({
      next: (response) => {
        const ordered = PRODUCT_SLUGS
          .map(slug => response.items.find(p => p.slug === slug))
          .filter((p): p is ProductListItem => !!p);
        const selectedProducts = ordered.length ? ordered : response.items.slice(0, 2);
        this.products.set(selectedProducts);

        const defaults: Record<number, number> = {};
        for (const product of selectedProducts) {
          const preferred = product.variants?.[1] ?? product.variants?.[0];
          if (preferred) defaults[product.id] = preferred.id;
        }
        this.selectedVariants.set(defaults);
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

  selectedVariantId(product: ProductListItem): number | null {
    return this.selectedVariants()[product.id] ?? null;
  }

  selectedVariant(product: ProductListItem): ProductVariant | null {
    const selectedId = this.selectedVariantId(product);
    if (!selectedId) return product.variants?.[1] ?? product.variants?.[0] ?? null;
    return product.variants?.find(v => v.id === selectedId) ?? product.variants?.[1] ?? product.variants?.[0] ?? null;
  }

  selectVariant(product: ProductListItem, variant: ProductVariant): void {
    if (!variant.is_in_stock) return;
    this.selectedVariants.update(current => ({
      ...current,
      [product.id]: variant.id,
    }));
    this.clearError(product.id);
    // La cantidad nunca supera el stock de la variante elegida
    const max = this.maxQty(variant);
    if (this.quantity(product) > max) this.quantities.update(c => ({ ...c, [product.id]: max }));
  }

  quantity(product: ProductListItem): number {
    return this.quantities()[product.id] ?? 1;
  }

  maxQty(variant: ProductVariant): number {
    return Math.max(1, variant.stock ?? 1);
  }

  changeQty(product: ProductListItem, variant: ProductVariant, delta: number): void {
    const next = Math.min(this.maxQty(variant), Math.max(1, this.quantity(product) + delta));
    this.quantities.update(c => ({ ...c, [product.id]: next }));
  }

  addToCart(product: ProductListItem, variant: ProductVariant): void {
    if (!variant.is_in_stock || this.addingId() !== null) return;
    this.clearError(product.id);
    this.addingId.set(product.id);
    this.cartService.addItem(variant.id, this.quantity(product)).subscribe({
      next: () => {
        this.addingId.set(null);
        this.quantities.update(c => ({ ...c, [product.id]: 1 }));
        this.miniCartService.open();
      },
      error: (err) => {
        this.addingId.set(null);
        const msg = err?.message || 'No hemos podido añadir el producto. Inténtalo de nuevo.';
        this.errors.update(c => ({ ...c, [product.id]: msg }));
        this.toastService.error(msg);
      },
    });
  }

  private clearError(productId: number): void {
    if (this.errors()[productId]) {
      this.errors.update(c => { const n = { ...c }; delete n[productId]; return n; });
    }
  }
}
