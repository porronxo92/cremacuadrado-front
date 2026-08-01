import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

type LeadTab = 'newsletter' | 'pos' | 'contact';

const POS_STATUSES = ['new', 'contacted', 'sample_sent', 'closed_won', 'closed_lost'] as const;

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-leads">
      <div class="page-header">
        <h1>Leads</h1>
        <button class="btn btn--secondary" (click)="exportCsv()">⬇ Exportar CSV</button>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'newsletter'" (click)="switchTab('newsletter')">Newsletter</button>
        <button class="tab" [class.active]="tab() === 'pos'" (click)="switchTab('pos')">Para tiendas (B2B)</button>
        <button class="tab" [class.active]="tab() === 'contact'" (click)="switchTab('contact')">Contacto</button>
      </div>

      @if (loading()) {
        <div class="loading">Cargando…</div>
      } @else if (items().length === 0) {
        <div class="empty">No hay leads todavía.</div>
      } @else {
        <div class="leads-table-container">
          @if (tab() === 'newsletter') {
            <table class="leads-table">
              <thead><tr><th>Email</th><th>Origen</th><th>Cupón</th><th>Registrado</th><th>Fecha</th></tr></thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr>
                    <td>{{ item.email }}</td>
                    <td>{{ item.source }}</td>
                    <td>{{ item.coupon_code || '—' }}</td>
                    <td>{{ item.converted_at ? 'Sí' : 'No' }}</td>
                    <td>{{ item.created_at | date:'dd/MM/yyyy' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (tab() === 'pos') {
            <table class="leads-table">
              <thead><tr><th>Nombre</th><th>Establecimiento</th><th>Ciudad</th><th>Contacto</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr>
                    <td>{{ item.name }}</td>
                    <td>{{ item.establishment_name }} <small>({{ item.establishment_type }})</small></td>
                    <td>{{ item.city }}</td>
                    <td>{{ item.email }}<br><small>{{ item.phone }}</small></td>
                    <td>
                      <select [ngModel]="item.status" (ngModelChange)="updatePosStatus(item, $event)">
                        @for (s of posStatuses; track s) {
                          <option [value]="s">{{ s }}</option>
                        }
                      </select>
                    </td>
                    <td>{{ item.created_at | date:'dd/MM/yyyy' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (tab() === 'contact') {
            <table class="leads-table">
              <thead><tr><th>Nombre</th><th>Email</th><th>Mensaje</th><th>Marketing</th><th>Fecha</th></tr></thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr>
                    <td>{{ item.name }}</td>
                    <td>{{ item.email }}</td>
                    <td class="message-cell">{{ item.message }}</td>
                    <td>{{ item.accepts_marketing ? 'Sí' : 'No' }}</td>
                    <td>{{ item.created_at | date:'dd/MM/yyyy' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-leads { padding: 2rem; font-family: 'Poppins', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .page-header h1 { font-family: 'Teko', sans-serif; font-size: 2rem; color: #7B1716; text-transform: uppercase; }
    .btn { border: none; border-radius: 3px; padding: 0.5rem 1rem; font-size: 0.85rem; cursor: pointer; }
    .btn--secondary { background: #F4F1E9; color: #1A1208; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
    .tab { border: 1px solid #d8d0bd; background: #fff; padding: 0.5rem 1.1rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; }
    .tab.active { background: #7B1716; color: #E6C15A; border-color: #7B1716; }
    .loading, .empty { padding: 3rem; text-align: center; color: #8C7F6A; }
    .leads-table-container { background: #fff; border-radius: 4px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .leads-table { width: 100%; border-collapse: collapse; }
    .leads-table th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #8C7F6A; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
    .leads-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f2f2f2; vertical-align: top; }
    .message-cell { max-width: 320px; white-space: pre-wrap; }
    select { border: 1px solid #d8d0bd; border-radius: 3px; padding: 0.3rem 0.5rem; }
  `],
})
export class AdminLeadsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  tab = signal<LeadTab>('newsletter');
  items = signal<any[]>([]);
  loading = signal(true);
  posStatuses = POS_STATUSES;

  ngOnInit(): void {
    this.load();
  }

  switchTab(tab: LeadTab): void {
    this.tab.set(tab);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<{ items: any[] }>(`${environment.apiUrl}/admin/leads/${this.tab()}?page_size=100`).subscribe({
      next: (res) => { this.items.set(res.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updatePosStatus(item: any, status: string): void {
    this.http.patch(`${environment.apiUrl}/admin/leads/pos/${item.id}/status?status=${status}`, {}).subscribe({
      next: () => this.toast.success('Estado actualizado'),
      error: (err) => this.toast.error(err.error?.detail || 'Error al actualizar'),
    });
  }

  exportCsv(): void {
    const url = `${environment.apiUrl}/admin/leads/export/csv?type=${this.tab()}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `leads_${this.tab()}.csv`;
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: () => this.toast.error('Error al exportar el CSV'),
    });
  }
}
