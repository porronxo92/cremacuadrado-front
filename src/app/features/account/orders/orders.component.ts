import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderListItem } from '../../../core/models';

@Component({
  selector: 'app-account-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="orders-page">
      <h1>Mis pedidos</h1>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <h2>No tienes pedidos aún</h2>
          <p>Cuando realices tu primera compra, aparecerá aquí.</p>
          <a routerLink="/tienda" class="btn btn--primary">Explorar productos</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <div class="order-card">
              <div class="order-card__header">
                <div class="order-card__meta">
                  <span class="order-number">Pedido {{ order.order_number }}</span>
                  <span class="order-date">{{ order.created_at | date:'dd MMM yyyy' }}</span>
                </div>
                <span class="status-badge" [class]="'status--' + order.status">
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>

              <div class="order-card__body">
                @if (order.primary_image_url) {
                  <div class="order-card__thumb">
                    <img [src]="order.primary_image_url" [alt]="'Pedido ' + order.order_number" loading="lazy">
                  </div>
                }
                <div class="order-card__info">
                  <span class="order-items-count">{{ order.item_count }} artículo{{ order.item_count !== 1 ? 's' : '' }}</span>
                  <strong class="order-total">{{ order.total | currency:'EUR':'symbol':'1.2-2':'es' }}</strong>
                </div>
              </div>

              <div class="order-card__footer">
                @if (order.status === 'pending') {
                  <button class="btn btn--ghost btn--danger" (click)="cancelOrder(order.order_number)">
                    Cancelar
                  </button>
                }
                <button class="btn btn--outline" (click)="viewOrder(order)">
                  Ver detalles
                </button>
              </div>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button
              class="pagination__btn"
              (click)="loadOrders(currentPage() - 1)"
              [disabled]="currentPage() === 1">
              ← Anterior
            </button>
            <span class="pagination__info">{{ currentPage() }} / {{ totalPages() }}</span>
            <button
              class="pagination__btn"
              (click)="loadOrders(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()">
              Siguiente →
            </button>
          </div>
        }
      }

      <!-- Modal detalle de pedido -->
      @if (selectedOrder()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">

            <div class="modal__header">
              <div>
                <h2>Pedido {{ selectedOrder()!.order_number }}</h2>
                <span class="modal__date">{{ selectedOrder()!.created_at | date:'dd MMMM yyyy, HH:mm' }}</span>
              </div>
              <button class="modal__close" (click)="closeModal()" aria-label="Cerrar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="modal__body">

              <!-- Estado y seguimiento -->
              <div class="modal__section">
                <div class="modal__status-row">
                  <span class="status-badge status-badge--lg" [class]="'status--' + selectedOrder()!.status">
                    {{ getStatusLabel(selectedOrder()!.status) }}
                  </span>
                  @if (selectedOrder()!.tracking_number) {
                    <a
                      [href]="'https://www.correos.es/ss/Satellite/site/pagina-inicio_CA_correosexp/sidioma=es_ES#tracking=' + selectedOrder()!.tracking_number"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="tracking-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      {{ selectedOrder()!.tracking_number }}
                    </a>
                  }
                </div>
              </div>

              <!-- Productos -->
              <div class="modal__section">
                <h3 class="modal__section-title">Productos</h3>
                <div class="modal__items">
                  @for (item of selectedOrder()!.items; track item.id) {
                    <div class="modal__item">
                      @if (item.product_image_url) {
                        <div class="modal__item-img">
                          <img [src]="item.product_image_url" [alt]="item.product_name" loading="lazy">
                        </div>
                      } @else {
                        <div class="modal__item-img modal__item-img--placeholder">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      }
                      <div class="modal__item-info">
                        <span class="modal__item-name">{{ item.product_name }}</span>
                        @if (item.product_sku) {
                          <span class="modal__item-sku">{{ item.product_sku }}</span>
                        }
                      </div>
                      <div class="modal__item-qty">× {{ item.quantity }}</div>
                      <div class="modal__item-price">{{ item.total | currency:'EUR':'symbol':'1.2-2':'es' }}</div>
                    </div>
                  }
                </div>
              </div>

              <!-- Resumen de precios -->
              <div class="modal__section">
                <h3 class="modal__section-title">Resumen</h3>
                <div class="modal__price-table">
                  <div class="modal__price-row">
                    <span>Subtotal</span>
                    <span>{{ selectedOrder()!.subtotal | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                  </div>
                  <div class="modal__price-row">
                    <span>Envío</span>
                    <span>{{ selectedOrder()!.shipping_cost === 0 ? 'Gratis' : (selectedOrder()!.shipping_cost | currency:'EUR':'symbol':'1.2-2':'es') }}</span>
                  </div>
                  @if (selectedOrder()!.discount > 0) {
                    <div class="modal__price-row modal__price-row--discount">
                      <span>Descuento@if (selectedOrder()!.coupon_code) { <small>({{ selectedOrder()!.coupon_code }})</small> }</span>
                      <span>−{{ selectedOrder()!.discount | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                    </div>
                  }
                  <div class="modal__price-row modal__price-row--total">
                    <span>Total</span>
                    <span>{{ selectedOrder()!.total | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                  </div>
                </div>
              </div>

              <!-- Dirección de envío -->
              <div class="modal__section">
                <h3 class="modal__section-title">Dirección de envío</h3>
                <address class="modal__address">
                  {{ selectedOrder()!.shipping_address.first_name }} {{ selectedOrder()!.shipping_address.last_name }}<br>
                  {{ selectedOrder()!.shipping_address.street }}<br>
                  {{ selectedOrder()!.shipping_address.postal_code }} {{ selectedOrder()!.shipping_address.city }}<br>
                  {{ selectedOrder()!.shipping_address.province }}
                </address>
              </div>

            </div>

            <!-- Acciones del modal -->
            <div class="modal__footer">
              @if (canRequestInvoice(selectedOrder()!.status)) {
                <button
                  class="btn btn--outline"
                  [disabled]="requestingInvoice()"
                  (click)="requestInvoice(selectedOrder()!.order_number)">
                  @if (requestingInvoice()) {
                    <span class="btn-spinner"></span> Enviando...
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Recibir factura por email
                  }
                </button>
              }
              @if (selectedOrder()!.status === 'pending') {
                <button class="btn btn--ghost btn--danger" (click)="cancelOrder(selectedOrder()!.order_number)">
                  Cancelar pedido
                </button>
              }
              <button class="btn btn--primary" (click)="closeModal()">Cerrar</button>
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page {
      h1 {
        font-family: 'Teko', sans-serif;
        font-size: 2rem;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        color: var(--color-granate, #7B1716);
        margin: 0 0 2rem;
      }
    }

    /* ── Lista de pedidos ── */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-card {
      background: var(--color-card-bg, #EDE9DF);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--color-border, rgba(28,26,20,0.1));
    }

    .order-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1.25rem;
      background: rgba(28,26,20,0.04);
      border-bottom: 1px solid var(--color-border, rgba(28,26,20,0.1));
    }

    .order-card__meta {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .order-number {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--color-ink, #1C1A14);
    }

    .order-date {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      color: var(--color-muted, #6B6456);
    }

    .order-card__body {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
    }

    .order-card__thumb {
      width: 56px;
      height: 56px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: rgba(28,26,20,0.06);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .order-card__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .order-items-count {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      color: var(--color-muted, #6B6456);
    }

    .order-total {
      font-family: 'Poppins', sans-serif;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--color-ink, #1C1A14);
    }

    .order-card__footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--color-border, rgba(28,26,20,0.1));
    }

    /* ── Status badges ── */
    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;

      &.status-badge--lg {
        font-size: 0.85rem;
        padding: 0.3rem 0.9rem;
      }

      &.status--pending, &.status--pending_payment, &.status--payment_processing {
        background: #FEF3C7;
        color: #92400E;
      }

      &.status--processing, &.status--paid {
        background: #DBEAFE;
        color: #1E40AF;
      }

      &.status--shipped {
        background: #D1FAE5;
        color: #065F46;
      }

      &.status--delivered {
        background: #D1FAE5;
        color: #065F46;
      }

      &.status--payment_failed {
        background: #FEE2E2;
        color: #991B1B;
      }

      &.status--cancelled {
        background: #FEE2E2;
        color: #991B1B;
      }

      &.status--refunded {
        background: #F3F4F6;
        color: #374151;
      }
    }

    /* ── Botones ── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      border: 1.5px solid transparent;

      &--primary {
        background: var(--color-granate, #7B1716);
        color: #F4F1E9;
        border-color: var(--color-granate, #7B1716);

        &:hover {
          background: #5f1212;
          border-color: #5f1212;
        }
      }

      &--outline {
        background: transparent;
        color: var(--color-granate, #7B1716);
        border-color: var(--color-granate, #7B1716);

        &:hover {
          background: var(--color-granate, #7B1716);
          color: #F4F1E9;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &--ghost {
        background: transparent;
        border-color: transparent;
        color: var(--color-muted, #6B6456);

        &:hover {
          background: rgba(28,26,20,0.06);
        }
      }

      &--danger {
        color: #991B1B;

        &:hover {
          background: #FEE2E2;
          border-color: #991B1B;
        }
      }
    }

    /* ── Empty / loading ── */
    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      background: var(--color-card-bg, #EDE9DF);
      border-radius: 8px;

      svg {
        color: var(--color-muted, #6B6456);
        opacity: 0.4;
        margin-bottom: 1rem;
      }

      h2 {
        font-family: 'Lora', serif;
        color: var(--color-ink, #1C1A14);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--color-muted, #6B6456);
        margin-bottom: 1.5rem;
      }
    }

    .loading {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(123,23,22,0.15);
      border-top-color: var(--color-granate, #7B1716);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Paginación ── */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .pagination__btn {
      padding: 0.4rem 0.875rem;
      border: 1px solid var(--color-border, rgba(28,26,20,0.15));
      background: var(--color-card-bg, #EDE9DF);
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        border-color: var(--color-granate, #7B1716);
        color: var(--color-granate, #7B1716);
      }
    }

    .pagination__info {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      color: var(--color-muted, #6B6456);
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(28,26,20,0.55);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;

      @media (min-width: 640px) {
        align-items: center;
        padding: 1rem;
      }
    }

    .modal {
      background: var(--color-bg, #F4F1E9);
      width: 100%;
      max-width: 560px;
      max-height: 92dvh;
      display: flex;
      flex-direction: column;
      border-radius: 12px 12px 0 0;
      overflow: hidden;

      @media (min-width: 640px) {
        border-radius: 12px;
        max-height: 85vh;
      }
    }

    .modal__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-border, rgba(28,26,20,0.1));
      flex-shrink: 0;

      h2 {
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        font-size: 1rem;
        color: var(--color-ink, #1C1A14);
        margin: 0 0 0.2rem;
      }
    }

    .modal__date {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      color: var(--color-muted, #6B6456);
    }

    .modal__close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-muted, #6B6456);
      padding: 0.25rem;
      border-radius: 4px;
      line-height: 0;
      flex-shrink: 0;

      &:hover {
        color: var(--color-ink, #1C1A14);
        background: rgba(28,26,20,0.06);
      }
    }

    .modal__body {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .modal__section {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--color-border, rgba(28,26,20,0.08));

      &:last-child {
        border-bottom: none;
      }
    }

    .modal__section-title {
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-muted, #6B6456);
      margin: 0 0 0.75rem;
    }

    .modal__status-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .tracking-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--color-granate, #7B1716);
      text-decoration: none;
      border-bottom: 1px dashed currentColor;

      &:hover {
        border-bottom-style: solid;
      }
    }

    /* Líneas de producto en el modal */
    .modal__items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .modal__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .modal__item-img {
      width: 52px;
      height: 52px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: rgba(28,26,20,0.06);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &--placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-muted, #6B6456);
        opacity: 0.4;
      }
    }

    .modal__item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
    }

    .modal__item-name {
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-ink, #1C1A14);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .modal__item-sku {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      color: var(--color-muted, #6B6456);
    }

    .modal__item-qty {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      color: var(--color-muted, #6B6456);
      white-space: nowrap;
    }

    .modal__item-price {
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-ink, #1C1A14);
      white-space: nowrap;
    }

    /* Tabla de precios */
    .modal__price-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .modal__price-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      color: var(--color-ink, #1C1A14);

      span:first-child {
        color: var(--color-muted, #6B6456);
      }

      small {
        font-size: 0.75rem;
        margin-left: 0.25rem;
      }

      &--discount {
        color: #065F46;

        span:first-child {
          color: #065F46;
        }
      }

      &--total {
        padding-top: 0.5rem;
        margin-top: 0.25rem;
        border-top: 1px solid var(--color-border, rgba(28,26,20,0.12));
        font-weight: 700;
        font-size: 1rem;

        span:first-child {
          color: var(--color-ink, #1C1A14);
        }
      }
    }

    /* Dirección */
    .modal__address {
      font-style: normal;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      line-height: 1.7;
      color: var(--color-ink, #1C1A14);
    }

    /* Footer del modal */
    .modal__footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--color-border, rgba(28,26,20,0.1));
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .btn-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(123,23,22,0.3);
      border-top-color: var(--color-granate, #7B1716);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class AccountOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  selectedOrder = signal<Order | null>(null);
  requestingInvoice = signal(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(page: number = 1): void {
    this.loading.set(true);
    this.currentPage.set(page);

    this.orderService.getOrders(page).subscribe({
      next: (response) => {
        this.orders.set(response.items);
        this.totalPages.set(response.total_pages);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar los pedidos');
        this.loading.set(false);
      }
    });
  }

  viewOrder(order: OrderListItem): void {
    this.orderService.getOrder(order.order_number).subscribe({
      next: (fullOrder) => {
        this.selectedOrder.set(fullOrder);
      },
      error: () => {
        this.toastService.error('No se pudo cargar el detalle del pedido');
      }
    });
  }

  closeModal(): void {
    this.selectedOrder.set(null);
    this.requestingInvoice.set(false);
  }

  cancelOrder(orderNumber: string): void {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) return;

    this.orderService.cancelOrder(orderNumber).subscribe({
      next: () => {
        this.toastService.success('Pedido cancelado correctamente');
        this.closeModal();
        this.loadOrders(this.currentPage());
      },
      error: (err: Error) => {
        this.toastService.error('Error al cancelar el pedido: ' + err.message);
      }
    });
  }

  requestInvoice(orderNumber: string): void {
    this.requestingInvoice.set(true);
    this.orderService.requestInvoice(orderNumber).subscribe({
      next: () => {
        this.toastService.success('Te enviaremos la factura por email en unos minutos');
        this.requestingInvoice.set(false);
      },
      error: () => {
        this.toastService.error('No se pudo solicitar la factura. Inténtalo de nuevo.');
        this.requestingInvoice.set(false);
      }
    });
  }

  canRequestInvoice(status: string): boolean {
    return ['paid', 'processing', 'shipped', 'delivered'].includes(status);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'pending_payment': 'Pago pendiente',
      'payment_processing': 'Procesando pago',
      'payment_failed': 'Pago fallido',
      'paid': 'Pagado',
      'processing': 'Preparando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
    };
    return labels[status] || status;
  }
}
