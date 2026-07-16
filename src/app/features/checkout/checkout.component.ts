import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { StripeService } from '../../core/services/stripe.service';
import { UserService } from '../../core/services/user.service';
import { Address } from '../../core/models';

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
                
                @if (savedAddresses().length > 0) {
                  <div class="saved-addresses">
                    @for (addr of savedAddresses(); track addr.id) {
                      <label class="saved-address-option" [class.selected]="selectedAddressId() === addr.id">
                        <input type="radio" name="savedAddress" [checked]="selectedAddressId() === addr.id" (change)="selectSavedAddress(addr)">
                        <div class="saved-address-option__body">
                          <strong>
                            {{ addr.label || (addr.first_name + ' ' + addr.last_name) }}
                            @if (addr.is_default) { <span class="badge">Predeterminada</span> }
                          </strong>
                          <p>{{ addr.street }}, {{ addr.postal_code }} {{ addr.city }} ({{ addr.province }})</p>
                        </div>
                      </label>
                    }
                    <label class="saved-address-option" [class.selected]="selectedAddressId() === 'new'">
                      <input type="radio" name="savedAddress" [checked]="selectedAddressId() === 'new'" (change)="selectNewAddress()">
                      <div class="saved-address-option__body">
                        <strong>+ Usar otra dirección</strong>
                      </div>
                    </label>
                  </div>
                }

                @if (selectedAddressId() === 'new') {
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

                  @if (authService.isAuthenticated()) {
                    <label class="save-address-checkbox">
                      <input type="checkbox" [checked]="saveNewAddress()" (change)="saveNewAddress.set($any($event.target).checked)">
                      Guardar esta dirección para futuros pedidos
                    </label>
                  }
                }
              </section>
              
              <!-- Step 3: Payment -->
              <section class="checkout-section">
                <h2>
                  <span class="step-number">3</span>
                  Pago seguro
                </h2>

                @if (stripeInitializing()) {
                  <div class="stripe-loading">
                    <span class="spinner"></span>
                    Preparando formulario de pago...
                  </div>
                }

                <!-- Stripe Payment Element mounts here -->
                <div id="payment-element" [class.hidden]="!stripeReady()"></div>

                @if (!stripeReady() && !stripeInitializing()) {
                  <p class="stripe-hint">
                    Completa los pasos anteriores para activar el formulario de pago.
                  </p>
                }

                <p class="payment-notice">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Pago 100% seguro · Procesado por Stripe · Cifrado SSL
                </p>
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

    .saved-addresses {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .saved-address-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;

      input[type="radio"] {
        margin-top: 0.2rem;
      }

      &.selected {
        border-color: #4a7c4e;
        background: #f0f7f0;
      }

      &__body {
        font-size: 0.9rem;

        strong {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #333;
        }

        p {
          margin: 0.25rem 0 0;
          color: #666;
        }
      }
    }

    .badge {
      background: #4a7c4e;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
    }

    .save-address-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #333;
      cursor: pointer;
      margin-top: 0.5rem;

      input {
        width: auto;
      }
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
      margin-top: 1rem;

      svg {
        color: #27ae60;
        flex-shrink: 0;
      }
    }

    .stripe-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      color: #666;
      font-size: 0.9rem;
    }

    .stripe-hint {
      color: #999;
      font-size: 0.9rem;
      font-style: italic;
      padding: 1rem 0;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid #ddd;
      border-top-color: #4a7c4e;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    #payment-element {
      margin-bottom: 1rem;
      &.hidden { display: none; }
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
export class CheckoutComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private stripeService = inject(StripeService);
  private userService = inject(UserService);

  cartService = inject(CartService);
  authService = inject(AuthService);

  contactForm!: FormGroup;
  shippingForm!: FormGroup;

  processing = signal(false);
  error = signal<string | null>(null);
  stripeReady = signal(false);
  stripeInitializing = signal(false);

  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<number | 'new'>('new');
  saveNewAddress = signal(true);

  private orderNumber: string | null = null;
  private stripeInitTriggered = false;

  constructor() {}

  get shippingCost(): number {
    return (this.cartService.cart()?.subtotal || 0) >= 50 ? 0 : 4.95;
  }

  ngOnInit(): void {
    this.initForms();

    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUser();
      if (user) {
        this.contactForm.patchValue({
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
        });
      }
      this.loadSavedAddresses();
    }

    // Watch form status changes to trigger Stripe init
    this.contactForm.statusChanges.subscribe(() => this.tryInitStripe());
    this.shippingForm.statusChanges.subscribe(() => this.tryInitStripe());
  }

  ngOnDestroy(): void {
    this.stripeService.destroy();
  }

  initForms(): void {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
    });

    this.shippingForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      state: ['', Validators.required],
      country: ['ES', Validators.required],
      notes: [''],
    });
  }

  isFormValid(): boolean {
    if (this.selectedAddressId() !== 'new') {
      return this.contactForm.valid;
    }
    return this.contactForm.valid && this.shippingForm.valid;
  }

  private loadSavedAddresses(): void {
    this.userService.getAddresses().subscribe({
      next: (addresses) => {
        this.savedAddresses.set(addresses);
        const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
        if (defaultAddress) {
          this.selectSavedAddress(defaultAddress);
        }
      },
      error: () => {
        // No saved addresses yet — keep the manual entry form
      },
    });
  }

  selectSavedAddress(addr: Address): void {
    this.selectedAddressId.set(addr.id);
    this.contactForm.patchValue({
      firstName: addr.first_name,
      lastName: addr.last_name,
      phone: addr.phone,
    });
    this.shippingForm.patchValue({
      address: addr.street,
      city: addr.city,
      postalCode: addr.postal_code,
      state: addr.province,
      country: addr.country,
    });
  }

  selectNewAddress(): void {
    this.selectedAddressId.set('new');
  }

  private tryInitStripe(): void {
    if (this.isFormValid() && !this.stripeInitTriggered) {
      this.initStripeElement();
    }
  }

  private buildCheckoutData() {
    const addr = {
      first_name: this.contactForm.value.firstName,
      last_name: this.contactForm.value.lastName,
      street: this.shippingForm.value.address,
      city: this.shippingForm.value.city,
      postal_code: this.shippingForm.value.postalCode,
      province: this.shippingForm.value.state,
      country: this.shippingForm.value.country,
      phone: this.contactForm.value.phone,
    };

    return {
      shipping_address: addr,
      billing_address: addr,
      same_billing_address: true,
      guest_email: this.authService.isAuthenticated() ? undefined : this.contactForm.value.email,
      customer_notes: this.shippingForm.value.notes || undefined,
    };
  }

  private initStripeElement(): void {
    this.stripeInitTriggered = true;
    this.stripeInitializing.set(true);
    this.error.set(null);

    this.orderService.createPaymentIntent(this.buildCheckoutData() as any).subscribe({
      next: async (response) => {
        this.orderNumber = response.order_number;
        try {
          await this.stripeService.initElements(response.client_secret);
          // Small timeout ensures the #payment-element div is rendered
          setTimeout(() => {
            this.stripeService.mountPaymentElement('#payment-element');
            this.stripeReady.set(true);
            this.stripeInitializing.set(false);
          }, 50);
        } catch (e: any) {
          this.error.set(e.message || 'Error al inicializar el formulario de pago');
          this.stripeInitializing.set(false);
          this.stripeInitTriggered = false;
        }
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Error al preparar el pago');
        this.stripeInitializing.set(false);
        this.stripeInitTriggered = false;
      },
    });
  }

  async placeOrder(): Promise<void> {
    if (!this.isFormValid()) {
      this.contactForm.markAllAsTouched();
      this.shippingForm.markAllAsTouched();
      return;
    }

    if (!this.stripeReady()) {
      this.error.set('El formulario de pago no está listo todavía. Por favor espera un momento.');
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    if (this.authService.isAuthenticated() && this.selectedAddressId() === 'new' && this.saveNewAddress()) {
      this.userService.createAddress({
        label: null,
        first_name: this.contactForm.value.firstName,
        last_name: this.contactForm.value.lastName,
        street: this.shippingForm.value.address,
        street_2: null,
        city: this.shippingForm.value.city,
        province: this.shippingForm.value.state,
        postal_code: this.shippingForm.value.postalCode,
        country: this.shippingForm.value.country,
        phone: this.contactForm.value.phone,
        is_default: true,
      }).subscribe({ error: () => {} });
    }

    const returnUrl = `${window.location.origin}/gracias?order=${this.orderNumber}`;
    const result = await this.stripeService.confirmPayment(returnUrl);

    if (result.error) {
      this.error.set(result.error.message);
      this.processing.set(false);
    }
    // On success Stripe redirects — no further action needed here
  }
}
