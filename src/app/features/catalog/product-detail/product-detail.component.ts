import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, inject, signal, computed, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { MiniCartService } from '../../../core/services/mini-cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models';
import { FormatSelectorComponent, ProductFormat } from '../components/format-selector/format-selector.component';
import { PriceDisplayComponent } from '../components/price-display/price-display.component';
import { AudioPlayerComponent } from '../components/audio-player/audio-player.component';

type Tab = 'producto' | 'ingredientes' | 'nutricion' | 'como-usarlo';
type PurchaseType = 'once' | 'sub';

const FAQS = [
  { q: '¿Por qué el aceite está separado?', a: 'Es el aceite natural del pistacho — señal de que no hay aditivos. Completamente normal: remueve bien antes de cada uso.' },
  { q: '¿Cuánto tiempo dura la crema?', a: '12 meses desde la elaboración. Una vez abierto, consumir en 4 semanas en lugar fresco y seco.' },
  { q: '¿Cómo se conserva?', a: 'Temperatura ambiente, alejada de la luz directa. No necesita nevera. El frío puede endurecer la crema.' },
];

const PLACEHOLDER_REVIEWS = [
  { name: 'Marta G.', location: 'Madrid',   text: 'Jamás volvería a comprar otra.', rating: 5 },
  { name: 'Carlos M.', location: 'Valencia', text: 'Compré el kilo y fue la mejor decisión.',  rating: 5 },
];

