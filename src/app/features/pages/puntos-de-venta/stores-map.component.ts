import {
  Component, ElementRef, Input, OnChanges, OnDestroy, PLATFORM_ID, ViewChild, ViewEncapsulation, afterNextRender, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Leaflet from 'leaflet';
import { PointOfSale } from '../../../core/models';

const BRAND = '#7B1716';
const SPAIN_CENTER: [number, number] = [40.2, -3.7];

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
  private markers = new Map<number, Leaflet.CircleMarker>();

  constructor() {
    afterNextRender(async () => {
      if (!this.isBrowser) return;
      this.L = await import('leaflet');
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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    }).addTo(this.map);
    this.layer = L.layerGroup().addTo(this.map);
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
      const marker = L.circleMarker([lat, lng], {
        radius: 9, color: '#fff', weight: 2, fillColor: BRAND, fillOpacity: 0.95,
      }).bindPopup(this.popup(store));
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
