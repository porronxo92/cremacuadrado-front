import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PointOfSale } from '../../../../core/models';
import { PointOfSaleService } from '../../../../core/services/point-of-sale.service';
import { StoresMapGateComponent } from '../../../pages/puntos-de-venta/stores-map-gate.component';

const LIST_LIMIT = 3;

/**
 * «¿Dónde comprar CremaCuadrado?»: versión compacta de /puntos-de-venta (misma API y mismo
 * modelo). La lista corta va en el HTML (también en SSR, con la respuesta en la caché de
 * transferencia); el mapa pasa por la puerta de consentimiento y Leaflet se importa en
 * diferido solo cuando el mapa entra en pantalla.
 */
@Component({
  selector: 'app-stores-block',
  standalone: true,
  imports: [RouterLink, StoresMapGateComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <section class="stores" aria-labelledby="stores-title">
      <div class="container">
        <header class="stores__header">
          <h2 class="stores__title" id="stores-title">¿Dónde comprar CremaCuadrado?</h2>
          <p class="stores__sub">En tu tienda gourmet o aquí, online.</p>
        </header>

        <div class="stores__body" [class.stores__body--solo]="stores().length === 0">
          @if (stores().length > 0) {
            <div class="stores__map">
              <app-stores-map-gate [stores]="stores()" [compact]="true" />
            </div>
          }

          <div class="stores__side">
            @if (stores().length > 0) {
              <ul class="stores__list" aria-label="Algunos puntos de venta">
                @for (store of shown(); track store.id) {
                  <li><strong>{{ store.name }}</strong><span>{{ store.city }}</span></li>
                }
                @if (extra() > 0) {
                  <li class="stores__more">y {{ extra() }} más</li>
                }
              </ul>
            }
            <div class="stores__actions">
              <a routerLink="/puntos-de-venta" class="stores__btn">Ver todos los puntos de venta</a>
              <a href="/#productos" class="stores__online" (click)="goToProducts($event)">o cómpralo online</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
    .stores { padding: 2rem 0; background: var(--color-bg, #F4F1E9); }
    .stores__header { text-align: center; margin-bottom: 1rem; }
    .stores__title {
      font-family: 'Teko', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em;
      font-size: clamp(2rem, 4vw, 2.8rem); line-height: 1.1; color: var(--color-brand, #7B1716); margin: 0 0 0.4rem;
    }
    .stores__sub { font-family: 'Lora', serif; font-style: italic; font-size: 1rem; color: var(--color-text-light, #5A4F3E); margin: 0; }

    .stores__body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.9rem; }
    .stores__body--solo { max-width: 460px; margin: 0 auto; text-align: center; }
    .stores__map {
      border: 1px solid var(--color-border, #D9D3C5); border-radius: 12px; overflow: hidden;
    }

    .stores__list {
      list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.15rem 0.5rem;
      font-family: 'Poppins', sans-serif; font-size: 0.85rem; color: var(--color-ink, #1C1A14);
      li:not(:last-child)::after { content: '·'; margin-left: 0.5rem; color: var(--color-text-light, #5A4F3E); }
      strong { font-weight: 600; }
      span { font-size: 0.78rem; color: var(--color-text-light, #5A4F3E); margin-left: 0.3rem; }
      .stores__more { font-family: 'Lora', serif; font-size: 0.9rem; color: var(--color-text-light, #5A4F3E); }
    }
    .stores__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0 0.75rem; margin-top: 0.25rem; }
    .stores__body--solo .stores__actions { justify-content: center; margin-top: 0; }
    .stores__btn {
      display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 1.5rem;
      background: var(--color-bg, #F4F1E9); color: var(--color-brand, #7B1716); border: 1.5px solid var(--color-brand, #7B1716);
      border-radius: 20px; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 0.85rem; text-decoration: none;
      text-align: center; transition: background 150ms, color 150ms;
      &:hover { background: var(--color-brand, #7B1716); color: var(--color-bg, #F4F1E9); }
    }
    .stores__online {
      display: inline-flex; align-items: center; min-height: 48px; padding: 0 0.5rem;
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 0.85rem; color: var(--color-brand, #7B1716);
      text-decoration: underline; text-underline-offset: 3px;
    }

    @media (min-width: 900px) {
      .stores { padding: 2.25rem 0; }
      .stores__body:not(.stores__body--solo) { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 2rem; align-items: center; }
    }
    @media (max-width: 480px) {
      .stores { padding: 1.5rem 0; }
      .container { padding: 0 1rem; }
      .stores__title { font-size: 1.45rem; margin-bottom: 0.25rem; }
      .stores__btn { padding: 0 1rem; flex: 1 1 auto; }
    }
  `],
})
export class StoresBlockComponent implements OnInit {
  private readonly pointOfSaleService = inject(PointOfSaleService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly stores = signal<PointOfSale[]>([]);
  readonly shown = computed(() => this.stores().slice(0, LIST_LIMIT));
  readonly extra = computed(() => Math.max(0, this.stores().length - LIST_LIMIT));
  readonly cityCount = computed(() => new Set(this.stores().map(s => s.city)).size);

  ngOnInit(): void {
    this.pointOfSaleService.getAll().subscribe({
      next: stores => this.stores.set(stores),
      error: () => this.stores.set([]),
    });
  }

  goToProducts(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = document.getElementById('productos');
    if (!target) return;  // sin la sección: deja que el enlace navegue
    event.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    (target.querySelector('h2') as HTMLElement | null)?.focus({ preventScroll: true });
  }
}
