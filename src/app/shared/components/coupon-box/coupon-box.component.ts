import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Código de descuento plegado por defecto (lo usan /carrito y /checkout). Solo para
 * clientes con cuenta: a los invitados se les invita a iniciar sesión o registrarse
 * y volver a `returnUrl`. El cupón se guarda en la cesta; en el checkout, pre-confirm
 * lo copia al pedido y recalcula el importe antes de cobrar.
 */
@Component({
  selector: 'app-coupon-box',
  imports: [RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="coupon-section">
      @if (cartService.cart()?.coupon; as coupon) {
        @if (coupon.applies === false) {
          <div class="coupon-info" role="status">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p><strong>Cupón {{ coupon.code }} no aplicado.</strong> {{ coupon.message }}</p>
          </div>
          <button type="button" class="link-btn" (click)="removeCoupon()"
            [attr.aria-label]="'Quitar el cupón ' + coupon.code">Quitar cupón</button>
        } @else {
          <div class="coupon-applied">
            <span>Cupón <strong>{{ coupon.code }}</strong> aplicado@if (coupon.discount_type === 'free_shipping') { · envío gratis }</span>
            <button type="button" class="link-btn" (click)="removeCoupon()"
              [attr.aria-label]="'Quitar el cupón ' + coupon.code">Quitar</button>
          </div>
        }
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
                  [attr.aria-invalid]="!!couponError()"
                  [attr.aria-describedby]="couponError() ? 'coupon-error' : null">
                <button type="submit" class="cc-btn cc-btn--secondary" [disabled]="!couponCode || applying()">
                  {{ applying() ? 'Aplicando…' : 'Aplicar' }}
                </button>
              </form>
              @if (couponError()) {
                <p class="coupon-error" id="coupon-error" role="alert">{{ couponError() }}</p>
              }
            } @else {
              <p class="coupon-login-prompt">
                Los códigos de descuento son para clientes con cuenta.
                <a routerLink="/auth/login" [queryParams]="{returnUrl}">Inicia sesión</a>
                o
                <a routerLink="/auth/register" [queryParams]="{returnUrl}">crea una cuenta</a>.
              </p>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

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

      .cc-btn { flex: 0 0 auto; padding-inline: 1.1rem; }

      input {
        flex: 1 1 0;
        min-width: 0;
        width: 100%;
        min-height: 48px;
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

    .cc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid var(--color-brand);
      border-radius: 20px;
      font-family: var(--font-ui);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms, color 150ms;

      &--secondary {
        background: var(--color-bg);
        color: var(--color-brand);
        min-height: 48px;
        padding: 0.5rem 1rem;
        &:hover:not(:disabled) { background: var(--color-brand); color: var(--color-bg); }
        &:disabled { opacity: 0.5; cursor: default; }
      }
    }

    .coupon-info {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      padding: 0.6rem 0.75rem;
      border-radius: 2px;
      font-size: 0.85rem;
      line-height: 1.4;
      background: rgba(230, 193, 90, 0.18);
      border: 1px solid rgba(200, 138, 26, 0.45);
      color: #5C4300;
      svg { flex-shrink: 0; margin-top: 2px; }
      p { margin: 0; }
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
  `],
})
export class CouponBoxComponent {
  /** A dónde vuelve el invitado tras iniciar sesión o registrarse */
  @Input() returnUrl = '/carrito';

  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);

  couponCode = '';
  readonly couponError = signal<string | null>(null);
  readonly applying = signal(false);
  readonly couponOpen = signal(false);

  applyCoupon(): void {
    if (!this.couponCode) return;
    this.applying.set(true);
    this.couponError.set(null);

    this.cartService.applyCoupon(this.couponCode.trim().toUpperCase()).subscribe({
      next: () => {
        this.couponCode = '';
        this.applying.set(false);
        this.couponOpen.set(false);
      },
      error: (err) => {
        this.couponError.set(err.message || 'Cupón no válido');
        this.applying.set(false);
      },
    });
  }

  removeCoupon(): void {
    this.couponError.set(null);
    this.cartService.removeCoupon().subscribe();
  }
}
