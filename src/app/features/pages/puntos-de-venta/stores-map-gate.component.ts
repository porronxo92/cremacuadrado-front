import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';
import { PointOfSale } from '../../../core/models';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { StoresMapComponent } from './stores-map.component';

/**
 * Mapa de puntos de venta detrás de la puerta de consentimiento (RGPD/LSSI): las teselas
 * (CARTO / OpenStreetMap) y Leaflet solo se cargan si el usuario aceptó los servicios
 * externos o pulsa «Mostrar el mapa». Una vez permitido, se difiere hasta entrar en
 * pantalla (`@defer (on viewport)`). Lo usan /puntos-de-venta y la home.
 */
@Component({
  selector: 'app-stores-map-gate',
  standalone: true,
  imports: [StoresMapComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (!mapAllowed()) {
      <div class="gate gate--consent" [class.gate--compact]="compact">
        @if (compact) {
          <p>El mapa lo sirven CARTO / OpenStreetMap, que reciben tu IP.</p>
        } @else {
          <p>El mapa se carga desde los servidores de CARTO / OpenStreetMap (no instala cookies,
            pero recibe tu dirección IP). La lista de tiendas funciona sin él.</p>
        }
        <div class="gate__actions">
          <button type="button" class="gate__load" (click)="loadMap()">Ver mapa</button>
          <button type="button" class="gate__settings" (click)="cookieConsent.openSettings()">Configurar cookies</button>
        </div>
      </div>
    } @else {
      @defer (on viewport) {
        <app-stores-map class="gate gate--map" [class.gate--compact]="compact" [stores]="stores" [minHeight]="compact ? 0 : 380" />
      } @placeholder {
        <div class="gate gate--skeleton" [class.gate--compact]="compact"></div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .gate { display: block; width: 100%; height: 420px; }
    .gate--compact { height: 200px; }
    @media (max-width: 768px) { .gate { height: 280px; } .gate--compact { height: 200px; } }
    @media (min-width: 769px) { .gate--compact { height: 260px; } }
    .gate--consent.gate--compact { height: auto; min-height: 200px; padding: 0.75rem 1rem; gap: 0.5rem; }
    @media (min-width: 769px) { .gate--consent.gate--compact { min-height: 260px; } }
    .gate--skeleton { background: var(--color-card-bg, #EDE9DF); }
    .gate--consent {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;
      padding: 1rem 1.25rem; text-align: center; background: var(--color-card-bg, #EDE9DF); box-sizing: border-box;
      p { max-width: 420px; margin: 0; font-family: 'Lora', serif; font-size: 0.9rem; color: var(--color-ink, #1C1A14); }
    }
    .gate--compact .gate__load, .gate--compact .gate__settings { padding: 0 0.7rem; font-size: 0.8rem; }
    .gate--compact .gate__actions { flex-wrap: nowrap; gap: 0.4rem; }
    .gate--compact p { font-size: 0.85rem; }
    .gate__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .gate__load, .gate__settings {
      min-height: 48px; padding: 0 1.25rem; border-radius: 20px; cursor: pointer;
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 0.85rem;
    }
    .gate__load { background: var(--color-brand, #7B1716); color: var(--color-bg, #F4F1E9); border: 1.5px solid var(--color-brand, #7B1716); }
    .gate__settings { background: transparent; color: var(--color-brand, #7B1716); border: 1.5px solid var(--color-brand, #7B1716); }
  `],
})
export class StoresMapGateComponent {
  @Input() stores: PointOfSale[] = [];
  /** Altura contenida (home): 200 px en móvil, 260 px en escritorio. */
  @Input() compact = false;

  readonly cookieConsent = inject(CookieConsentService);
  /** El usuario pulsó «Ver mapa» (petición expresa) o aceptó los servicios externos. */
  private readonly mapRequested = signal(false);
  readonly mapAllowed = computed(() => this.mapRequested() || this.cookieConsent.external());

  loadMap(): void {
    this.mapRequested.set(true);
  }
}
