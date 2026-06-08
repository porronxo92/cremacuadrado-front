import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="checkout-page">
      <div class="container">
        <h1>Finalizar compra</h1>
        
        @if (cartService.itemCount() === 0) {
          <div class="empty-cart">
            <p>Tu carrito está vacío</p>
            <a routerLink="/tienda" class="btn btn--primary">Ver productos</a>
          </div>
        } @else {
          <div class="checkout-layout">
            <!-- Checkout form -->
            <div class="checkout-form">
              <!-- Step 1: Contact -->
              <section class="checkout-section">
                <h2>
                  <span class="step-number">1</span>
                  Información de contacto
                </h2>
                
                @if (!authService.isAuthenticated()) {
                  <p class="login-prompt">
                    ¿Ya tienes cuenta? 
                    <a routerLink="/auth/login" [queryParams]="{returnUrl: '/checkout'}">Inicia sesión</a>
                  </p>
                }
                
                <form [formGroup]="contactForm">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="email">Email *</label>
                      <input 
                        type="email" 
                        id="email" 
                        formControlName="email"
                        [class.error]="contactForm.get('email')?.invalid && contactForm.get('email')?.touched">
                      @if (contactForm.get('email')?.hasError('required') && contactForm.get('email')?.touched) {
                        <span class="error-text">El email es obligatorio</span>
                      }
                      @if (contactForm.get('email')?.hasError('email') && contactForm.get('email')?.touched) {
                        <span class="error-text">Email no válido</span>
                      }
                    </div>
                  </div>
                  
                  <div class="form-row form-row--2">
                    <div class="form-group">
                      <label for="firstName">Nombre *</label>
                      <input type="text" id="firstName" formControlName="firstName">
                    </div>
                    <div class="form-group">
                      <label for="lastName">Apellidos *</label>
                      <input type="text" id="lastName" formControlName="lastName">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="phone">Teléfono *</label>
                    <input type="tel" id="phone" formControlName="phone">
                  </div>
                </form>
              </section>
              
              <!-- Step 2: Shipping -->
              <section class="checkout-section">
                <h2>
                  <span class="step-number">2</span>
                  Dirección de envío
                </h2>
                
                <form [formGroup]="shippingForm">
                  <div class="form-group">
                    <label for="address">Dirección *</label>
                    <input type="text" id="address" formControlName="address" placeholder="Calle, número, piso...">
                  </div>
                  
                  <div class="form-row form-row--2">
                    <div class="form-group">
                      <label for="city">Ciudad *</label>
                      <input type="text" id="city" formControlName="city">
                    </div>
                    <div class="form-group">
                      <label for="postalCode">Código postal *</label>
                      <input type="text" id="postalCode" formControlName="postalCode">
                    </div>
                  </div>
                  
                  <div class="form-row form-row--2">
                    <div class="form-group">
                      <label for="state">Provincia *</label>
                      <input type="text" id="state" formControlName="state">
                    </div>
                    <div class="form-group">
                      <label for="country">País *</label>
                      <select id="country" formControlName="country">
                        <option value="ES">España</option>
                        <option value="PT">Portugal</option>
                        <option value="FR">Francia</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="notes">Notas del pedido (opcional)</label>
                    <textarea id="notes" formControlName="notes" rows="3" placeholder="Instrucciones especiales para la entrega..."></textarea>
                  </div>
                </form>
              </section>
              
              <!-- Step 3: Payment -->
              <section class="checkout-section">
                <h2>
                  <span class="step-number">3</span>
                  Método de pago
                </h2>
                
                <div class="payment-methods">
                  <label class="payment-option" [class.selected]="paymentMethod() === 'card'">
                    <input type="radio" name="payment" value="card" (change)="paymentMethod.set('card')" checked>
                    <div class="payment-option__content">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      <span>Tarjeta de crédito/débito</span>
                    </div>
                  </label>
                  
                  <label class="payment-option" [class.selected]="paymentMethod() === 'paypal'">
                    <input type="radio" name="payment" value="paypal" (change)="paymentMethod.set('paypal')">
                    <div class="payment-option__content">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                      </svg>
                      <span>PayPal</span>
                    </div>
                  </label>
                </div>
                
                @if (paymentMethod() === 'card') {
                  <div class="card-form">
                    <div class="form-group">
                      <label for="cardNumber">Número de tarjeta</label>
                      <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                    </div>
                    <div class="form-row form-row--2">
                      <div class="form-group">
                        <label for="cardExpiry">Fecha de expiración</label>
                        <input type="text" id="cardExpiry" placeholder="MM/AA" maxlength="5">
                      </div>
                      <div class="form-group">
                        <label for="cardCvc">CVC</label>
                        <input type="text" id="cardCvc" placeholder="123" maxlength="4">
                      </div>
                    </div>
                    <p class="payment-notice">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      Pago seguro con cifrado SSL
                    </p>
                  </div>
                }
              </section>
            </div>
            
            <!-- Order summary -->
            <div class="order-summary">
              <h2>Resumen del pedido</h2>
              
              <div class="summary-items">
                @for (item of cartService.cart()?.items || []; track item.id) {
                  <div class="summary-item">
                    <div class="summary-item__image">
                      <img [src]="item.product_image || '/assets/images/placeholder.jpg'" [alt]="item.product_name">
                      <span class="quantity-badge">{{ item.quantity }}</span>
                    </div>
                    <div class="summary-item__info">
                      <h4>{{ item.product_name }}</h4>
                      <span>{{ item.product_price | currency:'EUR' }} x {{ item.quantity }}</span>
                    </div>
                    <div class="summary-item__total">
                      {{ item.total | currency:'EUR' }}
                    </div>
                  </div>
                }
              </div>
              
              <hr>
              
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ cartService.cart()?.subtotal | currency:'EUR' }}</span>
              </div>
              
              <div class="summary-row">
                <span>Envío</span>
                <span>{{ shippingCost | currency:'EUR' }}</span>
              </div>
              
              @if (shippingCost === 0) {
                <div class="free-shipping-badge">
                  ✓ Envío gratuito
                </div>
              }
              
              <hr>
              
              <div class="summary-row summary-row--total">
                <span>Total</span>
                <span>{{ (cartService.cart()?.subtotal || 0) + shippingCost | currency:'EUR' }}</span>
              </div>
              
              <button 
                class="btn btn--primary btn--large btn--block"
                (click)="placeOrder()"
                [disabled]="processing() || !isFormValid()">
                @if (processing()) {
                  Procesando...
                } @else {
                  Confirmar pedido
                }
              </button>
              
              @if (error()) {
                <div class="error-message">
                  {{ error() }}
                </div>
              }
              
              <p class="terms-notice">
                Al realizar el pedido, aceptas nuestros
                <a routerLink="/condiciones-venta">Términos y condiciones</a> y
                <a routerLink="/privacidad">Política de privacidad</a>.
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .checkout-page {
      padding: 2rem 0;
      background: #f9f9f9;
      min-height: calc(100vh - 140px);
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
    
    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 2rem;
      align-items: start;
      
      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }
    
    .checkout-section {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      
      h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1.5rem;
        font-size: 1.2rem;
        color: #333;
      }
    }
    
    .step-number {
      width: 28px;
      height: 28px;
      background: #4a7c4e;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }
    
    .login-prompt {
      background: #f0f7f0;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      
      a {
        color: #4a7c4e;
        font-weight: 600;
      }
    }
    
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
      }
      
      input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #4a7c4e;
        }
        
        &.error {
          border-color: #e74c3c;
        }
      }
    }
    
    .form-row {
      &--2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        
        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }
      }
    }
    
    .error-text {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    
    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .payment-option {
      cursor: pointer;
      
      input {
        display: none;
      }
      
      &__content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        transition: all 0.3s;
        
        svg {
          color: #666;
        }
      }
      
      &.selected &__content {
        border-color: #4a7c4e;
        background: #f0f7f0;
        
        svg {
          color: #4a7c4e;
        }
      }
    }
    
    .card-form {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }
    
    .payment-notice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      font-size: 0.85rem;
      margin-top: 0.5rem;
      
      svg {
        color: #27ae60;
      }
    }
    
    .order-summary {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: sticky;
      top: 90px;
      
      h2 {
        margin: 0 0 1rem;
        font-size: 1.2rem;
        color: #333;
      }
    }
    
    .summary-items {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .summary-item__image {
      position: relative;
      width: 50px;
      height: 50px;
      border-radius: 4px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .quantity-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 20px;
        height: 20px;
        background: #4a7c4e;
        color: #fff;
        border-radius: 50%;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .summary-item__info {
      flex: 1;
      
      h4 {
        margin: 0;
        font-size: 0.9rem;
        color: #333;
      }
      
      span {
        font-size: 0.8rem;
        color: #666;
      }
    }
    
    .summary-item__total {
      font-weight: 600;
      color: #333;
    }
    
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 1rem 0;
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
    
    .free-shipping-badge {
      background: #d4edda;
      color: #155724;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      text-align: center;
      margin: 0.5rem 0;
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
        
        &:hover:not(:disabled) {
          background: #3d6640;
        }
        
        &:disabled {
          background: #ccc;
          cursor: not-allowed;
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
    
    .error-message {
      background: #fee;
      color: #c00;
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
    
    .terms-notice {
      margin-top: 1rem;
      font-size: 0.8rem;
      color: #666;
      text-align: center;
      
      a {
        color: #4a7c4e;
      }
    }
    
    .empty-cart {
      text-align: center;
      padding: 3rem;
      background: #fff;
      border-radius: 8px;
      
      p {
        color: #666;
        margin-bottom: 1rem;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  cartService = inject(CartService);
  authService = inject(AuthService);
  
  contactForm!: FormGroup;
  shippingForm!: FormGroup;
  
  paymentMethod = signal('card');
  processing = signal(false);
  error = signal<string | null>(null);
  
  get shippingCost(): number {
    return (this.cartService.cart()?.subtotal || 0) >= 30 ? 0 : 4.95;
  }
  
  ngOnInit(): void {
    this.initForms();
    
    // Pre-fill if user is logged in
    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUser();
      if (user) {
        this.contactForm.patchValue({
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone
        });
      }
    }
  }
  
  initForms(): void {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required]
    });
    
    this.shippingForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      state: ['', Validators.required],
      country: ['ES', Validators.required],
      notes: ['']
    });
  }
  
  isFormValid(): boolean {
    return this.contactForm.valid && this.shippingForm.valid;
  }
  
  placeOrder(): void {
    if (!this.isFormValid()) {
      this.contactForm.markAllAsTouched();
      this.shippingForm.markAllAsTouched();
      return;
    }
    
    this.processing.set(true);
    this.error.set(null);
    
    const orderData = {
      shipping_address: {
        first_name: this.contactForm.value.firstName,
        last_name: this.contactForm.value.lastName,
        street: this.shippingForm.value.address,
        city: this.shippingForm.value.city,
        postal_code: this.shippingForm.value.postalCode,
        province: this.shippingForm.value.state,
        country: this.shippingForm.value.country,
        phone: this.contactForm.value.phone
      },
      billing_address: {
        first_name: this.contactForm.value.firstName,
        last_name: this.contactForm.value.lastName,
        street: this.shippingForm.value.address,
        city: this.shippingForm.value.city,
        postal_code: this.shippingForm.value.postalCode,
        province: this.shippingForm.value.state,
        country: this.shippingForm.value.country,
        phone: this.contactForm.value.phone
      },
      notes: this.shippingForm.value.notes,
      payment_method: this.paymentMethod()
    };
    
    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.processing.set(false);
        this.cartService.clearCart();
        this.router.navigate(['/gracias'], {
          queryParams: { orderId: order.id }
        });
      },
      error: (err) => {
        this.processing.set(false);
        this.error.set(err.message || 'Error al procesar el pedido');
      }
    });
  }
}
