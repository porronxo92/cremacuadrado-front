import { Component, DestroyRef, OnInit, OnDestroy, computed, inject, signal, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { StripeService } from '../../core/services/stripe.service';
import { UserService } from '../../core/services/user.service';
import { Address, BillingDetails } from '../../core/models';
import { normalizeTaxId, taxIdValidator } from '../../core/utils/tax-id';
import { BALEARES_SHIPPING_COST, TERMS_VERSION, shippingZone, ShippingZone } from '../../core/legal';
import {
  PROVINCES, SHIPPING_PROVINCES, canonicalProvince, postcodeMatchesProvince, provinceCode, provinceFromPostcode,
} from '../../core/data/spain';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { environment } from '@env/environment';
import { Subject, firstValueFrom, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-checkout',
    imports: [CommonModule, RouterModule, ReactiveFormsModule, PhoneInputComponent],
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

              <!-- Resumen de errores: aparece al intentar pagar con datos pendientes.
                   Recibe el foco y enlaza cada error con su campo (los errores
                   en línea se mantienen debajo de cada campo). -->
              @if (errorSummary().length > 0) {
                <div class="error-summary" #errorSummaryEl tabindex="-1" role="alert" aria-labelledby="error-summary-title">
                  <h2 id="error-summary-title">Revisa estos datos para continuar</h2>
                  <ul>
                    @for (e of errorSummary(); track e.id) {
                      <li><a [href]="'#' + e.id" (click)="focusField($event, e.id)">{{ e.label }}</a></li>
                    }
                  </ul>
                </div>
              }

              <!-- Step 1: Contact -->
              <section class="checkout-section" aria-labelledby="step-contact">
                <h2 id="step-contact">
                  <span class="step-number" aria-hidden="true">1</span>
                  Información de contacto
                </h2>

                @if (!authService.isAuthenticated()) {
                  <p class="login-prompt">
                    ¿Ya tienes cuenta?
                    <a routerLink="/auth/login" [queryParams]="{returnUrl: '/checkout'}">Inicia sesión</a>
                  </p>
                }

                @if (!authService.isAuthenticated() && cartService.cart()?.coupon) {
                  <p class="coupon-guest-warning">
                    Tu cupón <strong>{{ cartService.cart()?.coupon?.code }}</strong> no se aplicará como invitado.
                    <a routerLink="/auth/login" [queryParams]="{returnUrl: '/checkout'}">Inicia sesión</a>
                    o
                    <a routerLink="/auth/register" [queryParams]="{returnUrl: '/checkout'}">crea una cuenta</a>
                    para no perder el descuento.
                  </p>
                }

                <form [formGroup]="contactForm" (ngSubmit)="placeOrder()" novalidate>
                  <div class="form-group">
                    <label for="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      formControlName="email"
                      autocomplete="email"
                      (blur)="checkExistingAccount()"
                      [class.error]="showError(contactForm, 'email')"
                      [attr.aria-invalid]="showError(contactForm, 'email')"
                      [attr.aria-describedby]="showError(contactForm, 'email') ? 'email-error' : (existingAccount() ? 'existing-account' : null)">
                    @if (showError(contactForm, 'email')) {
                      <span class="error-text" id="email-error">
                        {{ contactForm.get('email')?.hasError('required') ? 'Escribe tu email para recibir la confirmación del pedido' : 'Revisa el email: debe tener el formato nombre@dominio.com' }}
                      </span>
                    }
                    <!-- Email ya registrado: invitar a iniciar sesión para que el pedido
                         quede en su cuenta (no bloquea la compra como invitado). -->
                    <div aria-live="polite">
                      @if (existingAccount()) {
                        <p class="existing-account" id="existing-account">
                          Ya tienes una cuenta con este email.
                          <a routerLink="/auth/login" [queryParams]="{returnUrl: '/checkout'}"
                             [state]="{ email: contactForm.value.email }">Inicia sesión antes de pagar</a>
                          para que el pedido quede guardado en tu cuenta.
                        </p>
                      }
                    </div>
                  </div>

                  @if (missingProfileData()) {
                    <p class="profile-hint" role="status">
                      Completa los datos marcados en rojo. Los guardaremos en tu cuenta para próximos pedidos.
                    </p>
                  }

                  <div class="form-row form-row--2">
                    <div class="form-group">
                      <label for="firstName">Nombre *</label>
                      <input type="text" id="firstName" formControlName="firstName" autocomplete="given-name"
                        [class.error]="showError(contactForm, 'firstName')"
                        [attr.aria-invalid]="showError(contactForm, 'firstName')"
                        [attr.aria-describedby]="showError(contactForm, 'firstName') ? 'firstName-error' : null">
                      @if (showError(contactForm, 'firstName')) { <span class="error-text" id="firstName-error">Escribe tu nombre</span> }
                    </div>
                    <div class="form-group">
                      <label for="lastName">Apellidos *</label>
                      <input type="text" id="lastName" formControlName="lastName" autocomplete="family-name"
                        [class.error]="showError(contactForm, 'lastName')"
                        [attr.aria-invalid]="showError(contactForm, 'lastName')"
                        [attr.aria-describedby]="showError(contactForm, 'lastName') ? 'lastName-error' : null">
                      @if (showError(contactForm, 'lastName')) { <span class="error-text" id="lastName-error">Escribe tus apellidos</span> }
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="phone">Teléfono *</label>
                    <app-phone-input formControlName="phone" inputId="phone" [invalid]="showError(contactForm, 'phone')"
                      [describedBy]="showError(contactForm, 'phone') ? 'phone-error' : null" />
                    @if (showError(contactForm, 'phone')) {
                      <span class="error-text" id="phone-error">
                        {{ contactForm.get('phone')?.hasError('required') ? 'Escribe un teléfono: Correos lo necesita para la entrega' : 'Revisa el teléfono: en España son 9 dígitos' }}
                      </span>
                    }
                  </div>
                </form>
              </section>

              <!-- Step 2: Shipping -->
              <section class="checkout-section" aria-labelledby="step-shipping">
                <h2 id="step-shipping">
                  <span class="step-number" aria-hidden="true">2</span>
                  Dirección de envío
                </h2>

                @if (savedAddresses().length > 0) {
                  <fieldset class="saved-addresses">
                    <legend class="sr-only">Dirección de envío guardada</legend>
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
                  </fieldset>
                }

                @if (selectedAddressId() === 'new') {
                  <form [formGroup]="shippingForm" (ngSubmit)="placeOrder()" novalidate>
                    <div class="form-group">
                      <label for="address">Dirección *</label>
                      <input type="text" id="address" formControlName="address" autocomplete="shipping address-line1"
                        placeholder="Calle, número, piso..."
                        [class.error]="showError(shippingForm, 'address')"
                        [attr.aria-invalid]="showError(shippingForm, 'address')"
                        [attr.aria-describedby]="showError(shippingForm, 'address') ? 'address-error' : null">
                      @if (showError(shippingForm, 'address')) { <span class="error-text" id="address-error">Escribe la calle, el número y el piso</span> }
                    </div>

                    <div class="form-row form-row--2">
                      <div class="form-group">
                        <label for="city">Ciudad *</label>
                        <input type="text" id="city" formControlName="city" autocomplete="shipping address-level2"
                          [class.error]="showError(shippingForm, 'city')"
                          [attr.aria-invalid]="showError(shippingForm, 'city')"
                          [attr.aria-describedby]="showError(shippingForm, 'city') ? 'city-error' : null">
                        @if (showError(shippingForm, 'city')) { <span class="error-text" id="city-error">Escribe la ciudad o el municipio</span> }
                      </div>
                      <div class="form-group">
                        <label for="postalCode">Código postal *</label>
                        <input type="text" id="postalCode" formControlName="postalCode" inputmode="numeric" maxlength="5"
                          autocomplete="shipping postal-code"
                          [class.error]="postalCodeError()"
                          [attr.aria-invalid]="!!postalCodeError()"
                          [attr.aria-describedby]="postalCodeError() ? 'postalCode-error' : null">
                        @if (postalCodeError(); as msg) {
                          <span class="error-text" id="postalCode-error">{{ msg }}</span>
                        }
                      </div>
                    </div>

                    <div class="form-row form-row--2">
                      <div class="form-group">
                        <label for="state">Provincia *</label>
                        <select id="state" formControlName="state" autocomplete="shipping address-level1"
                          [class.error]="showError(shippingForm, 'state')"
                          [attr.aria-invalid]="showError(shippingForm, 'state')"
                          [attr.aria-describedby]="showError(shippingForm, 'state') ? 'state-error' : null">
                          <option value="" disabled>Selecciona una provincia</option>
                          @for (p of shippingProvinces; track p.code) {
                            <option [value]="p.name">{{ p.name }}</option>
                          }
                        </select>
                        @if (showError(shippingForm, 'state')) { <span class="error-text" id="state-error">Selecciona la provincia</span> }
                      </div>
                      <div class="form-group">
                        <label for="country">País *</label>
                        <select id="country" formControlName="country" autocomplete="shipping country">
                          <option value="ES">España</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="notes">Notas del pedido (opcional)</label>
                      <textarea id="notes" formControlName="notes" rows="3" placeholder="Indicaciones para la entrega"></textarea>
                    </div>
                  </form>

                  @if (authService.isAuthenticated()) {
                    <label class="check-option">
                      <input type="checkbox" [checked]="saveNewAddress()" (change)="saveNewAddress.set($any($event.target).checked)">
                      Guardar esta dirección para futuros pedidos
                    </label>
                  }
                }

                <!-- Aviso de zona de envío (Baleares: informativo; Canarias/Ceuta/Melilla: bloqueo explicado) -->
                <div class="zone-notice" role="status">
                  @if (zone() === 'baleares') {
                    <p class="zone-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span>Envío a Islas Baleares: 7,95 €. El envío gratis desde 48 € es solo para la península.</span>
                    </p>
                  }
                </div>

                @if (zone() === 'quote') {
                  <section class="quote-panel" id="quote-panel" tabindex="-1" aria-labelledby="quote-panel-title">
                    <h3 id="quote-panel-title">Envíos a Canarias, Ceuta y Melilla</h3>
                    <p>Hay trámites de aduana y calculamos el envío a medida. Escríbenos por WhatsApp con tu pedido y te pasamos el presupuesto.</p>
                    <a class="btn btn--primary" [href]="quoteWhatsappUrl()" target="_blank" rel="noopener">
                      Pedir presupuesto por WhatsApp
                      <span class="sr-only">(se abre en WhatsApp)</span>
                    </a>
                  </section>
                }

                <label class="check-option invoice-toggle">
                  <input type="checkbox" [checked]="needsInvoice()" (change)="toggleInvoice($any($event.target).checked)">
                  Necesito factura a nombre de empresa o autónomo (con NIF)
                </label>

                @if (needsInvoice()) {
                  <form [formGroup]="billingForm" class="billing-form" (ngSubmit)="placeOrder()" novalidate>
                    <div class="form-row form-row--2">
                      <div class="form-group">
                        <label for="billingName">Razón social o nombre *</label>
                        <input type="text" id="billingName" formControlName="name" autocomplete="organization"
                          [class.error]="showError(billingForm, 'name')"
                          [attr.aria-invalid]="showError(billingForm, 'name')"
                          [attr.aria-describedby]="showError(billingForm, 'name') ? 'billingName-error' : null">
                        @if (showError(billingForm, 'name')) { <span class="error-text" id="billingName-error">Escribe la razón social o el nombre fiscal</span> }
                      </div>
                      <div class="form-group">
                        <label for="billingNif">NIF / CIF / NIE *</label>
                        <input type="text" id="billingNif" formControlName="nif" autocomplete="off"
                          [class.error]="showError(billingForm, 'nif')"
                          [attr.aria-invalid]="showError(billingForm, 'nif')"
                          [attr.aria-describedby]="showError(billingForm, 'nif') ? 'billingNif-error' : null">
                        @if (showError(billingForm, 'nif')) {
                          <span class="error-text" id="billingNif-error">
                            {{ billingForm.get('nif')?.hasError('required') ? 'Escribe el NIF, CIF o NIE' : 'Revisa el NIF: la letra o los dígitos no cuadran' }}
                          </span>
                        }
                      </div>
                    </div>
                    <label class="check-option">
                      <input type="checkbox" [checked]="billingSameAsShipping()" (change)="setBillingSameAsShipping($any($event.target).checked)">
                      La dirección fiscal es la misma que la de envío
                    </label>
                    @if (!billingSameAsShipping()) {
                      <div class="form-group">
                        <label for="billingStreet">Dirección fiscal *</label>
                        <input type="text" id="billingStreet" formControlName="street" autocomplete="billing address-line1"
                          [class.error]="showError(billingForm, 'street')"
                          [attr.aria-invalid]="showError(billingForm, 'street')"
                          [attr.aria-describedby]="showError(billingForm, 'street') ? 'billingStreet-error' : null">
                        @if (showError(billingForm, 'street')) { <span class="error-text" id="billingStreet-error">Escribe la dirección fiscal</span> }
                      </div>
                      <div class="form-row form-row--2">
                        <div class="form-group">
                          <label for="billingCity">Ciudad *</label>
                          <input type="text" id="billingCity" formControlName="city" autocomplete="billing address-level2"
                            [class.error]="showError(billingForm, 'city')"
                            [attr.aria-invalid]="showError(billingForm, 'city')"
                            [attr.aria-describedby]="showError(billingForm, 'city') ? 'billingCity-error' : null">
                          @if (showError(billingForm, 'city')) { <span class="error-text" id="billingCity-error">Escribe la ciudad</span> }
                        </div>
                        <div class="form-group">
                          <label for="billingPostal">Código postal *</label>
                          <input type="text" id="billingPostal" formControlName="postal_code" inputmode="numeric" maxlength="5"
                            autocomplete="billing postal-code"
                            [class.error]="billingPostalError()"
                            [attr.aria-invalid]="!!billingPostalError()"
                            [attr.aria-describedby]="billingPostalError() ? 'billingPostal-error' : null">
                          @if (billingPostalError(); as msg) { <span class="error-text" id="billingPostal-error">{{ msg }}</span> }
                        </div>
                      </div>
                      <div class="form-group">
                        <label for="billingProvince">Provincia *</label>
                        <select id="billingProvince" formControlName="province" autocomplete="billing address-level1"
                          [class.error]="showError(billingForm, 'province')"
                          [attr.aria-invalid]="showError(billingForm, 'province')"
                          [attr.aria-describedby]="showError(billingForm, 'province') ? 'billingProvince-error' : null">
                          <option value="" disabled>Selecciona una provincia</option>
                          @for (p of allProvinces; track p.code) {
                            <option [value]="p.name">{{ p.name }}</option>
                          }
                        </select>
                        @if (showError(billingForm, 'province')) {
                          <span class="error-text" id="billingProvince-error">Selecciona la provincia</span>
                        }
                      </div>
                    }
                  </form>
                }
              </section>

              <!-- Step 3: Payment -->
              <section class="checkout-section" aria-labelledby="step-payment">
                <h2 id="step-payment">
                  <span class="step-number" aria-hidden="true">3</span>
                  Pago seguro
                </h2>

                @if (stripeInitializing()) {
                  <div class="stripe-loading" role="status">
                    <span class="spinner" aria-hidden="true"></span>
                    Preparando el formulario de pago…
                  </div>
                }

                <!-- Stripe Payment Element mounts here -->
                <div id="payment-element" [class.hidden]="!stripeReady()"></div>

                @if (!stripeReady() && !stripeInitializing()) {
                  <p class="stripe-hint">
                    Completa tus datos de contacto y la dirección de envío para activar el formulario de pago.
                  </p>
                }

                <p class="payment-notice">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Pago 100% seguro · Procesado por Stripe · Cifrado SSL
                </p>
              </section>
            </div>

            <!-- Order summary -->
            <div class="order-summary">
              <h2>Resumen del pedido</h2>

              <ul class="summary-items">
                @for (item of cartService.cart()?.items || []; track item.id) {
                  <li class="summary-item">
                    <div class="summary-item__image">
                      <img [src]="item.product_image || '/assets/images/placeholder.jpg'" [alt]="item.product_name" width="56" height="56">
                      <span class="quantity-badge" [attr.aria-label]="item.quantity + (item.quantity === 1 ? ' unidad' : ' unidades')">{{ item.quantity }}</span>
                    </div>
                    <div class="summary-item__info">
                      <h3>{{ item.product_name }}</h3>
                      @if (item.variant_format) { <span class="summary-item__format">{{ item.variant_format }}</span> }
                      <span>{{ (item.unit_price ?? item.product_price ?? 0) | currency:'EUR':'symbol':'1.2-2':'es' }} × {{ item.quantity }}</span>
                    </div>
                    <div class="summary-item__total">
                      {{ item.total | currency:'EUR':'symbol':'1.2-2':'es' }}
                    </div>
                  </li>
                }
              </ul>

              <hr>

              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ cartService.cart()?.subtotal | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
              </div>

              @if ((cartService.cart()?.discount ?? 0) > 0) {
                <div class="summary-row summary-row--discount">
                  <span>Descuento {{ cartService.cart()?.coupon?.code ? '(' + cartService.cart()!.coupon!.code + ')' : '' }}</span>
                  <span>−{{ cartService.cart()?.discount | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                </div>
              }

              <div class="summary-row">
                <span>Envío</span>
                <span class="ship-value">
                  @if (zone() === 'quote') {
                    A presupuestar
                  } @else if (shippingDiscount > 0) {
                    <s class="ship-old"><span class="sr-only">antes </span>{{ (zone() === 'baleares' ? balearesCost : shippingDiscount) | currency:'EUR':'symbol':'1.2-2':'es' }}</s>
                    <strong class="ship-free">Gratis</strong>
                    <small class="ship-note">Cupón {{ cartService.cart()?.coupon?.code }}</small>
                  } @else if (zone() === 'baleares') {
                    @if (balearesShipping() !== null) { {{ balearesShipping() | currency:'EUR':'symbol':'1.2-2':'es' }} } @else { Calculando… }
                  } @else if (shippingCost === 0) { Gratis } @else { {{ shippingCost | currency:'EUR':'symbol':'1.2-2':'es' }} }
                </span>
              </div>

              @if (cartService.cart()?.coupon; as cpn) {
                @if (cpn.applies === false && cpn.message) {
                  <p class="coupon-info" role="status">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span><strong>{{ cpn.code }}:</strong> {{ cpn.message }}</span>
                  </p>
                }
              }

              <hr>

              <div class="summary-row summary-row--total">
                <span>Total <small class="vat-note">(IVA incluido)</small></span>
                <span>{{ displayTotal | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
              </div>
              @if (zone() === 'quote') {
                <p class="total-note">Total sin envío: lo presupuestamos por WhatsApp.</p>
              }

              <label class="terms-check" [class.has-error]="termsError()">
                <input type="checkbox" id="acceptTerms" [checked]="acceptTerms()"
                  (change)="onTermsChange($any($event.target).checked)"
                  [attr.aria-invalid]="termsError()"
                  [attr.aria-describedby]="termsError() ? 'acceptTerms-error' : null">
                <span>
                  He leído y acepto las <a routerLink="/condiciones-venta" target="_blank">condiciones generales de venta</a>,
                  incluida la información sobre el <a routerLink="/desistimiento" target="_blank">derecho de desistimiento</a>. *
                </span>
              </label>
              @if (termsError()) {
                <span class="error-text error-text--terms" id="acceptTerms-error">Marca la casilla para aceptar las condiciones de venta</span>
              }

              <!-- Siempre pulsable (salvo mientras se procesa): si falta algo,
                   al pulsarlo se muestra el resumen de errores en lugar de
                   dejar un botón gris sin explicación. -->
              <button
                type="button"
                class="btn btn--primary btn--large btn--block"
                (click)="placeOrder()"
                [disabled]="processing()"
                [attr.aria-busy]="processing()">
                @if (processing()) {
                  <span class="spinner spinner--on-brand" aria-hidden="true"></span>
                  Procesando...
                } @else {
                  <!-- Art. 98.2 TRLGDCU: el botón debe indicar sin ambigüedad que obliga a pagar. -->
                  Confirmar y pagar
                }
              </button>

              @if (error()) {
                <div class="error-message" role="alert">
                  {{ error() }}
                </div>
              }

              <p class="terms-notice">
                Envío a la península en 48–72 h; a Baleares, algo más. Trataremos tus datos para gestionar el pedido
                (ejecución del contrato). Más información en la <a routerLink="/privacidad" target="_blank">política de privacidad</a>.
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    // Estilo de marca (variables globales de styles.scss). Contenedores con
    // radio 2px; botones con radio 20px; nunca blanco puro.
    $surface: #FAF8F3;

    .checkout-page {
      padding: 2rem 0 3rem;
      background: var(--color-bg);
      min-height: calc(100vh - 140px);
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

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 2rem;
      align-items: start;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    // ── Resumen de errores ──────────────────────────────
    .error-summary {
      border: 2px solid var(--color-error);
      background: rgba(160, 28, 28, 0.04);
      border-radius: 2px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      scroll-margin-top: 100px;

      h2 {
        font-family: var(--font-ui);
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-error);
        margin: 0 0 0.5rem;
      }

      ul { margin: 0; padding-left: 1.25rem; }

      li { margin: 0.25rem 0; }

      a {
        color: var(--color-error);
        font-weight: 500;
        text-decoration: underline;
        display: inline-block;
        padding: 0.25rem 0;
      }
    }

    .checkout-section {
      background: $surface;
      border: 1px solid var(--color-border);
      border-radius: 2px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1.25rem;
        font-family: var(--font-ui);
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--color-text);
      }

      @media (max-width: 480px) { padding: 1.25rem 1rem; }
    }

    .step-number {
      width: 28px;
      height: 28px;
      background: var(--color-brand);
      color: var(--color-accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .login-prompt,
    .coupon-guest-warning,
    .profile-hint {
      padding: 0.75rem 1rem;
      border-radius: 2px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      line-height: 1.5;

      a { color: var(--color-brand); font-weight: 600; text-decoration: underline; }
    }

    .login-prompt { background: var(--color-bg-alt); }

    .ship-value { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.3; }
    .ship-old { color: var(--color-text-light); font-size: 0.85rem; }
    .ship-free { color: var(--color-text); font-weight: 600; }
    .ship-note { font-size: 0.75rem; color: var(--color-text-light); }

    .coupon-info {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      margin: 0.5rem 0;
      padding: 0.6rem 0.75rem;
      border-radius: 2px;
      font-size: 0.85rem;
      line-height: 1.4;
      background: rgba(230, 193, 90, 0.18);
      border: 1px solid rgba(200, 138, 26, 0.45);
      color: #5C4300;
      svg { flex-shrink: 0; margin-top: 2px; }
    }

    .zone-info {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      margin: 1rem 0 0;
      padding: 0.75rem 1rem;
      border-radius: 2px;
      font-size: 0.9rem;
      line-height: 1.5;
      background: var(--color-bg-alt);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      svg { flex-shrink: 0; margin-top: 3px; color: var(--color-brand); }
    }

    .quote-panel {
      margin: 1rem 0 0;
      padding: 1.25rem;
      border: 2px solid var(--color-brand);
      border-radius: 2px;
      background: var(--color-bg-alt);
      scroll-margin-top: 100px;

      h3 {
        margin: 0 0 0.5rem;
        font-family: var(--font-ui);
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--color-brand);
      }
      p { margin: 0 0 1rem; font-size: 0.95rem; line-height: 1.5; color: var(--color-text); }
      .btn { width: 100%; }
      @media (min-width: 600px) { .btn { width: auto; } }
    }

    .total-note { margin: -0.25rem 0 0.5rem; font-size: 0.8rem; color: var(--color-text-light); text-align: right; }

    .existing-account {
      margin: 0.5rem 0 0;
      padding: 0.75rem 1rem;
      border-radius: 2px;
      font-size: 0.9rem;
      line-height: 1.5;
      a { color: var(--color-brand); font-weight: 600; text-decoration: underline; }
    }

    .coupon-guest-warning,
    .profile-hint,
    .existing-account {
      background: rgba(230, 193, 90, 0.18);
      border: 1px solid rgba(200, 138, 26, 0.45);
      color: #5C4300;
    }

    // ── Campos ──────────────────────────────────────────
    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.4rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--color-text);
      }

      input, select, textarea {
        width: 100%;
        min-height: 48px;
        padding: 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: 2px;
        background: #FFFDF8;
        color: var(--color-text);
        font-family: var(--font-ui);
        font-size: 1rem; // ≥16px: evita el zoom automático de iOS
        transition: border-color 150ms;

        &:focus { border-color: var(--color-brand); }

        &.error { border-color: var(--color-error); border-width: 2px; }
      }

      textarea { min-height: 0; }
    }

    .form-row {
      &--2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
          gap: 0;
        }
      }
    }

    .error-text {
      display: block;
      color: var(--color-error);
      font-size: 0.85rem;
      margin-top: 0.3rem;

      &--terms { margin: -0.25rem 0 0.75rem; }
    }

    .saved-addresses {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 0 0 1.25rem;
      border: none;
      padding: 0;
    }

    .saved-address-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border: 2px solid var(--color-border);
      border-radius: 2px;
      cursor: pointer;
      transition: border-color 150ms, background 150ms;

      input[type="radio"] {
        margin-top: 0.2rem;
        width: 20px;
        height: 20px;
        accent-color: var(--color-brand);
        flex-shrink: 0;
      }

      &.selected {
        border-color: var(--color-brand);
        background: rgba(123, 23, 22, 0.04);
      }

      &__body {
        font-size: 0.9rem;

        strong {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          color: var(--color-text);
          font-weight: 600;
        }

        p {
          margin: 0.25rem 0 0;
          color: var(--color-text-light);
        }
      }
    }

    .badge {
      background: var(--color-brand);
      color: var(--color-accent);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
    }

    .invoice-toggle { margin-top: 1.25rem; }

    .billing-form { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }

    // Casillas: zona táctil de 48px aunque el control mida 20px
    .check-option {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-height: 48px;
      font-size: 0.9rem;
      color: var(--color-text);
      cursor: pointer;

      input {
        width: 20px;
        height: 20px;
        accent-color: var(--color-brand);
        flex-shrink: 0;
      }
    }

    .payment-notice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-text-light);
      font-size: 0.85rem;
      margin-top: 1rem;

      svg { color: var(--color-success); flex-shrink: 0; }
    }

    .stripe-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      color: var(--color-text-light);
      font-size: 0.9rem;
    }

    .stripe-hint {
      color: var(--color-text-light);
      font-size: 0.9rem;
      font-style: italic;
      padding: 0.5rem 0;
    }

    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-brand);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;

      &--on-brand { border-color: rgba(230, 193, 90, 0.35); border-top-color: var(--color-accent); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    #payment-element {
      margin-bottom: 1rem;
      &.hidden { display: none; }
    }

    // ── Resumen del pedido ─────────────────────────────
    .order-summary {
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

    .summary-items {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 300px;
      overflow-y: auto;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.25rem 0.75rem 0;
      border-bottom: 1px solid var(--color-border);

      &:last-child { border-bottom: none; }
    }

    .summary-item__image {
      position: relative;
      width: 56px;
      height: 56px;
      flex-shrink: 0;
      margin: 6px 6px 0 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 2px;
        background: var(--color-bg);
      }

      .quantity-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 20px;
        height: 20px;
        padding: 0 4px;
        background: var(--color-brand);
        color: var(--color-accent);
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .summary-item__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;

      h3 {
        margin: 0;
        font-family: var(--font-ui);
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--color-text);
      }

      span {
        font-size: 0.8rem;
        color: var(--color-text-light);
      }
    }

    .summary-item__format { font-weight: 500; }

    .summary-item__total {
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap;
    }

    hr {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 1rem 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.4rem 0;
      color: var(--color-text-light);

      &--discount { color: var(--color-success); font-weight: 500; }

      &--total {
        align-items: baseline;
        font-weight: 600;
        color: var(--color-text);
        padding: 0.75rem 0;

        span:last-child {
          font-family: var(--font-title);
          font-size: 2rem;
          line-height: 1;
          color: var(--color-brand);
        }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 48px;
      padding: 0.75rem 1.5rem;
      border: 1.5px solid var(--color-brand);
      border-radius: 20px;
      font-family: var(--font-ui);
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: background 150ms, color 150ms;

      &--primary {
        background: var(--color-brand);
        color: var(--color-accent);

        &:hover:not(:disabled) { background: var(--color-brand-hover); }

        &:disabled { opacity: 0.5; cursor: progress; }
      }

      &--large { min-height: 54px; font-size: 1rem; }

      &--block { display: flex; width: 100%; }
    }

    .error-message {
      background: rgba(160, 28, 28, 0.06);
      border: 1px solid rgba(160, 28, 28, 0.35);
      color: var(--color-error);
      padding: 0.75rem;
      border-radius: 2px;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .vat-note { font-size: 0.75rem; font-weight: 400; color: var(--color-text-light); }

    .terms-check {
      display: flex; gap: 0.6rem; align-items: flex-start; margin: 1.25rem 0 0.75rem;
      font-size: 0.85rem; line-height: 1.5; cursor: pointer; color: var(--color-text);
      input { margin-top: 0.15rem; width: 20px; height: 20px; flex-shrink: 0; accent-color: var(--color-brand); }
      a { color: var(--color-brand); font-weight: 600; text-decoration: underline; }

      &.has-error input { outline: 2px solid var(--color-error); outline-offset: 2px; }
    }

    .terms-notice {
      margin-top: 1rem;
      font-size: 0.8rem;
      color: var(--color-text-light);
      text-align: center;
      line-height: 1.5;

      a { color: var(--color-brand); text-decoration: underline; }
    }

    .empty-cart {
      text-align: center;
      padding: 3rem;
      background: var(--color-bg-alt);
      border-radius: 2px;

      p {
        font-family: var(--font-narrative);
        color: var(--color-text-light);
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
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

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

  /** Full Address object when user picks a saved address; null when filling manually. */
  private _selectedAddress: Address | null = null;

  private orderNumber: string | null = null;
  private paymentIntentId: string | null = null;
  private stripeInitTriggered = false;

  billingForm!: FormGroup;
  needsInvoice = signal(false);
  billingSameAsShipping = signal(true);
  acceptTerms = signal(false);
  /** El usuario logado tenía datos de contacto incompletos (p. ej. registro con Google). */
  missingProfileData = signal(false);
  /** El email del invitado ya tiene cuenta (POST /auth/email-status). */
  existingAccount = signal(false);
  private lastCheckedEmail = '';
  readonly shippingProvinces = SHIPPING_PROVINCES;
  readonly allProvinces = PROVINCES;

  /** Errores pendientes tras pulsar «pagar» (resumen enfocable arriba del formulario). */
  errorSummary = signal<{ id: string; label: string }[]>([]);
  /** La casilla de condiciones se marca en rojo solo tras intentar pagar. */
  termsError = signal(false);
  private submitAttempted = false;

  showError(form: FormGroup, key: string): boolean {
    const control = form.get(key);
    return !!control && control.invalid && control.touched;
  }

  postalCodeError(): string | null {
    const c = this.shippingForm.get('postalCode')!;
    if (c.hasError('provinceMismatch')) return 'El código postal no corresponde a la provincia seleccionada';
    if (!c.touched) return null;
    if (c.hasError('required')) return 'Escribe el código postal';
    if (c.hasError('pattern')) return 'Revisa el código postal: deben ser 5 dígitos';
    return null;
  }

  billingPostalError(): string | null {
    const c = this.billingForm.get('postal_code')!;
    if (c.hasError('provinceMismatch')) return 'El código postal no corresponde a la provincia';
    if (c.touched && c.hasError('required')) return 'Escribe el código postal';
    return null;
  }

  /** Lista de errores para el resumen: cada uno enlaza al id de su campo. */
  private collectErrors(): { id: string; label: string }[] {
    const out: { id: string; label: string }[] = [];
    const add = (invalid: boolean, id: string, label: string) => { if (invalid) out.push({ id, label }); };

    const c = this.contactForm.controls;
    add(c['email'].invalid, 'email', c['email'].hasError('required') ? 'Falta el email' : 'El email no es válido');
    add(c['firstName'].invalid, 'firstName', 'Falta el nombre');
    add(c['lastName'].invalid, 'lastName', 'Faltan los apellidos');
    add(c['phone'].invalid, 'phone', c['phone'].hasError('required') ? 'Falta el teléfono' : 'El teléfono no es válido');

    if (this.selectedAddressId() === 'new') {
      const s = this.shippingForm.controls;
      add(s['address'].invalid, 'address', 'Falta la dirección');
      add(s['city'].invalid, 'city', 'Falta la ciudad');
      const cp = s['postalCode'];
      add(cp.invalid, 'postalCode',
        cp.hasError('required') ? 'Falta el código postal'
          : cp.hasError('provinceMismatch') ? 'El código postal no corresponde a la provincia'
          : 'El código postal no es válido');
      add(s['state'].invalid, 'state', 'Falta la provincia');
    }
    // Canarias, Ceuta y Melilla: no se cobra en la web; el enlace lleva al panel con el presupuesto por WhatsApp.
    add(this.zone() === 'quote', 'quote-panel',
      'No podemos cobrar envíos a Canarias, Ceuta ni Melilla desde la web: pide presupuesto por WhatsApp');

    if (this.needsInvoice()) {
      const b = this.billingForm.controls;
      add(b['name'].invalid, 'billingName', 'Falta la razón social o el nombre fiscal');
      add(b['nif'].invalid, 'billingNif', b['nif'].hasError('required') ? 'Falta el NIF' : 'El NIF no es válido');
      if (!this.billingSameAsShipping()) {
        add(b['street'].invalid, 'billingStreet', 'Falta la dirección fiscal');
        add(b['city'].invalid, 'billingCity', 'Falta la ciudad fiscal');
        add(b['postal_code'].invalid, 'billingPostal',
          b['postal_code'].hasError('provinceMismatch') ? 'El código postal fiscal no corresponde a la provincia' : 'Falta el código postal fiscal');
        add(b['province'].invalid, 'billingProvince', 'Falta la provincia fiscal');
      }
    }

    add(!this.acceptTerms(), 'acceptTerms', 'Acepta las condiciones generales de venta');
    return out;
  }

  /** Tras el primer intento de pago, el resumen se actualiza a medida que se corrigen los datos. */
  private refreshErrorSummary(): void {
    if (this.submitAttempted && this.errorSummary().length) this.errorSummary.set(this.collectErrors());
  }

  focusField(event: Event, id: string): void {
    event.preventDefault();
    const el = this.document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    el.focus({ preventScroll: true });
  }

  /** Invitado con un email que ya tiene cuenta → aviso para iniciar sesión. */
  checkExistingAccount(): void {
    const control = this.contactForm.get('email')!;
    const email = String(control.value || '').trim().toLowerCase();
    if (this.authService.isAuthenticated() || control.invalid || email === this.lastCheckedEmail) return;
    this.lastCheckedEmail = email;
    this.authService.emailStatus(email).subscribe({
      next: ({ registered }) => {
        if (String(control.value || '').trim().toLowerCase() === email) this.existingAccount.set(registered);
      },
      // Sin respuesta (p. ej. límite de peticiones) no se muestra nada: la compra como invitado sigue.
      error: () => { this.lastCheckedEmail = ''; },
    });
  }

  onTermsChange(checked: boolean): void {
    this.acceptTerms.set(checked);
    if (checked) this.termsError.set(false);
    this.refreshErrorSummary();
  }

  constructor() {}

  /** Envío anulado por cupón (el backend envía Decimal como texto). */
  get shippingDiscount(): number {
    return Number(this.cartService.cart()?.shipping_discount ?? 0) || 0;
  }

  /** Zona de envío según el CP escrito (o la provincia, si el CP aún está incompleto). */
  zone = computed<ShippingZone>(() => {
    const cp = this.postalCodeValue().trim();
    if (/^\d{5}$/.test(cp)) return shippingZone(cp);
    const code = provinceCode(this.stateValue());
    return code ? shippingZone(code) : 'peninsula';
  });

  /** Envío a Baleares según el backend (null mientras se consulta). */
  balearesShipping = signal<number | null>(null);
  readonly balearesCost = BALEARES_SHIPPING_COST;
  private postalCodeValue = signal('');
  private stateValue = signal('');
  private shippingQuery$ = new Subject<string | null>();

  /** Total del resumen: el del carrito con el envío de la zona (importes que calcula el backend). */
  get displayTotal(): number {
    const cart = this.cartService.cart();
    const total = Number(cart?.total ?? 0) || 0;
    const zone = this.zone();
    if (zone === 'peninsula') return total;
    const withoutShipping = total - (Number(cart?.shipping_cost ?? 0) || 0);
    if (zone === 'quote') return Math.round(withoutShipping * 100) / 100;
    if (this.shippingDiscount > 0 || this.balearesShipping() === null) return total;
    return Math.round((withoutShipping + this.balearesShipping()!) * 100) / 100;
  }

  /** Mensaje prellenado para pedir presupuesto de envío por WhatsApp. */
  quoteWhatsappUrl(): string {
    const cp = this.postalCodeValue().trim();
    const province = this.stateValue() || provinceFromPostcode(cp) || '';
    const lines = (this.cartService.cart()?.items ?? []).map(i =>
      `- ${i.quantity} × ${i.product_name}${i.variant_format ? ' ' + i.variant_format : ''}`);
    const text = [
      'Hola, quiero pedir presupuesto de envío para este pedido.',
      `Provincia: ${province || 'sin indicar'}`,
      `Código postal: ${cp || 'sin indicar'}`,
      'Pedido:',
      ...lines,
    ].join('\n');
    return `https://wa.me/${environment.whatsappPhoneNumber}?text=${encodeURIComponent(text)}`;
  }

  get shippingCost(): number {
    // Use the shipping cost already calculated by the backend (accounts for discount)
    return this.cartService.cart()?.shipping_cost ?? 4.95;
  }

  ngOnInit(): void {
    this.initForms();

    // Envío a Baleares: lo calcula el backend (GET /checkout/shipping-cost?postal_code=…).
    this.shippingQuery$.pipe(
      switchMap(cp => cp === null ? of(null) : this.orderService.getShippingCost(cp).pipe(
        map(r => Number(r.cost)),
        catchError(() => of(this.balearesCost)),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(cost => this.balearesShipping.set(cost));

    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUser();
      if (user) {
        this.contactForm.patchValue({
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone ?? '',
        });
        // Cuentas creadas con Google suelen llegar sin apellidos o teléfono:
        // se marcan ya en rojo para que el cliente los complete.
        for (const key of ['firstName', 'lastName', 'phone']) {
          const control = this.contactForm.get(key)!;
          if (control.invalid) control.markAsTouched();
        }
        this.missingProfileData.set(this.contactForm.invalid);
      }
      this.loadSavedAddresses();
    }

    // Si cambia el email, el aviso de cuenta existente deja de aplicar hasta el próximo blur.
    this.contactForm.get('email')!.valueChanges.subscribe(() => this.existingAccount.set(false));

    // Watch form status changes to trigger Stripe init
    this.contactForm.statusChanges.subscribe(() => { this.tryInitStripe(); this.refreshErrorSummary(); });
    this.shippingForm.statusChanges.subscribe(() => { this.tryInitStripe(); this.refreshErrorSummary(); });
    this.billingForm.statusChanges.subscribe(() => this.refreshErrorSummary());
  }

  ngOnDestroy(): void {
    this.stripeService.destroy();
  }

  initForms(): void {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.pattern(/\S/)]],
      lastName: ['', [Validators.required, Validators.pattern(/\S/)]],
      phone: ['', Validators.required],
    });

    this.billingForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      nif: ['', [Validators.required, taxIdValidator]],
      street: [''],
      city: [''],
      postal_code: [''],
      province: [''],
    }, { validators: postcodeMatchesProvince('province', 'postal_code') });

    this.shippingForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      state: ['', Validators.required],
      country: ['ES', Validators.required],
      notes: [''],
    }, { validators: postcodeMatchesProvince('state', 'postalCode') });

    // Al escribir el CP, se propone la provincia correspondiente si no hay ninguna
    this.shippingForm.get('postalCode')!.valueChanges.subscribe(cp => {
      const state = this.shippingForm.get('state')!;
      const suggested = provinceFromPostcode(cp);
      if (suggested && !state.value && /^\d{5}$/.test(String(cp))) state.setValue(suggested);
      this.postalCodeValue.set(String(cp ?? ''));
      this.refreshZone();
    });
    this.shippingForm.get('state')!.valueChanges.subscribe(state => {
      this.stateValue.set(String(state ?? ''));
      this.refreshZone();
    });
  }

  /** Al entrar en Baleares con CP completo, pide el envío real al backend. */
  private refreshZone(): void {
    const cp = this.postalCodeValue().trim();
    const query = this.zone() === 'baleares' && /^\d{5}$/.test(cp) ? cp : null;
    if (query === null) this.balearesShipping.set(null);
    this.shippingQuery$.next(query);
    this.refreshErrorSummary();
  }

  isFormValid(): boolean {
    if (this.zone() === 'quote') return false;
    if (this.selectedAddressId() !== 'new') {
      return this.contactForm.valid;
    }
    return this.contactForm.valid && this.shippingForm.valid;
  }

  toggleInvoice(checked: boolean): void {
    this.needsInvoice.set(checked);
    if (checked && !this.billingForm.value.name) {
      const { firstName, lastName } = this.contactForm.value;
      this.billingForm.patchValue({ name: `${firstName || ''} ${lastName || ''}`.trim() });
    }
  }

  setBillingSameAsShipping(same: boolean): void {
    this.billingSameAsShipping.set(same);
    for (const key of ['street', 'city', 'postal_code', 'province']) {
      const control = this.billingForm.get(key)!;
      control.setValidators(same ? [] : [Validators.required]);
      control.updateValueAndValidity();
    }
  }

  isBillingValid(): boolean {
    return !this.needsInvoice() || this.billingForm.valid;
  }

  /** Tax details sent to the backend (null = simplified invoice without NIF). */
  private buildBilling(): BillingDetails | null {
    if (!this.needsInvoice()) return null;
    const b = this.billingForm.value;
    const ship = this.buildCheckoutData().shipping_address;
    const same = this.billingSameAsShipping();
    return {
      name: b.name.trim(),
      nif: normalizeTaxId(b.nif),
      street: same ? ship.street : b.street,
      city: same ? ship.city : b.city,
      postal_code: same ? ship.postal_code : b.postal_code,
      province: same ? ship.province : b.province,
      country: ship.country || 'ES',
    };
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
    // Direcciones guardadas antes de la lista de provincias: si la provincia no
    // es válida o no casa con el CP, se abre el formulario para corregirla.
    const province = canonicalProvince(addr.province);
    const cpOk = province && provinceFromPostcode(addr.postal_code) === province;
    if (!province || !cpOk) {
      this._selectedAddress = null;
      this.selectedAddressId.set('new');
      this.shippingForm.patchValue({
        address: addr.street, city: addr.city, postalCode: addr.postal_code,
        state: province ?? '', country: 'ES',
      });
      this.contactForm.patchValue({ firstName: addr.first_name, lastName: addr.last_name, phone: addr.phone });
      this.shippingForm.markAllAsTouched();
      return;
    }
    addr = { ...addr, province };
    this._selectedAddress = addr;
    // Patch shippingForm FIRST so that when contactForm.patchValue triggers
    // statusChanges (and tryInitStripe), the address values are already ready.
    this.shippingForm.patchValue({
      address: addr.street,
      city: addr.city,
      postalCode: addr.postal_code,
      state: addr.province,
      country: addr.country,
    });
    this.selectedAddressId.set(addr.id);
    this.contactForm.patchValue({
      firstName: addr.first_name,
      lastName: addr.last_name,
      phone: addr.phone,
    });
  }

  selectNewAddress(): void {
    this._selectedAddress = null;
    this.selectedAddressId.set('new');
  }

  private tryInitStripe(): void {
    if (this.isFormValid() && !this.stripeInitTriggered) {
      this.initStripeElement();
    }
  }

  /**
   * Guarda en la cuenta los datos de contacto que el cliente ha completado o
   * cambiado en el checkout (nombre, apellidos, teléfono) para próximos pedidos.
   */
  private saveContactDataToProfile(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    const { firstName, lastName, phone } = this.contactForm.getRawValue();
    const changes: Record<string, string> = {};
    if ((firstName ?? '').trim() && firstName.trim() !== (user.first_name ?? '')) changes['first_name'] = firstName.trim();
    if ((lastName ?? '').trim() && lastName.trim() !== (user.last_name ?? '')) changes['last_name'] = lastName.trim();
    if ((phone ?? '').trim() && phone !== (user.phone ?? '')) changes['phone'] = phone;
    if (!Object.keys(changes).length) return;
    this.userService.updateProfile(changes).subscribe({
      next: updated => this.authService.updateCurrentUser(updated),
      error: () => {},  // no bloquea la compra
    });
  }

  private buildCheckoutData() {
    // When a saved address is selected, read directly from the Address object
    // to avoid a race condition where shippingForm values may still be empty
    // when contactForm.statusChanges fires during selectSavedAddress.
    const saved = this._selectedAddress;
    const addr = {
      first_name: saved?.first_name ?? this.contactForm.value.firstName,
      last_name: saved?.last_name ?? this.contactForm.value.lastName,
      street: saved?.street ?? this.shippingForm.value.address,
      city: saved?.city ?? this.shippingForm.value.city,
      postal_code: saved?.postal_code ?? this.shippingForm.value.postalCode,
      province: saved?.province ?? this.shippingForm.value.state,
      country: saved?.country ?? this.shippingForm.value.country,
      phone: saved?.phone ?? this.contactForm.value.phone,
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
        this.paymentIntentId = response.payment_intent_id;
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
        // El errorInterceptor ya devuelve { status, message } legible.
        this.error.set(err?.message || 'Error al preparar el pago. Inténtalo de nuevo.');
        this.stripeInitializing.set(false);
        this.stripeInitTriggered = false;
      },
    });
  }

  async placeOrder(): Promise<void> {
    if (this.processing()) return;

    // Validación al pulsar: resumen de errores enfocable + errores en cada campo.
    this.submitAttempted = true;
    const errors = this.collectErrors();
    this.errorSummary.set(errors);
    this.termsError.set(!this.acceptTerms());
    if (errors.length) {
      this.contactForm.markAllAsTouched();
      if (this.selectedAddressId() === 'new') this.shippingForm.markAllAsTouched();
      if (this.needsInvoice()) this.billingForm.markAllAsTouched();
      this.error.set(null);
      // Espera a que se pinte el resumen para moverle el foco.
      setTimeout(() => {
        const summary = this.document.querySelector<HTMLElement>('.error-summary');
        summary?.scrollIntoView({ block: 'start' });
        summary?.focus({ preventScroll: true });
      });
      return;
    }

    if (!this.stripeReady()) {
      this.tryInitStripe();
      this.error.set('Estamos preparando el formulario de pago. Espera un momento y vuelve a pulsar.');
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    // Tax details go to the pending order right before charging: the invoice
    // is issued automatically when Stripe confirms the payment.
    if (this.orderNumber && this.paymentIntentId) {
      try {
        await firstValueFrom(
          this.orderService.preConfirm(this.orderNumber, this.paymentIntentId, TERMS_VERSION, this.buildBilling(),
            this.buildCheckoutData().shipping_address, this.buildCheckoutData().guest_email),
        );
        // pre-confirm recalcula el importe si la dirección cambió de zona (península ↔ Baleares)
        await this.stripeService.refreshAmount();
      } catch (err: any) {
        this.error.set(err?.message || 'No se pudo preparar el pago. Inténtalo de nuevo.');
        this.processing.set(false);
        return;
      }
    }

    this.saveContactDataToProfile();

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

    const returnUrl = `${this.document.location.origin}/gracias?order=${this.orderNumber}`;
    const result = await this.stripeService.confirmPayment(returnUrl);

    if (result.error) {
      this.error.set(result.error.message);
      this.processing.set(false);
    }
    // On success Stripe redirects — no further action needed here
  }
}
