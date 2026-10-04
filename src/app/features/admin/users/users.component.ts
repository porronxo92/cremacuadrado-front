import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminUserRow } from '../shared/admin.models';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Clientes</h1>
          <p>{{ state.total() }} cuentas · pulsa en un cliente para ver su ficha completa</p>
        </div>
      </header>

      <div class="adm-filters">
        <label class="adm-field adm-field--search">
          <span>Buscar</span>
          <input type="search" [(ngModel)]="f.search" (input)="state.typed()" placeholder="Email, nombre o teléfono…">
        </label>
        <label class="adm-field">
          <span>Rol</span>
          <select [(ngModel)]="f.role" (change)="state.apply()">
            <option value="">Todos</option>
            <option value="customer">Clientes</option>
            <option value="admin">Administradores</option>
          </select>
        </label>
        <label class="adm-field">
          <span>Estado</span>
          <select [(ngModel)]="f.is_active" (change)="state.apply()">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Desactivados</option>
          </select>
        </label>
        <label class="adm-field">
          <span>Compras</span>
          <select [(ngModel)]="f.has_orders" (change)="state.apply()">
            <option value="">Todos</option>
            <option value="true">Con pedidos</option>
            <option value="false">Sin pedidos</option>
          </select>
        </label>
        @if (hasFilters()) {
          <button type="button" class="adm-btn adm-btn--ghost" (click)="state.reset()">Limpiar</button>
        }
      </div>

      @if (loading()) {
        <div class="adm-loading">Cargando clientes…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          <table class="adm-table is-responsive">
            <thead>
              <tr>
                <th class="is-sortable" (click)="state.sortBy('email')">Cliente{{ state.sortIcon('email') }}</th>
                <th>Rol</th>
                <th class="num is-sortable" (click)="state.sortBy('total_orders')">Pedidos{{ state.sortIcon('total_orders') }}</th>
                <th class="num is-sortable" (click)="state.sortBy('total_spent')">Gastado{{ state.sortIcon('total_spent') }}</th>
                <th class="is-sortable" (click)="state.sortBy('last_login_at')">Último acceso{{ state.sortIcon('last_login_at') }}</th>
                <th class="is-sortable" (click)="state.sortBy('created_at')">Alta{{ state.sortIcon('created_at') }}</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr class="is-clickable" (click)="open(u)" (keydown.enter)="open(u)" tabindex="0">
                  <td class="is-primary" data-label="Cliente">
                    <div>
                      <a class="adm-link" [routerLink]="['/admin/clientes', u.id]" (click)="$event.stopPropagation()">
                        {{ (u.first_name + ' ' + u.last_name).trim() || u.email }}
                      </a>
                      <span class="sub">{{ u.email }}@if (u.phone) { · {{ u.phone }} }</span>
                    </div>
                  </td>
                  <td data-label="Rol">
                    <adm-badge [tone]="u.role === 'admin' ? 'brand' : 'neutral'">{{ u.role === 'admin' ? 'Admin' : 'Cliente' }}</adm-badge>
                  </td>
                  <td class="num" data-label="Pedidos">{{ u.total_orders }}</td>
                  <td class="num" data-label="Gastado">{{ u.total_spent | currency:'EUR' }}</td>
                  <td data-label="Último acceso">
                    @if (u.last_login_at) { {{ u.last_login_at | date:'dd/MM/yy HH:mm' }} <span class="sub">{{ u.login_count }} accesos</span> }
                    @else { <span class="adm-muted">—</span> }
                  </td>
                  <td data-label="Alta">{{ u.created_at | date:'dd/MM/yy' }}</td>
                  <td data-label="Estado">
                    <adm-badge [tone]="u.is_active ? 'success' : 'danger'">{{ u.is_active ? 'Activo' : 'Desactivado' }}</adm-badge>
                    @if (!u.email_verified) { <adm-badge tone="warning">Email sin verificar</adm-badge> }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="adm-empty">No hay clientes que coincidan con los filtros</td></tr>
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
  styles: [`td adm-badge + adm-badge { margin-left: 0.25rem; }`],
})
export class AdminUsersComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  state = adminListState(
    { search: '', role: '', is_active: '', has_orders: '' },
    () => this.load(),
    { sort: 'created_at' },
  );
  f = this.state.filters;

  users = signal<AdminUserRow[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  hasFilters(): boolean {
    return Object.values(this.f).some(v => !!v);
  }

  load(): void {
    this.loading.set(true);
    this.api.users(this.state.query()).subscribe({
      next: res => {
        this.users.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar los clientes');
      },
    });
  }

  open(u: AdminUserRow): void {
    this.router.navigate(['/admin/clientes', u.id]);
  }
}
