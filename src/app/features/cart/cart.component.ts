import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { FREE_SHIPPING_THRESHOLD } from '../../core/legal';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="cart-page" [class.has-sticky]="!cartService.isLoading() && cartService.itemCount() > 0">
      <div class="container">
        <h1>Tu carrito</h1>

        @if (cartService.isLoading()) {
          <div class="loading" role="status">
            <div class="spinner" aria-hidden="true"></div>
            <p>Cargando carrito...</p>
          </div>
        } @else if (cartService.itemCount() === 0) {
          <div class="empty-cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>Tu carrito está vacío</h2>
            <p>Descubre nuestras cremas de pistacho manchego.</p>
            <a routerLink="/tienda" class="cc-btn cc-btn--primary">Ver productos</a>
          </div>
        } @else {
          <div class="cart-layout">
            <!-- Líneas del pedido -->
            <ul class="cart-items" aria-label="Productos en el carrito">
              @for (item of cartService.cart()?.items || []; track item.id) {
                <li class="cart-item">
                  <a class="cart-item__image" [routerLink]="['/tienda', item.product_slug]" tabindex="-1" aria-hidden="true">
                    <img [src]="item.product_image || '/assets/images/placeholder.jpg'" alt="" width="96" height="96">
                  </a>

                  <div class="cart-item__info">
                    <h2 class="cart-item__name">
                      <a [routerLink]="['/tienda', item.product_slug]">{{ item.product_name }}</a>
                    </h2>
                    @if (item.variant_format) { <span class="cart-item__format">{{ item.variant_format }}</span> }
                    <span class="cart-item__price">{{ (item.unit_price ?? item.product_price ?? 0) | currency:'EUR':'symbol':'1.2-2':'es' }} / ud.</span>
                    @if (!item.is_available || item.stock_available < item.quantity) {
                      <span class="cart-item__stock" role="status">
                        {{ item.stock_available > 0 ? 'Solo quedan ' + item.stock_available + ' unidades' : 'Sin stock' }}
                      </span>
                    }
                  </div>

                  <div class="cart-item__actions">
                    <div class="qty" role="group" [attr.aria-label]="'Cantidad de ' + itemLabel(item)">
                      <button type="button" class="qty__btn"
                        (click)="updateQuantity(item.id, item.quantity - 1)"
                        [disabled]="item.quantity <= 1 || busy()"
                        [attr.aria-label]="'Quitar una unidad de ' + itemLabel(item)">−</button>
                      <span class="qty__val" aria-live="polite">{{ item.quantity }}</span>
                      <button type="button" class="qty__btn"
                        (click)="updateQuantity(item.id, item.quantity + 1)"
                        [disabled]="busy() || item.quantity >= item.stock_available"
                        [attr.aria-label]="'Añadir una unidad de ' + itemLabel(item)">+</button>
                    </div>

                    <span class="cart-item__total">{{ item.total | currency:'EUR':'symbol':'1.2-2':'es' }}</span>

                    <button type="button" class="cart-item__remove"
                      (click)="removeItem(item.id)"
                      [disabled]="busy()"
                      [attr.aria-label]="'Eliminar ' + itemLabel(item) + ' del carrito'">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </li>
              }
            </ul>

            <!-- Resumen -->
            <section class="cart-summary" aria-labelledby="summary-title">
              <h2 id="summary-title">Resumen del pedido</h2>

              <div class="summary-row">
                <span>Subtotal ({{ cartService.itemCount() }} {{ cartService.itemCount() === 1 ? 'artículo' : 'artículos' }})</span>
                <span>{{ cartService.cart()?.subtotal | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
              </div>

              @if ((cartService.cart()?.discount || 0) > 0) {
                <div class="summary-row summary-row--discount">
                  <span>Descuento ({{ cartService.cart()?.coupon?.code }})</span>
                  <span>−{{ cartService.cart()?.discount | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                </div>
              }

              <div class="summary-row">
                <span>Envío</span>
                <span>
                  @if ((cartService.cart()?.shipping_cost || 0) === 0) {
                    Gratis
                  } @else {
                    {{ cartService.cart()?.shipping_cost | currency:'EUR':'symbol':'1.2-2':'es' }}
                  }
                </span>
              </div>

              @if ((cartService.cart()?.shipping_cost || 0) > 0) {
                <div class="shipping-notice">
                  <p>{{ cartService.cart()?.shipping_message }}</p>
                  <div class="progress-bar" role="progressbar"
                    aria-label="Progreso hacia el envío gratis"
                    aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="freeShippingProgress()">
                    <div class="progress" [style.width.%]="freeShippingProgress()"></div>
                  </div>
                </div>
              }

              <!-- Cupón: plegado por defecto (solo para clientes con cuenta) -->
              <div class="coupon-section">
                @if (cartService.cart()?.coupon; as coupon) {
                  <div class="coupon-applied">
                    <span>Cupón <strong>{{ coupon.code }}</strong> aplicado</span>
                    <button type="button" class="link-btn" (click)="removeCoupon()">Quitar</button>
                  </div>
                } @else {
                  <button type="button" class="coupon-toggle"
                    (click)="couponOpen.set(!couponOpen())"
                    [attr.aria-expanded]="couponOpen()"
                    aria-controls="coupon-panel">
                    ¿Tienes un código de descuento?
                    <svg class="coupon-toggle__chevron" [class.is-open]="couponOpen()" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>

                  @if (couponOpen()) {
                    <div id="coupon-panel" class="coupon-panel">
                      @if (authService.isAuthenticated()) {
                        <form class="coupon-input" (ngSubmit)="applyCoupon()">
                          <label for="coupon-code" class="sr-only">Código de descuento</label>
                          <input
                            id="coupon-code"
                            name="coupon"
                            type="text"
                            autocomplete="off"
                            autocapitalize="characters"
                            [(ngModel)]="couponCode"
                            placeholder="Código"
                            [attr.aria-invalid]="!!couponError"
                            [attr.aria-describedby]="couponError ? 'coupon-error' : null">
                          <button type="submit" class="cc-btn cc-btn--secondary" [disabled]="!couponCode || applyingCoupon">
                            {{ applyingCoupon ? 'Aplicando…' : 'Aplicar' }}
                          </button>
                        </form>
                        @if (couponError) {
                          <p class="coupon-error" id="coupon-error" role="alert">{{ couponError }}</p>
                        }
                      } @else {
                        <p class="coupon-login-prompt">
                          Los códigos de descuento son para clientes con cuenta.
                          <a routerLink="/auth/login" [queryParams]="{returnUrl: '/carrito'}">Inicia sesión</a>
                          o
                          <a routerLink="/auth/register" [queryParams]="{returnUrl: '/carrito'}">crea una cuenta</a>.
                        </p>
                      }
                    </div>
                  }
                }
              </div>

              <hr>

              <div class="summary-row summary-row--total">
                <span>Total <small>(IVA incluido)</small></span>
                <span>{{ cartService.cart()?.total | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
              </div>

              <a routerLink="/checkout" class="cc-btn cc-btn--primary cc-btn--block summary-cta">
                Ir al pago
              </a>

              <a routerLink="/tienda" class="continue-shopping">
                ← Seguir comprando
              </a>
            </section>
          </div>

          <!-- Móvil: botón de pago fijo abajo -->
          <div class="sticky-pay">
            <div class="sticky-pay__total">
              <span>Total</span>
              <strong>{{ cartService.cart()?.total | currency:'EUR':'symbol':'1.2-2':'es' }}</strong>
            </div>
            <a routerLink="/checkout" class="cc-btn cc-btn--primary">Ir al pago</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    // Estilo de marca (variables globales de styles.scss). Contenedores 2px, botones 20px.
    $surface: #FAF8F3;

    .cart-page {
      padding: 2rem 0 3rem;
      background: var(--color-bg);

      @media (max-width: 900px) {
        &.has-sticky { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
      }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    h1 {
      font-family: var(--font-title);
      font-weight: 700;
      font-size: clamp(2rem, 5vw, 2.75rem);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      line-height: 1;
      color: var(--color-brand);
      margin-bottom: 1.5rem;
    }

    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;
      align-items: start;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    // ── Líneas ──────────────────────────────────────────
    .cart-items {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .cart-item {
      display: grid;
      grid-template-columns: 96px 1fr auto;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: $surface;
      border: 1px solid var(--color-border);
      border-radius: 2px;

      @media (max-width: 600px) {
        grid-template-columns: 72px 1fr;
        gap: 0.75rem;
      }
    }

    .cart-item__image {
      display: block;
      width: 96px;
      height: 96px;
      border-radius: 2px;
      overflow: hidden;
      background: var(--color-bg-alt);

      img { width: 100%; height: 100%; object-fit: cover; }

      @media (max-width: 600px) { width: 72px; height: 72px; }
    }

    .cart-item__info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .cart-item__name {
      margin: 0;
      font-family: var(--font-ui);
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.3;

      a {
        color: var(--color-text);
        text-decoration: none;
        &:hover { color: var(--color-brand); text-decoration: underline; }
      }
    }

    .cart-item__format {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--color-text-light);
    }

    .cart-item__price {
      font-size: 0.85rem;
      color: var(--color-text-light);
    }

    .cart-item__stock {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-error);
    }

    .cart-item__actions {
      display: flex;
      align-items: center;
      gap: 1rem;

      @media (max-width: 600px) {
        grid-column: 1 / -1;
        justify-content: space-between;
        gap: 0.5rem;
      }
    }

    .qty {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--color-border);
      border-radius: 24px;
      overflow: hidden;
      background: var(--color-bg);

      &__btn {
        width: 44px;
        height: 44px;
        border: none;
        background: none;
        color: var(--color-brand);
        font-family: var(--font-ui);
        font-size: 1.15rem;
        font-weight: 600;
        cursor: pointer;
        touch-action: manipulation;
        transition: background 150ms, color 150ms;

        &:hover:not(:disabled) { background: var(--color-brand); color: var(--color-bg); }
        &:disabled { opacity: 0.4; cursor: default; }
      }

      &__val {
        min-width: 36px;
        text-align: center;
        font-weight: 600;
        color: var(--color-text);
      }
    }

    .cart-item__total {
      font-weight: 600;
      color: var(--color-text);
      min-width: 72px;
      text-align: right;
      white-space: nowrap;
    }

    .cart-item__remove {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: 50%;
      color: var(--color-text-light);
      cursor: pointer;
      transition: color 150ms, background 150ms;

      &:hover:not(:disabled) { color: var(--color-error); background: rgba(160, 28, 28, 0.06); }
      &:disabled { opacity: 0.4; cursor: default; }
    }

    // ── Resumen ─────────────────────────────────────────
    .cart-summary {
      background: var(--color-bg-alt);
      border: 1px solid var(--color-border);
      border-radius: 2px;
      padding: 1.5rem;
      position: sticky;
      top: 90px;

      @media (max-width: 900px) { position: static; }

      h2 {
        margin: 0 0 1rem;
        font-family: var(--font-ui);
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--color-text);
      }
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.4rem 0;
      color: var(--color-text-light);

      &--discount { color: var(--color-success); font-weight: 500; }

      &--total {
        align-items: baseline;
        font-weight: 600;
        color: var(--color-text);
        padding: 0.75rem 0;

        small { font-size: 0.75rem; font-weight: 400; color: var(--color-text-light); }

        span:last-child {
          font-family: var(--font-title);
          font-size: 2rem;
          line-height: 1;
          color: var(--color-brand);
        }
      }
    }

    .shipping-notice {
      background: rgba(230, 193, 90, 0.18);
      border-radius: 2px;
      padding: 0.75rem;
      margin: 0.75rem 0;

      p {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        color: #5C4300;
      }
    }

    .progress-bar {
      height: 6px;
      background: rgba(28, 26, 20, 0.08);
      border-radius: 3px;
      overflow: hidden;

      .progress {
        height: 100%;
        background: var(--color-brand);
        transition: width 300ms ease;
      }
    }

    .coupon-section { margin: 0.75rem 0; }

    .coupon-toggle {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      min-height: 44px;
      padding: 0;
      background: none;
      border: none;
      font-family: var(--font-ui);
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--color-brand);
      text-decoration: underline;
      cursor: pointer;

      &__chevron { transition: transform 200ms ease; &.is-open { transform: rotate(180deg); } }
    }

    .coupon-panel { padding-top: 0.25rem; }

    .coupon-input {
      display: flex;
      gap: 0.5rem;

      input {
        flex: 1;
        min-width: 0;
        min-height: 44px;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: 2px;
        background: #FFFDF8;
        font-family: var(--font-ui);
        font-size: 1rem;
        text-transform: uppercase;
        color: var(--color-text);
        &:focus { border-color: var(--color-brand); }
      }
    }

    .coupon-applied {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--color-success);
    }

    .link-btn {
      min-height: 44px;
      padding: 0 0.25rem;
      background: none;
      border: none;
      font-family: var(--font-ui);
      font-size: 0.85rem;
      color: var(--color-text-light);
      text-decoration: underline;
      cursor: pointer;
      &:hover { color: var(--color-brand); }
    }

    .coupon-error {
      color: var(--color-error);
      font-size: 0.85rem;
      margin: 0.5rem 0 0;
    }

    .coupon-login-prompt {
      font-size: 0.85rem;
      color: var(--color-text-light);
      margin: 0;
      line-height: 1.5;

      a { color: var(--color-brand); font-weight: 600; text-decoration: underline; }
    }

    hr {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 0.75rem 0;
    }

    // Botones de marca (nombre propio para no heredar el .btn global)
    .cc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 48px;
      padding: 0.75rem 1.5rem;
      border: 1.5px solid var(--color-brand);
      border-radius: 20px;
      font-family: var(--font-ui);
      font-size: 0.95rem;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: background 150ms, color 150ms;

      &--primary {
        background: var(--color-brand);
        color: var(--color-accent);
        &:hover { background: var(--color-brand-hover); }
      }

      &--secondary {
        background: var(--color-bg);
        color: var(--color-brand);
        min-height: 44px;
        padding: 0.5rem 1rem;
        &:hover:not(:disabled) { background: var(--color-brand); color: var(--color-bg); }
        &:disabled { opacity: 0.5; cursor: default; }
      }

      &--block { display: flex; width: 100%; }
    }

    // En móvil el botón del resumen se sustituye por la barra fija
    .summary-cta { @media (max-width: 900px) { display: none; } }

    .continue-shopping {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      margin-top: 0.5rem;
      color: var(--color-text-light);
      text-decoration: none;
      font-size: 0.9rem;

      &:hover { color: var(--color-brand); text-decoration: underline; }
    }

    // ── Barra fija móvil ───────────────────────────────
    .sticky-pay {
      display: none;

      @media (max-width: 900px) {
        display: flex;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 200;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
        background: var(--color-bg);
        border-top: 1px solid var(--color-border);
        box-shadow: 0 -4px 16px rgba(28, 26, 20, 0.08);

        .cc-btn { flex: 1; max-width: 260px; }
      }

      &__total {
        display: flex;
        flex-direction: column;
        line-height: 1.1;

        span { font-size: 0.75rem; color: var(--color-text-light); }
        strong { font-family: var(--font-title); font-size: 1.6rem; color: var(--color-brand); }
      }
    }

    // ── Estados ─────────────────────────────────────────
    .empty-cart {
      text-align: center;
      padding: 3rem 1rem;

      svg { color: var(--color-text-muted); margin-bottom: 1rem; }

      h2 {
        font-family: var(--font-ui);
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text);
        margin-bottom: 0.5rem;
      }

      p {
        font-family: var(--font-narrative);
        color: var(--color-text-light);
        margin-bottom: 1.5rem;
      }
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-light);
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 2.5px solid var(--color-border);
      border-top-color: var(--color-brand);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);

  couponCode = '';
  couponError: string | null = null;
  applyingCoupon = false;
  readonly couponOpen = signal(false);
  readonly busy = signal(false);

  /** % hacia el envío gratis; el servidor lo calcula sobre el subtotal tras descuentos. */
  readonly freeShippingProgress = computed(() => {
    const cart = this.cartService.cart();
    const base = (cart?.subtotal ?? 0) - (cart?.discount ?? 0);
    return Math.max(0, Math.min(100, Math.round((base / FREE_SHIPPING_THRESHOLD) * 100)));
  });

  ngOnInit(): void {
    this.cartService.loadCart();
  }

  itemLabel(item: { product_name: string; variant_format?: string | null }): string {
    return item.variant_format ? `${item.product_name} ${item.variant_format}` : item.product_name;
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity < 1) return;
    this.busy.set(true);
    this.cartService.updateItemQuantity(itemId, quantity).subscribe({
      next: () => this.busy.set(false),
      error: () => this.busy.set(false),
    });
  }

  removeItem(itemId: number): void {
    this.busy.set(true);
    this.cartService.removeItem(itemId).subscribe({
      next: () => this.busy.set(false),
      error: () => this.busy.set(false),
    });
  }

  applyCoupon(): void {
    if (!this.couponCode) return;

    this.applyingCoupon = true;
    this.couponError = null;

    this.cartService.applyCoupon(this.couponCode.trim().toUpperCase()).subscribe({
      next: () => {
        this.couponCode = '';
        this.applyingCoupon = false;
        this.couponOpen.set(false);
      },
      error: (err) => {
        this.couponError = err.message || 'Cupón no válido';
        this.applyingCoupon = false;
      },
    });
  }

  removeCoupon(): void {
    this.couponError = null;
    this.cartService.removeCoupon().subscribe();
  }
}
