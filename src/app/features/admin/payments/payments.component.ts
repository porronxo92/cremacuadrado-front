import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminPayment, AdminRefund, AdminWebhookEvent, Page } from '../shared/admin.models';
import { ORDER_STATUS, PAYMENT_STATUS, statusInfo } from '../shared/admin-labels';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';

type Tab = 'payments' | 'refunds' | 'webhooks';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Pagos</h1>
          <p>Cobros de Stripe, reembolsos y registro de webhooks</p>
        </div>
      </header>

      <nav class="adm-tabs" role="tablist">
        <button type="button" role="tab" [class.is-active]="f.tab === 'payments'" (click)="switchTab('payments')">Cobros</button>
        <button type="button" role="tab" [class.is-active]="f.tab === 'refunds'" (click)="switchTab('refunds')">Reembolsos</button>
        <button type="button" role="tab" [class.is-active]="f.tab === 'webhooks'" (click)="switchTab('webhooks')">Webhooks Stripe</button>
      </nav>

      @if (f.tab === 'payments') {
        <div class="adm-filters">
          <label class="adm-field adm-field--search">
            <span>Buscar</span>
            <input type="search" [(ngModel)]="f.search" (input)="state.typed()" placeholder="Nº pedido, email o ID de Stripe">
          </label>
          <label class="adm-field">
            <span>Estado</span>
            <select [(ngModel)]="f.status" (change)="state.apply()">
              <option value="">Todos</option>
              <option value="succeeded">Cobrados</option>
              <option value="requires_payment_method">Fallidos / sin método</option>
              <option value="processing">Procesando</option>
              <option value="canceled">Cancelados</option>
            </select>
          </label>
        </div>
      }
      @if (f.tab === 'webhooks') {
        <div class="adm-filters">
          <label class="adm-check">
            <input type="checkbox" [checked]="f.only_errors === 'true'"
                   (change)="f.only_errors = $any($event.target).checked ? 'true' : ''; state.apply()">
            Solo eventos con error
          </label>
        </div>
      }

      @if (loading()) {
        <div class="adm-loading">Cargando…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          @switch (f.tab) {
            @case ('payments') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Pedido</th><th>Cliente</th><th class="num">Importe</th><th>Estado Stripe</th><th>Método</th><th>Fecha</th></tr></thead>
                <tbody>
                  @for (p of payments(); track p.id) {
                    <tr>
                      <td class="is-primary" data-label="Pedido">
                        <div>
                          <a class="adm-link mono" routerLink="/admin/orders" [queryParams]="{ search: p.order_number }">{{ p.order_number }}</a>
                          <span class="sub mono">{{ p.stripe_payment_intent_id }}</span>
                        </div>
                      </td>
                      <td data-label="Cliente">{{ p.email || '—' }}</td>
                      <td class="num" data-label="Importe">{{ p.amount | currency:p.currency.toUpperCase() }}</td>
                      <td data-label="Estado Stripe">
                        <adm-badge [tone]="pay(p.status).tone">{{ pay(p.status).label }}</adm-badge>
                        @if (p.order_status) { <span class="sub">Pedido: {{ order(p.order_status).label }}</span> }
                      </td>
                      <td data-label="Método">{{ p.payment_method_type || '—' }}</td>
                      <td data-label="Fecha">{{ p.created_at | date:'dd/MM/yy HH:mm' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="6" class="adm-empty">Sin cobros</td></tr> }
                </tbody>
              </table>
            }
            @case ('refunds') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Pedido</th><th class="num">Importe</th><th>Motivo</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  @for (r of refunds(); track r.id) {
                    <tr>
                      <td class="is-primary" data-label="Pedido">
                        <div>
                          <a class="adm-link mono" routerLink="/admin/orders" [queryParams]="{ search: r.order_number }">{{ r.order_number || '—' }}</a>
                          <span class="sub mono">{{ r.stripe_refund_id }}</span>
                        </div>
                      </td>
                      <td class="num" data-label="Importe">−{{ r.amount | currency:'EUR' }}</td>
                      <td data-label="Motivo">{{ r.reason || '—' }}</td>
                      <td data-label="Estado"><adm-badge [tone]="r.status === 'succeeded' ? 'success' : 'warning'">{{ r.status }}</adm-badge></td>
                      <td data-label="Fecha">{{ r.created_at | date:'dd/MM/yy HH:mm' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="5" class="adm-empty">Sin reembolsos</td></tr> }
                </tbody>
              </table>
            }
            @case ('webhooks') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Evento</th><th>Procesado</th><th>Error</th><th>Recibido</th><th class="actions"></th></tr></thead>
                <tbody>
                  @for (e of webhooks(); track e.id) {
                    <tr>
                      <td class="is-primary" data-label="Evento">
                        <div><strong>{{ e.event_type }}</strong><span class="sub mono">{{ e.stripe_event_id }}</span></div>
                      </td>
                      <td data-label="Procesado">
                        <adm-badge [tone]="e.error ? 'danger' : (e.processed ? 'success' : 'warning')">
                          {{ e.error ? 'Error' : (e.processed ? 'OK' : 'Pendiente') }}
                        </adm-badge>
                      </td>
                      <td data-label="Error" class="err">{{ e.error || '—' }}</td>
                      <td data-label="Recibido">{{ e.created_at | date:'dd/MM/yy HH:mm:ss' }}</td>
                      <td class="actions" data-label="">
                        <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="openEvent(e)">Ver payload</button>
                      </td>
                    </tr>
                  } @empty { <tr><td colspan="5" class="adm-empty">Sin eventos</td></tr> }
                </tbody>
              </table>
            }
          }
        </div>
        <adm-pagination [page]="state.page()" [pageSize]="state.pageSize()" [total]="state.total()"
                        [totalPages]="state.totalPages()" (pageChange)="state.goTo($event)"
                        (pageSizeChange)="state.setPageSize($event)" />
      }
    </div>

    @if (event(); as e) {
      <adm-modal [title]="e.event_type" size="lg" (closed)="event.set(null)">
        @if (e.error) { <p class="adm-error">{{ e.error }}</p> }
        <pre class="payload">{{ e.payload ? (e.payload | json) : 'Cargando…' }}</pre>
      </adm-modal>
    }
  `,
  styles: [`
    .err { max-width: 320px; font-size: 0.8rem; color: var(--adm-danger); overflow-wrap: anywhere; }
    .payload { margin: 0; padding: 1rem; background: #1C1A14; color: #F4F1E9; border-radius: 6px; font-size: 0.75rem;
      max-height: 60vh; overflow: auto; white-space: pre-wrap; word-break: break-all; }
  `],
})
export class AdminPaymentsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  state = adminListState({ tab: 'payments', search: '', status: '', only_errors: '' }, () => this.load());
  f = this.state.filters;

  payments = signal<AdminPayment[]>([]);
  refunds = signal<AdminRefund[]>([]);
  webhooks = signal<AdminWebhookEvent[]>([]);
  loading = signal(true);
  event = signal<AdminWebhookEvent | null>(null);

  ngOnInit(): void {
    this.load();
  }

  pay(s: string) { return statusInfo(PAYMENT_STATUS, s); }
  order(s: string) { return statusInfo(ORDER_STATUS, s); }

  switchTab(tab: Tab): void {
    Object.assign(this.f, { tab, search: '', status: '', only_errors: '' });
    this.state.apply();
  }

  load(): void {
    this.loading.set(true);
    const { tab, ...query } = this.state.query();
    const done = <T>(target: (items: T[]) => void) => ({
      next: (res: Page<T>) => {
        target(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: (err: { message?: string }) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar');
      },
    });
    if (tab === 'refunds') this.api.refunds(query).subscribe(done<AdminRefund>(i => this.refunds.set(i)));
    else if (tab === 'webhooks') this.api.webhookEvents(query).subscribe(done<AdminWebhookEvent>(i => this.webhooks.set(i)));
    else this.api.payments(query).subscribe(done<AdminPayment>(i => this.payments.set(i)));
  }

  openEvent(e: AdminWebhookEvent): void {
    this.event.set(e);
    this.api.webhookEvent(e.id).subscribe({
      next: full => this.event.set(full),
      error: err => this.toast.error(err.message || 'No se pudo cargar el evento'),
    });
  }
}
