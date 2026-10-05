import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminInvoice, AdminInvoiceTotals } from '../shared/admin.models';
import { INVOICE_PDF_STATUS, INVOICE_TYPE, statusInfo } from '../shared/admin-labels';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';

/** Current month as AAAA-MM in the browser's local time (Spain). */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Facturas</h1>
          <p>Facturas emitidas con numeración correlativa. Se generan automáticamente al cobrar cada pedido.</p>
        </div>
        <div class="adm-page-actions">
          <button type="button" class="adm-btn adm-btn--primary"
                  [disabled]="exporting() || !f.month" (click)="exportMonth()">
            {{ exporting() ? 'Preparando ZIP…' : 'Descargar mes (ZIP + libro CSV)' }}
          </button>
        </div>
      </header>

      @if (totals(); as t) {
        <div class="adm-grid--stats">
          <adm-stat label="Facturas" [value]="t.count" [highlight]="true" />
          <adm-stat label="Base imponible" [value]="(t.tax_base | currency:'EUR') ?? ''" />
          <adm-stat label="Cuota IVA" [value]="(t.tax_amount | currency:'EUR') ?? ''" />
          <adm-stat label="Total facturado" [value]="(t.total | currency:'EUR') ?? ''"
                    hint="Rectificativas restan" />
        </div>
      }

      <div class="adm-filters">
        <label class="adm-field">
          <span>Mes</span>
          <input type="month" [(ngModel)]="f.month" (change)="state.apply(); loadTotals()">
        </label>
        <label class="adm-field">
          <span>Tipo</span>
          <select [(ngModel)]="f.type" (change)="state.apply(); loadTotals()">
            <option value="">Todas</option>
            <option value="simplified">Simplificadas</option>
            <option value="full">Completas (con NIF)</option>
            <option value="corrective">Rectificativas</option>
          </select>
        </label>
        <label class="adm-field adm-field--search">
          <span>Buscar</span>
          <input type="search" [(ngModel)]="f.search" (input)="state.typed(); totalsTyped()"
                 placeholder="Nº factura, nº pedido, cliente, email o NIF">
        </label>
      </div>

      @if (loading()) {
        <div class="adm-loading">Cargando…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          <table class="adm-table is-responsive">
            <thead>
              <tr>
                <th>Factura</th><th>Fecha</th><th>Cliente</th><th class="num">Base</th>
                <th class="num">IVA</th><th class="num">Total</th><th>PDF</th><th class="actions"></th>
              </tr>
            </thead>
            <tbody>
              @for (inv of invoices(); track inv.id) {
                <tr>
                  <td class="is-primary" data-label="Factura">
                    <div>
                      <strong class="mono">{{ inv.invoice_number }}</strong>
                      <span class="sub">
                        <adm-badge [tone]="type(inv.invoice_type).tone">{{ type(inv.invoice_type).label }}</adm-badge>
                        @if (inv.rectifies_number) { rectifica {{ inv.rectifies_number }} }
                      </span>
                      @if (inv.order_number) {
                        <a class="adm-link mono sub" routerLink="/admin/orders" [queryParams]="{ search: inv.order_number }">
                          {{ inv.order_number }}
                        </a>
                      }
                    </div>
                  </td>
                  <td data-label="Fecha">{{ inv.issued_at + 'Z' | date:'dd/MM/yyyy' }}</td>
                  <td data-label="Cliente">
                    <div>
                      {{ inv.buyer_name || '—' }}
                      @if (inv.buyer_nif) { <span class="sub mono">{{ inv.buyer_nif }}</span> }
                      @if (inv.buyer_email) { <span class="sub">{{ inv.buyer_email }}</span> }
                    </div>
                  </td>
                  <td class="num" data-label="Base">{{ inv.tax_base | currency:'EUR' }}</td>
                  <td class="num" data-label="IVA">
                    {{ inv.tax_amount | currency:'EUR' }}
                    <span class="sub">{{ inv.tax_rate * 100 | number:'1.0-2' }} %</span>
                  </td>
                  <td class="num" data-label="Total"><strong>{{ inv.total | currency:'EUR' }}</strong></td>
                  <td data-label="PDF">
                    <adm-badge [tone]="pdf(inv.pdf_status).tone">{{ pdf(inv.pdf_status).label }}</adm-badge>
                    @if (inv.sent_count) { <span class="sub">Enviada {{ inv.sent_count }}×</span> }
                  </td>
                  <td class="actions" data-label="">
                    <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost"
                            [disabled]="busy() === inv.id" (click)="download(inv)"
                            [attr.aria-label]="'Descargar PDF ' + inv.invoice_number">
                      {{ busy() === inv.id ? '…' : 'PDF' }}
                    </button>
                    @if (inv.pdf_status !== 'stored') {
                      <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost"
                              [disabled]="busy() === inv.id" (click)="regenerate(inv)">
                        Guardar PDF
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="adm-empty">No hay facturas con estos filtros</td></tr>
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
    .sub adm-badge { margin-right: 0.35rem; }
  `],
})
export class AdminInvoicesComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  state = adminListState({ month: currentMonth(), type: '', search: '' }, () => this.load(), { pageSize: 25 });
  f = this.state.filters;

  invoices = signal<AdminInvoice[]>([]);
  totals = signal<AdminInvoiceTotals | null>(null);
  loading = signal(true);
  exporting = signal(false);
  busy = signal<number | null>(null);
  private totalsTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
    this.loadTotals();
  }

  type(t: string) { return statusInfo(INVOICE_TYPE, t); }
  pdf(s: string) { return statusInfo(INVOICE_PDF_STATUS, s); }

  load(): void {
    this.loading.set(true);
    this.api.invoices(this.state.query()).subscribe({
      next: res => {
        this.invoices.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar las facturas');
      },
    });
  }

  loadTotals(): void {
    const { month, type, search } = this.f;
    this.api.invoiceTotals({ month, type, search }).subscribe({
      next: t => this.totals.set(t),
      error: () => this.totals.set(null),
    });
  }

  totalsTyped(): void {
    if (this.totalsTimer) clearTimeout(this.totalsTimer);
    this.totalsTimer = setTimeout(() => this.loadTotals(), 350);
  }

  download(inv: AdminInvoice): void {
    this.busy.set(inv.id);
    this.api.downloadInvoice(inv).subscribe({
      next: () => {
        this.busy.set(null);
        if (inv.pdf_status !== 'stored') this.load();  // the download stores it
      },
      error: err => {
        this.busy.set(null);
        this.toast.error(err.message || 'No se pudo descargar la factura');
      },
    });
  }

  regenerate(inv: AdminInvoice): void {
    this.busy.set(inv.id);
    this.api.regenerateInvoicePdf(inv.id).subscribe({
      next: res => {
        this.busy.set(null);
        this.toast.success(res.message);
        this.load();
      },
      error: err => {
        this.busy.set(null);
        this.toast.error(err.message || 'No se pudo guardar el PDF');
      },
    });
  }

  exportMonth(): void {
    if (!this.f.month) return;
    this.exporting.set(true);
    this.api.exportInvoicesMonth(this.f.month).subscribe({
      next: () => this.exporting.set(false),
      error: err => {
        this.exporting.set(false);
        this.toast.error(err.status === 404 ? 'No hay facturas en ese mes' : (err.message || 'No se pudo exportar el mes'));
      },
    });
  }
}
