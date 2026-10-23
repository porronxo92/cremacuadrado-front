import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { PointOfSale } from '../../../../core/models';
import { PointOfSaleService } from '../../../../core/services/point-of-sale.service';
import { StoresMapGateComponent } from '../../../pages/puntos-de-venta/stores-map-gate.component';

/**
 * «¿Dónde comprar CremaCuadrado?»: versión compacta de /puntos-de-venta (misma API y mismo
 * modelo). Filtros por ciudad, como en /puntos-de-venta, y el mapa detrás de la puerta de
 * consentimiento (Leaflet se importa en diferido solo cuando el mapa entra en pantalla).
 * Sin puntos de venta (o si la API falla) la sección no se pinta.
 */
@Component({
  selector: 'app-stores-block',
  standalone: true,
  imports: [StoresMapGateComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (stores().length > 0) {
      <section class="stores" aria-labelledby="stores-title">
        <div class="container stores__layout">
          <div class="stores__intro">
            <header class="stores__header">
              <h2 class="stores__title" id="stores-title">¿Dónde comprar CremaCuadrado?</h2>
              <p class="stores__sub">Elige tu ciudad y encuentra tu tienda más cercana.</p>
            </header>

            <div class="stores__filters" role="group" aria-label="Filtrar puntos de venta por ciudad">
              @for (city of cities(); track city) {
                <button
                  type="button"
                  class="stores__tag"
                  [class.stores__tag--active]="activeCity() === city"
                  [attr.aria-pressed]="activeCity() === city"
                  (click)="toggleCity(city)">{{ city }}</button>
              }
            </div>
            <p class="stores__status" aria-live="polite">{{ status() }}</p>
          </div>

          <div class="stores__map">
            <app-stores-map-gate [stores]="filtered()" [compact]="true" />
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    :host { display: block; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
    .stores { padding: 2rem 0; background: var(--color-bg, #F4F1E9); }
    .stores__header { text-align: center; margin-bottom: 0.9rem; }
    .stores__title {
      font-family: 'Teko', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em;
      font-size: clamp(2rem, 4vw, 2.8rem); line-height: 1.1; color: var(--color-brand, #7B1716); margin: 0 0 0.4rem;
    }
    .stores__sub { font-family: 'Lora', serif; font-style: italic; font-size: 1rem; color: var(--color-text-light, #5A4F3E); margin: 0; }

    .stores__filters { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
    // Mismo aspecto que .pdv-tag de /puntos-de-venta, con zona táctil de 44 px
    .stores__tag {
      display: inline-flex; align-items: center; min-height: 44px; padding: 0 1rem;
      border-radius: 50px; background: #fff; border: 1.5px solid var(--color-border, #D9D3C5);
      font-family: 'Poppins', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--color-text-light, #5A4F3E);
      cursor: pointer; touch-action: manipulation; transition: background 150ms, border-color 150ms, color 150ms;

      @media (hover: hover) and (pointer: fine) {
        &:hover:not(.stores__tag--active) { border-color: var(--color-brand, #7B1716); color: var(--color-brand, #7B1716); }
      }
      &--active { background: var(--color-brand, #7B1716); border-color: var(--color-brand, #7B1716); color: #fff; }
    }
    .stores__status {
      margin: 0.5rem 0 0.75rem; text-align: center;
      font-family: 'Poppins', sans-serif; font-size: 0.78rem; color: var(--color-text-light, #5A4F3E);
    }
    .stores__map { border: 1px solid var(--color-border, #D9D3C5); border-radius: 12px; overflow: hidden; }

    // Escritorio: texto y filtros a la izquierda, mapa a la derecha
    @media (min-width: 900px) {
      .stores { padding: 2.25rem 0; }
      .stores__layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 2.5rem; align-items: center; }
      .stores__header { text-align: left; }
      .stores__filters { justify-content: flex-start; }
      .stores__status { text-align: left; margin-bottom: 0; }
    }
    @media (max-width: 480px) {
      .stores { padding: 1.5rem 0; }
      .container { padding: 0 1rem; }
      .stores__title { font-size: 1.45rem; margin-bottom: 0.25rem; }
      .stores__sub { font-size: 0.92rem; }
    }
  `],
})
export class StoresBlockComponent implements OnInit {
  private readonly pointOfSaleService = inject(PointOfSaleService);

  readonly stores = signal<PointOfSale[]>([]);
  readonly activeCity = signal<string | null>(null);
  readonly cities = computed(() => Array.from(new Set(this.stores().map(s => s.city))));
  readonly filtered = computed(() => {
    const city = this.activeCity();
    return city ? this.stores().filter(s => s.city === city) : this.stores();
  });
  readonly status = computed(() => {
    const n = this.filtered().length;
    const city = this.activeCity();
    const pdv = `${n} punto${n !== 1 ? 's' : ''} de venta`;
    if (city) return `${pdv} en ${city}`;
    const c = this.cities().length;
    return `${pdv} en ${c} ciudad${c !== 1 ? 'es' : ''}`;
  });

  ngOnInit(): void {
    this.pointOfSaleService.getAll().subscribe({
      next: stores => this.stores.set(stores),
      error: () => this.stores.set([]),
    });
  }

  toggleCity(city: string): void {
    this.activeCity.set(this.activeCity() === city ? null : city);
  }
}
