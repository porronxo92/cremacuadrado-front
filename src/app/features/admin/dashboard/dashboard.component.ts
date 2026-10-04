import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminDashboard, LowStockVariant } from '../shared/admin.models';
import { ORDER_STATUS, statusInfo } from '../shared/admin-labels';
import { ADMIN_UI } from '../shared/admin-ui.components';

interface Bar { x: number; y: number; w: number; h: number; path: string; date: string; orders: number; revenue: number }

const CHART_W = 720;
const CHART_H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 48 };

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Dashboard</h1>
          @if (stats(); as s) {
            <p>{{ s.period_start | date:'d MMM yyyy' }} – {{ periodEndLabel() | date:'d MMM yyyy' }} · comparado con el periodo anterior</p>
          }
        </div>
        <div class="adm-chips" role="group" aria-label="Periodo">
          @for (p of periods; track p.days) {
            <button type="button" class="adm-chip" [class.is-active]="period() === p.days" (click)="setPeriod(p.days)">{{ p.label }}</button>
          }
        </div>
      </header>

      @if (loading() && !stats()) {
        <div class="adm-loading">Cargando estadísticas…</div>
      }
      @if (stats(); as s) {
        <!-- KPIs of the period -->
        <div class="adm-grid--stats" [class.is-stale]="loading()">
          <adm-stat label="Ingresos" [value]="(s.revenue_period | currency:'EUR':'symbol':'1.0-0') ?? ''" [growth]="s.revenue_growth" [highlight]="true" />
          <adm-stat label="Pedidos pagados" [value]="s.paid_orders_period" [growth]="s.orders_growth" />
          <adm-stat label="Ticket medio" [value]="(s.average_order_value | currency:'EUR') ?? ''" />
          <adm-stat label="Nuevos clientes" [value]="s.new_customers_period" [hint]="s.total_customers + ' en total'" />
          <adm-stat label="Repiten compra" [value]="s.returning_customer_rate !== null ? s.returning_customer_rate + ' %' : '—'"
                    hint="de los compradores del periodo" />
        </div>

        <!-- Needs attention -->
        <div class="attention">
          <a class="adm-stat is-link" routerLink="/admin/orders" [queryParams]="{ status: 'paid,processing' }">
            <span class="adm-stat__label">Por preparar / enviar</span>
            <strong class="adm-stat__value">{{ s.pending_orders }}</strong>
            <span class="adm-stat__hint">Pedidos pagados sin enviar →</span>
          </a>
          <a class="adm-stat is-link" routerLink="/admin/resenas">
            <span class="adm-stat__label">Reseñas pendientes</span>
            <strong class="adm-stat__value">{{ s.pending_reviews }}</strong>
            <span class="adm-stat__hint">Moderar →</span>
          </a>
          <a class="adm-stat is-link" routerLink="/admin/carritos">
            <span class="adm-stat__label">Carritos abandonados</span>
            <strong class="adm-stat__value">{{ s.abandoned_carts }}</strong>
            <span class="adm-stat__hint">{{ s.abandoned_carts_value | currency:'EUR':'symbol':'1.0-0' }} sin cobrar (30 días) →</span>
          </a>
          <a class="adm-stat is-link" href="#stock" (click)="scrollToStock($event)">
            <span class="adm-stat__label">Stock bajo</span>
            <strong class="adm-stat__value">{{ s.low_stock_variants }}</strong>
            <span class="adm-stat__hint">Variantes por reponer ↓</span>
          </a>
        </div>

        <!-- Revenue chart -->
        <section class="adm-card">
          <div class="card-head">
            <h2>Ingresos diarios</h2>
            <button type="button" class="adm-link" (click)="showTable.set(!showTable())">{{ showTable() ? 'Ver gráfica' : 'Ver como tabla' }}</button>
          </div>
          @if (!showTable()) {
            <div class="chart" (mouseleave)="hover.set(null)">
              <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img"
                   [attr.aria-label]="'Ingresos diarios: total ' + (s.revenue_period | currency:'EUR')">
                @for (t of yTicks(); track t.value) {
                  <line class="grid" [attr.x1]="PAD.left" [attr.x2]="W - PAD.right" [attr.y1]="t.y" [attr.y2]="t.y" />
                  <text class="tick" [attr.x]="PAD.left - 6" [attr.y]="t.y + 4" text-anchor="end">{{ t.label }}</text>
                }
                @for (b of bars(); track b.date; let i = $index) {
                  @if (b.h > 0) { <path class="bar" [class.is-hover]="hover()?.date === b.date" [attr.d]="b.path" /> }
                  <rect class="hit" [attr.x]="b.x - gap()" [attr.y]="PAD.top" [attr.width]="b.w + gap() * 2" [attr.height]="H - PAD.top - PAD.bottom"
                        (mouseenter)="hover.set(b)" (focus)="hover.set(b)" tabindex="0"
                        [attr.aria-label]="(b.date | date:'d MMM') + ': ' + (b.revenue | currency:'EUR') + ', ' + b.orders + ' pedidos'" />
                  @if (showXLabel(i)) {
                    <text class="tick" [attr.x]="b.x + b.w / 2" [attr.y]="H - 8" text-anchor="middle">{{ b.date | date:'d/M' }}</text>
                  }
                }
                <line class="axis" [attr.x1]="PAD.left" [attr.x2]="W - PAD.right" [attr.y1]="H - PAD.bottom" [attr.y2]="H - PAD.bottom" />
              </svg>
              @if (hover(); as h) {
                <div class="tooltip" [style.left.%]="((h.x + h.w / 2) / W) * 100">
                  <strong>{{ h.date | date:'EEE d MMM' }}</strong>
                  <span>{{ h.revenue | currency:'EUR' }}</span>
                  <span class="adm-muted">{{ h.orders }} pedido{{ h.orders === 1 ? '' : 's' }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="adm-table-wrap table-view">
              <table class="adm-table">
                <thead><tr><th>Día</th><th class="num">Pedidos</th><th class="num">Ingresos</th></tr></thead>
                <tbody>
                  @for (d of s.daily_series; track d.date) {
                    <tr><td>{{ d.date | date:'EEE d MMM' }}</td><td class="num">{{ d.orders }}</td><td class="num">{{ d.revenue | currency:'EUR' }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        <div class="adm-grid--2">
          <section class="adm-card">
            <h2>Productos más vendidos</h2>
            @for (p of s.top_products; track p.product_name) {
              <div class="hbar">
                <div class="hbar__label"><span>{{ p.product_name }}</span><span class="adm-muted">{{ p.quantity_sold }} uds · <strong>{{ p.revenue | currency:'EUR':'symbol':'1.0-0' }}</strong></span></div>
                <div class="hbar__track"><div class="hbar__fill" [style.width.%]="pct(p.revenue, maxProduct())"></div></div>
              </div>
            } @empty { <p class="adm-muted">Sin ventas en el periodo</p> }
          </section>

          <section class="adm-card">
            <h2>Pedidos por estado</h2>
            @for (row of statusRows(); track row.status) {
              <a class="hbar hbar--link" routerLink="/admin/orders" [queryParams]="{ status: row.status }">
                <div class="hbar__label">
                  <adm-badge [tone]="row.tone">{{ row.label }}</adm-badge>
                  <strong>{{ row.count }}</strong>
                </div>
                <div class="hbar__track"><div class="hbar__fill hbar__fill--muted" [style.width.%]="pct(row.count, maxStatus())"></div></div>
              </a>
            } @empty { <p class="adm-muted">Sin pedidos en el periodo</p> }
          </section>

          <section class="adm-card">
            <h2>Cupones más usados</h2>
            @for (c of s.top_coupons; track c.code) {
              <a class="row-link" routerLink="/admin/cupones" [queryParams]="{ search: c.code }">
                <code>{{ c.code }}</code>
                <span class="adm-muted">{{ c.uses }} usos · −{{ c.discount | currency:'EUR':'symbol':'1.0-0' }}</span>
              </a>
            } @empty { <p class="adm-muted">Ningún cupón usado en el periodo</p> }
          </section>

          <section class="adm-card">
            <h2>Nuevos leads del periodo</h2>
            <a class="row-link" routerLink="/admin/leads" [queryParams]="{ tab: 'newsletter' }"><span>Newsletter</span><strong>{{ s.new_leads_period.newsletter ?? 0 }}</strong></a>
            <a class="row-link" routerLink="/admin/leads" [queryParams]="{ tab: 'pos' }"><span>Tiendas B2B</span><strong>{{ s.new_leads_period.pos ?? 0 }}</strong></a>
            <a class="row-link" routerLink="/admin/leads" [queryParams]="{ tab: 'contact' }"><span>Formulario de contacto</span><strong>{{ s.new_leads_period.contact ?? 0 }}</strong></a>
          </section>
        </div>

        <section class="adm-card" id="stock">
          <div class="card-head">
            <h2>Stock bajo</h2>
            <a class="adm-link" routerLink="/admin/products">Ir a productos →</a>
          </div>
          @if (lowStock().length) {
            <div class="adm-table-wrap is-responsive">
              <table class="adm-table is-responsive">
                <thead><tr><th>Producto</th><th>Formato</th><th>SKU</th><th class="num">Stock</th><th class="num">Aviso en</th></tr></thead>
                <tbody>
                  @for (v of lowStock(); track v.variant_id) {
                    <tr>
                      <td class="is-primary" data-label="Producto">{{ v.product_name }}</td>
                      <td data-label="Formato">{{ v.format }}</td>
                      <td data-label="SKU" class="mono">{{ v.sku || '—' }}</td>
                      <td class="num" data-label="Stock">
                        <adm-badge [tone]="v.stock === 0 ? 'danger' : 'warning'">{{ v.stock === 0 ? 'Agotado' : v.stock + ' uds' }}</adm-badge>
                      </td>
                      <td class="num" data-label="Aviso en">{{ v.low_stock_threshold }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="adm-muted">Todo el catálogo tiene stock suficiente ✔</p>
          }
        </section>

        <p class="adm-muted totals">Histórico: {{ s.total_orders }} pedidos pagados · {{ s.total_revenue | currency:'EUR' }} facturados ·
          hoy {{ s.orders_today }} pedidos ({{ s.revenue_today | currency:'EUR' }})</p>
      }
    </div>
  `,
  styles: [`
    .is-stale { opacity: 0.55; transition: opacity 0.2s; }
    .attention { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    .card-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin-bottom: 0.5rem; h2 { margin: 0; } }
    .chart { position: relative; }
    .chart svg { display: block; width: 100%; height: auto; overflow: visible; }
    .grid { stroke: #EDE9DF; stroke-width: 1; }
    .axis { stroke: #D9D3C5; stroke-width: 1; }
    .tick { fill: #6B6456; font: 11px 'Poppins', sans-serif; }
    .bar { fill: #A8443A; transition: fill 0.12s; }
    .bar.is-hover { fill: #7B1716; }
    .hit { fill: transparent; cursor: default; outline: none; }
    .tooltip { position: absolute; top: 0; transform: translateX(-50%); pointer-events: none; display: flex; flex-direction: column;
      padding: 0.45rem 0.65rem; background: #1C1A14; color: #F4F1E9; border-radius: 6px; font-size: 0.78rem; white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); .adm-muted { color: rgba(244,241,233,0.7); } }
    .table-view { max-height: 320px; overflow-y: auto; box-shadow: none; }
    .hbar { display: block; margin-bottom: 0.75rem; text-decoration: none; color: inherit; }
    .hbar--link:hover .hbar__fill { background: #7B1716; }
    .hbar__label { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.84rem; margin-bottom: 0.3rem; }
    .hbar__track { height: 8px; background: #EDE9DF; border-radius: 4px; overflow: hidden; }
    .hbar__fill { height: 100%; background: #A8443A; border-radius: 0 4px 4px 0; min-width: 2px; }
    .hbar__fill--muted { background: #8C7F6A; }
    .row-link { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; min-height: 40px; padding: 0.35rem 0;
      border-bottom: 1px solid var(--adm-border); text-decoration: none; color: inherit; &:last-child { border: 0; } &:hover { color: var(--adm-brand); }
      code { font-weight: 600; color: var(--adm-brand); } }
    .totals { font-size: 0.8rem; text-align: center; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  readonly W = CHART_W;
  readonly H = CHART_H;
  readonly PAD = PAD;
  readonly periods = [
    { days: 7, label: '7 días' },
    { days: 30, label: '30 días' },
    { days: 90, label: '90 días' },
    { days: 365, label: '12 meses' },
  ];

  period = signal(30);
  stats = signal<AdminDashboard | null>(null);
  lowStock = signal<LowStockVariant[]>([]);
  loading = signal(true);
  showTable = signal(false);
  hover = signal<Bar | null>(null);

  /** Backend period_end is exclusive (midnight of the next day). */
  periodEndLabel = computed(() => {
    const end = this.stats()?.period_end;
    return end ? new Date(new Date(end).getTime() - 86_400_000) : null;
  });

  private maxRevenue = computed(() => {
    const max = Math.max(0, ...(this.stats()?.daily_series ?? []).map(d => d.revenue));
    return niceMax(max);
  });

  yTicks = computed(() => {
    const max = this.maxRevenue();
    const plotH = CHART_H - PAD.top - PAD.bottom;
    return [0, 0.5, 1].map(f => ({
      value: max * f,
      y: PAD.top + plotH * (1 - f),
      label: max * f >= 1000 ? `${(max * f / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k €` : `${Math.round(max * f)} €`,
    }));
  });

  gap = computed(() => Math.max(1, this.slot() * 0.15));
  private slot = computed(() => (CHART_W - PAD.left - PAD.right) / Math.max(1, this.stats()?.daily_series.length ?? 1));

  bars = computed<Bar[]>(() => {
    const series = this.stats()?.daily_series ?? [];
    const slot = this.slot();
    const w = Math.max(1, Math.min(24, slot - 2)); // ≤24px, ≥2px surface gap
    const plotH = CHART_H - PAD.top - PAD.bottom;
    const max = this.maxRevenue() || 1;
    const base = CHART_H - PAD.bottom;
    return series.map((d, i) => {
      const h = (d.revenue / max) * plotH;
      const x = PAD.left + i * slot + (slot - w) / 2;
      const y = base - h;
      const r = Math.min(4, w / 2, h);
      // Rounded data-end (top), square at the baseline
      const path = `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${base} Z`;
      return { x, y, w, h, path, date: d.date, orders: d.orders, revenue: d.revenue };
    });
  });

  statusRows = computed(() =>
    Object.entries(this.stats()?.orders_by_status ?? {})
      .map(([status, count]) => ({ status, count, ...statusInfo(ORDER_STATUS, status) }))
      .sort((a, b) => b.count - a.count),
  );
  maxStatus = computed(() => Math.max(1, ...this.statusRows().map(r => r.count)));
  maxProduct = computed(() => Math.max(1, ...(this.stats()?.top_products ?? []).map(p => p.revenue)));

  ngOnInit(): void {
    this.load();
    this.api.lowStock().subscribe({ next: v => this.lowStock.set(v), error: () => this.lowStock.set([]) });
  }

  setPeriod(days: number): void {
    this.period.set(days);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.hover.set(null);
    this.api.dashboard({ period: this.period() }).subscribe({
      next: s => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar el dashboard');
      },
    });
  }

  /** Thin out x labels so they never collide (~8 labels max). */
  showXLabel(i: number): boolean {
    const n = this.bars().length;
    const step = Math.max(1, Math.ceil(n / 8));
    return i % step === 0;
  }

  pct(value: number, max: number): number {
    return max > 0 ? Math.max(2, (value / max) * 100) : 0;
  }

  scrollToStock(event: Event): void {
    event.preventDefault();
    document.getElementById('stock')?.scrollIntoView({ behavior: 'smooth' });
  }
}

/** Round an axis max up to a clean number (1, 2, 2.5, 5 × 10^n). */
function niceMax(v: number): number {
  if (v <= 0) return 100;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}
