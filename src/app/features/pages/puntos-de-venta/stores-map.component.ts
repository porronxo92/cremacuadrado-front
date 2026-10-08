import {
  Component, ElementRef, Input, OnChanges, OnDestroy, PLATFORM_ID, ViewChild, ViewEncapsulation, afterNextRender, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Leaflet from 'leaflet';
import { PointOfSale } from '../../../core/models';
import { environment } from '../../../../environments/environment';

const BRAND = '#7B1716';
const SPAIN_CENTER: [number, number] = [40.2, -3.7];

// Clave pública de CARTO Basemaps (environment.cartoApiKey): sin ella las
// teselas raster salen con la marca de agua «API key required».
const CARTO_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  + (environment.cartoApiKey ? `?key=${encodeURIComponent(environment.cartoApiKey)}` : '');

/**
 * Mapa de puntos de venta con Leaflet + teselas de CARTO (datos de OpenStreetMap).
 * No instala cookies; aun así se carga solo con consentimiento o clic, porque las
 * teselas se piden a un servidor externo (CARTO). Leaflet se importa de forma
 * dinámica solo en el navegador (no existe en SSR).
 */
@Component({
  selector: 'app-stores-map',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `<div #map class="stores-map" role="region" aria-label="Mapa de puntos de venta"></div>`,
  styles: [`
    .stores-map { width: 100%; height: 100%; min-height: 380px; z-index: 0; }
    .stores-map .leaflet-popup-content { font-family: 'Poppins', sans-serif; font-size: 0.85rem; line-height: 1.5; }
    .stores-map .leaflet-popup-content strong { display: block; color: ${BRAND}; font-size: 0.95rem; }
    .stores-map .leaflet-popup-content a { color: ${BRAND}; }
    .stores-map .store-approx { display: block; color: #6B6456; font-size: 0.72rem; }
    .stores-map .store-pin { filter: drop-shadow(0 2px 3px rgba(28, 26, 20, 0.35)); }
    .stores-map .store-pin svg { display: block; transform-origin: 50% 100%; transition: transform 0.15s ease; }
    .stores-map .store-pin:hover svg, .stores-map .store-pin:focus-visible svg { transform: scale(1.12); }
  `],
})
export class StoresMapComponent implements OnChanges, OnDestroy {
  @Input() stores: PointOfSale[] = [];
  /** Tienda a enfocar (al pulsar en la lista). */
  @Input() focusId: number | null = null;
  @ViewChild('map', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private L?: typeof Leaflet;
  private map?: Leaflet.Map;
  private layer?: Leaflet.LayerGroup;
  private markers = new Map<number, Leaflet.Marker>();
  private icon?: Leaflet.DivIcon;

  constructor() {
    afterNextRender(async () => {
      if (!this.isBrowser) return;
      // Leaflet 1.x es CommonJS: en el bundle de producción la API llega en `default`.
      const mod = await import('leaflet');
      this.L = ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
      this.init();
    });
  }

  ngOnChanges(): void {
    if (this.map) this.render();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private init(): void {
    const L = this.L!;
    this.map = L.map(this.mapEl.nativeElement, { scrollWheelZoom: false }).setView(SPAIN_CENTER, 6);
    L.tileLayer(CARTO_TILES, {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    }).addTo(this.map);
    this.layer = L.layerGroup().addTo(this.map);
    // Chincheta crema con borde granate y el logo (assets/images/logo.svg) dentro;
    // la punta inferior marca la ubicación.
    this.icon = L.divIcon({
      className: 'store-pin',
      html: `<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true">`
        + `<path d="M18 1C8.6 1 1 8.6 1 18c0 12.4 17 27 17 27s17-14.6 17-27C35 8.6 27.4 1 18 1z" fill="#F4F1E9" stroke="${BRAND}" stroke-width="2"/>`
        + `<image href="/assets/images/logo.svg" x="8.5" y="7.9" width="19" height="20.3"/></svg>`,
      iconSize: [36, 46],
      iconAnchor: [18, 45],
      popupAnchor: [0, -40],
    });
    this.render();
  }

  private render(): void {
    const L = this.L!;
    this.layer!.clearLayers();
    this.markers.clear();

    const located = this.stores.filter(s => s.latitude != null && s.longitude != null);
    // Tiendas sin dirección comparten el centro de su ciudad: se reparten en un
    // pequeño círculo para que no queden unas encima de otras.
    const seen = new Map<string, number>();
    const points: Leaflet.LatLngExpression[] = [];

    for (const store of located) {
      let lat = Number(store.latitude);
      let lng = Number(store.longitude);
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      if (n > 0) {
        const angle = n * 2.4;
        const radius = 0.0025 * Math.sqrt(n);
        lat += radius * Math.cos(angle);
        lng += radius * Math.sin(angle) * 1.3;
      }
      const marker = L.marker([lat, lng], { icon: this.icon, title: store.name, riseOnHover: true })
        .bindPopup(this.popup(store));
      marker.addTo(this.layer!);
      this.markers.set(store.id, marker);
      points.push([lat, lng]);
    }

    if (points.length === 1) this.map!.setView(points[0], 14);
    else if (points.length > 1) this.map!.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });

    if (this.focusId != null) {
      const marker = this.markers.get(this.focusId);
      if (marker) {
        this.map!.setView(marker.getLatLng(), 15);
        marker.openPopup();
      }
    }
  }

  private popup(store: PointOfSale): string {
    const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const address = store.address ? `${esc(store.address)}, ` : '';
    return `<strong>${esc(store.name)}</strong>${address}${esc(store.city)}`
      + (store.address ? '' : '<span class="store-approx">Ubicación aproximada</span>')
      + `<br><a href="${encodeURI(store.maps_url)}" target="_blank" rel="noopener">Cómo llegar</a>`
      + ` · <a href="${encodeURI(store.instagram_url)}" target="_blank" rel="noopener">Instagram</a>`;
  }
}
