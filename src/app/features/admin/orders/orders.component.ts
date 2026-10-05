import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminOrder, OrderInvoiceRef, OrderPayments, OrderShipment } from '../shared/admin.models';
import { ORDER_STATUS, ORDER_STATUS_EDITABLE, PAYMENT_STATUS, SHIPMENT_STATUS, statusInfo } from '../shared/admin-labels';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI, AdminConfirmService } from '../shared/admin-ui.components';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Pedidos</h1>
          <p>{{ state.total() }} pedidos{{ hasFilters() ? ' con los filtros aplicados' : '' }}</p>
        </div>
        <div class="adm-page-actions">
          <button type="button" class="adm-btn adm-btn--ghost" (click)="exportCsv()" [disabled]="exporting()">
            {{ exporting() ? 'Exportando…' : 'Exportar CSV' }}
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="adm-filters">
        <label class="adm-field adm-field--search">
          <span>Buscar</span>
          <input type="search" [(ngModel)]="f.search" (input)="state.typed()"
                 placeholder="Nº pedido, email, nombre, tracking…">
        </label>
        <label class="adm-field">
          <span>Estado</span>
          <select [(ngModel)]="f.status" (change)="state.apply()">
            <option value="">Todos</option>
            <option value="paid,processing">Por preparar</option>
            @for (s of statusOptions; track s) { <option [value]="s">{{ label(s) }}</option> }
            <option value="payment_failed">Pago fallido</option>
            <option value="partially_refunded">Reembolso parcial</option>
          </select>
        </label>
        <label class="adm-field">
          <span>Desde</span>
          <input type="date" [(ngModel)]="f.date_from" (change)="state.apply()">
        </label>
        <label class="adm-field">
          <span>Hasta</span>
          <input type="date" [(ngModel)]="f.date_to" (change)="state.apply()">
        </label>
        <label class="adm-field">
          <span>Cupón</span>
          <input type="text" [(ngModel)]="f.coupon_code" (input)="state.typed()" placeholder="Código">
        </label>
        @if (hasFilters()) {
          <button type="button" class="adm-btn adm-btn--ghost" (click)="state.reset()">Limpiar</button>
        }
      </div>

      @if (f.user_id) {
        <div class="adm-callout adm-callout--info">
          Mostrando solo los pedidos del cliente #{{ f.user_id }}.
          <button type="button" class="adm-link" (click)="f.user_id = ''; state.apply()">Ver todos</button>
        </div>
      }

      @if (loading()) {
        <div class="adm-loading">Cargando pedidos…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          <table class="adm-table is-responsive">
            <thead>
              <tr>
                <th class="is-sortable" (click)="state.sortBy('order_number')">Pedido{{ state.sortIcon('order_number') }}</th>
                <th>Cliente</th>
                <th class="is-sortable" (click)="state.sortBy('created_at')">Fecha{{ state.sortIcon('created_at') }}</th>
                <th class="num is-sortable" (click)="state.sortBy('total')">Total{{ state.sortIcon('total') }}</th>
                <th>Estado</th>
                <th>Seguimiento</th>
                <th class="actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <tr>
                  <td class="is-primary" data-label="Pedido">
                    <div>
                      <button type="button" class="adm-link mono" (click)="openDetail(order)">{{ order.order_number }}</button>
                      <span class="sub">{{ order.item_count }} artículo{{ order.item_count === 1 ? '' : 's' }}</span>
                    </div>
                  </td>
                  <td data-label="Cliente">
                    <div>
                      @if (order.user_id) {
                        <a class="adm-link" [routerLink]="['/admin/clientes', order.user_id]">{{ order.customer_name || order.customer_email }}</a>
                      } @else {
                        {{ order.customer_name || '—' }} <adm-badge>Invitado</adm-badge>
                      }
                      <span class="sub">{{ order.customer_email }}</span>
                    </div>
                  </td>
                  <td data-label="Fecha">{{ order.created_at | date:'dd/MM/yy HH:mm' }}</td>
                  <td class="num" data-label="Total">
                    <div>
                      <strong>{{ order.total | currency:'EUR' }}</strong>
                      @if (order.coupon_code) { <span class="sub">🏷 {{ order.coupon_code }}</span> }
                    </div>
                  </td>
                  <td data-label="Estado"><adm-badge [tone]="status(order.status).tone">{{ status(order.status).label }}</adm-badge></td>
                  <td data-label="Seguimiento"><span class="mono">{{ order.tracking_number || '—' }}</span></td>
                  <td class="actions" data-label="">
                    <select class="adm-input status-select" [value]="order.status" (change)="onStatusChange(order, $event)"
                            [attr.aria-label]="'Cambiar estado del pedido ' + order.order_number">
                      @for (s of statusOptions; track s) { <option [value]="s" [selected]="s === order.status">{{ label(s) }}</option> }
                      @if (!statusOptions.includes(order.status)) { <option [value]="order.status" selected>{{ label(order.status) }}</option> }
                    </select>
                    <button type="button" class="adm-btn adm-btn--sm" (click)="openDetail(order)">Ver</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="adm-empty">No hay pedidos que coincidan con los filtros</td></tr>
              }
            </tbody>
          </table>
        </div>

        <adm-pagination [page]="state.page()" [pageSize]="state.pageSize()" [total]="state.total()"
                        [totalPages]="state.totalPages()" (pageChange)="state.goTo($event)"
                        (pageSizeChange)="state.setPageSize($event)" />
      }
    </div>

    <!-- Order detail -->
    @if (detail(); as o) {
      <adm-modal [title]="'Pedido ' + o.order_number" size="lg" (closed)="detail.set(null)">
        <div class="detail-head">
          <adm-badge [tone]="status(o.status).tone">{{ status(o.status).label }}</adm-badge>
          <span class="adm-muted">Creado {{ o.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
          @if (o.paid_at) { <span class="adm-muted">· Pagado {{ o.paid_at | date:'dd/MM/yyyy HH:mm' }}</span> }
          @if (o.shipped_at) { <span class="adm-muted">· Enviado {{ o.shipped_at | date:'dd/MM/yyyy' }}</span> }
          @if (o.delivered_at) { <span class="adm-muted">· Entregado {{ o.delivered_at | date:'dd/MM/yyyy' }}</span> }
        </div>

        <div class="adm-grid--2">
          <section class="adm-card">
            <h3>Cliente</h3>
            <dl class="adm-dl">
              <dt>Nombre</dt><dd>{{ o.customer_name || '—' }}</dd>
              <dt>Email</dt><dd>{{ o.customer_email || '—' }}</dd>
              <dt>Teléfono</dt><dd>{{ o.shipping_address.phone || '—' }}</dd>
              <dt>Cuenta</dt>
              <dd>
                @if (o.user_id) {
                  <a class="adm-link" [routerLink]="['/admin/clientes', o.user_id]" (click)="detail.set(null)">Ver ficha del cliente →</a>
                } @else { Compra como invitado }
              </dd>
            </dl>
          </section>
          <section class="adm-card">
            <h3>Dirección de envío</h3>
            <p class="addr">
              {{ o.shipping_address.first_name }} {{ o.shipping_address.last_name }}<br>
              {{ o.shipping_address.street }}@if (o.shipping_address.street_2) {, {{ o.shipping_address.street_2 }}}<br>
              {{ o.shipping_address.postal_code }} {{ o.shipping_address.city }} ({{ o.shipping_address.province }})<br>
              {{ o.shipping_address.country }}
            </p>
            @if (o.billing_address) {
              <h3>Facturación</h3>
              <p class="addr">
                {{ $any(o.billing_address).name || (o.billing_address.first_name + ' ' + o.billing_address.last_name) }}<br>
                @if ($any(o.billing_address).nif) { <span class="mono">NIF {{ $any(o.billing_address).nif }}</span><br> }
                {{ o.billing_address.street }}, {{ o.billing_address.postal_code }} {{ o.billing_address.city }}
              </p>
            }
          </section>
        </div>

        <section class="adm-card adm-card--flush">
          <div class="adm-table-wrap">
            <table class="adm-table">
              <thead><tr><th>Producto</th><th class="num">Precio</th><th class="num">Uds.</th><th class="num">Total</th></tr></thead>
              <tbody>
                @for (item of o.items; track item.id) {
                  <tr>
                    <td>{{ item.product_name }} @if (item.product_sku) { <span class="sub mono">{{ item.product_sku }}</span> }</td>
                    <td class="num">{{ item.unit_price | currency:'EUR' }}</td>
                    <td class="num">{{ item.quantity }}</td>
                    <td class="num">{{ item.total | currency:'EUR' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <dl class="adm-dl totals">
            <dt>Subtotal</dt><dd>{{ o.subtotal | currency:'EUR' }}</dd>
            <dt>Envío</dt><dd>{{ o.shipping_cost | currency:'EUR' }}</dd>
            @if (o.discount > 0) {
              <dt>Descuento @if (o.coupon_code) { (<a class="adm-link" [routerLink]="['/admin/cupones']" [queryParams]="{ search: o.coupon_code }" (click)="detail.set(null)">{{ o.coupon_code }}</a>) }</dt>
              <dd class="discount">−{{ o.discount | currency:'EUR' }}</dd>
            }
            <dt><strong>Total</strong></dt><dd><strong>{{ o.total | currency:'EUR' }}</strong></dd>
          </dl>
        </section>

        <div class="adm-grid--2">
          <section class="adm-card">
            <h3>Pago</h3>
            @if (detailLoading()) {
              <p class="adm-muted">Cargando…</p>
            } @else {
              <dl class="adm-dl">
                <dt>Método</dt><dd>{{ o.payment_method || '—' }}</dd>
                <dt>Stripe PI</dt><dd class="mono">{{ o.payment_intent_id || '—' }}</dd>
              </dl>
              @for (pi of payments()?.payment_intents ?? []; track pi.id) {
                <p class="line"><adm-badge [tone]="payStatus(pi.status).tone">{{ payStatus(pi.status).label }}</adm-badge>
                  {{ pi.amount | currency:'EUR' }} · {{ pi.payment_method_type || 'card' }} · {{ pi.created_at | date:'dd/MM HH:mm' }}</p>
              }
              @for (r of payments()?.refunds ?? []; track r.id) {
                <p class="line"><adm-badge tone="neutral">Reembolso {{ r.status }}</adm-badge>
                  −{{ r.amount | currency:'EUR' }} · {{ r.reason || 'sin motivo' }} · {{ r.created_at | date:'dd/MM HH:mm' }}</p>
              }
            }
            <h3 class="invoices-title">Facturas</h3>
            @for (inv of o.invoices ?? []; track inv.id) {
              <p class="line">
                <adm-badge [tone]="inv.invoice_type === 'corrective' ? 'danger' : 'info'">
                  {{ inv.invoice_type === 'corrective' ? 'Rectificativa' : 'Factura' }}
                </adm-badge>
                <span class="mono">{{ inv.invoice_number }}</span> · {{ inv.total | currency:'EUR' }}
                <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="downloadInvoice(inv)">PDF</button>
              </p>
            } @empty {
              @if (isInvoiceable(o.status)) {
                <p class="line adm-muted">
                  Sin factura emitida.
                  <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost"
                          [disabled]="issuingInvoice()" (click)="issueInvoice(o)">
                    {{ issuingInvoice() ? 'Emitiendo…' : 'Emitir factura' }}
                  </button>
                </p>
              } @else {
                <p class="line adm-muted">Se emite automáticamente al cobrar el pedido.</p>
              }
            }
          </section>
          <section class="adm-card">
            <h3>Envío</h3>
            <dl class="adm-dl">
              <dt>Seguimiento</dt><dd class="mono">{{ o.tracking_number || '—' }}</dd>
              @if (shipment()?.shipment; as sh) {
                <dt>Correos</dt><dd><adm-badge [tone]="shipStatus(sh.status).tone">{{ shipStatus(sh.status).label }}</adm-badge></dd>
                @if (sh.error) { <dt>Error</dt><dd class="adm-error">{{ sh.error }}</dd> }
                @if (sh.correos_tracking_url) { <dt>Web</dt><dd><a class="adm-link" [href]="sh.correos_tracking_url" target="_blank" rel="noopener">Ver en Correos ↗</a></dd> }
              }
            </dl>
            @if (shipment()?.shipment?.events?.length) {
              <ol class="timeline">
                @for (ev of shipment()!.shipment!.events; track ev.id) {
                  <li><strong>{{ ev.description || ev.code }}</strong> <span class="adm-muted">{{ ev.occurred_at | date:'dd/MM HH:mm' }}</span></li>
                }
              </ol>
            }
            <div class="row-actions">
              @if (!o.tracking_number) {
                <button type="button" class="adm-btn adm-btn--sm" (click)="askTracking(o)">Marcar como enviado</button>
              } @else {
                <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="askTracking(o)">Cambiar tracking</button>
              }
              @if (shipment()?.shipment?.localizador) {
                <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="syncTracking(o)" [disabled]="syncing()">
                  {{ syncing() ? 'Consultando…' : 'Actualizar tracking' }}
                </button>
                <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="downloadLabel(o)">Etiqueta PDF</button>
              }
            </div>
          </section>
        </div>

        @if (o.customer_notes) {
          <section class="adm-card">
            <h3>Notas del cliente</h3>
            <p class="quote">{{ o.customer_notes }}</p>
          </section>
        }

        <section class="adm-card">
          <h3>Notas internas <small class="adm-muted">(no las ve el cliente)</small></h3>
          <label class="adm-field">
            <textarea [(ngModel)]="notesDraft" rows="3" placeholder="Ej.: llamó para cambiar la dirección…"></textarea>
          </label>
          <div class="row-actions">
            <button type="button" class="adm-btn adm-btn--sm adm-btn--primary" (click)="saveNotes(o)"
                    [disabled]="savingNotes() || notesDraft === (o.admin_notes || '')">
              {{ savingNotes() ? 'Guardando…' : 'Guardar notas' }}
            </button>
          </div>
        </section>
      </adm-modal>
    }

    <!-- Tracking -->
    @if (trackingOrder(); as t) {
      <adm-modal title="Número de seguimiento" size="sm" (closed)="closeTracking()" [closable]="!savingTracking()">
        <p class="adm-muted">
          Pedido <strong>{{ t.order_number }}</strong>.
          @if (!t.tracking_number) { Se marcará como enviado y el cliente recibirá el email "pedido enviado". }
        </p>
        <label class="adm-field">
          <span>Nº de seguimiento</span>
          <input type="text" [(ngModel)]="trackingNumber" maxlength="100" (keyup.enter)="confirmTracking()">
        </label>
        <div modal-footer>
          <button type="button" class="adm-btn adm-btn--ghost" (click)="closeTracking()" [disabled]="savingTracking()">Cancelar</button>
          <button type="button" class="adm-btn adm-btn--primary" (click)="confirmTracking()" [disabled]="!trackingNumber.trim() || savingTracking()">
            {{ savingTracking() ? 'Guardando…' : 'Confirmar' }}
          </button>
        </div>
      </adm-modal>
    }
  `,
  styles: [`
    .invoices-title { margin-top: 1rem; }
    .status-select { width: auto; min-height: 34px; padding: 0.25rem 0.5rem; font-size: 0.8rem; }
    .actions { display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; }
    .detail-head { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; font-size: 0.8rem; }
    .addr { margin: 0 0 0.75rem; line-height: 1.6; }
    .totals { padding: 1rem 1.25rem; grid-template-columns: 1fr auto; dd { text-align: right; } .discount { color: var(--adm-success); } }
    .line { margin: 0.4rem 0 0; font-size: 0.82rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
    .timeline { margin: 0.75rem 0 0; padding-left: 1.1rem; font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .row-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
    .quote { margin: 0; padding: 0.75rem; background: var(--adm-surface-alt); border-radius: 6px; font-style: italic; }
    @media (max-width: 768px) { .actions { width: 100%; } .status-select { flex: 1; } }
  `],
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private confirm = inject(AdminConfirmService);

  readonly statusOptions = ORDER_STATUS_EDITABLE;

  state = adminListState(
    { search: '', status: '', date_from: '', date_to: '', coupon_code: '', user_id: '' },
    () => this.load(),
    { sort: 'created_at' },
  );
  f = this.state.filters;

  orders = signal<AdminOrder[]>([]);
  loading = signal(true);
  exporting = signal(false);

  detail = signal<AdminOrder | null>(null);
  detailLoading = signal(false);
  payments = signal<OrderPayments | null>(null);
  shipment = signal<OrderShipment | null>(null);
  notesDraft = '';
  savingNotes = signal(false);
  syncing = signal(false);

  trackingOrder = signal<AdminOrder | null>(null);
  trackingNumber = '';
  savingTracking = signal(false);

  ngOnInit(): void {
    this.load();
  }

  hasFilters(): boolean {
    return Object.values(this.f).some(v => !!v);
  }

  load(): void {
    this.loading.set(true);
    this.api.orders(this.state.query()).subscribe({
      next: res => {
        this.orders.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar los pedidos');
      },
    });
  }

  label(s: string): string { return statusInfo(ORDER_STATUS, s).label; }
  status(s: string) { return statusInfo(ORDER_STATUS, s); }
  payStatus(s: string) { return statusInfo(PAYMENT_STATUS, s); }
  shipStatus(s: string) { return statusInfo(SHIPMENT_STATUS, s); }

  // ── Detail ─────────────────────────────────────────────────────────────
  openDetail(order: AdminOrder): void {
    this.detail.set(order);
    this.notesDraft = order.admin_notes || '';
    this.payments.set(null);
    this.shipment.set(null);
    this.detailLoading.set(true);
    forkJoin({
      order: this.api.order(order.id).pipe(catchError(() => of(order))),
      payments: this.api.orderPayments(order.id).pipe(catchError(() => of(null))),
      shipment: this.api.orderShipment(order.id).pipe(catchError(() => of(null))),
    }).subscribe(({ order: fresh, payments, shipment }) => {
      if (this.detail()?.id !== order.id) return;
      this.detail.set(fresh);
      this.notesDraft = fresh.admin_notes || '';
      this.payments.set(payments);
      this.shipment.set(shipment);
      this.detailLoading.set(false);
    });
  }

  saveNotes(order: AdminOrder): void {
    this.savingNotes.set(true);
    this.api.updateOrderNotes(order.id, this.notesDraft).subscribe({
      next: updated => {
        this.savingNotes.set(false);
        this.detail.set(updated);
        this.replaceRow(updated);
        this.toast.success('Notas guardadas');
      },
      error: err => {
        this.savingNotes.set(false);
        this.toast.error(err.message || 'No se pudieron guardar las notas');
      },
    });
  }

  syncTracking(order: AdminOrder): void {
    this.syncing.set(true);
    this.api.syncOrderTracking(order.id).subscribe({
      next: () => {
        this.syncing.set(false);
        this.api.orderShipment(order.id).subscribe(sh => this.shipment.set(sh));
        this.toast.success('Tracking actualizado');
      },
      error: err => {
        this.syncing.set(false);
        this.toast.error(err.message || 'No se pudo consultar Correos');
      },
    });
  }

  issuingInvoice = signal(false);

  isInvoiceable(status: string): boolean {
    return ['paid', 'processing', 'shipped', 'delivered', 'partially_refunded', 'refunded'].includes(status);
  }

  downloadInvoice(inv: OrderInvoiceRef): void {
    this.api.downloadInvoice(inv).subscribe({
      error: err => this.toast.error(err.message || 'No se pudo descargar la factura'),
    });
  }

  issueInvoice(order: AdminOrder): void {
    this.issuingInvoice.set(true);
    this.api.issueOrderInvoice(order.id).subscribe({
      next: inv => {
        this.issuingInvoice.set(false);
        this.toast.success(`Factura ${inv.invoice_number} emitida`);
        const current = this.detail();
        if (current?.id === order.id) {
          this.detail.set({ ...current, invoices: [...(current.invoices ?? []), inv] });
        }
      },
      error: err => {
        this.issuingInvoice.set(false);
        this.toast.error(err.message || 'No se pudo emitir la factura');
      },
    });
  }

  downloadLabel(order: AdminOrder): void {
    this.api.download(`/orders/${order.id}/label`, {}, `etiqueta_${order.order_number}.pdf`).subscribe({
      error: err => this.toast.error(err.message || 'No se pudo descargar la etiqueta'),
    });
  }

  // ── Status ─────────────────────────────────────────────────────────────
  async onStatusChange(order: AdminOrder, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const next = select.value;
    select.value = order.status; // the row updates once the API confirms

    if (next === 'shipped' && !order.tracking_number) {
      this.askTracking(order);
      return;
    }
    if (['cancelled', 'refunded'].includes(next)) {
      const ok = await this.confirm.ask({
        title: `¿Marcar como ${this.label(next).toLowerCase()}?`,
        message: `El pedido ${order.order_number} pasará a "${this.label(next)}" y el cliente recibirá un email.` +
          (next === 'refunded' ? '\n\nOjo: esto NO devuelve el dinero en Stripe; hazlo desde el panel de Stripe.' : ''),
        confirmText: 'Sí, cambiar',
        danger: true,
      });
      if (!ok) return;
    }

    this.api.updateOrderStatus(order.id, next).subscribe({
      next: updated => {
        this.replaceRow(updated);
        this.toast.success(`Pedido ${order.order_number}: ${this.label(next)}`);
      },
      error: err => this.toast.error(err.message || 'Error al actualizar el estado'),
    });
  }

  askTracking(order: AdminOrder): void {
    this.trackingNumber = order.tracking_number ?? '';
    this.trackingOrder.set(order);
  }

  closeTracking(): void {
    if (this.savingTracking()) return;
    this.trackingOrder.set(null);
    this.trackingNumber = '';
  }

  confirmTracking(): void {
    const order = this.trackingOrder();
    const tracking = this.trackingNumber.trim();
    if (!order || !tracking || this.savingTracking()) return;
    this.savingTracking.set(true);

    // Setting the tracking sends the "shipped" email the first time
    this.api.updateOrderTracking(order.id, tracking).subscribe({
      next: withTracking => {
        const done = (o: AdminOrder) => {
          this.savingTracking.set(false);
          this.trackingOrder.set(null);
          this.replaceRow(o);
          if (this.detail()?.id === o.id) this.detail.set(o);
          this.toast.success('Seguimiento guardado');
        };
        if (['shipped', 'delivered'].includes(withTracking.status)) {
          done(withTracking);
          return;
        }
        this.api.updateOrderStatus(order.id, 'shipped').subscribe({
          next: done,
          error: err => {
            this.savingTracking.set(false);
            this.toast.error(err.message || 'Error al marcar como enviado');
          },
        });
      },
      error: err => {
        this.savingTracking.set(false);
        this.toast.error(err.message || 'Error al guardar el seguimiento');
      },
    });
  }

  exportCsv(): void {
    this.exporting.set(true);
    const { page, page_size, ...filters } = this.state.query();
    const stamp = new Date().toISOString().slice(0, 10);
    this.api.download('/orders/export/csv', filters, `pedidos_${stamp}.csv`).subscribe({
      next: () => this.exporting.set(false),
      error: err => {
        this.exporting.set(false);
        this.toast.error(err.message || 'No se pudo exportar');
      },
    });
  }

  private replaceRow(updated: AdminOrder): void {
    this.orders.update(list => list.map(o => (o.id === updated.id ? updated : o)));
  }
}
