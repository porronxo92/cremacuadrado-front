import { Component, inject, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { MiniCartService } from '../../../core/services/mini-cart.service';

@Component({
  selector: 'app-mini-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Overlay -->
    @if (miniCartService.isOpen()) {
      <div
        class="mini-cart__overlay"
        (click)="close()"
        aria-hidden="true">
      </div>
    }

    <!-- Panel -->
    <aside
      class="mini-cart"
      [class.is-open]="miniCartService.isOpen()"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compra">

      <!-- Header -->
      <div class="mini-cart__header">
        <h2 class="mini-cart__title">
          Tu carrito
          @if (cartService.itemCount() > 0) {
            <span class="mini-cart__count">{{ cartService.itemCount() }}</span>
          }
        </h2>
        <button
          class="mini-cart__close"
          (click)="close()"
          aria-label="Cerrar carrito">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="mini-cart__body">
        @if (cartService.isLoading()) {
          <div class="mini-cart__loading">
            <div class="spinner"></div>
          </div>
        } @else if (cartService.isEmpty()) {
          <div class="mini-cart__empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <p>Tu carrito está vacío</p>
            <a routerLink="/tienda" class="btn-shop" (click)="close()">Ver productos</a>
          </div>
        } @else {
          <ul class="mini-cart__items" role="list">
            @for (item of cartService.items(); track item.id) {
              <li class="mini-cart__item">
                <div class="mini-cart__item-img">
                  <img
                    [src]="item.product_image || '/assets/images/placeholder.jpg'"
                    [alt]="item.product_name"
                    width="72" height="72"
                    loading="lazy">
                </div>
                <div class="mini-cart__item-info">
                  <a
                    [routerLink]="['/tienda', item.product_slug]"
                    class="mini-cart__item-name"
                    (click)="close()">
                    {{ item.product_name }}
                  </a>
                  <div class="mini-cart__item-row">
                    <div class="mini-cart__qty" role="group" [attr.aria-label]="'Cantidad de ' + item.product_name">
                      <button
                        (click)="decrement(item.id, item.quantity)"
                        [disabled]="updating"
                        aria-label="Reducir cantidad">−</button>
                      <span>{{ item.quantity }}</span>
                      <button
                        (click)="increment(item.id, item.quantity)"
                        [disabled]="updating"
                        aria-label="Aumentar cantidad">+</button>
                    </div>
                    <span class="mini-cart__item-price">{{ item.total | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                  </div>
                </div>
                <button
                  class="mini-cart__item-remove"
                  (click)="remove(item.id)"
                  [disabled]="updating"
                  [attr.aria-label]="'Eliminar ' + item.product_name">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Footer (solo cuando hay items) -->
      @if (!cartService.isEmpty() && !cartService.isLoading()) {
        <div class="mini-cart__footer">
          <div class="mini-cart__subtotal">
            <span>Subtotal</span>
            <strong>{{ cartService.subtotal() | currency:'EUR':'symbol':'1.2-2':'es' }}</strong>
          </div>
          @if (cartService.subtotal() < 4800) {
            <p class="mini-cart__shipping-notice">
              Te faltan <strong>{{ (4800 - cartService.subtotal()) / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}</strong> para envío gratis
            </p>
          } @else {
            <p class="mini-cart__shipping-free">✓ Envío gratis</p>
          }
          <button class="mini-cart__cta" (click)="goToCart()">
            Tramitar pedido
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      }
    </aside>
  `,
  styles: [`
    $brand:    #7B1716;
    $accent:   #E6C15A;
    $bg:       #F4F1E9;
    $bg-alt:   #EDE9DD;
    $text:     #1C1A14;
    $muted:    #6B6456;
    $border:   rgba(28,26,20,0.1);
    $w:        380px;

    .mini-cart__overlay {
      position: fixed;
      inset: 0;
      background: rgba($text, 0.35);
      z-index: 300;
      animation: fadeIn 200ms ease;
    }

    @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }

    .mini-cart {
      position: fixed;
      top: 0;
      right: 0;
      width: min($w, 100vw);
      height: 100dvh;
      background: $bg;
      z-index: 301;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
      box-shadow: -4px 0 32px rgba($text, 0.12);

      &.is-open {
        transform: translateX(0);
      }
    }

    // ── Header ────────────────────────────────────────────
    .mini-cart__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid $border;
      flex-shrink: 0;
    }

    .mini-cart__title {
      font-family: 'Teko', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: $brand;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mini-cart__count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: $brand;
      color: $accent;
      font-family: 'Poppins', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }

    .mini-cart__close {
      background: none;
      border: none;
      padding: 0.4rem;
      cursor: pointer;
      color: $muted;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 150ms, background 150ms;

      &:hover { color: $brand; background: rgba($brand, 0.06); }
    }

    // ── Body ──────────────────────────────────────────────
    .mini-cart__body {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0.75rem 0;
    }

    .mini-cart__loading,
    .mini-cart__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      height: 100%;
      min-height: 200px;
      padding: 2rem;
      text-align: center;

      svg { color: rgba($muted, 0.4); }

      p {
        font-family: 'Lora', serif;
        color: $muted;
        font-size: 0.95rem;
      }
    }

    .btn-shop {
      display: inline-block;
      background: $bg;
      color: $brand;
      border: 1.5px solid $brand;
      border-radius: 20px;
      padding: 0.6rem 1.5rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.8rem;
      text-decoration: none;
      transition: background 150ms, color 150ms;

      &:hover { background: $brand; color: $bg; }
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid $border;
      border-top-color: $brand;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg) } }

    // ── Items ─────────────────────────────────────────────
    .mini-cart__items {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .mini-cart__item {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.85rem 1.5rem;
      border-bottom: 1px solid $border;
      position: relative;

      &:last-child { border-bottom: none; }
    }

    .mini-cart__item-img {
      width: 72px;
      height: 72px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: $bg-alt;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .mini-cart__item-info {
      flex: 1;
      min-width: 0;
    }

    .mini-cart__item-name {
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: $text;
      text-decoration: none;
      display: block;
      margin-bottom: 0.5rem;
      line-height: 1.35;

      &:hover { color: $brand; }
    }

    .mini-cart__item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .mini-cart__qty {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid $border;
      border-radius: 4px;
      overflow: hidden;

      button {
        width: 28px;
        height: 28px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        color: $muted;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 150ms, color 150ms;

        &:hover:not(:disabled) { background: $bg-alt; color: $brand; }
        &:disabled { opacity: 0.4; cursor: default; }
      }

      span {
        width: 32px;
        text-align: center;
        font-family: 'Poppins', sans-serif;
        font-size: 0.8rem;
        font-weight: 500;
        color: $text;
        border-left: 1px solid $border;
        border-right: 1px solid $border;
        line-height: 28px;
      }
    }

    .mini-cart__item-price {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: $brand;
    }

    .mini-cart__item-remove {
      background: none;
      border: none;
      padding: 0.35rem;
      cursor: pointer;
      color: rgba($muted, 0.5);
      flex-shrink: 0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 150ms, background 150ms;
      align-self: center;

      &:hover:not(:disabled) { color: #c0392b; background: rgba(#c0392b, 0.06); }
      &:disabled { opacity: 0.3; cursor: default; }
    }

    // ── Footer ────────────────────────────────────────────
    .mini-cart__footer {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid $border;
      flex-shrink: 0;
      background: $bg;
    }

    .mini-cart__subtotal {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      span {
        font-family: 'Poppins', sans-serif;
        font-size: 0.8rem;
        color: $muted;
      }

      strong {
        font-family: 'Teko', sans-serif;
        font-size: 1.4rem;
        font-weight: 700;
        color: $brand;
        letter-spacing: -0.01em;
      }
    }

    .mini-cart__shipping-notice {
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      color: $muted;
      text-align: center;
      margin-bottom: 1rem;
      background: $bg-alt;
      padding: 0.4rem 0.75rem;
      border-radius: 4px;

      strong { color: $brand; }
    }

    .mini-cart__shipping-free {
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      font-weight: 600;
      color: #4a7c2e;
      text-align: center;
      margin-bottom: 1rem;
      background: rgba(74,124,46,0.08);
      padding: 0.4rem 0.75rem;
      border-radius: 4px;
    }

    .mini-cart__cta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.85rem 1.5rem;
      background: $brand;
      color: $accent;
      border: none;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms, color 150ms;

      &:hover { background: lighten($brand, 6%); }
    }
  `]
})
export class MiniCartComponent {
  readonly cartService = inject(CartService);
  readonly miniCartService = inject(MiniCartService);
  private router = inject(Router);

  updating = false;

  constructor() {
    effect(() => {
      const open = this.miniCartService.isOpen();
      if (typeof document !== 'undefined') {
        document.body.style.overflow = open ? 'hidden' : '';
      }
    });
  }

  close(): void {
    this.miniCartService.close();
  }

  goToCart(): void {
    this.close();
    this.router.navigate(['/carrito']);
  }

  increment(itemId: number, qty: number): void {
    this.updating = true;
    this.cartService.updateItemQuantity(itemId, qty + 1).subscribe({
      next: () => this.updating = false,
      error: () => this.updating = false,
    });
  }

  decrement(itemId: number, qty: number): void {
    if (qty <= 1) { this.remove(itemId); return; }
    this.updating = true;
    this.cartService.updateItemQuantity(itemId, qty - 1).subscribe({
      next: () => this.updating = false,
      error: () => this.updating = false,
    });
  }

  remove(itemId: number): void {
    this.updating = true;
    this.cartService.removeItem(itemId).subscribe({
      next: () => this.updating = false,
      error: () => this.updating = false,
    });
  }
}
