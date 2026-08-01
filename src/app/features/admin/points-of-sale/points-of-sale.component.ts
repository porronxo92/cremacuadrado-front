import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

interface PointOfSale {
  id: number;
  name: string;
  city: string;
  instagram_url: string;
  maps_url: string;
  is_active: boolean;
  sort_order: number;
}

@Component({
  selector: 'app-admin-points-of-sale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-pos">
      <div class="page-header">
        <h1>Puntos de venta</h1>
      </div>

      <div class="content-grid">
        <div class="list-panel">
          @if (loading()) {
            <div class="loading">Cargando…</div>
          } @else {
            <table class="pos-table">
              <thead><tr><th>Nombre</th><th>Ciudad</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                @for (store of stores(); track store.id) {
                  <tr>
                    <td>{{ store.name }}</td>
                    <td>{{ store.city }}</td>
                    <td>
                      <span class="status-badge" [class.active]="store.is_active">
                        {{ store.is_active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="actions">
                      <button class="btn btn--icon" (click)="edit(store)">✏️</button>
                      <button class="btn btn--icon btn--danger" (click)="remove(store)">🗑</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <div class="form-panel">
          <h3>{{ editing() ? 'Editar punto de venta' : 'Nuevo punto de venta' }}</h3>
          <label>Nombre <input type="text" [(ngModel)]="formName"></label>
          <label>Ciudad <input type="text" [(ngModel)]="formCity"></label>
          <label>Instagram (URL) <input type="text" [(ngModel)]="formInstagram" placeholder="https://instagram.com/..."></label>
          <label>Google Maps (URL) <input type="text" [(ngModel)]="formMaps" placeholder="https://maps.google.com/..."></label>
          <label>Orden <input type="number" [(ngModel)]="formSortOrder"></label>
          <label class="checkbox-row"><input type="checkbox" [(ngModel)]="formIsActive"> Activo (visible en la web)</label>

          @if (formError()) {
            <p class="error">{{ formError() }}</p>
          }

          <div class="form-actions">
            <button class="btn btn--primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Guardando…' : 'Guardar' }}
            </button>
            @if (editing()) {
              <button class="btn btn--ghost" (click)="resetForm()">Cancelar</button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-pos { padding: 2rem; font-family: 'Poppins', sans-serif; }
    .page-header h1 { font-family: 'Teko', sans-serif; font-size: 2rem; color: #7B1716; text-transform: uppercase; margin-bottom: 1.5rem; }
    .content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
    .list-panel, .form-panel { background: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 1.25rem; }
    .pos-table { width: 100%; border-collapse: collapse; }
    .pos-table th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #8C7F6A; padding: 0.5rem; }
    .pos-table td { padding: 0.5rem; border-bottom: 1px solid #f2f2f2; }
    .form-panel h3 { font-family: 'Teko', sans-serif; font-size: 1.3rem; color: #7B1716; margin-bottom: 0.75rem; text-transform: uppercase; }
    .form-panel label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; margin-bottom: 0.75rem; color: #5A4F3E; }
    .form-panel input { border: 1px solid #d8d0bd; border-radius: 3px; padding: 0.45rem 0.6rem; font-family: inherit; }
    .checkbox-row { flex-direction: row !important; align-items: center; gap: 0.5rem !important; }
    .form-actions { display: flex; gap: 0.5rem; }
    .btn { border: none; border-radius: 3px; padding: 0.5rem 1rem; font-size: 0.85rem; cursor: pointer; }
    .btn--primary { background: #7B1716; color: #E6C15A; font-weight: 600; }
    .btn--ghost { background: transparent; color: #5A4F3E; }
    .btn--icon { background: transparent; font-size: 1rem; }
    .btn--danger:hover { color: #b00020; }
    .status-badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 12px; background: #eee; color: #666; }
    .status-badge.active { background: #E9F3DC; color: #4a7c2c; }
    .error { color: #b00020; font-size: 0.8rem; }
    .loading { color: #8C7F6A; padding: 2rem; text-align: center; }
  `],
})
export class AdminPointsOfSaleComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  stores = signal<PointOfSale[]>([]);
  loading = signal(true);
  saving = signal(false);
  formError = signal<string | null>(null);
  editing = signal<PointOfSale | null>(null);

  formName = '';
  formCity = '';
  formInstagram = '';
  formMaps = '';
  formSortOrder = 0;
  formIsActive = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<PointOfSale[]>(`${environment.apiUrl}/admin/points-of-sale`).subscribe({
      next: (stores) => { this.stores.set(stores); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  edit(store: PointOfSale): void {
    this.editing.set(store);
    this.formName = store.name;
    this.formCity = store.city;
    this.formInstagram = store.instagram_url;
    this.formMaps = store.maps_url;
    this.formSortOrder = store.sort_order;
    this.formIsActive = store.is_active;
  }

  resetForm(): void {
    this.editing.set(null);
    this.formName = '';
    this.formCity = '';
    this.formInstagram = '';
    this.formMaps = '';
    this.formSortOrder = 0;
    this.formIsActive = true;
    this.formError.set(null);
  }

  save(): void {
    if (!this.formName.trim() || !this.formCity.trim()) {
      this.formError.set('Nombre y ciudad son obligatorios');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    const payload = {
      name: this.formName,
      city: this.formCity,
      instagram_url: this.formInstagram,
      maps_url: this.formMaps,
      sort_order: this.formSortOrder,
      is_active: this.formIsActive,
    };

    const existing = this.editing();
    const request = existing
      ? this.http.put(`${environment.apiUrl}/admin/points-of-sale/${existing.id}`, payload)
      : this.http.post(`${environment.apiUrl}/admin/points-of-sale`, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Punto de venta guardado');
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail || 'Error al guardar');
      },
    });
  }

  remove(store: PointOfSale): void {
    if (!confirm(`¿Eliminar "${store.name}" (${store.city})?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/points-of-sale/${store.id}`).subscribe({
      next: () => { this.toast.success('Eliminado'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al eliminar'),
    });
  }
}
