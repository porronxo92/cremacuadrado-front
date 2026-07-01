import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CollapsibleBlockComponent } from '../../../shared/components/collapsible-block/collapsible-block.component';
import { ParaTiendasService } from '../../../core/services/para-tiendas.service';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-para-tiendas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CollapsibleBlockComponent],
  template: `
    <div class="pt-page">

      <!-- ── Bloque 0: Hero ─────────────────────────────────────── -->
      <section class="pt-hero">
        <span class="pt-hero__deco" aria-hidden="true">PV</span>
        <span class="pt-hero__deco pt-hero__deco--2" aria-hidden="true">PV</span>
        <div class="pt-hero__content">
          <span class="pt-hero__eyebrow">Para tiendas gourmet y delicatessen</span>
          <h1 class="pt-hero__title">Dale a tu cliente algo que no encuentra en ningún supermercado</h1>
          <p class="pt-hero__subtitle">Crema de pistacho manchego artesanal. Con historia, con identidad y con todo el soporte que necesitas para venderla.</p>
          <button type="button" class="pt-hero__cta" (click)="scrollToForm()">
            Quiero ser punto de venta →
          </button>
        </div>
      </section>

      <!-- ── Bloque 1: Por qué CremaCuadrado ────────────────────── -->
      <app-collapsible-block title="Por qué CremaCuadrado en tu tienda" [initialOpen]="true">
        <svg block-icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>

        <div class="pt-grid">
          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
            </div>
            <h3 class="pt-card__title">Producto exclusivo</h3>
            <p class="pt-card__desc">No está en supermercados. Diferencia tu surtido y da a tu cliente una razón para volver.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 class="pt-card__title">12 meses de caducidad</h3>
            <p class="pt-card__desc">Sin riesgo de merma. Stock tranquilo sin presión de rotación rápida.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 11l18-5v12L3 14v-3z"></path>
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
              </svg>
            </div>
            <h3 class="pt-card__title">Historia que contar</h3>
            <p class="pt-card__desc">Cuando tu cliente pregunta qué es esto, tienes una respuesta con alma. Eso fideliza.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <h3 class="pt-card__title">Soporte de marca</h3>
            <p class="pt-card__desc">Material físico y contenido para redes. Te mencionamos en nuestros canales.</p>
          </div>
        </div>
      </app-collapsible-block>

      <!-- ── Bloque 2: Condiciones comerciales ──────────────────── -->
      <app-collapsible-block title="Condiciones comerciales" [initialOpen]="true">
        <svg block-icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"></path>
          <line x1="8" y1="7" x2="16" y2="7"></line>
          <line x1="8" y1="11" x2="16" y2="11"></line>
          <line x1="8" y1="15" x2="12" y2="15"></line>
        </svg>

        <div class="pt-grid">
          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <h3 class="pt-card__title">Envío gratuito</h3>
            <p class="pt-card__desc">Sin coste de transporte en todos los pedidos mayoristas.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 class="pt-card__title">Pago a 30 días</h3>
            <p class="pt-card__desc">Desde la fecha de envío. Sin pago inmediato.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </div>
            <h3 class="pt-card__title">Reposición garantizada</h3>
            <p class="pt-card__desc">Stock disponible con plazos de entrega acordados.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 class="pt-card__title">12 meses de caducidad</h3>
            <p class="pt-card__desc">Fecha de consumo preferente desde la elaboración.</p>
          </div>
        </div>

        <div class="pt-notice">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2.59 12.58V2h10.58l7.42 7.41a2 2 0 0 1 0 2.83z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <div>
            <p class="pt-notice__title">Pedido mínimo: 20 unidades</p>
            <p class="pt-notice__desc">Puedes combinar formatos 100g y 200g libremente para llegar al mínimo.</p>
          </div>
        </div>
      </app-collapsible-block>

      <!-- ── Bloque 3: Lo que incluye ser punto de venta ────────── -->
      <app-collapsible-block title="Lo que incluye ser punto de venta" [initialOpen]="true">
        <svg block-icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 11l18-5v12L3 14v-3z"></path>
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
        </svg>

        <div class="pt-grid">
          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <h3 class="pt-card__title">Material de punto de venta</h3>
            <p class="pt-card__desc">Cartelería y fichas de producto para comunicar en tu tienda.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <h3 class="pt-card__title">Contenido para tus redes</h3>
            <p class="pt-card__desc">Fotos y vídeos listos para publicar en tu Instagram o TikTok.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3 class="pt-card__title">Apareces en nuestro mapa</h3>
            <p class="pt-card__desc">Te incluimos en la página de puntos de venta de cremacuadrado.com.</p>
          </div>

          <div class="pt-card">
            <div class="pt-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <h3 class="pt-card__title">Te mencionamos en redes</h3>
            <p class="pt-card__desc">Publicamos sobre tu tienda cuando empezáis a vender.</p>
          </div>
        </div>
      </app-collapsible-block>

      <!-- ── Bloque 4: Testimonios ───────────────────────────────── -->
      <app-collapsible-block title="Lo que dicen nuestros puntos de venta" [initialOpen]="true">
        <svg block-icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
        </svg>

        <div class="pt-testimonials">
          <div class="pt-testimonial pt-testimonial--placeholder">
            <p class="pt-testimonial__quote">"[TESTIMONIO PENDIENTE — sustituir por cita real]"</p>
            <p class="pt-testimonial__author">[Nombre de tienda pendiente]</p>
            <p class="pt-testimonial__city">[Ciudad pendiente]</p>
            <span class="pt-testimonial__badge">Punto de venta activo</span>
          </div>
          <div class="pt-testimonial pt-testimonial--placeholder">
            <p class="pt-testimonial__quote">"[TESTIMONIO PENDIENTE — sustituir por cita real]"</p>
            <p class="pt-testimonial__author">[Nombre de tienda pendiente]</p>
            <p class="pt-testimonial__city">[Ciudad pendiente]</p>
            <span class="pt-testimonial__badge">Punto de venta activo</span>
          </div>
        </div>
      </app-collapsible-block>

      <!-- ── Bloque 5: Formulario (siempre visible) ─────────────── -->
      <section class="pt-form-block" id="formulario-punto-de-venta">
        <div class="pt-form-block__header">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22 6 12 13 2 6"></polyline>
          </svg>
          <span>Quiero ser punto de venta</span>
        </div>

        <div class="pt-form-block__body">
          @if (submitState() === 'success') {
            <div class="pt-form-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p class="pt-form-success__title">Solicitud recibida</p>
              <p class="pt-form-success__desc">Os llamamos en 48 horas. Gracias por tu interés en CremaCuadrado.</p>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="pt-form__grid">
                <div class="pt-field">
                  <label for="name">Nombre</label>
                  <input id="name" type="text" formControlName="name" placeholder="Tu nombre">
                  @if (form.get('name')?.invalid && form.get('name')?.touched) {
                    <span class="pt-field__error">Este campo es obligatorio.</span>
                  }
                </div>

                <div class="pt-field">
                  <label for="establishmentName">Nombre de la tienda</label>
                  <input id="establishmentName" type="text" formControlName="establishmentName" placeholder="Nombre de tu tienda">
                  @if (form.get('establishmentName')?.invalid && form.get('establishmentName')?.touched) {
                    <span class="pt-field__error">Este campo es obligatorio.</span>
                  }
                </div>

                <div class="pt-field">
                  <label for="city">Localidad</label>
                  <input id="city" type="text" formControlName="city" placeholder="Madrid, Barcelona…">
                  @if (form.get('city')?.invalid && form.get('city')?.touched) {
                    <span class="pt-field__error">Este campo es obligatorio.</span>
                  }
                </div>

                <div class="pt-field">
                  <label for="establishmentType">Tipo de establecimiento</label>
                  <select id="establishmentType" formControlName="establishmentType">
                    <option value="" disabled>Selecciona…</option>
                    <option value="Tienda gourmet">Tienda gourmet</option>
                    <option value="Delicatessen">Delicatessen</option>
                    <option value="Herbolario premium">Herbolario premium</option>
                    <option value="Otro">Otro</option>
                  </select>
                  @if (form.get('establishmentType')?.invalid && form.get('establishmentType')?.touched) {
                    <span class="pt-field__error">Selecciona una opción.</span>
                  }
                </div>

                <div class="pt-field">
                  <label for="email">Email</label>
                  <input id="email" type="email" formControlName="email" placeholder="tienda@ejemplo.com">
                  @if (form.get('email')?.invalid && form.get('email')?.touched) {
                    <span class="pt-field__error">Introduce un email válido.</span>
                  }
                </div>

                <div class="pt-field">
                  <label for="phone">Teléfono</label>
                  <input id="phone" type="tel" formControlName="phone" placeholder="+34 600 000 000">
                  @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
                    <span class="pt-field__error">Introduce un teléfono válido.</span>
                  }
                </div>
              </div>

              <p class="pt-form__note">Sin compromiso. Os llamamos en 48 horas. Si os interesa conocer el producto antes de decidir, os enviamos una muestra gratuita.</p>

              @if (submitState() === 'error') {
                <div class="pt-form-error">
                  <span>No hemos podido enviar tu solicitud. Inténtalo de nuevo.</span>
                  <button type="button" class="pt-form-error__retry" (click)="submitState.set('idle')">Reintentar</button>
                </div>
              }

              <button type="submit" class="pt-form__submit" [disabled]="form.invalid || submitState() === 'loading'">
                {{ submitState() === 'loading' ? 'Enviando...' : 'Conocer precios de venta' }}
              </button>

              <p class="pt-form__disclaimer">No compartimos tus datos con terceros.</p>
            </form>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .pt-page {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.5rem 1rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Hero ─────────────────────────────────────────────────── */
    .pt-hero {
      position: relative;
      overflow: hidden;
      background: #7B1716;
      border-radius: 8px;
      padding: 3.5rem 2rem;
    }

    .pt-hero__deco {
      position: absolute;
      pointer-events: none;
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 18rem;
      line-height: 1;
      color: rgba(255, 255, 255, 0.04);
      top: -3rem;
      right: -2rem;
      user-select: none;
    }

    .pt-hero__deco--2 {
      top: auto;
      bottom: -6rem;
      left: -4rem;
      right: auto;
      font-size: 14rem;
    }

    .pt-hero__content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      max-width: 560px;
    }

    .pt-hero__eyebrow {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.8rem;
      color: #E6C15A;
    }

    .pt-hero__title {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 22px;
      color: #F4F1E9;
      margin: 0;
      line-height: 1.35;
    }

    .pt-hero__subtitle {
      font-family: 'Lora', serif;
      font-style: italic;
      color: rgba(244, 241, 233, 0.7);
      margin: 0;
      line-height: 1.6;
    }

    .pt-hero__cta {
      align-self: flex-start;
      margin-top: 0.5rem;
      background: #E6C15A;
      color: #1C1A14;
      border: none;
      border-radius: 20px;
      padding: 0.85rem 1.75rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      min-height: 48px;
      transition: opacity 200ms ease;
    }

    .pt-hero__cta:hover { opacity: 0.85; }

    /* ── Grid de tarjetas ─────────────────────────────────────── */
    .pt-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .pt-grid { grid-template-columns: 1fr; }
    }

    .pt-card {
      background: #EDE9DF;
      border-radius: 6px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .pt-card__icon {
      color: #7B1716;
      margin-bottom: 0.25rem;
    }

    .pt-card__title {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      color: #1C1A14;
      margin: 0;
    }

    .pt-card__desc {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.9rem;
      color: #6B6456;
      margin: 0;
      line-height: 1.6;
    }

    /* ── Aviso pedido mínimo ──────────────────────────────────── */
    .pt-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(162, 186, 28, 0.08);
      border: 1px solid rgba(162, 186, 28, 0.3);
      border-radius: 6px;
      color: #4d5a10;
    }

    .pt-notice__title {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      color: #1C1A14;
      margin: 0 0 0.2rem;
    }

    .pt-notice__desc {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.88rem;
      color: #6B6456;
      margin: 0;
      line-height: 1.5;
    }

    /* ── Testimonios ──────────────────────────────────────────── */
    .pt-testimonials {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .pt-testimonials { grid-template-columns: 1fr; }
    }

    .pt-testimonial {
      background: #EDE9DF;
      border-left: 2px solid #E6C15A;
      border-radius: 4px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .pt-testimonial--placeholder {
      opacity: 0.75;
      border-left-style: dashed;
    }

    .pt-testimonial__quote {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.95rem;
      color: #6B6456;
      margin: 0 0 0.5rem;
      line-height: 1.6;
    }

    .pt-testimonial__author {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      color: #6B6456;
      margin: 0;
    }

    .pt-testimonial__city {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      color: #6B6456;
      margin: 0 0 0.5rem;
    }

    .pt-testimonial__badge {
      align-self: flex-start;
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #4d5a10;
      background: rgba(162, 186, 28, 0.18);
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
    }

    /* ── Formulario ───────────────────────────────────────────── */
    .pt-form-block {
      border: 1px solid rgba(123, 23, 22, 0.15);
      border-radius: 8px;
      overflow: hidden;
    }

    .pt-form-block__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      background: rgba(123, 23, 22, 0.04);
      color: #7B1716;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 1.05rem;
    }

    .pt-form-block__body {
      padding: 1.5rem;
    }

    .pt-form__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .pt-form__grid { grid-template-columns: 1fr; }
    }

    .pt-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .pt-field label {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.8rem;
      color: #1C1A14;
    }

    .pt-field input,
    .pt-field select {
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      color: #1C1A14;
      background: #F4F1E9;
      border: 1.5px solid rgba(28, 26, 20, 0.1);
      border-radius: 6px;
      padding: 0.7rem 0.9rem;
      min-height: 48px;
      box-sizing: border-box;
    }

    .pt-field input:focus,
    .pt-field select:focus {
      outline: none;
      border-color: #7B1716;
    }

    .pt-field__error {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      color: #7B1716;
    }

    .pt-form__note {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.88rem;
      color: #6B6456;
      margin: 1.25rem 0 0;
      line-height: 1.6;
    }

    .pt-form-error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      padding: 0.85rem 1rem;
      background: rgba(123, 23, 22, 0.06);
      border: 1px solid rgba(123, 23, 22, 0.25);
      border-radius: 6px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      color: #7B1716;
    }

    .pt-form-error__retry {
      background: transparent;
      border: 1.5px solid #7B1716;
      color: #7B1716;
      border-radius: 20px;
      padding: 0.4rem 1rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      min-height: 36px;
    }

    .pt-form__submit {
      width: 100%;
      margin-top: 1.25rem;
      background: #7B1716;
      color: #F4F1E9;
      border: none;
      border-radius: 20px;
      padding: 0.9rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      min-height: 48px;
      transition: opacity 200ms ease;
    }

    .pt-form__submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pt-form__disclaimer {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.78rem;
      color: #6B6456;
      text-align: center;
      margin: 0.75rem 0 0;
    }

    .pt-form-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem;
      color: #4d5a10;
    }

    .pt-form-success__title {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 1.1rem;
      color: #1C1A14;
      margin: 0;
    }

    .pt-form-success__desc {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.92rem;
      color: #6B6456;
      margin: 0;
      max-width: 40ch;
    }
  `]
})
export class ParaTiendasComponent {
  private fb = inject(FormBuilder);
  private paraTiendasService = inject(ParaTiendasService);

  readonly submitState = signal<SubmitState>('idle');

  readonly form = this.fb.group({
    name: ['', Validators.required],
    establishmentName: ['', Validators.required],
    city: ['', Validators.required],
    establishmentType: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s()-]{9,15}$/)]],
  });

  scrollToForm(): void {
    document.getElementById('formulario-punto-de-venta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitState.set('loading');
    const value = this.form.getRawValue();

    this.paraTiendasService.submitPosLead({
      name: value.name!,
      establishment_name: value.establishmentName!,
      city: value.city!,
      establishment_type: value.establishmentType!,
      email: value.email!,
      phone: value.phone!,
    }).subscribe({
      next: () => this.submitState.set('success'),
      error: () => this.submitState.set('error'),
    });
  }
}
