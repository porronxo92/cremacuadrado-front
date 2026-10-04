import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminCoupon, CouponRedemption } from '../shared/admin.models';
import { ORDER_STATUS, statusInfo } from '../shared/admin-labels';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI, AdminConfirmService } from '../shared/admin-ui.components';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Cupones</h1>
          <p>Descuentos, quién los usa y cuánto generan</p>
        </div>
        <div class="adm-page-actions">
          <button type="button" class="adm-btn adm-btn--primary" (click)="newCoupon()">+ Nuevo cupón</button>
        </div>
      </header>

      <div class="adm-split">
        <div class="adm-page">
          <div class="adm-filters">
            <label class="adm-field adm-field--search">
              <span>Buscar</span>
              <input type="search" [(ngModel)]="f.search" (input)="state.typed()" placeholder="Código o descripción">
            </label>
            <label class="adm-field">
              <span>Estado</span>
              <select [(ngModel)]="f.is_active" (change)="state.apply()">
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Desactivados</option>
              </select>
            </label>
          </div>

          @if (loading()) {
            <div class="adm-loading">Cargando cupones…</div>
          } @else {
            <div class="adm-table-wrap is-responsive">
              <table class="adm-table is-responsive">
                <thead>
                  <tr>
                    <th>Código</th><th>Descuento</th><th class="num">Usos</th><th class="num">Clientes</th>
                    <th class="num">Descontado</th><th class="num">Ventas</th><th>Estado</th><th class="actions"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of coupons(); track c.id) {
                    <tr [class.is-selected]="editingId() === c.id">
                      <td class="is-primary" data-label="Código">
                        <div><code class="code">{{ c.code }}</code>
                          @if (c.description) { <span class="sub">{{ c.description }}</span> }</div>
                      </td>
                      <td data-label="Descuento">
                        {{ c.discount_type === 'percent' ? c.discount_value + ' %' : (c.discount_value | currency:'EUR') }}
                        @if (c.min_order_amount > 0) { <span class="sub">mín. {{ c.min_order_amount | currency:'EUR' }}</span> }
                      </td>
                      <td class="num" data-label="Usos">
                        <button type="button" class="adm-link" (click)="openUsage(c)" [disabled]="!c.used_count && !c.redemptions">
                          {{ c.redemptions }}{{ c.usage_limit ? ' / ' + c.usage_limit : '' }}
                        </button>
                      </td>
                      <td class="num" data-label="Clientes">{{ c.unique_customers }}</td>
                      <td class="num" data-label="Descontado">{{ c.total_discount | currency:'EUR' }}</td>
                      <td class="num" data-label="Ventas">{{ c.revenue | currency:'EUR' }}</td>
                      <td data-label="Estado">
                        <adm-badge [tone]="c.is_valid ? 'success' : (c.is_active ? 'warning' : 'neutral')">{{ validity(c) }}</adm-badge>
                      </td>
                      <td class="actions" data-label="">
                        <button type="button" class="adm-btn adm-btn--sm" (click)="openUsage(c)">Quién lo usó</button>
                        <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="edit(c)">Editar</button>
                        <button type="button" class="adm-icon-btn" (click)="remove(c)" [attr.aria-label]="'Eliminar cupón ' + c.code">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="8" class="adm-empty">No hay cupones</td></tr>
                  }
                </tbody>
              </table>
            </div>
            <adm-pagination [page]="state.page()" [pageSize]="state.pageSize()" [total]="state.total()"
                            [totalPages]="state.totalPages()" (pageChange)="state.goTo($event)"
                            (pageSizeChange)="state.setPageSize($event)" />
          }
        </div>

        <!-- Form -->
        <aside class="adm-split__aside adm-card" #formCard>
          <h2>{{ editingId() ? 'Editar ' + form.code : 'Nuevo cupón' }}</h2>
          <div class="adm-form one-col">
            <label class="adm-field"><span>Código</span>
              <input type="text" [(ngModel)]="form.code" [disabled]="!!editingId()" placeholder="BIENVENIDO10" maxlength="50"></label>
            <label class="adm-field"><span>Descripción</span>
              <input type="text" [(ngModel)]="form.description" maxlength="255"></label>
            <div class="adm-grid--2">
              <label class="adm-field"><span>Tipo</span>
                <select [(ngModel)]="form.discount_type">
                  <option value="percent">Porcentaje</option>
                  <option value="fixed">Importe fijo</option>
                </select>
              </label>
              <label class="adm-field"><span>Valor {{ form.discount_type === 'percent' ? '(%)' : '(€)' }}</span>
                <input type="number" [(ngModel)]="form.discount_value" min="0" step="0.01"></label>
            </div>
            <div class="adm-grid--2">
              <label class="adm-field"><span>Pedido mínimo (€)</span>
                <input type="number" [(ngModel)]="form.min_order_amount" min="0" step="0.01"></label>
              @if (form.discount_type === 'percent') {
                <label class="adm-field"><span>Descuento máx. (€)</span>
                  <input type="number" [(ngModel)]="form.max_discount_amount" min="0" step="0.01" placeholder="Sin tope"></label>
              }
            </div>
            <label class="adm-field"><span>Límite de usos totales</span>
              <input type="number" [(ngModel)]="form.usage_limit" min="1" placeholder="Ilimitado">
              <small>Cada cliente registrado solo puede usarlo una vez.</small></label>
            <div class="adm-grid--2">
              <label class="adm-field"><span>Válido desde</span><input type="date" [(ngModel)]="form.valid_from"></label>
              <label class="adm-field"><span>Válido hasta</span><input type="date" [(ngModel)]="form.valid_until"></label>
            </div>
            <label class="adm-check"><input type="checkbox" [(ngModel)]="form.is_active"> Activo</label>
            @if (formError()) { <p class="adm-error">{{ formError() }}</p> }
            <div class="form-actions">
              @if (editingId()) { <button type="button" class="adm-btn adm-btn--ghost" (click)="newCoupon()">Cancelar</button> }
              <button type="button" class="adm-btn adm-btn--primary" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Usage -->
    @if (usageCoupon(); as c) {
      <adm-modal [title]="'Usos del cupón ' + c.code" size="lg" (closed)="usageCoupon.set(null)">
        <div class="adm-grid--stats">
          <adm-stat label="Usos" [value]="c.redemptions" [hint]="c.usage_limit ? 'de ' + c.usage_limit + ' permitidos' : 'sin límite'" />
          <adm-stat label="Clientes distintos" [value]="c.unique_customers" />
          <adm-stat label="Descuento total" [value]="(c.total_discount | currency:'EUR') ?? ''" />
          <adm-stat label="Ventas con cupón" [value]="(c.revenue | currency:'EUR') ?? ''" [highlight]="true" />
        </div>
        <div class="usage-tools">
          <label class="adm-field adm-field--search">
            <input type="search" [(ngModel)]="usageSearch" (input)="usageTyped.next()" placeholder="Buscar email o nº de pedido" aria-label="Buscar usos">
          </label>
          <a class="adm-btn adm-btn--ghost adm-btn--sm" [routerLink]="['/admin/orders']" [queryParams]="{ coupon_code: c.code }">Ver pedidos con este cupón →</a>
        </div>
        @if (usageLoading()) {
          <div class="adm-loading">Cargando…</div>
        } @else {
          <div class="adm-table-wrap is-responsive">
            <table class="adm-table is-responsive">
              <thead><tr><th>Cliente</th><th>Pedido</th><th>Fecha</th><th class="num">Descuento</th><th class="num">Total pedido</th><th>Estado</th></tr></thead>
              <tbody>
                @for (r of usage(); track r.id) {
                  <tr>
                    <td class="is-primary" data-label="Cliente">
                      <div>
                        @if (r.user_id) {
                          <a class="adm-link" [routerLink]="['/admin/clientes', r.user_id]">{{ r.customer_name || r.email }}</a>
                        } @else { {{ r.customer_name || '—' }} <adm-badge>Invitado</adm-badge> }
                        <span class="sub">{{ r.email }}</span>
                      </div>
                    </td>
                    <td data-label="Pedido">
                      <a class="adm-link mono" [routerLink]="['/admin/orders']" [queryParams]="{ search: r.order_number }">{{ r.order_number }}</a>
                    </td>
                    <td data-label="Fecha">{{ r.created_at | date:'dd/MM/yy HH:mm' }}</td>
                    <td class="num" data-label="Descuento">−{{ r.discount_amount | currency:'EUR' }}</td>
                    <td class="num" data-label="Total pedido">{{ r.order_total | currency:'EUR' }}</td>
                    <td data-label="Estado">
                      @if (r.reverted_at) { <adm-badge tone="neutral">Revertido</adm-badge> }
                      @else { <adm-badge [tone]="orderStatus(r.order_status).tone">{{ orderStatus(r.order_status).label }}</adm-badge> }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="adm-empty">Nadie ha usado este cupón todavía</td></tr>
                }
              </tbody>
            </table>
          </div>
          <adm-pagination [page]="usagePage()" [pageSize]="20" [total]="usageTotal()" [totalPages]="usagePages()"
                          (pageChange)="loadUsage($event)" (pageSizeChange)="loadUsage(1)" />
        }
      </adm-modal>
    }
  `,
  styles: [`
    .code { font-family: ui-monospace, Consolas, monospace; font-weight: 600; color: var(--adm-brand); }
    tr.is-selected td { background: var(--adm-brand-soft); }
    .one-col { grid-template-columns: minmax(0, 1fr); }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .actions { display: flex; gap: 0.35rem; align-items: center; justify-content: flex-end; }
    .usage-tools { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; .adm-field { flex: 1 1 240px; } }
  `],
})
export class AdminCouponsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private confirm = inject(AdminConfirmService);

  state = adminListState({ search: '', is_active: '' }, () => this.load(), { pageSize: 50 });
  f = this.state.filters;

  coupons = signal<AdminCoupon[]>([]);
  loading = signal(true);
  saving = signal(false);
  formError = signal<string | null>(null);
  editingId = signal<number | null>(null);
  form = this.emptyForm();

  usageCoupon = signal<AdminCoupon | null>(null);
  usage = signal<CouponRedemption[]>([]);
  usageLoading = signal(false);
  usagePage = signal(1);
  usageTotal = signal(0);
  usagePages = signal(0);
  usageSearch = '';
  usageTyped = new Subject<void>();

  constructor() {
    this.usageTyped.pipe(debounceTime(350), takeUntilDestroyed()).subscribe(() => this.loadUsage(1));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.coupons(this.state.query()).subscribe({
      next: res => {
        this.coupons.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar los cupones');
      },
    });
  }

  validity(c: AdminCoupon): string {
    if (!c.is_active) return 'Desactivado';
    if (c.is_valid) return 'Vigente';
    if (c.usage_limit && c.used_count >= c.usage_limit) return 'Agotado';
    if (c.valid_until && new Date(c.valid_until) < new Date()) return 'Caducado';
    return 'Aún no vigente';
  }

  orderStatus(s: string | null) { return statusInfo(ORDER_STATUS, s); }

  // ── Usage ──────────────────────────────────────────────────────────────
  openUsage(c: AdminCoupon): void {
    this.usageCoupon.set(c);
    this.usageSearch = '';
    this.loadUsage(1);
  }

  loadUsage(page: number): void {
    const c = this.usageCoupon();
    if (!c) return;
    this.usageLoading.set(true);
    this.usagePage.set(page);
    this.api.couponRedemptions(c.id, { page, page_size: 20, search: this.usageSearch }).subscribe({
      next: res => {
        this.usage.set(res.items);
        this.usageTotal.set(res.total);
        this.usagePages.set(res.total_pages);
        this.usageLoading.set(false);
      },
      error: err => {
        this.usageLoading.set(false);
        this.toast.error(err.message || 'No se pudieron cargar los usos');
      },
    });
  }

  // ── Form ───────────────────────────────────────────────────────────────
  private emptyForm() {
    return {
      code: '', description: '', discount_type: 'percent' as 'percent' | 'fixed', discount_value: 10 as number | null,
      min_order_amount: 0 as number | null, max_discount_amount: null as number | null, usage_limit: null as number | null,
      valid_from: '', valid_until: '', is_active: true,
    };
  }

  newCoupon(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.formError.set(null);
  }

  edit(c: AdminCoupon): void {
    this.editingId.set(c.id);
    this.formError.set(null);
    this.form = {
      code: c.code, description: c.description || '', discount_type: c.discount_type,
      discount_value: c.discount_value, min_order_amount: c.min_order_amount,
      max_discount_amount: c.max_discount_amount, usage_limit: c.usage_limit,
      valid_from: c.valid_from?.substring(0, 10) || '', valid_until: c.valid_until?.substring(0, 10) || '',
      is_active: c.is_active,
    };
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      document.querySelector('.adm-split__aside')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  save(): void {
    const fm = this.form;
    if (!fm.code.trim() || !fm.discount_value || fm.discount_value <= 0) {
      this.formError.set('El código y el valor del descuento son obligatorios');
      return;
    }
    if (fm.discount_type === 'percent' && fm.discount_value > 100) {
      this.formError.set('Un porcentaje no puede superar el 100 %');
      return;
    }
    if (fm.valid_from && fm.valid_until && fm.valid_until < fm.valid_from) {
      this.formError.set('La fecha de fin es anterior a la de inicio');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    const payload = {
      description: fm.description || null,
      discount_type: fm.discount_type,
      discount_value: fm.discount_value,
      min_order_amount: fm.min_order_amount || 0,
      max_discount_amount: fm.discount_type === 'percent' ? (fm.max_discount_amount || null) : null,
      usage_limit: fm.usage_limit || null,
      valid_from: fm.valid_from ? `${fm.valid_from}T00:00:00` : null,
      valid_until: fm.valid_until ? `${fm.valid_until}T23:59:59` : null,
      is_active: fm.is_active,
    };
    const id = this.editingId();
    const req = id
      ? this.api.put(`/coupons/${id}`, payload)
      : this.api.post('/coupons', { ...payload, code: fm.code.trim().toUpperCase() });

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Cupón actualizado' : 'Cupón creado');
        this.newCoupon();
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.formError.set(err.message || 'Error al guardar el cupón');
      },
    });
  }

  async remove(c: AdminCoupon): Promise<void> {
    const used = c.redemptions > 0 || c.used_count > 0;
    const ok = await this.confirm.ask({
      title: `¿Eliminar el cupón ${c.code}?`,
      message: used
        ? `Este cupón se ha usado ${c.redemptions || c.used_count} veces. El histórico de usos se conserva, pero ` +
          'te recomendamos desactivarlo en lugar de eliminarlo.'
        : 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar', danger: true,
    });
    if (!ok) return;
    this.api.delete(`/coupons/${c.id}`).subscribe({
      next: () => {
        this.toast.success('Cupón eliminado');
        if (this.editingId() === c.id) this.newCoupon();
        this.load();
      },
      error: err => this.toast.error(err.message || 'Error al eliminar'),
    });
  }
}
