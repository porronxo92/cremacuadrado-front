import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

interface Store {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  province: string;
  phone?: string;
  hours?: string;
  tags: string[];
  lat?: number;
  lng?: number;
}

@Component({
  selector: 'app-puntos-de-venta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="pdv-page">

      <!-- ── Hero ────────────────────────────────────────────── -->
      <section class="pdv-hero">
        <div class="pdv-hero__bg"></div>
        <div class="container">
          <nav class="breadcrumb">
            <a routerLink="/">Inicio</a>
            <span>›</span>
            <span>Puntos de Venta</span>
          </nav>
          <div class="pdv-hero__content">
            <span class="pdv-hero__badge">📍 Dónde encontrarnos</span>
            <h1>Puntos de Venta</h1>
            <p>Encuentra Cremacuadrado en tiendas especializadas, herboristerías y delicatessen cerca de ti.</p>
          </div>
        </div>
      </section>

      <!-- ── Mapa + Buscador ──────────────────────────────────── -->
      <section class="pdv-map-section">
        <div class="container">

          <!-- Buscador -->
          <div class="pdv-search">
            <div class="pdv-search__bar">
              <svg class="pdv-search__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Busca por ciudad, tienda o provincia…"
                [(ngModel)]="searchQuery"
                class="pdv-search__input"
              >
              @if (searchQuery) {
                <button class="pdv-search__clear" (click)="searchQuery = ''" title="Limpiar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              }
            </div>
            <div class="pdv-search__filters">
              @for (tag of availableTags; track tag) {
                <button
                  class="pdv-tag"
                  [class.pdv-tag--active]="activeTag() === tag"
                  (click)="toggleTag(tag)"
                >{{ tag }}</button>
              }
            </div>
          </div>

          <!-- Mapa -->
          <div class="pdv-map-wrapper">
            <iframe
              class="pdv-map"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1571052.1823547506!2d-4.5!3d39.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd6a5c8ef6a9d6c7%3A0xd0c1b6e1c4bc5e55!2sCiudad%20Real%2C%20Spain!5e0!3m2!1ses!2ses!4v1700000000000!5m2!1ses!2ses"
              title="Mapa de puntos de venta Cremacuadrado"
            ></iframe>
            <div class="pdv-map__overlay-tip">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Para una experiencia óptima, abre el mapa completo
              <a href="https://maps.app.goo.gl/yourlink" target="_blank" rel="noopener">Ver en Google Maps →</a>
            </div>
          </div>

          <!-- Resultados -->
          <div class="pdv-results">
            <p class="pdv-results__count">
              @if (filteredStores().length === stores.length) {
                {{ stores.length }} puntos de venta en toda España
              } @else {
                {{ filteredStores().length }} resultado{{ filteredStores().length !== 1 ? 's' : '' }} encontrado{{ filteredStores().length !== 1 ? 's' : '' }}
              }
            </p>

            @if (filteredStores().length === 0) {
              <div class="pdv-no-results">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>No hemos encontrado tiendas que coincidan con "{{ searchQuery }}".</p>
                <button class="btn btn--outline-brand" (click)="searchQuery = ''; activeTag.set(null)">Ver todas las tiendas</button>
              </div>
            } @else {
              <div class="pdv-grid">
                @for (store of filteredStores(); track store.id) {
                  <div class="pdv-card">
                    <div class="pdv-card__head">
                      <div class="pdv-card__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div class="pdv-card__title-block">
                        <h3>{{ store.name }}</h3>
                        <span class="pdv-card__type">{{ store.type }}</span>
                      </div>
                    </div>
                    <div class="pdv-card__body">
                      <p class="pdv-card__address">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {{ store.address }}, {{ store.city }} ({{ store.province }})
                      </p>
                      @if (store.hours) {
                        <p class="pdv-card__hours">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {{ store.hours }}
                        </p>
                      }
                      @if (store.phone) {
                        <p class="pdv-card__phone">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6.51 6.51l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          <a [href]="'tel:' + store.phone">{{ store.phone }}</a>
                        </p>
                      }
                    </div>
                    <div class="pdv-card__tags">
                      @for (tag of store.tags; track tag) {
                        <span class="pdv-tag pdv-tag--sm">{{ tag }}</span>
                      }
                    </div>
                    <a
                      [href]="'https://maps.google.com/?q=' + encodeAddress(store)"
                      target="_blank"
                      rel="noopener"
                      class="pdv-card__cta"
                    >
                      Cómo llegar
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── Formulario de Contacto ───────────────────────────── -->
      <section class="pdv-contact">
        <div class="container">
          <div class="pdv-contact__header">
            <span class="pdv-contact__badge">✉️ Escríbenos</span>
            <h2>¿Tienes alguna pregunta?</h2>
            <p>Tanto si eres un cliente con dudas como si quieres convertirte en punto de venta, estamos aquí para ayudarte.</p>
          </div>

          <!-- Tabs -->
          <div class="pdv-tabs">
            <button
              class="pdv-tab"
              [class.pdv-tab--active]="activeForm() === 'customer'"
              (click)="activeForm.set('customer')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Soy cliente
            </button>
            <button
              class="pdv-tab"
              [class.pdv-tab--active]="activeForm() === 'business'"
              (click)="activeForm.set('business')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              Quiero ser punto de venta
            </button>
          </div>

          <!-- Formulario Cliente -->
          @if (activeForm() === 'customer') {
            <form class="pdv-form" (submit)="submitCustomerForm($event)">
              <div class="pdv-form__grid">
                <div class="form-field">
                  <label for="c-name">Nombre *</label>
                  <input type="text" id="c-name" [(ngModel)]="customerForm.name" name="c-name" placeholder="Tu nombre" required>
                </div>
                <div class="form-field">
                  <label for="c-email">Email *</label>
                  <input type="email" id="c-email" [(ngModel)]="customerForm.email" name="c-email" placeholder="tu@email.com" required>
                </div>
              </div>
              <div class="form-field">
                <label for="c-subject">Asunto</label>
                <select id="c-subject" [(ngModel)]="customerForm.subject" name="c-subject">
                  <option value="">Selecciona un tema…</option>
                  <option value="pedido">Consulta sobre un pedido</option>
                  <option value="producto">Información de producto</option>
                  <option value="tienda">Encontrar punto de venta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="form-field">
                <label for="c-message">Mensaje *</label>
                <textarea id="c-message" [(ngModel)]="customerForm.message" name="c-message" rows="5" placeholder="Cuéntanos en qué podemos ayudarte…" required></textarea>
              </div>
              <div class="pdv-form__footer">
                <p class="pdv-form__privacy">Al enviar este formulario aceptas nuestra <a routerLink="/pages/politica-privacidad">política de privacidad</a>.</p>
                <button type="submit" class="btn btn--brand" [disabled]="submitting()">
                  @if (submitting()) {
                    <span class="spinner"></span> Enviando…
                  } @else {
                    Enviar mensaje
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                </button>
              </div>
            </form>
          }

          <!-- Formulario Negocio -->
          @if (activeForm() === 'business') {
            <form class="pdv-form" (submit)="submitBusinessForm($event)">
              <div class="pdv-form__info-banner">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>Colaboramos con tiendas delicatessen, herboristerías, tiendas bio y restaurantes. Rellena el formulario y nos ponemos en contacto contigo en 48h.</p>
              </div>
              <div class="pdv-form__grid">
                <div class="form-field">
                  <label for="b-contact">Persona de contacto *</label>
                  <input type="text" id="b-contact" [(ngModel)]="businessForm.contact" name="b-contact" placeholder="Nombre y apellidos" required>
                </div>
                <div class="form-field">
                  <label for="b-email">Email de negocio *</label>
                  <input type="email" id="b-email" [(ngModel)]="businessForm.email" name="b-email" placeholder="tienda@ejemplo.com" required>
                </div>
              </div>
              <div class="pdv-form__grid">
                <div class="form-field">
                  <label for="b-business">Nombre del negocio *</label>
                  <input type="text" id="b-business" [(ngModel)]="businessForm.businessName" name="b-business" placeholder="Nombre de tu tienda" required>
                </div>
                <div class="form-field">
                  <label for="b-type">Tipo de negocio *</label>
                  <select id="b-type" [(ngModel)]="businessForm.businessType" name="b-type" required>
                    <option value="">Selecciona…</option>
                    <option value="delicatessen">Tienda delicatessen</option>
                    <option value="herboristeria">Herboristería / Tienda bio</option>
                    <option value="restaurante">Restaurante / Cafetería</option>
                    <option value="supermercado">Supermercado</option>
                    <option value="online">Tienda online</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div class="pdv-form__grid">
                <div class="form-field">
                  <label for="b-city">Ciudad *</label>
                  <input type="text" id="b-city" [(ngModel)]="businessForm.city" name="b-city" placeholder="Madrid, Barcelona…" required>
                </div>
                <div class="form-field">
                  <label for="b-phone">Teléfono</label>
                  <input type="tel" id="b-phone" [(ngModel)]="businessForm.phone" name="b-phone" placeholder="+34 600 000 000">
                </div>
              </div>
              <div class="form-field">
                <label for="b-message">Cuéntanos más sobre tu negocio</label>
                <textarea id="b-message" [(ngModel)]="businessForm.message" name="b-message" rows="4" placeholder="Describe brevemente tu tienda, clientes habituales, volumen estimado…"></textarea>
              </div>
              <div class="pdv-form__footer">
                <p class="pdv-form__privacy">Al enviar este formulario aceptas nuestra <a routerLink="/pages/politica-privacidad">política de privacidad</a>.</p>
                <button type="submit" class="btn btn--brand" [disabled]="submitting()">
                  @if (submitting()) {
                    <span class="spinner"></span> Enviando…
                  } @else {
                    Solicitar colaboración
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                </button>
              </div>
            </form>
          }

        </div>
      </section>

      <!-- ── Datos rápidos ────────────────────────────────────── -->
      <section class="pdv-stats">
        <div class="container">
          <div class="pdv-stats__grid">
            <div class="pdv-stats__item">
              <span class="pdv-stats__num">{{ stores.length }}+</span>
              <span class="pdv-stats__label">Puntos de venta</span>
            </div>
            <div class="pdv-stats__item">
              <span class="pdv-stats__num">8</span>
              <span class="pdv-stats__label">Provincias</span>
            </div>
            <div class="pdv-stats__item">
              <span class="pdv-stats__num">48h</span>
              <span class="pdv-stats__label">Respuesta para nuevas colaboraciones</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    $brand: #7B1716;
    $accent: #E6C15A;
    $bg: #F4F1E9;
    $bg-alt: #EDE9DD;
    $text: #1A1208;
    $text-lt: #5A4F3E;
    $text-mt: #8C7F6A;
    $border: #D9D3C5;

    .pdv-page {
      background: $bg;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    // ── Breadcrumb ────────────────────────────────────────────
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.7);
      margin-bottom: 2rem;

      a {
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        &:hover { color: $accent; }
      }

      span:last-child { color: rgba(255,255,255,0.95); }
    }

    // ── Hero ──────────────────────────────────────────────────
    .pdv-hero {
      position: relative;
      padding: 4rem 0 3.5rem;
      overflow: hidden;

      &__bg {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(135deg, rgba(123,23,22,0.92) 0%, rgba(80,12,12,0.85) 100%),
          url('/assets/images/nosotros/principal-quienes.somos2_.jpg') center/cover no-repeat;
        z-index: 0;
      }

      .container { position: relative; z-index: 1; }

      &__content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      &__badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba($accent, 0.18);
        border: 1px solid rgba($accent, 0.35);
        color: $accent;
        font-family: 'Poppins', sans-serif;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 0.3rem 0.85rem;
        border-radius: 50px;
      }

      h1 {
        font-family: 'Teko', sans-serif;
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 700;
        color: #fff;
        line-height: 1.05;
        margin: 0;
      }

      p {
        font-family: 'Lora', serif;
        font-size: 1.05rem;
        color: rgba(255,255,255,0.82);
        max-width: 52ch;
        line-height: 1.7;
        margin: 0;
      }
    }

    // ── Buscador ──────────────────────────────────────────────
    .pdv-map-section {
      padding: 3rem 0 4rem;
    }

    .pdv-search {
      margin-bottom: 1.75rem;

      &__bar {
        position: relative;
        display: flex;
        align-items: center;
        background: #fff;
        border: 1.5px solid $border;
        border-radius: 8px;
        overflow: hidden;
        transition: border-color 200ms ease, box-shadow 200ms ease;
        max-width: 600px;

        &:focus-within {
          border-color: $brand;
          box-shadow: 0 0 0 3px rgba($brand, 0.1);
        }
      }

      &__icon {
        flex-shrink: 0;
        margin-left: 1rem;
        color: $text-mt;
      }

      &__input {
        flex: 1;
        border: none;
        outline: none;
        padding: 0.85rem 1rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        color: $text;
        background: transparent;

        &::placeholder { color: $text-mt; }
      }

      &__clear {
        background: none;
        border: none;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        color: $text-mt;
        &:hover { color: $brand; }
      }

      &__filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
    }

    .pdv-tag {
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.8rem;
      border-radius: 50px;
      background: #fff;
      border: 1.5px solid $border;
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      color: $text-lt;
      cursor: pointer;
      transition: all 150ms ease;

      &:hover {
        border-color: $brand;
        color: $brand;
      }

      &--active {
        background: $brand;
        border-color: $brand;
        color: #fff;
      }

      &--sm {
        padding: 0.2rem 0.55rem;
        font-size: 0.68rem;
        cursor: default;
        &:hover { border-color: $border; color: $text-lt; }
      }
    }

    // ── Mapa ──────────────────────────────────────────────────
    .pdv-map-wrapper {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid $border;
      box-shadow: 0 8px 32px -8px rgba($text, 0.12);
      margin-bottom: 2.5rem;
    }

    .pdv-map {
      display: block;
      width: 100%;
      height: 420px;
      border: none;

      @media (max-width: 768px) { height: 280px; }
    }

    .pdv-map__overlay-tip {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba($bg, 0.92);
      backdrop-filter: blur(6px);
      border-top: 1px solid $border;
      padding: 0.6rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      color: $text-mt;

      svg { flex-shrink: 0; color: $brand; }

      a {
        color: $brand;
        text-decoration: none;
        font-weight: 600;
        margin-left: auto;
        &:hover { text-decoration: underline; }
      }
    }

    // ── Resultados / Grid ──────────────────────────────────────
    .pdv-results__count {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      color: $text-mt;
      margin-bottom: 1.25rem;
    }

    .pdv-no-results {
      text-align: center;
      padding: 3rem 1rem;
      color: $text-mt;

      svg { display: block; margin: 0 auto 1rem; opacity: 0.4; }

      p {
        font-family: 'Lora', serif;
        font-size: 1rem;
        margin-bottom: 1.25rem;
      }
    }

    .pdv-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .pdv-card {
      background: #fff;
      border: 1px solid $border;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: box-shadow 200ms ease, transform 200ms ease;

      &:hover {
        box-shadow: 0 8px 24px -6px rgba($text, 0.12);
        transform: translateY(-2px);
      }

      &__head {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
      }

      &__icon {
        width: 40px;
        height: 40px;
        background: rgba($brand, 0.08);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: $brand;
      }

      &__title-block {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      h3 {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: $text;
        margin: 0;
        line-height: 1.3;
      }

      &__type {
        font-family: 'Poppins', sans-serif;
        font-size: 0.7rem;
        font-weight: 500;
        color: $text-mt;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      &__body {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      &__address, &__hours, &__phone {
        display: flex;
        align-items: flex-start;
        gap: 0.4rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.78rem;
        color: $text-lt;
        line-height: 1.4;

        svg { flex-shrink: 0; margin-top: 1px; color: $text-mt; }
      }

      &__phone a {
        color: $brand;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }

      &__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: auto;
      }

      &__cta {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        color: $brand;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding-top: 0.5rem;
        border-top: 1px solid $border;
        transition: gap 150ms ease;

        &:hover { gap: 0.65rem; }
      }
    }

    // ── Formulario ────────────────────────────────────────────
    .pdv-contact {
      background: $bg-alt;
      border-top: 1px solid $border;
      border-bottom: 1px solid $border;
      padding: 4rem 0;
    }

    .pdv-contact__header {
      text-align: center;
      margin-bottom: 2.5rem;

      &__badge, .pdv-contact__badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba($brand, 0.08);
        color: $brand;
        font-family: 'Poppins', sans-serif;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 0.3rem 0.85rem;
        border-radius: 50px;
        margin-bottom: 0.75rem;
      }

      h2 {
        font-family: 'Teko', sans-serif;
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 700;
        color: $text;
        margin: 0.5rem 0;
      }

      p {
        font-family: 'Lora', serif;
        font-size: 1rem;
        color: $text-lt;
        max-width: 56ch;
        margin: 0 auto;
        line-height: 1.7;
      }
    }

    .pdv-contact__badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba($brand, 0.08);
      color: $brand;
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.3rem 0.85rem;
      border-radius: 50px;
      margin-bottom: 0.75rem;
    }

    .pdv-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .pdv-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.5rem;
      border-radius: 50px;
      border: 2px solid $border;
      background: #fff;
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: $text-lt;
      cursor: pointer;
      transition: all 200ms ease;

      &:hover {
        border-color: $brand;
        color: $brand;
      }

      &--active {
        background: $brand;
        border-color: $brand;
        color: #fff;

        svg { stroke: #fff; }
      }

      @media (max-width: 480px) {
        padding: 0.55rem 1rem;
        font-size: 0.78rem;
        span { display: none; }
      }
    }

    .pdv-form {
      max-width: 720px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid $border;
      border-radius: 12px;
      padding: 2rem 2.5rem;

      @media (max-width: 600px) { padding: 1.5rem; }

      &__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;

        @media (max-width: 600px) { grid-template-columns: 1fr; }
      }

      &__info-banner {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: rgba($accent, 0.12);
        border: 1px solid rgba($accent, 0.3);
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;

        svg { flex-shrink: 0; color: darken(#E6C15A, 20%); margin-top: 2px; }

        p {
          font-family: 'Poppins', sans-serif;
          font-size: 0.8rem;
          color: $text-lt;
          margin: 0;
          line-height: 1.55;
        }
      }

      &__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid $border;
      }

      &__privacy {
        font-family: 'Poppins', sans-serif;
        font-size: 0.72rem;
        color: $text-mt;
        margin: 0;

        a {
          color: $brand;
          text-decoration: none;
          &:hover { text-decoration: underline; }
        }
      }
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;

      label {
        font-family: 'Poppins', sans-serif;
        font-size: 0.78rem;
        font-weight: 600;
        color: $text-lt;
        letter-spacing: 0.02em;
      }

      input, select, textarea {
        width: 100%;
        padding: 0.7rem 0.9rem;
        border: 1.5px solid $border;
        border-radius: 6px;
        background: $bg;
        font-family: 'Poppins', sans-serif;
        font-size: 0.875rem;
        color: $text;
        outline: none;
        transition: border-color 200ms ease, box-shadow 200ms ease;
        box-sizing: border-box;

        &::placeholder { color: $text-mt; }

        &:focus {
          border-color: $brand;
          box-shadow: 0 0 0 3px rgba($brand, 0.1);
          background: #fff;
        }
      }

      textarea { resize: vertical; min-height: 100px; }
      select { cursor: pointer; }
    }

    // ── Botones ────────────────────────────────────────────────
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.75rem;
      border-radius: 6px;
      border: none;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: pointer;
      text-decoration: none;
      transition: background 200ms ease, opacity 200ms ease;

      &--brand {
        background: $brand;
        color: $accent;
        &:hover { background: lighten($brand, 6%); }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }

      &--outline-brand {
        background: transparent;
        border: 2px solid $brand;
        color: $brand;
        &:hover { background: rgba($brand, 0.06); }
      }
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    // ── Stats ──────────────────────────────────────────────────
    .pdv-stats {
      padding: 3rem 0;

      &__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;

        @media (max-width: 600px) { grid-template-columns: 1fr; }
      }

      &__item {
        text-align: center;
        padding: 1.5rem;
        background: #fff;
        border: 1px solid $border;
        border-radius: 10px;
      }

      &__num {
        display: block;
        font-family: 'Teko', sans-serif;
        font-size: 3rem;
        font-weight: 700;
        color: $brand;
        line-height: 1;
        margin-bottom: 0.25rem;
      }

      &__label {
        font-family: 'Poppins', sans-serif;
        font-size: 0.8rem;
        color: $text-mt;
      }
    }

    // ── Responsive ────────────────────────────────────────────
    @media (max-width: 768px) {
      .pdv-hero { padding: 3rem 0 2.5rem; }
      .pdv-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PuntosDeVentaComponent {
  private toastService = inject(ToastService);

  readonly availableTags = ['Delicatessen', 'Herboristería', 'Bio', 'Restaurante', 'Online'];

  readonly stores: Store[] = [
    {
      id: 1, name: 'Delicatessen El Granero', type: 'Tienda Delicatessen',
      address: 'Calle Mayor, 14', city: 'Madrid', province: 'Madrid',
      phone: '+34 910 000 001', hours: 'L-S: 9:00–21:00',
      tags: ['Delicatessen']
    },
    {
      id: 2, name: 'Bio Natural Market', type: 'Herboristería / Tienda Bio',
      address: 'Gran Vía, 102', city: 'Barcelona', province: 'Barcelona',
      phone: '+34 930 000 002', hours: 'L-V: 9:30–20:30, S: 10:00–14:00',
      tags: ['Herboristería', 'Bio']
    },
    {
      id: 3, name: 'La Despensa Manchega', type: 'Tienda Gourmet',
      address: 'Pl. Mayor, 5', city: 'Ciudad Real', province: 'Ciudad Real',
      phone: '+34 926 000 003', hours: 'L-S: 10:00–20:00',
      tags: ['Delicatessen']
    },
    {
      id: 4, name: 'Herbolario Verde Vivo', type: 'Herboristería',
      address: 'Calle Colón, 28', city: 'Valencia', province: 'Valencia',
      phone: '+34 960 000 004', hours: 'L-V: 9:00–20:00',
      tags: ['Herboristería', 'Bio']
    },
    {
      id: 5, name: 'Restaurante Tierra y Sal', type: 'Restaurante',
      address: 'Paseo de la Castellana, 45', city: 'Madrid', province: 'Madrid',
      phone: '+34 910 000 005', hours: 'Mar-Dom: 13:00–16:00, 20:00–23:30',
      tags: ['Restaurante']
    },
    {
      id: 6, name: 'Gourmet Andaluz', type: 'Tienda Delicatessen',
      address: 'Calle Sierpes, 12', city: 'Sevilla', province: 'Sevilla',
      phone: '+34 950 000 006', hours: 'L-S: 10:00–21:00',
      tags: ['Delicatessen']
    },
    {
      id: 7, name: 'Ecomarket Bilbao', type: 'Supermercado Bio',
      address: 'Calle Iparraguirre, 8', city: 'Bilbao', province: 'Vizcaya',
      phone: '+34 940 000 007', hours: 'L-S: 9:00–21:00',
      tags: ['Bio', 'Herboristería']
    },
    {
      id: 8, name: 'Cremacuadrado Shop Online', type: 'Tienda Online',
      address: 'cremacuadrado.com', city: 'España', province: 'Todo el país',
      hours: '24h / 7 días',
      tags: ['Online']
    },
  ];

  searchQuery = '';
  activeTag = signal<string | null>(null);
  activeForm = signal<'customer' | 'business'>('customer');
  submitting = signal(false);

  filteredStores = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const tag = this.activeTag();
    return this.stores.filter(s => {
      const matchesQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q);
      const matchesTag = !tag || s.tags.includes(tag);
      return matchesQuery && matchesTag;
    });
  });

  customerForm = { name: '', email: '', subject: '', message: '' };
  businessForm = { contact: '', email: '', businessName: '', businessType: '', city: '', phone: '', message: '' };

  toggleTag(tag: string): void {
    this.activeTag.set(this.activeTag() === tag ? null : tag);
  }

  encodeAddress(store: Store): string {
    return encodeURIComponent(`${store.name}, ${store.address}, ${store.city}`);
  }

  submitCustomerForm(event: Event): void {
    event.preventDefault();
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.customerForm = { name: '', email: '', subject: '', message: '' };
      this.toastService.success('¡Mensaje enviado! Te respondemos en menos de 24h.');
    }, 1200);
  }

  submitBusinessForm(event: Event): void {
    event.preventDefault();
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.businessForm = { contact: '', email: '', businessName: '', businessType: '', city: '', phone: '', message: '' };
      this.toastService.success('¡Solicitud recibida! Nos ponemos en contacto contigo en 48h.');
    }, 1200);
  }
}
