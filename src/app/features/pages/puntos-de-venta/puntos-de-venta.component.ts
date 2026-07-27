import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { PointOfSaleService } from '../../../core/services/point-of-sale.service';
import { PointOfSale } from '../../../core/models';

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
                placeholder="Busca por ciudad o tienda…"
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
              @for (city of availableCities(); track city) {
                <button
                  class="pdv-tag"
                  [class.pdv-tag--active]="activeCity() === city"
                  (click)="toggleCity(city)"
                >{{ city }}</button>
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
              @if (filteredStores().length === stores().length) {
                {{ stores().length }} puntos de venta en toda España
              } @else {
                {{ filteredStores().length }} resultado{{ filteredStores().length !== 1 ? 's' : '' }} encontrado{{ filteredStores().length !== 1 ? 's' : '' }}
              }
            </p>

            @if (filteredStores().length === 0) {
              <div class="pdv-no-results">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>No hemos encontrado tiendas que coincidan con "{{ searchQuery }}".</p>
                <button class="btn btn--outline-brand" (click)="searchQuery = ''; activeCity.set(null)">Ver todas las tiendas</button>
              </div>
            } @else {
              @for (group of groupedStores(); track group.city) {
                <div class="pdv-city-group">
                  <h2 class="pdv-city-group__title">{{ group.city }}</h2>
                  <div class="pdv-grid">
                    @for (store of group.stores; track store.id) {
                      <div class="pdv-card">
                        <div class="pdv-card__head">
                          <div class="pdv-card__icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          </div>
                          <div class="pdv-card__title-block">
                            <h3>{{ store.name }}</h3>
                            <span class="pdv-card__type">{{ store.city }}</span>
                          </div>
                        </div>
                        <div class="pdv-card__links">
                          <a [href]="store.instagram_url" target="_blank" rel="noopener" class="pdv-card__instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                            Instagram
                          </a>
                        </div>
                        <a
                          [href]="store.maps_url"
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
                </div>
              }
            }
          </div>
        </div>
      </section>

      <!-- ── CTA Contacto ────────────────────────────────────── -->
      <section class="pdv-cta">
        <div class="container">
          <div class="pdv-cta__inner">
            <div class="pdv-cta__text">
              <h2>¿Tienes alguna pregunta?</h2>
              <p>Tanto si eres un cliente con dudas como si quieres convertirte en punto de venta, estamos aquí para ayudarte.</p>
            </div>
            <a routerLink="/contacto" class="pdv-cta__btn">
              Contáctanos
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>
      </section>

      <!-- ── Datos rápidos ────────────────────────────────────── -->
      <section class="pdv-stats">
        <div class="container">
          <div class="pdv-stats__grid">
            <div class="pdv-stats__item">
              <span class="pdv-stats__num">{{ stores().length }}+</span>
              <span class="pdv-stats__label">Puntos de venta</span>
            </div>
            <div class="pdv-stats__item">
              <span class="pdv-stats__num">{{ availableCities().length }}</span>
              <span class="pdv-stats__label">Ciudades</span>
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

    .pdv-city-group {
      margin-bottom: 2.25rem;

      &__title {
        font-family: 'Teko', sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: $brand;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        margin: 0 0 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid $border;
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

      &__links {
        display: flex;
        margin-top: auto;
      }

      &__instagram {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.78rem;
        font-weight: 500;
        color: $text-lt;
        text-decoration: none;

        svg { flex-shrink: 0; color: $text-mt; }
        &:hover { color: $brand; svg { color: $brand; } }
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

    // ── CTA Contacto ──────────────────────────────────────────
    .pdv-cta {
      padding: 3.5rem 0;
      background: $brand;

      &__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;

        @media (max-width: 640px) {
          flex-direction: column;
          text-align: center;
          gap: 1.5rem;
        }
      }

      &__text {
        h2 {
          font-family: 'Teko', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          text-transform: uppercase;
          color: $accent;
          margin: 0 0 0.35rem;
          line-height: 1.1;
        }
        p {
          font-family: 'Lora', serif;
          font-size: 0.95rem;
          color: rgba(244, 241, 233, 0.8);
          margin: 0;
          line-height: 1.6;
        }
      }

      &__btn {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.75rem;
        background: $accent;
        color: $brand;
        border-radius: 2px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        text-decoration: none;
        transition: background 200ms ease, color 200ms ease;

        &:hover {
          background: darken(#E6C15A, 8%);
        }
      }
    }

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
export class PuntosDeVentaComponent implements OnInit {
  private toastService = inject(ToastService);
  private pointOfSaleService = inject(PointOfSaleService);

  stores = signal<PointOfSale[]>([]);
  availableCities = computed(() => Array.from(new Set(this.stores().map(s => s.city))));

  searchQuery = '';
  activeCity = signal<string | null>(null);

  ngOnInit(): void {
    this.pointOfSaleService.getAll().subscribe({
      next: (stores) => this.stores.set(stores),
      error: () => this.toastService.error('No se han podido cargar los puntos de venta.'),
    });
  }

  filteredStores = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const city = this.activeCity();
    return this.stores().filter(s => {
      const matchesQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q);
      const matchesCity = !city || s.city === city;
      return matchesQuery && matchesCity;
    });
  });

  groupedStores = computed(() => {
    const groups = new Map<string, PointOfSale[]>();
    for (const store of this.filteredStores()) {
      const list = groups.get(store.city) ?? [];
      list.push(store);
      groups.set(store.city, list);
    }
    return Array.from(groups.entries()).map(([city, stores]) => ({ city, stores }));
  });

  toggleCity(city: string): void {
    this.activeCity.set(this.activeCity() === city ? null : city);
  }
}