function buildFormats(basePrice: number): ProductFormat[] {
  return [
    { id: '100g', label: '100g', grams: 100,  price: basePrice,                        badge: 'Para probar', badgeColor: 'gray'   },
    { id: '200g', label: '200g', grams: 200,  price: Math.round(basePrice * 1.515),     badge: 'Más popular', badgeColor: 'green'  },
    { id: '1kg',  label: '1 kg', grams: 1000, price: Math.round(basePrice * 5.555),     badge: 'Mejor €/g',   badgeColor: 'yellow' },
  ];
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormatSelectorComponent, PriceDisplayComponent, AudioPlayerComponent],
  template: `
    <div class="pd">
      @if (loading()) {
        <div class="pd__loading"><div class="spinner"></div></div>
      } @else if (!product()) {
        <div class="pd__not-found">
          <p>Producto no encontrado.</p>
          <a routerLink="/tienda">Volver a la tienda</a>
        </div>
      } @else {

        <nav class="pd__breadcrumb" aria-label="Migas de pan">
          <a routerLink="/">Inicio</a><span>/</span>
          <a routerLink="/tienda">Tienda</a><span>/</span>
          <span aria-current="page">{{ product()!.name }}</span>
        </nav>

        <div class="pd__layout">

          <!-- ── GALERÍA ─────────────────────────────── -->
          <div class="pd__gallery">

            <!-- Desktop -->
            <div class="pd__gallery-desktop">
              <div class="pd__main-img">
                <img [src]="selectedImage() || firstImage()" [alt]="product()!.name + ' — crema de pistacho manchego'" loading="eager">
              </div>
              @if ((product()!.images?.length ?? 0) > 1) {
                <div class="pd__thumbs">
                  @for (img of product()!.images!; track img.id) {
                    <button
                      class="pd__thumb"
                      [class.is-active]="selectedImage() === img.url || (!selectedImage() && $index === 0)"
                      (click)="selectedImage.set(img.url)"
                      [attr.aria-label]="'Ver imagen ' + ($index + 1)">
                      <img [src]="img.url" [alt]="product()!.name" loading="lazy">
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Mobile: scroll-snap + dots -->
            <div class="pd__gallery-mobile">
              <div class="pd__slides" #slidesEl (scroll)="onGalleryScroll()">
                @if (product()!.images?.length) {
                  @for (img of product()!.images!; track img.id) {
                    <div class="pd__slide"><img [src]="img.url" [alt]="product()!.name" loading="lazy"></div>
                  }
                } @else {
                  <div class="pd__slide"><img src="/assets/images/placeholder.jpg" [alt]="product()!.name"></div>
                }
              </div>
              @if ((product()!.images?.length ?? 0) > 1) {
                <div class="pd__dots" role="tablist">
                  @for (img of product()!.images!; track img.id) {
                    <button class="pd__dot" [class.is-active]="currentSlide() === $index"
                      (click)="scrollToSlide($index)" role="tab"
                      [attr.aria-selected]="currentSlide() === $index"
                      [attr.aria-label]="'Imagen ' + ($index + 1)">
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- ── COLUMNA DE COMPRA ───────────────────── -->
          <div class="pd__buy">

            <!-- 1. Valoraciones -->
            
              <div class="step-body">
                <span class="step-label">valoraciones</span>
                <div class="step-stars">
                  <span class="stars-filled">★★★★★</span>
                  <span class="stars-meta">{{ product()!.average_rating ?? '4.9' }} · {{ product()!.review_count || 47 }} reseñas</span>
                </div>
              </div>
            

            <!-- 2. Producto -->
            
              
              <div class="step-body">
                <span class="step-label">producto</span>
                <h1 class="pd__title">{{ product()!.name }}</h1>
                @if (product()!.short_description) {
                  <p class="pd__tagline">{{ product()!.short_description }}</p>
                }
              </div>
            

            <!-- 3. Audio -->
            
              <div class="step-body">
                <span class="step-label">trilogía del sabor · 30s</span>
                @if (product()!.audio_url) {
                  <app-audio-player [src]="product()!.audio_url!" />
                } @else {
                  <div class="pd__audio-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    Audio del proceso · próximamente
                  </div>
                }
              </div>
            

            <!-- 4. Formato -->
            
              <div class="step-body">
                <span class="step-label">elige tu formato</span>
                <app-format-selector
                  [formats]="formats()"
                  [selected]="selectedFormat()"
                  (formatChange)="onFormatChange($event)" />
              </div>
            

            <!-- 5. Precio -->


              <div class="step-body">
                <span class="step-label">precio</span>
                <app-price-display [price]="effectivePrice()" [grams]="selectedFormat()!.grams" />
              </div>


            <!-- 6. Cómo quieres pedirlo -->

              <div class="step-body" #purchaseBlock>
                <span class="step-label">elige cómo pedirlo</span>
                <div class="pur-options">

                  <!-- Opción A: una vez -->
                  <label class="pur-opt" [class.is-active]="purchaseType() === 'once'">
                    <div class="pur-opt__header">
                      <span class="pur-opt__radio">
                        <input type="radio" name="pur" value="once"
                          [checked]="purchaseType() === 'once'"
                          (change)="purchaseType.set('once')"
                          aria-label="Compra de una vez">
                      </span>
                      <span class="pur-opt__name">Compra de una vez</span>
                      <span class="pur-opt__price">
                        {{ selectedFormat()!.price / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}
                      </span>
                    </div>
                    @if (purchaseType() === 'once') {
                      <div class="pur-opt__body">
                        <button
                          class="pd__cta"
                          (click)="addToCart()"
                          [disabled]="!product()!.is_in_stock || addingToCart()">
                          @if (addingToCart()) {
                            <span class="pd__cta-spinner"></span>Añadiendo...
                          } @else if (!product()!.is_in_stock) {
                            Producto agotado
                          } @else {
                            Añadir al carrito
                          }
                        </button>
                      </div>
                    }
                  </label>

                  <!-- Opción B: suscripción -->
                  <label class="pur-opt" [class.is-active]="purchaseType() === 'sub'">
                    <div class="pur-opt__header">
                      <span class="pur-opt__radio">
                        <input type="radio" name="pur" value="sub"
                          [checked]="purchaseType() === 'sub'"
                          (change)="purchaseType.set('sub')"
                          aria-label="Suscripción mensual">
                      </span>
                      <span class="pur-opt__name">
                        Suscríbete y ahorra
                        <strong class="pur-opt__discount">−15%</strong>
                      </span>
                      <span class="pur-opt__price pur-opt__price--sub">
                        {{ subPrice() / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}
                      </span>
                    </div>
                    @if (purchaseType() === 'sub') {
                      <div class="pur-opt__body">
                        <ul class="pur-opt__benefits">
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Cancelas cuando quieras, sin permanencias
                          </li>
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Envío gratis en todos tus pedidos
                          </li>
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Modifica tu suscripción cuando quieras
                          </li>
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Sorpresa exclusiva cada mes para suscriptores
                          </li>
                        </ul>
                        <button class="pd__cta pd__cta--sub" (click)="activateSubscription()">
                          Suscribirme — próximamente
                        </button>
                      </div>
                    }
                  </label>

                </div>
              </div>


            <!-- 7. Garantías -->

              <div class="step-body">
                <span class="step-label">garantías</span>
                <div class="pd__guarantees">
                  <span class="guarantee">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    Gratis +48€
                  </span>
                  <span class="guarantee">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    48–72h
                  </span>
                  <span class="guarantee">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Pago seguro
                  </span>
                </div>
              </div>

          </div>
        </div>

        <!-- ── TABS ───────────────────────────────── -->
        <div class="pd__tabs-section">
          <div class="pd__tabs" role="tablist">
            @for (tab of tabs; track tab.id) {
              <button
                class="pd__tab"
                [class.is-active]="activeTab() === tab.id"
                (click)="activeTab.set(tab.id)"
                role="tab"
                [attr.aria-selected]="activeTab() === tab.id">
                {{ tab.label }}
              </button>
            }
          </div>

          <div class="pd__tab-content" role="tabpanel">
            @if (activeTab() === 'producto') {
              @if (product()!.description) {
                <div class="pd__description" [innerHTML]="product()!.description"></div>
              }
              <div class="pd__faqs">
                @for (faq of faqs; track faq.q) {
                  <details class="pd__faq">
                    <summary class="pd__faq-q">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      {{ faq.q }}
                    </summary>
                    <p class="pd__faq-a">{{ faq.a }}</p>
                  </details>
                }
              </div>
            }
            @if (activeTab() === 'ingredientes') {
              <p class="pd__tab-text">{{ product()!.short_description || 'Pistacho (100%). Sin aditivos, sin conservantes, sin azúcares añadidos.' }}</p>
            }
            @if (activeTab() === 'nutricion') {
              @if (product()!.nutrition) {
                <p class="pd__nutrition-note">Valores medios por 100 g</p>
                <table class="pd__nutrition-table">
                  <tbody>
                    @if (product()!.nutrition!.energy_kcal) { <tr><td>Energía</td><td>{{ product()!.nutrition!.energy_kcal }} kcal</td></tr> }
                    @if (product()!.nutrition!.fat !== null) { <tr><td>Grasas</td><td>{{ product()!.nutrition!.fat }} g</td></tr> }
                    @if (product()!.nutrition!.saturated_fat !== null) { <tr><td class="indent">de las cuales saturadas</td><td>{{ product()!.nutrition!.saturated_fat }} g</td></tr> }
                    @if (product()!.nutrition!.carbohydrates !== null) { <tr><td>Hidratos de carbono</td><td>{{ product()!.nutrition!.carbohydrates }} g</td></tr> }
                    @if (product()!.nutrition!.sugars !== null) { <tr><td class="indent">de los cuales azúcares</td><td>{{ product()!.nutrition!.sugars }} g</td></tr> }
                    @if (product()!.nutrition!.fiber !== null) { <tr><td>Fibra</td><td>{{ product()!.nutrition!.fiber }} g</td></tr> }
                    @if (product()!.nutrition!.proteins !== null) { <tr><td>Proteínas</td><td>{{ product()!.nutrition!.proteins }} g</td></tr> }
                    @if (product()!.nutrition!.salt !== null) { <tr><td>Sal</td><td>{{ product()!.nutrition!.salt }} g</td></tr> }
                  </tbody>
                </table>
              } @else {
                <p class="pd__tab-text">Información nutricional no disponible.</p>
              }
            }
            @if (activeTab() === 'como-usarlo') {
              <p class="pd__tab-text">Ideal para untar en tostadas, mezclar con yogur, usar en smoothies o como base de salsas y postres. Remueve bien antes de usar para integrar el aceite natural.</p>
            }
          </div>
        </div>

        <!-- ── RESEÑAS ─────────────────────────────── -->
        <div class="pd__reviews">
          <div class="pd__reviews-head">
            <strong>Lo que dicen quienes ya la tienen</strong>
            <span class="pd__reviews-link">Ver todas →</span>
          </div>
          @for (review of placeholderReviews; track review.name) {
            <div class="pd__review">
              <div class="pd__review-top">
                <span class="pd__review-name">{{ review.name }}</span>
                <span class="pd__review-stars">★★★★★</span>
              </div>
              <p class="pd__review-text">"{{ review.text }}"</p>
              <div class="pd__review-meta">
                {{ review.location }}
                <span class="pd__review-verified">Compra verificada</span>
              </div>
            </div>
          }
        </div>

      }
    </div>

    <!-- ── BARRA FIJA MÓVIL ───────────────────────────── -->
    @if (showStickyBar() && product()) {
      <div class="pd__sticky-bar" role="complementary" aria-label="Añadir al carrito">
        <div class="pd__sticky-info">
          <div class="pd__sticky-name">{{ product()!.name }} · {{ selectedFormat()?.label }}</div>
          <div class="pd__sticky-price">{{ effectivePrice() / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}</div>
        </div>
        <button class="pd__sticky-cta" (click)="addToCart()" [disabled]="addingToCart()">
          {{ addingToCart() ? '...' : 'Añadir al carrito' }}
        </button>
      </div>
    }
  `,
  styles: [`
    $brand:  #7B1716;
    $accent: #E6C15A;
    $bg:     #F4F1E9;
    $bg-alt: #EDE9DF;
    $ink:    #1C1A14;
    $muted:  #6B6456;
    $verde:  #A2BA1C;
    $border: rgba(28,26,20,0.1);

    .pd {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.5rem 1.5rem 5rem;
    }

    .pd__loading, .pd__not-found {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 5rem 2rem; gap: 1rem; color: $muted;
      a { color: $brand; }
    }

    .spinner {
      width: 36px; height: 36px;
      border: 2.5px solid $border; border-top-color: $brand;
      border-radius: 50%; animation: spin .7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg) } }

    // ── Breadcrumb ────────────────────────────────────
    .pd__breadcrumb {
      display: flex; align-items: center; gap: 0.4rem;
      font-family: 'Poppins', sans-serif; font-size: .72rem; color: $muted;
      margin-bottom: 2rem;
      a { color: $muted; text-decoration: none; &:hover { color: $brand; } }
      span { color: rgba($muted,.6); }
      span[aria-current] { color: $ink; font-weight: 500; }
    }

    // ── Two-column layout ─────────────────────────────
    .pd__layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5rem;
      align-items: start;
      margin-bottom: 4rem;

      @media (max-width: 768px) { grid-template-columns: 1fr; gap: 0; }
    }

    // ── Gallery desktop ───────────────────────────────
    .pd__gallery-desktop { @media (max-width: 768px) { display: none; } }

    .pd__main-img {
      aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: $bg-alt;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .pd__thumbs { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }

    .pd__thumb {
      width: 68px; height: 68px; padding: 0;
      border: 2px solid transparent; border-radius: 4px;
      overflow: hidden; cursor: pointer; background: $bg-alt;
      transition: border-color 150ms;
      &.is-active { border-color: $verde; }
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    // ── Gallery mobile ────────────────────────────────
    .pd__gallery-mobile { display: none; @media (max-width: 768px) { display: block; } }

    .pd__slides {
      display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
      scroll-behavior: smooth; scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .pd__slide {
      flex: 0 0 100%; scroll-snap-align: start; aspect-ratio: 1; background: $bg-alt;
      img { width: 100%; height: 100%; object-fit: cover; display: block; }
    }

    .pd__dots {
      display: flex; justify-content: center; gap: 5px; margin-top: 8px;
    }

    .pd__dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: rgba($muted,.25); border: none; cursor: pointer; padding: 0;
      transition: background 150ms, transform 150ms;
      &.is-active { background: $brand; transform: scale(1.3); }
    }

    // ── Buy column ────────────────────────────────────
    .pd__buy {
      display: flex; flex-direction: column; gap: 10px;
      @media (max-width: 768px) { padding-top: 1.5rem; }
    }

    // Step rows
    .step-row {
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 8px;
      align-items: flex-start;
    }

    .step-num {
      width: 22px; height: 22px; border-radius: 50%;
      font-family: 'Poppins', sans-serif; font-size: .7rem; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 2px;

      &--filled { background: $brand; color: $bg; }
      &--outline { background: $bg; border: 1px solid $border; color: $muted; }
    }

    .step-body { display: flex; flex-direction: column; gap: 5px; }

    .step-label {
      font-family: 'Poppins', sans-serif; font-size: .62rem; font-weight: 500;
      text-transform: uppercase; letter-spacing: .06em; color: $muted;
    }

    // Step 1: stars
    .step-stars { display: flex; align-items: center; gap: 5px; }
    .stars-filled { color: $accent; font-size: .9rem; letter-spacing: 1px; }
    .stars-meta { font-family: 'Poppins', sans-serif; font-size: .78rem; color: $muted; }

    // Step 2: title
    .pd__title {
      font-family: 'Teko', sans-serif; font-weight: 700;
      font-size: clamp(1.4rem, 3vw, 1.9rem);
      text-transform: uppercase; letter-spacing: -.02em; color: $brand;
      margin: 0; line-height: 1.05;
    }

    .pd__tagline {
      font-family: 'Lora', serif; font-style: italic;
      font-size: .82rem; color: $muted; margin: 0; line-height: 1.5;
    }

    // Step 6: CTA
    .pd__cta {
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      width: 100%; padding: .85rem 1.5rem;
      background: $bg; color: $brand;
      border: 1.5px solid $brand; border-radius: 20px;
      font-family: 'Poppins', sans-serif; font-size: .85rem; font-weight: 600;
      cursor: pointer; transition: background 150ms, color 150ms; min-height: 48px;

      &:hover:not(:disabled) { background: $brand; color: $bg; }
      &:disabled { opacity: .55; cursor: default; }
    }

    .pd__cta-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba($brand,.3); border-top-color: $brand;
      border-radius: 50%; animation: spin .6s linear infinite; flex-shrink: 0;
    }

    // Step 7: Guarantees
    .pd__guarantees { display: flex; gap: 10px; flex-wrap: wrap; }

    .guarantee {
      font-family: 'Poppins', sans-serif; font-size: .72rem; color: $muted;
      display: flex; align-items: center; gap: 3px;
      svg { color: $brand; flex-shrink: 0; }
    }

    // Step 3: audio placeholder
    .pd__audio-placeholder {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 14px;
      background: $bg-alt; border-radius: 40px;
      font-family: 'Poppins', sans-serif; font-size: .72rem;
      font-style: italic; color: $muted;
      svg { color: $muted; flex-shrink: 0; }
    }

    // Step 6: Purchase type selector
    .pur-options {
      display: flex; flex-direction: column; gap: 6px;
    }

    .pur-opt {
      display: block; cursor: pointer;
      border: 1.5px solid $border; border-radius: 8px;
      overflow: hidden; transition: border-color 150ms, background 150ms;
      background: $bg;

      &.is-active {
        border-color: $brand;
        background: rgba($brand, 0.03);
      }

      &:not(.is-active):hover { border-color: rgba($brand, 0.3); }
    }

    .pur-opt__header {
      display: grid;
      grid-template-columns: 18px 1fr auto;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }

    .pur-opt__radio {
      display: flex; align-items: center; justify-content: center;
      input[type="radio"] { accent-color: $brand; width: 14px; height: 14px; margin: 0; cursor: pointer; }
    }

    .pur-opt__name {
      font-family: 'Poppins', sans-serif; font-size: .8rem;
      font-weight: 500; color: $ink;
    }

    .pur-opt__discount {
      font-size: .75rem; font-weight: 700; color: $brand;
      background: rgba($brand, 0.08); padding: 1px 5px; border-radius: 4px;
      margin-left: 4px;
    }

    .pur-opt__price {
      font-family: 'Teko', sans-serif; font-weight: 700;
      font-size: 1.1rem; color: $ink; line-height: 1; white-space: nowrap;

      &--sub { color: $brand; }
    }

    .pur-opt__body {
      padding: 0 12px 12px;
    }

    .pur-opt__benefits {
      list-style: none; padding: 0; margin: 0 0 10px;
      display: flex; flex-direction: column; gap: 5px;

      li {
        font-family: 'Poppins', sans-serif; font-size: .73rem;
        color: $muted; display: flex; align-items: flex-start; gap: 6px;
        svg { color: $verde; margin-top: 2px; flex-shrink: 0; }
      }
    }

    // CTA variants
    .pd__cta--sub {
      background: $brand; color: $accent;
      border-color: $brand;
      &:hover:not(:disabled) { background: lighten($brand, 6%); color: $accent; }
    }

    // ── Tabs ──────────────────────────────────────────
    .pd__tabs-section { border-top: 1px solid $border; padding-top: 2.5rem; margin-bottom: 2.5rem; }

    .pd__tabs {
      display: flex; overflow-x: auto; scrollbar-width: none;
      border-bottom: 1px solid $border; margin-bottom: 1.5rem;
      &::-webkit-scrollbar { display: none; }
    }

    .pd__tab {
      font-family: 'Poppins', sans-serif; font-size: .75rem; font-weight: 500;
      text-transform: uppercase; letter-spacing: .08em; color: $muted;
      background: none; border: none; border-bottom: 2px solid transparent;
      padding: .7rem 1.1rem; cursor: pointer; white-space: nowrap;
      transition: color 150ms, border-color 150ms;
      &:hover { color: $brand; }
      &.is-active { color: $brand; border-bottom-color: $brand; }
    }

    .pd__tab-content { min-height: 80px; }

    .pd__tab-text {
      font-family: 'Lora', serif; font-size: .9rem; color: $muted; line-height: 1.75;
      p { margin: 0 0 .75rem; }
    }

    .pd__description {
      font-family: 'Lora', serif; font-size: .9rem; color: $muted; line-height: 1.75;
      margin-bottom: 1.5rem;
      ::ng-deep { p { margin: 0 0 .75rem; } strong { color: $ink; } }
    }

    .pd__faqs { display: flex; flex-direction: column; gap: 4px; }

    .pd__faq {
      border: 1px solid $border; border-radius: 6px; overflow: hidden;
      &[open] { .pd__faq-q { color: $brand; } }
    }

    .pd__faq-q {
      font-family: 'Poppins', sans-serif; font-size: .82rem; font-weight: 500;
      color: $ink; padding: .75rem .9rem; cursor: pointer; list-style: none;
      display: flex; align-items: center; gap: .5rem;
      transition: color 150ms, background 150ms;
      &:hover { background: $bg; }
      svg { color: $accent; flex-shrink: 0; }
    }

    .pd__faq-a {
      font-family: 'Lora', serif; font-size: .85rem; color: $muted;
      line-height: 1.7; padding: 0 .9rem .9rem; margin: 0;
    }

    .pd__nutrition-note { font-family: 'Poppins', sans-serif; font-size: .7rem; color: $muted; margin: 0 0 .75rem; }

    .pd__nutrition-table {
      width: 100%; border-collapse: collapse;
      font-family: 'Poppins', sans-serif; font-size: .8rem;
      tr { border-bottom: 1px solid $border; &:last-child { border-bottom: none; } }
      td { padding: .5rem .4rem; color: $muted; &:last-child { text-align: right; font-weight: 500; color: $ink; } &.indent { padding-left: 1.25rem; font-size: .75rem; } }
    }

    // ── Reseñas ───────────────────────────────────────
    .pd__reviews {
      border: 1px solid $border; border-radius: 8px; overflow: hidden;
    }

    .pd__reviews-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: .85rem 1rem; border-bottom: 1px solid $border;
      strong { font-family: 'Poppins', sans-serif; font-size: .82rem; font-weight: 600; color: $ink; }
    }

    .pd__reviews-link {
      font-family: 'Poppins', sans-serif; font-size: .75rem; font-weight: 500;
      color: $brand; cursor: pointer;
    }

    .pd__review {
      padding: .85rem 1rem;
      border-bottom: 1px solid $border;
      &:last-child { border-bottom: none; }
    }

    .pd__review-top {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;
    }

    .pd__review-name { font-family: 'Poppins', sans-serif; font-size: .8rem; font-weight: 600; color: $ink; }
    .pd__review-stars { color: $accent; font-size: .8rem; letter-spacing: 1px; }

    .pd__review-text {
      font-family: 'Lora', serif; font-style: italic;
      font-size: .82rem; color: $muted; margin: 0 0 5px; line-height: 1.5;
    }

    .pd__review-meta {
      font-family: 'Poppins', sans-serif; font-size: .7rem; color: $muted;
      display: flex; align-items: center; gap: 6px;
    }

    .pd__review-verified {
      font-size: .68rem; font-weight: 500;
      background: rgba($verde,.15); color: #5A6B0A;
      padding: 1px 7px; border-radius: 20px;
    }

    // ── Mobile sticky bar ─────────────────────────────
    .pd__sticky-bar {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
      background: $bg; border-top: 1px solid $border;
      padding: .65rem 1.25rem;
      align-items: center; justify-content: space-between; gap: 1rem;
      min-height: 64px; box-shadow: 0 -4px 16px rgba($ink,.08);

      @media (max-width: 768px) { display: flex; }
    }

    .pd__sticky-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

    .pd__sticky-name {
      font-family: 'Poppins', sans-serif; font-size: .78rem; font-weight: 500;
      color: $ink; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .pd__sticky-price {
      font-family: 'Teko', sans-serif; font-weight: 700;
      font-size: 1.35rem; color: $brand; letter-spacing: -.01em; line-height: 1;
    }

    .pd__sticky-cta {
      padding: .65rem 1.25rem; background: $brand; color: $accent;
      border: none; border-radius: 20px;
      font-family: 'Poppins', sans-serif; font-size: .78rem; font-weight: 600;
      cursor: pointer; flex-shrink: 0; min-height: 44px; min-width: 140px;
      transition: background 150ms;
      &:hover:not(:disabled) { background: lighten($brand, 6%); }
      &:disabled { opacity: .5; }
    }
  `]
})
export class ProductDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('purchaseBlock') purchaseBlock?: ElementRef<HTMLElement>;
  @ViewChild('slidesEl') slidesEl?: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private miniCartService = inject(MiniCartService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly addingToCart = signal(false);
  readonly selectedImage = signal<string | null>(null);
  readonly selectedFormat = signal<ProductFormat | null>(null);
  readonly currentSlide = signal(0);
  readonly showStickyBar = signal(false);
  readonly activeTab = signal<Tab>('producto');
  readonly purchaseType = signal<PurchaseType>('once');

  readonly subPrice = computed(() => {
    const f = this.selectedFormat();
    return f ? Math.round(f.price * 0.85) : 0;
  });

  readonly effectivePrice = computed(() =>
    this.purchaseType() === 'sub' ? this.subPrice() : (this.selectedFormat()?.price ?? 0)
  );

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'producto',     label: 'El producto'  },
    { id: 'ingredientes', label: 'Ingredientes' },
    { id: 'nutricion',    label: 'Nutrición'    },
    { id: 'como-usarlo',  label: 'Cómo usarlo'  },
  ];

  readonly faqs = FAQS;
  readonly placeholderReviews = PLACEHOLDER_REVIEWS;

  readonly formats = computed(() => {
    const p = this.product();
    return p ? buildFormats(p.price) : [];
  });

  readonly firstImage = computed(() =>
    this.product()?.images?.[0]?.url ?? '/assets/images/placeholder.jpg'
  );

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['slug']) this.loadProduct(params['slug']);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.purchaseBlock) return;
    this.observer = new IntersectionObserver(
      ([entry]) => this.showStickyBar.set(!entry.isIntersecting),
      { threshold: 0 }
    );
    this.observer.observe(this.purchaseBlock.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.productService.getProduct(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.selectedImage.set(null);
        this.selectedFormat.set(buildFormats(product.price)[1]); // default: 200g
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFormatChange(fmt: ProductFormat): void {
    this.selectedFormat.set(fmt);
  }

  activateSubscription(): void {
    this.toastService.success('Suscripción mensual — próximamente disponible');
  }

  onGalleryScroll(): void {
    const el = this.slidesEl?.nativeElement;
    if (!el) return;
    this.currentSlide.set(Math.round(el.scrollLeft / el.clientWidth));
  }

  scrollToSlide(index: number): void {
    const el = this.slidesEl?.nativeElement;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.addingToCart.set(true);
    this.cartService.addItem(p.id, 1).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.productService.invalidateCache(p.slug);
        this.miniCartService.open();
      },
      error: () => {
        this.addingToCart.set(false);
        this.toastService.error('Error al añadir el producto');
      },
    });
  }
}
