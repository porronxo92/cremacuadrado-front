import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="cart-page">
      <div class="container">
        <h1>Tu Carrito</h1>
        
        @if (cartService.isLoading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Cargando carrito...</p>
          </div>
        } @else if (cartService.itemCount() === 0) {
          <div class="empty-cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>Tu carrito está vacío</h2>
            <p>¡Añade algunos productos deliciosos!</p>
            <a routerLink="/tienda" class="btn btn--primary">Ver productos</a>
          </div>
        } @else {
          <div class="cart-layout">
            <!-- Cart items -->
            <div class="cart-items">
              @for (item of cartService.cart()?.items || []; track item.id) {
                <div class="cart-item">
                  <div class="cart-item__image">
                    <img [src]="item.product_image || '/assets/images/placeholder.jpg'" [alt]="item.product_name">
                  </div>
                  
                  <div class="cart-item__info">
                    <h3>
                      <a [routerLink]="['/tienda', item.product_slug]">{{ item.product_name }}{{ item.variant_format ? ' — ' + item.variant_format : '' }}</a>
                    </h3>
                    <p class="cart-item__price">{{ (item.unit_price ?? item.product_price ?? 0) | currency:'EUR' }}</p>
                  </div>
                  
                  <div class="cart-item__quantity">
                    <button 
                      (click)="updateQuantity(item.id, item.quantity - 1)"
                      [disabled]="item.quantity <= 1 || updating">
                      -
                    </button>
                    <span>{{ item.quantity }}</span>
                    <button 
                      (click)="updateQuantity(item.id, item.quantity + 1)"
                      [disabled]="updating">
                      +
                    </button>
                  </div>
                  
                  <div class="cart-item__total">
                    {{ item.total | currency:'EUR' }}
                  </div>
                  
                  <button 
                    class="cart-item__remove"
                    (click)="removeItem(item.id)"
                    [disabled]="removing">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              }
            </div>
            
            <!-- Cart summary -->
            <div class="cart-summary">
              <h2>Resumen del pedido</h2>
              
              <div class="summary-row">
                <span>Subtotal ({{ cartService.itemCount() }} artículos)</span>
                <span>{{ cartService.cart()?.subtotal | currency:'EUR' }}</span>
              </div>
              
              <div class="summary-row">
                <span>Envío</span>
                <span>
                  @if ((cartService.cart()?.shipping_cost || 0) === 0) {
                    Gratis
                  } @else {
                    {{ cartService.cart()?.shipping_cost | currency:'EUR' }}
                  }
                </span>
              </div>

              @if ((cartService.cart()?.shipping_cost || 0) > 0) {
                <div class="shipping-notice">
                  <p>{{ cartService.cart()?.shipping_message }}</p>
                  <div class="progress-bar">
                    <div class="progress" [style.width.%]="((cartService.cart()?.subtotal || 0) / freeShippingThreshold) * 100"></div>
                  </div>
                </div>
              }
              
              <!-- Coupon -->
              <div class="coupon-section">
                <label>¿Tienes un cupón?</label>
                <div class="coupon-input">
                  <input 
                    type="text" 
                    [(ngModel)]="couponCode" 
                    placeholder="Código de cupón"
                    [disabled]="!!appliedCoupon">
                  @if (!appliedCoupon) {
                    <button 
                      (click)="applyCoupon()" 
                      [disabled]="!couponCode || applyingCoupon"
                      class="btn btn--secondary">
                      Aplicar
                    </button>
                  } @else {
                    <button 
                      (click)="removeCoupon()" 
                      class="btn btn--outline">
                      Quitar
                    </button>
                  }
                </div>
                @if (couponError) {
                  <p class="coupon-error">{{ couponError }}</p>
                }
                @if (appliedCoupon) {
                  <p class="coupon-success">Cupón "{{ appliedCoupon }}" aplicado</p>
                }
              </div>
              
              <hr>
              
              <div class="summary-row summary-row--total">
                <span>Total</span>
                <span>{{ cartService.cart()?.total | currency:'EUR' }}</span>
              </div>
              
              <a routerLink="/checkout" class="btn btn--primary btn--large btn--block">
                Proceder al pago
              </a>
              
              <a routerLink="/tienda" class="continue-shopping">
                ← Continuar comprando
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cart-page {
      padding: 2rem 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    h1 {
      margin-bottom: 2rem;
      color: #333;
    }
    
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
      align-items: start;
      
      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }
    
    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .cart-item {
      display: grid;
      grid-template-columns: 100px 1fr auto auto auto;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      
      @media (max-width: 600px) {
        grid-template-columns: 80px 1fr;
        grid-template-rows: auto auto;
      }
    }
    
    .cart-item__image {
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      @media (max-width: 600px) {
        width: 80px;
        height: 80px;
      }
    }
    
    .cart-item__info {
      h3 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        
        a {
          color: #333;
          text-decoration: none;
          
          &:hover {
            color: #4a7c4e;
          }
        }
      }
    }
    
    .cart-item__price {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }
    
    .cart-item__quantity {
      display: flex;
      align-items: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      
      button {
        width: 32px;
        height: 32px;
        border: none;
        background: #f5f5f5;
        cursor: pointer;
        font-size: 1rem;
        
        &:hover:not(:disabled) {
          background: #eee;
        }
        
        &:disabled {
          opacity: 0.5;
        }
      }
      
      span {
        width: 40px;
        text-align: center;
        font-weight: 500;
      }
    }
    
    .cart-item__total {
      font-weight: 600;
      color: #4a7c4e;
      min-width: 80px;
      text-align: right;
    }
    
    .cart-item__remove {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 0.5rem;
      
      &:hover {
        color: #e74c3c;
      }
    }
    
    .cart-summary {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 1.5rem;
      position: sticky;
      top: 90px;
      
      h2 {
        margin: 0 0 1rem;
        font-size: 1.2rem;
        color: #333;
      }
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      color: #666;
      
      &--total {
        font-size: 1.25rem;
        font-weight: 700;
        color: #333;
        padding: 1rem 0;
      }
    }
    
    .shipping-notice {
      background: #fff9e6;
      border: 1px solid #ffd700;
      border-radius: 4px;
      padding: 0.75rem;
      margin: 1rem 0;
      
      p {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        color: #856404;
      }
    }
    
    .progress-bar {
      height: 6px;
      background: #eee;
      border-radius: 3px;
      overflow: hidden;
      
      .progress {
        height: 100%;
        background: #4a7c4e;
        transition: width 0.3s;
      }
    }
    
    .coupon-section {
      margin: 1rem 0;
      
      label {
        display: block;
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.5rem;
      }
    }
    
    .coupon-input {
      display: flex;
      gap: 0.5rem;
      
      input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
    }
    
    .coupon-error {
      color: #e74c3c;
      font-size: 0.85rem;
      margin: 0.5rem 0 0;
    }
    
    .coupon-success {
      color: #27ae60;
      font-size: 0.85rem;
      margin: 0.5rem 0 0;
    }
    
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 1rem 0;
    }
    
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: all 0.3s;
      
      &--primary {
        background: #4a7c4e;
        color: #fff;
        
        &:hover {
          background: #3d6640;
        }
      }
      
      &--secondary {
        background: #333;
        color: #fff;
        padding: 0.5rem 1rem;
        
        &:hover {
          background: #222;
        }
      }
      
      &--outline {
        background: none;
        border: 1px solid #ddd;
        color: #666;
        padding: 0.5rem 1rem;
        
        &:hover {
          border-color: #999;
        }
      }
      
      &--large {
        padding: 1rem 2rem;
        font-size: 1.1rem;
      }
      
      &--block {
        display: block;
        width: 100%;
      }
    }
    
    .continue-shopping {
      display: block;
      text-align: center;
      margin-top: 1rem;
      color: #666;
      text-decoration: none;
      font-size: 0.9rem;
      
      &:hover {
        color: #4a7c4e;
      }
    }
    
    .empty-cart {
      text-align: center;
      padding: 3rem;
      
      svg {
        color: #ccc;
        margin-bottom: 1rem;
      }
      
      h2 {
        color: #333;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #666;
        margin-bottom: 1.5rem;
      }
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #eee;
      border-top-color: #4a7c4e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  readonly freeShippingThreshold = 48;
  
  couponCode = '';
  appliedCoupon: string | null = null;
  couponError: string | null = null;
  applyingCoupon = false;
  updating = false;
  removing = false;
  
  ngOnInit(): void {
    this.cartService.loadCart();
  }
  
  updateQuantity(itemId: number, quantity: number): void {
    if (quantity < 1) return;
    
    this.updating = true;
    this.cartService.updateItemQuantity(itemId, quantity).subscribe({
      next: () => {
        this.updating = false;
      },
      error: () => {
        this.updating = false;
      }
    });
  }
  
  removeItem(itemId: number): void {
    this.removing = true;
    this.cartService.removeItem(itemId).subscribe({
      next: () => {
        this.removing = false;
      },
      error: () => {
        this.removing = false;
      }
    });
  }
  
  applyCoupon(): void {
    if (!this.couponCode) return;
    
    this.applyingCoupon = true;
    this.couponError = null;
    
    // MVP: Simple coupon validation
    setTimeout(() => {
      const validCoupons = ['BIENVENIDO10', 'PISTACHO20'];
      if (validCoupons.includes(this.couponCode.toUpperCase())) {
        this.appliedCoupon = this.couponCode.toUpperCase();
        this.couponCode = '';
      } else {
        this.couponError = 'Cupón no válido';
      }
      this.applyingCoupon = false;
    }, 500);
  }
  
  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponError = null;
  }
}
