import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminShipment } from '../shared/admin.models';
import { SHIPMENT_STATUS, statusInfo } from '../shared/admin-labels';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';

@Component({
  selector: 'app-admin-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Envíos</h1>
          <p>Envíos prerregistrados en Correos y su seguimiento</p>
        </div>
        <div class="adm-page-actions">
          <a class="adm-btn adm-btn--ghost" routerLink="/admin/orders" [queryParams]="{ status: 'paid,processing' }">Pedidos por preparar →</a>
        </div>
      </header>

      <div class="adm-filters">
        <label class="adm-field adm-field--search">
          <span>Buscar</span>
          <input type="search" [(ngModel)]="f.search" (input)="state.typed()" placeholder="Nº pedido o localizador">
        </label>
        <label class="adm-field">
          <span>Estado</span>
          <select [(ngModel)]="f.status" (change)="state.apply()">
            <option value="">Todos</option>
            <option value="created">Prerregistrados</option>
            <option value="in_transit">En tránsito</option>
            <option value="delivered">Entregados</option>
            <option value="returned">Devueltos</option>
            <option value="cancelled">Anulados</option>
            <option value="error">Con error</option>
          </select>
        </label>
        <label class="adm-check">
          <input type="checkbox" [checked]="f.only_errors === 'true'"
                 (change)="f.only_errors = $any($event.target).checked ? 'true' : ''; state.apply()">
          Solo con error
        </label>
      </div>

      @if (loading()) {
        <div class="adm-loading">Cargando envíos…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          <table class="adm-table is-responsive">
            <thead><tr><th>Pedido</th><th>Localizador</th><th>Estado</th><th>Último evento</th><th>Creado</th><th class="actions"></th></tr></thead>
            <tbody>
              @for (s of shipments(); track s.id) {
                <tr>
                  <td class="is-primary" data-label="Pedido">
                    <div>
                      <a class="adm-link mono" routerLink="/admin/orders" [queryParams]="{ search: s.order_number }">{{ s.order_number }}</a>
                      <span class="sub">{{ s.email }}</span>
                    </div>
                  </td>
                  <td data-label="Localizador" class="mono">{{ s.localizador || '—' }}</td>
                  <td data-label="Estado">
                    <adm-badge [tone]="ship(s.status).tone">{{ ship(s.status).label }}</adm-badge>
                    @if (s.error) { <span class="sub err">{{ s.error }}</span> }
                  </td>
                  <td data-label="Último evento">
                    @if (s.last_event) { {{ s.last_event.description }} <span class="sub">{{ s.last_event.occurred_at | date:'dd/MM HH:mm' }}</span> }
                    @else { <span class="adm-muted">—</span> }
                  </td>
                  <td data-label="Creado">{{ s.created_at | date:'dd/MM/yy' }}</td>
                  <td class="actions" data-label="">
                    @if (s.localizador) {
                      <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="sync(s)" [disabled]="syncing() === s.id">
                        {{ syncing() === s.id ? '…' : 'Actualizar' }}
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="adm-empty">No hay envíos registrados (con CORREOS_ENABLED=False el tracking se mete a mano en el pedido)</td></tr>
              }
            </tbody>
          </table>
        </div>
        <adm-pagination [page]="state.page()" [pageSize]="state.pageSize()" [total]="state.total()"
                        [totalPages]="state.totalPages()" (pageChange)="state.goTo($event)"
                        (pageSizeChange)="state.setPageSize($event)" />
      }
    </div>
  `,
  styles: [`.err { color: var(--adm-danger); max-width: 280px; overflow-wrap: anywhere; }`],
})
export class AdminShipmentsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  state = adminListState({ search: '', status: '', only_errors: '' }, () => this.load());
  f = this.state.filters;

  shipments = signal<AdminShipment[]>([]);
  loading = signal(true);
  syncing = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  ship(s: string) { return statusInfo(SHIPMENT_STATUS, s); }

  load(): void {
    this.loading.set(true);
    this.api.shipments(this.state.query()).subscribe({
      next: res => {
        this.shipments.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar los envíos');
      },
    });
  }

  sync(s: AdminShipment): void {
    this.syncing.set(s.id);
    this.api.syncOrderTracking(s.order_id).subscribe({
      next: () => {
        this.syncing.set(null);
        this.toast.success('Tracking actualizado');
        this.load();
      },
      error: err => {
        this.syncing.set(null);
        this.toast.error(err.message || 'No se pudo consultar Correos');
      },
    });
  }
}
