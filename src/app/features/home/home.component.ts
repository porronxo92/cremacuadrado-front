import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { MiniCartService } from '../../core/services/mini-cart.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductListItem, ProductVariant } from '../../core/models';
import { HeroBlockComponent } from './components/hero-block/hero-block.component';
import { TrilogiaBlockComponent } from './components/trilogia-block/trilogia-block.component';

const REVIEWS = [
  { name: 'Ana M.', location: 'Madrid', text: 'Increíble sabor, mi favorita para el desayuno. Ya he pedido tres veces.', rating: 5, product: 'Crema Pura 100%' },
  { name: 'Carlos R.', location: 'Barcelona', text: 'La calidad se nota desde el primer bocado. Pistacho real, sin engaños.', rating: 5, product: 'Crema Crunchy' },
  { name: 'Laura G.', location: 'Valencia', text: 'Me la recomendaron en Instagram y fue un acierto total. El tarro dura poco en casa.', rating: 5, product: 'Crema Pura 100%' },
  { name: 'Javier P.', location: 'Sevilla', text: 'La mejor crema de frutos secos que he probado. Mi familia está enganchada.', rating: 5, product: 'Crema Crunchy' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroBlockComponent, TrilogiaBlockComponent],
  template: `
    <!-- Bloque 1: Hero + Trilogía -->
    <app-hero-block videoSrc="assets/videos/crema-pistacho-artesanal-hero.mp4" />
    <app-trilogia-block />

    <!-- Bloque 2: Los dos productos -->
    <section class="products">
      <div class="container">
        <div class="products__header">
          <h2 class="products__title">LAS CREMAS</h2>
          <p class="products__sub">Pistacho manchego. Dos expresiones del mismo amor.</p>
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
                    [src]="product.primary_image || '/assets/images/placeholder.jpg'"
                    [alt]="product.name + ' — crema de pistacho manchego'"
                    loading="lazy">
                  @if (product.compare_price && product.compare_price > defaultVariantPrice(product)) {
                    <span class="product-card__badge">Oferta</span>
                  }
                </a>
                <div class="product-card__body">
                  <a [routerLink]="['/tienda', product.slug]" class="product-card__name">{{ product.name }}</a>
                  <p class="product-card__tagline">100% natural · sin aditivos</p>
                  <div class="product-card__footer">
                    <span class="product-card__price">{{ defaultVariantPrice(product) | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                    <button class="product-card__cta" (click)="addToCart(product)">
                      Añadir al carrito
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

    <!-- Bloque 3: Reseñas -->
    <section class="reviews">
      <div class="container">
        <h2 class="reviews__title">LO QUE DICEN</h2>
        <p class="reviews__sub">Más de 400 clientes en toda España</p>
        <div class="reviews__grid">
          @for (review of reviews; track review.name) {
            <blockquote class="review-card">
              <div class="review-card__stars">★★★★★</div>
              <p class="review-card__text">"{{ review.text }}"</p>
              <footer class="review-card__footer">
                <strong>{{ review.name }}</strong>
                <span>{{ review.location }}</span>
                <span class="review-card__product">{{ review.product }}</span>
              </footer>
            </blockquote>
          }
        </div>
      </div>
    </section>

    <!-- Bloque 4: B2B -->
    <section class="b2b">
      <div class="container">
        <h2 class="b2b__title">¿TIENES UN NEGOCIO?</h2>
        <p class="b2b__sub">La crema de pistacho que tus clientes no encuentran en ningún supermercado</p>
        <div class="b2b__grid">
          <div class="b2b__card">
            <div class="b2b__card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h3 class="b2b__card-title">TIENDAS GOURMET</h3>
            <p class="b2b__card-text">Un producto diferente, de origen conocido, con margen real. Fideliza a tus clientes más exigentes.</p>
            <a routerLink="/para-tiendas" class="b2b__card-cta">Conocer condiciones →</a>
          </div>
          <div class="b2b__card">
            <div class="b2b__card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 class="b2b__card-title">RESTAURANTES Y OBRADORES</h3>
            <p class="b2b__card-text">El ingrediente que diferencia tus postres, cremas y maridajes. Precio profesional, calidad constante.</p>
            <a routerLink="/para-tiendas" class="b2b__card-cta">Conocer condiciones →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Bloque 5: Captura de email -->
    <section class="newsletter">
      <div class="container">
        <div class="newsletter__inner">
          <div class="newsletter__text">
            <h2 class="newsletter__title">RECETAS Y NOVEDADES</h2>
            <p class="newsletter__sub">Sin spam. Solo lo que merece tu bandeja de entrada.</p>
          </div>
          <form class="newsletter__form" (submit)="subscribeNewsletter($event)">
            <input
              type="email"
              class="newsletter__input"
              placeholder="tu@email.com"
              required
              aria-label="Tu email">
            <button type="submit" class="newsletter__btn">Suscribirme</button>
          </form>
        </div>
      </div>
    </section>
  `,
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
      padding: 5rem 0;
      background: white;
    }

    .products__header {
      text-align: center;
      margin-bottom: 3rem;
    }

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

      &:hover {
        box-shadow: 0 12px 32px rgba($ink, 0.08);
        transform: translateY(-2px);
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
      margin: 0 0 1rem;
    }

    .product-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
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

      &:hover { background: $brand; color: $bg; }
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

    // ── Reseñas ───────────────────────────────────────────
    .reviews {
      padding: 5rem 0;
      background: $bg;
    }

    .reviews__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(2rem, 4vw, 2.8rem);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $brand;
      text-align: center;
      margin: 0 0 0.4rem;
    }

    .reviews__sub {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1rem;
      color: $muted;
      text-align: center;
      margin: 0 0 3rem;
    }

    .reviews__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .review-card {
      background: white;
      border: 1px solid $border;
      border-radius: 6px;
      padding: 1.5rem;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .review-card__stars {
      color: $accent;
      font-size: 0.85rem;
      letter-spacing: 2px;
    }

    .review-card__text {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.95rem;
      color: $ink;
      line-height: 1.65;
      margin: 0;
      flex: 1;
    }

    .review-card__footer {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
      font-family: 'Poppins', sans-serif;

      strong {
        font-size: 0.8rem;
        font-weight: 600;
        color: $ink;
      }

      span {
        font-size: 0.75rem;
        color: $muted;

        &::before { content: '·'; margin-right: 0.4rem; }
      }

      .review-card__product {
        font-size: 0.68rem;
        font-weight: 600;
        color: $brand;
        background: rgba($brand, 0.07);
        padding: 0.15rem 0.5rem;
        border-radius: 10px;

        &::before { display: none; }
      }
    }

    // ── B2B ───────────────────────────────────────────────
    .b2b {
      padding: 5rem 0;
      background: $ink;
    }

    .b2b__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(2rem, 4vw, 2.8rem);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $accent;
      text-align: center;
      margin: 0 0 0.4rem;
    }

    .b2b__sub {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1rem;
      color: rgba(#F4F1E9, 0.65);
      text-align: center;
      margin: 0 0 3rem;
    }

    .b2b__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .b2b__card {
      background: rgba(#F4F1E9, 0.04);
      border: 1px solid rgba(#F4F1E9, 0.1);
      border-radius: 6px;
      padding: 2rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: background 200ms;

      &:hover { background: rgba(#F4F1E9, 0.07); }
    }

    .b2b__card-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba($accent, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: $accent;
    }

    .b2b__card-title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 1.5rem;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: #F4F1E9;
      margin: 0;
    }

    .b2b__card-text {
      font-family: 'Lora', serif;
      font-size: 0.92rem;
      color: rgba(#F4F1E9, 0.65);
      line-height: 1.65;
      margin: 0;
      flex: 1;
    }

    .b2b__card-cta {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: $accent;
      text-decoration: none;
      transition: opacity 150ms;

      &:hover { opacity: 0.8; }
    }

    // ── Newsletter ────────────────────────────────────────
    .newsletter {
      padding: 5rem 0;
      background: $bg;
    }

    .newsletter__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
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

    .newsletter__sub {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.95rem;
      color: $muted;
      margin: 0;
    }

    .newsletter__form {
      display: flex;
      gap: 0.6rem;
      flex: 1;
      max-width: 480px;

      @media (max-width: 600px) {
        flex-direction: column;
        width: 100%;
        max-width: 100%;
      }
    }

    .newsletter__input {
      flex: 1;
      padding: 0.75rem 1rem;
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
      padding: 0.75rem 1.5rem;
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

  readonly featuredProducts = signal<ProductListItem[]>([]);
  readonly loadingProducts = signal(true);
  readonly reviews = REVIEWS;

  ngOnInit(): void {
    this.productService.getFeaturedProducts().subscribe({
      next: (products) => {
        this.featuredProducts.set(products.slice(0, 2));
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  private defaultVariant(product: ProductListItem): ProductVariant | null {
    return product.variants?.[1] ?? product.variants?.[0] ?? null;
  }

  defaultVariantPrice(product: ProductListItem): number {
    return this.defaultVariant(product)?.price ?? 0;
  }

  addToCart(product: ProductListItem): void {
    const variant = this.defaultVariant(product);
    if (!variant) {
      this.toastService.error('Selecciona un formato antes de añadir al carrito');
      this.router.navigate(['/tienda', product.slug]);
      return;
    }

    this.cartService.addItem(variant.id, 1).subscribe({
      next: () => this.miniCartService.open(),
      error: () => this.toastService.error('Error al añadir el producto'),
    });
  }

  subscribeNewsletter(event: Event): void {
    event.preventDefault();
    // TODO: connect to newsletter backend
    this.toastService.success('¡Gracias por suscribirte!');
    (event.target as HTMLFormElement).reset();
  }
}
