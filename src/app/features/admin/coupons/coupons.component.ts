import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  is_valid: boolean;
}

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-coupons">
      <div class="page-header">
        <h1>Cupones de descuento</h1>
      </div>

      <div class="content-grid">
        <div class="list-panel">
          @if (loading()) {
            <div class="loading">Cargando…</div>
          } @else {
            <table class="coupon-table">
              <thead><tr><th>Código</th><th>Descuento</th><th>Uso</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                @for (coupon of coupons(); track coupon.id) {
                  <tr>
                    <td><code>{{ coupon.code }}</code><br><small>{{ coupon.description }}</small></td>
                    <td>{{ coupon.discount_type === 'percent' ? coupon.discount_value + '%' : (coupon.discount_value | currency:'EUR') }}</td>
                    <td>{{ coupon.used_count }}{{ coupon.usage_limit ? ' / ' + coupon.usage_limit : '' }}</td>
                    <td>
                      <span class="status-badge" [class.active]="coupon.is_valid">
                        {{ coupon.is_valid ? 'Vigente' : 'Inactivo/expirado' }}
                      </span>
                    </td>
                    <td class="actions">
                      <button class="btn btn--icon" (click)="edit(coupon)">✏️</button>
                      <button class="btn btn--icon btn--danger" (click)="remove(coupon)">🗑</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <div class="form-panel">
          <h3>{{ editing() ? 'Editar cupón' : 'Nuevo cupón' }}</h3>
          <label>Código <input type="text" [(ngModel)]="formCode" [disabled]="!!editing()" placeholder="BIENVENIDO10"></label>
          <label>Descripción <input type="text" [(ngModel)]="formDescription"></label>
          <label>Tipo
            <select [(ngModel)]="formType">
              <option value="percent">Porcentaje (%)</option>
              <option value="fixed">Importe fijo (€)</option>
            </select>
          </label>
          <label>Valor <input type="number" [(ngModel)]="formValue" min="0"></label>
          <label>Pedido mínimo (€) <input type="number" [(ngModel)]="formMinOrder" min="0"></label>
          <label>Límite de usos (vacío = ilimitado) <input type="number" [(ngModel)]="formUsageLimit" min="1"></label>
          <label>Válido desde <input type="date" [(ngModel)]="formValidFrom"></label>
          <label>Válido hasta <input type="date" [(ngModel)]="formValidUntil"></label>
          <label class="checkbox-row"><input type="checkbox" [(ngModel)]="formIsActive"> Activo</label>

          @if (formError()) { <p class="error">{{ formError() }}</p> }

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
    .admin-coupons { padding: 2rem; font-family: 'Poppins', sans-serif; }
    .page-header h1 { font-family: 'Teko', sans-serif; font-size: 2rem; color: #7B1716; text-transform: uppercase; margin-bottom: 1.5rem; }
    .content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
    .list-panel, .form-panel { background: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 1.25rem; }
    .coupon-table { width: 100%; border-collapse: collapse; }
    .coupon-table th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #8C7F6A; padding: 0.5rem; }
    .coupon-table td { padding: 0.5rem; border-bottom: 1px solid #f2f2f2; vertical-align: top; }
    .form-panel h3 { font-family: 'Teko', sans-serif; font-size: 1.3rem; color: #7B1716; margin-bottom: 0.75rem; text-transform: uppercase; }
    .form-panel label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; margin-bottom: 0.65rem; color: #5A4F3E; }
    .form-panel input, .form-panel select { border: 1px solid #d8d0bd; border-radius: 3px; padding: 0.45rem 0.6rem; font-family: inherit; }
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
    code { background: #F4F1E9; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.8rem; }
  `],
})
export class AdminCouponsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  saving = signal(false);
  formError = signal<string | null>(null);
  editing = signal<Coupon | null>(null);

  formCode = '';
  formDescription = '';
  formType: 'percent' | 'fixed' = 'percent';
  formValue = 10;
  formMinOrder = 0;
  formUsageLimit: number | null = null;
  formValidFrom = '';
  formValidUntil = '';
  formIsActive = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<Coupon[]>(`${environment.apiUrl}/admin/coupons`).subscribe({
      next: (coupons) => { this.coupons.set(coupons); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  edit(coupon: Coupon): void {
    this.editing.set(coupon);
    this.formCode = coupon.code;
    this.formDescription = coupon.description || '';
    this.formType = coupon.discount_type;
    this.formValue = coupon.discount_value;
    this.formMinOrder = coupon.min_order_amount;
    this.formUsageLimit = coupon.usage_limit;
    this.formValidFrom = coupon.valid_from ? coupon.valid_from.substring(0, 10) : '';
    this.formValidUntil = coupon.valid_until ? coupon.valid_until.substring(0, 10) : '';
    this.formIsActive = coupon.is_active;
  }

  resetForm(): void {
    this.editing.set(null);
    this.formCode = '';
    this.formDescription = '';
    this.formType = 'percent';
    this.formValue = 10;
    this.formMinOrder = 0;
    this.formUsageLimit = null;
    this.formValidFrom = '';
    this.formValidUntil = '';
    this.formIsActive = true;
    this.formError.set(null);
  }

  save(): void {
    if (!this.formCode.trim() || this.formValue <= 0) {
      this.formError.set('Código y valor de descuento son obligatorios');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    const basePayload: Record<string, unknown> = {
      description: this.formDescription || null,
      discount_type: this.formType,
      discount_value: this.formValue,
      min_order_amount: this.formMinOrder,
      usage_limit: this.formUsageLimit || null,
      valid_from: this.formValidFrom ? new Date(this.formValidFrom).toISOString() : null,
      valid_until: this.formValidUntil ? new Date(this.formValidUntil).toISOString() : null,
      is_active: this.formIsActive,
    };

    const existing = this.editing();
    const request = existing
      ? this.http.put(`${environment.apiUrl}/admin/coupons/${existing.id}`, basePayload)
      : this.http.post(`${environment.apiUrl}/admin/coupons`, { ...basePayload, code: this.formCode });

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cupón guardado');
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail || 'Error al guardar el cupón');
      },
    });
  }

  remove(coupon: Coupon): void {
    if (!confirm(`¿Eliminar el cupón "${coupon.code}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/coupons/${coupon.id}`).subscribe({
      next: () => { this.toast.success('Cupón eliminado'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al eliminar'),
    });
  }
}
