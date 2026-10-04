import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminCart } from '../shared/admin.models';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';

@Component({
  selector: 'app-admin-carts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Carritos abandonados</h1>
          <p>Clientes que añadieron productos y no terminaron la compra</p>
        </div>
      </header>

      <div class="adm-grid--stats">
        <adm-stat label="Carritos" [value]="state.total()" [highlight]="true" />
        <adm-stat label="Valor en esta página" [value]="(pageValue() | currency:'EUR') ?? ''" />
        <adm-stat label="De clientes registrados" [value]="registered()" hint="Puedes contactarles por email" />
      </div>

      <div class="adm-filters">
        <label class="adm-field adm-field--search">
          <span>Buscar cliente</span>
          <input type="search" [(ngModel)]="f.search" (input)="state.typed()" placeholder="Email o nombre">
        </label>
        <label class="adm-field">
          <span>Sin tocar desde hace</span>
          <select [(ngModel)]="f.min_age_hours" (change)="state.apply()">
            <option value="0">Cualquier momento (activos)</option>
            <option value="1">1 hora</option>
            <option value="24">24 horas</option>
            <option value="72">3 días</option>
            <option value="168">7 días</option>
          </select>
        </label>
        <label class="adm-field">
          <span>Antigüedad máxima</span>
          <select [(ngModel)]="f.max_age_days" (change)="state.apply()">
            <option value="">Sin límite</option>
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="90">90 días</option>
          </select>
        </label>
        <label class="adm-check">
          <input type="checkbox" [checked]="f.only_registered === 'true'"
                 (change)="f.only_registered = $any($event.target).checked ? 'true' : ''; state.apply()">
          Solo registrados
        </label>
      </div>

      <p class="adm-callout adm-callout--info">
        Los carritos de invitados no tienen email asociado. Aún no hay emails automáticos de recuperación (requiere un cron).
      </p>

      @if (loading()) {
        <div class="adm-loading">Cargando carritos…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          <table class="adm-table is-responsive">
            <thead>
              <tr><th>Cliente</th><th>Productos</th><th class="num">Importe</th><th>Cupón</th><th>Última actividad</th><th>Creado</th></tr>
            </thead>
            <tbody>
              @for (c of carts(); track c.id) {
                <tr>
                  <td class="is-primary" data-label="Cliente">
                    <div>
                      @if (c.user_id) {
                        <a class="adm-link" [routerLink]="['/admin/clientes', c.user_id]">{{ c.customer_name || c.email }}</a>
                        <span class="sub">{{ c.email }}</span>
                      } @else {
                        <span class="adm-muted">Invitado (sin email)</span>
                      }
                    </div>
                  </td>
                  <td data-label="Productos">
                    <ul class="items">
                      @for (it of c.items; track $index) {
                        <li>{{ it.quantity }}× {{ it.product_name }}@if (it.format) { <span class="adm-muted"> {{ it.format }}</span> }</li>
                      }
                    </ul>
                  </td>
                  <td class="num" data-label="Importe"><strong>{{ c.subtotal | currency:'EUR' }}</strong></td>
                  <td data-label="Cupón">{{ c.coupon_code || '—' }}</td>
                  <td data-label="Última actividad">{{ c.updated_at | date:'dd/MM/yy HH:mm' }}</td>
                  <td data-label="Creado">{{ c.created_at | date:'dd/MM/yy' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="adm-empty">No hay carritos con estos filtros 🎉</td></tr>
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
  styles: [`
    .items { margin: 0; padding: 0; list-style: none; font-size: 0.82rem; }
    @media (max-width: 768px) { .items { text-align: right; } }
  `],
})
export class AdminCartsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  state = adminListState(
    { search: '', min_age_hours: '24', max_age_days: '', only_registered: '' },
    () => this.load(),
  );
  f = this.state.filters;

  carts = signal<AdminCart[]>([]);
  loading = signal(true);
  pageValue = computed(() => this.carts().reduce((sum, c) => sum + c.subtotal, 0));
  registered = computed(() => this.carts().filter(c => !c.is_guest).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.carts(this.state.query()).subscribe({
      next: res => {
        this.carts.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar los carritos');
      },
    });
  }
}
