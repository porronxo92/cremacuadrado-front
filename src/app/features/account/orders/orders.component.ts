import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { InvoiceSummary, Order, OrderListItem } from '../../../core/models';
import { saveBlob } from '../../../core/utils/save-blob';

@Component({
    selector: 'app-account-orders',
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

      <!-- Modal detalle de pedido: diálogo accesible (foco atrapado, Esc, foco devuelto) -->
      @if (selectedOrder(); as o) {
        <div class="modal-overlay" (click)="closeModal()">
          <div #dialog class="modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title"
               (click)="$event.stopPropagation()" (keydown)="onDialogKeydown($event)">

            <header class="modal__header">
              <div class="modal__heading">
                <span class="modal__eyebrow">Pedido</span>
                <h2 id="order-modal-title">{{ o.order_number }}</h2>
                <span class="modal__date">{{ o.created_at | date:"d 'de' MMMM 'de' y, HH:mm" }}</span>
              </div>
              <button #closeBtn type="button" class="modal__close" (click)="closeModal()" aria-label="Cerrar detalle del pedido">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </header>

            <div class="modal__body">

              <!-- Estado -->
              <section class="modal__section" aria-label="Estado del pedido">
                <div class="modal__status-row">
                  <span [class]="'status-badge status-badge--lg status--' + o.status">
                    {{ getStatusLabel(o.status) }}
                  </span>
                  @if (getStatusHelp(o.status); as help) {
                    <p class="modal__status-help">{{ help }}</p>
                  }
                </div>

                @if (stepIndex(o.status) >= 0) {
                  <ol class="steps">
                    @for (step of steps; track step.key; let i = $index) {
                      <li class="steps__item"
                          [class.is-done]="i < stepIndex(o.status)"
                          [class.is-current]="i === stepIndex(o.status)"
                          [attr.aria-current]="i === stepIndex(o.status) ? 'step' : null">
                        <span class="steps__dot" aria-hidden="true">
                          @if (i <= stepIndex(o.status)) {
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </span>
                        <span class="steps__label">{{ step.label }}</span>
                      </li>
                    }
                  </ol>
                }

                @if (o.tracking_number) {
                  <a class="tracking-link"
                     [href]="'https://www.correos.es/ss/Satellite/site/pagina-inicio_CA_correosexp/sidioma=es_ES#tracking=' + o.tracking_number"
                     target="_blank" rel="noopener noreferrer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    <span>Seguir el envío en Correos <small>{{ o.tracking_number }}</small></span>
                    <span class="visually-hidden">(se abre en una pestaña nueva)</span>
                  </a>
                }
              </section>

              <!-- Productos -->
              <section class="modal__section" aria-labelledby="order-modal-items">
                <h3 id="order-modal-items" class="modal__section-title">Productos</h3>
                <ul class="modal__items">
                  @for (item of o.items; track item.id) {
                    <li class="modal__item">
                      <div class="modal__item-img" [class.modal__item-img--placeholder]="!item.product_image_url">
                        @if (item.product_image_url) {
                          <img [src]="item.product_image_url" alt="" loading="lazy" width="56" height="56">
                        } @else {
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        }
                      </div>
                      <div class="modal__item-info">
                        <span class="modal__item-name">
                          {{ item.product_name }}
                          @if (formatFromSku(item.product_sku); as fmt) { <span class="modal__item-format">{{ fmt }}</span> }
                        </span>
                        <span class="modal__item-unit">{{ item.quantity }} × {{ toNumber(item.unit_price) | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                      </div>
                      <span class="modal__item-price">{{ toNumber(item.total) | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                    </li>
                  }
                </ul>
              </section>

              <!-- Resumen -->
              <section class="modal__section" aria-labelledby="order-modal-summary">
                <h3 id="order-modal-summary" class="modal__section-title">Resumen</h3>
                <dl class="modal__price-table">
                  <div class="modal__price-row">
                    <dt>Subtotal</dt>
                    <dd>{{ toNumber(o.subtotal) | currency:'EUR':'symbol':'1.2-2':'es' }}</dd>
                  </div>
                  @if (toNumber(o.discount) > 0) {
                    <div class="modal__price-row modal__price-row--discount">
                      <dt>Descuento @if (o.coupon_code) { <small>{{ o.coupon_code }}</small> }</dt>
                      <dd>−{{ toNumber(o.discount) | currency:'EUR':'symbol':'1.2-2':'es' }}</dd>
                    </div>
                  }
                  <div class="modal__price-row">
                    <dt>Envío</dt>
                    <dd>{{ toNumber(o.shipping_cost) === 0 ? 'Gratis' : (toNumber(o.shipping_cost) | currency:'EUR':'symbol':'1.2-2':'es') }}</dd>
                  </div>
                  <div class="modal__price-row modal__price-row--total">
                    <dt>Total <small>IVA incluido</small></dt>
                    <dd>{{ toNumber(o.total) | currency:'EUR':'symbol':'1.2-2':'es' }}</dd>
                  </div>
                </dl>
              </section>

              <!-- Dirección -->
              <section class="modal__section" aria-labelledby="order-modal-address">
                <h3 id="order-modal-address" class="modal__section-title">Dirección de envío</h3>
                <address class="modal__address">
                  <strong>{{ o.shipping_address.first_name }} {{ o.shipping_address.last_name }}</strong><br>
                  {{ o.shipping_address.street }}<br>
                  {{ o.shipping_address.postal_code }} {{ o.shipping_address.city }}<br>
                  {{ o.shipping_address.province }}
                </address>
              </section>

              <!-- Facturas -->
              @if (canRequestInvoice(o.status)) {
                <section class="modal__section" aria-labelledby="order-modal-invoices">
                  <h3 id="order-modal-invoices" class="modal__section-title">Facturas</h3>
                  @if (orderInvoices().length > 0) {
                    <ul class="invoices">
                      @for (inv of orderInvoices(); track inv.invoice_number) {
                        <li class="invoices__item">
                          <svg class="invoices__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <div class="invoices__info">
                            <strong>{{ inv.invoice_type === 'corrective' ? 'Rectificativa' : 'Factura' }} {{ inv.invoice_number }}</strong>
                            <span>{{ inv.issued_at + 'Z' | date:'dd/MM/yyyy' }} · {{ toNumber(inv.total) | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
                          </div>
                          <button type="button" class="btn btn--outline btn--compact"
                            [disabled]="downloadingInvoice() === inv.invoice_number"
                            [attr.aria-busy]="downloadingInvoice() === inv.invoice_number"
                            (click)="downloadInvoice(o.order_number, inv.invoice_number)"
                            [attr.aria-label]="'Descargar PDF de la factura ' + inv.invoice_number">
                            {{ downloadingInvoice() === inv.invoice_number ? 'Descargando…' : 'PDF' }}
                          </button>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="modal__muted">La factura de este pedido aún no está emitida. Al descargarla se genera en el momento.</p>
                  }
                  <button type="button" class="link-btn" [disabled]="requestingInvoice()" [attr.aria-busy]="requestingInvoice()"
                    (click)="requestInvoice(o.order_number)">
                    @if (requestingInvoice()) { <span class="btn-spinner" aria-hidden="true"></span> Enviando… }
                    @else { Recibir la factura por email }
                  </button>
                </section>
              }
            </div>

            <!-- Acciones -->
            <footer class="modal__footer">
              @if (o.status === 'pending') {
                <button type="button" class="btn btn--ghost btn--danger" (click)="cancelOrder(o.order_number)">Cancelar pedido</button>
              }
              @if (canRequestInvoice(o.status) && orderInvoices().length === 0) {
                <button type="button" class="btn btn--primary"
                  [disabled]="downloadingInvoice() !== null" [attr.aria-busy]="downloadingInvoice() !== null"
                  (click)="downloadInvoice(o.order_number)">
                  {{ downloadingInvoice() ? 'Descargando…' : 'Descargar factura' }}
                </button>
              } @else {
                <button type="button" class="btn btn--primary" (click)="closeModal()">Cerrar</button>
              }
            </footer>

          </div>
        </div>
      }
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
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

    /* ── Modal (diálogo; hoja inferior en móvil) ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(28,26,20,0.55);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
      animation: fade-in 150ms ease-out;

      @media (min-width: 640px) {
        align-items: center;
        padding: 1.5rem;
      }
    }

    .modal {
      background: var(--color-bg, #F4F1E9);
      width: 100%;
      max-width: 560px;
      max-height: 92dvh;
      display: flex;
      flex-direction: column;
      border-radius: 16px 16px 0 0;
      overflow: hidden;
      box-shadow: 0 -8px 32px rgba(28,26,20,0.18);
      animation: sheet-in 220ms ease-out;

      @media (min-width: 640px) {
        border-radius: 12px;
        max-height: 88dvh;
        box-shadow: 0 16px 48px rgba(28,26,20,0.25);
        animation-name: pop-in;
      }
    }

    @keyframes fade-in { from { opacity: 0; } }
    @keyframes sheet-in { from { transform: translateY(24px); opacity: 0; } }
    @keyframes pop-in { from { transform: scale(0.97); opacity: 0; } }

    .modal__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 1rem 1rem 1.5rem;
      border-bottom: 1px solid var(--color-border, rgba(28,26,20,0.1));
      flex-shrink: 0;

      h2 {
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        font-size: 1.125rem;
        letter-spacing: 0.01em;
        color: var(--color-ink, #1C1A14);
        margin: 0.1rem 0 0.15rem;
        overflow-wrap: anywhere;
      }
    }

    .modal__eyebrow {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-granate, #7B1716);
    }

    .modal__date {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      color: var(--color-muted, #6B6456);
    }

    .modal__close {
      width: 48px;
      height: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: var(--color-ink, #1C1A14);
      flex-shrink: 0;
      margin-top: -0.4rem;
      transition: background 150ms;

      &:hover { background: rgba(28,26,20,0.07); }
    }

    .modal__body {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .modal__section {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-border, rgba(28,26,20,0.08));

      &:last-child { border-bottom: none; }
    }

    .modal__section-title {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-muted, #6B6456);
      margin: 0 0 0.75rem;
    }

    .modal__muted {
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--color-muted, #6B6456);
      margin: 0 0 0.5rem;
    }

    /* Estado */
    .modal__status-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .modal__status-help {
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      color: var(--color-ink, #1C1A14);
      margin: 0;
    }

    .steps {
      list-style: none;
      margin: 1.25rem 0 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }

    .steps__item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      text-align: center;

      // Línea que une cada paso con el anterior
      &:not(:first-child)::before {
        content: '';
        position: absolute;
        top: 11px;
        right: 50%;
        width: 100%;
        height: 2px;
        background: rgba(28,26,20,0.15);
      }

      &.is-done:not(:first-child)::before,
      &.is-current:not(:first-child)::before { background: var(--color-granate, #7B1716); }
    }

    .steps__dot {
      position: relative;
      z-index: 1;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg, #F4F1E9);
      border: 2px solid rgba(28,26,20,0.3);
      color: var(--color-bg, #F4F1E9);
    }

    .is-done .steps__dot,
    .is-current .steps__dot {
      background: var(--color-granate, #7B1716);
      border-color: var(--color-granate, #7B1716);
    }

    .steps__label {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      color: var(--color-muted, #6B6456);
    }

    .is-current .steps__label {
      color: var(--color-ink, #1C1A14);
      font-weight: 600;
    }

    .tracking-link {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-height: 48px;
      margin-top: 1rem;
      padding: 0.6rem 0.9rem;
      border: 1px solid rgba(28,26,20,0.15);
      border-radius: 8px;
      background: var(--color-card-bg, #EDE9DF);
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-granate, #7B1716);
      text-decoration: none;

      small {
        display: block;
        font-size: 0.75rem;
        font-weight: 400;
        color: var(--color-muted, #6B6456);
      }

      &:hover { border-color: var(--color-granate, #7B1716); }
    }

    /* Productos */
    .modal__items {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .modal__item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .modal__item-img {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-card-bg, #EDE9DF);

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
      }
    }

    .modal__item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .modal__item-name {
      font-family: 'Poppins', sans-serif;
      font-size: 0.9375rem;
      font-weight: 500;
      line-height: 1.35;
      color: var(--color-ink, #1C1A14);
    }

    .modal__item-format {
      display: inline-block;
      margin-left: 0.2rem;
      padding: 0.05rem 0.45rem;
      border-radius: 999px;
      background: var(--color-card-bg, #EDE9DF);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-ink, #1C1A14);
      vertical-align: 0.1em;
    }

    .modal__item-unit {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8125rem;
      color: var(--color-muted, #6B6456);
      font-variant-numeric: tabular-nums;
    }

    .modal__item-price {
      font-family: 'Poppins', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-ink, #1C1A14);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    /* Resumen */
    .modal__price-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0;
    }

    .modal__price-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;

      dt { color: var(--color-muted, #6B6456); }
      dd { margin: 0; color: var(--color-ink, #1C1A14); font-variant-numeric: tabular-nums; }

      small {
        font-size: 0.75rem;
        margin-left: 0.25rem;
        font-weight: 400;
      }

      &--discount dt,
      &--discount dd { color: #065F46; }

      &--total {
        padding-top: 0.75rem;
        margin-top: 0.25rem;
        border-top: 1px solid rgba(28,26,20,0.12);

        dt { color: var(--color-ink, #1C1A14); font-weight: 600; }
        dt small { color: var(--color-muted, #6B6456); }
        dd { font-weight: 700; font-size: 1.125rem; }
      }
    }

    /* Dirección */
    .modal__address {
      font-style: normal;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--color-ink, #1C1A14);

      strong { font-weight: 600; }
    }

    /* Facturas */
    .invoices {
      list-style: none;
      margin: 0 0 0.5rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .invoices__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.6rem 0.6rem 0.85rem;
      border: 1px solid rgba(28,26,20,0.12);
      border-radius: 8px;
      background: var(--color-card-bg, #EDE9DF);
    }

    .invoices__icon {
      flex-shrink: 0;
      color: var(--color-granate, #7B1716);
    }

    .invoices__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      font-family: 'Poppins', sans-serif;

      strong { font-size: 0.875rem; font-weight: 600; color: var(--color-ink, #1C1A14); }
      span { font-size: 0.8125rem; color: var(--color-muted, #6B6456); font-variant-numeric: tabular-nums; }
    }

    .btn--compact {
      min-height: 44px;
      padding: 0.4rem 1rem;
      font-size: 0.8125rem;
      flex-shrink: 0;
    }

    .link-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      min-height: 44px;
      padding: 0;
      background: none;
      border: none;
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-granate, #7B1716);
      text-decoration: underline;
      text-underline-offset: 3px;

      &:disabled { cursor: progress; opacity: 0.7; }
    }

    /* Acciones */
    .modal__footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem calc(1rem + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid var(--color-border, rgba(28,26,20,0.1));
      flex-shrink: 0;
      flex-wrap: wrap;

      .btn { min-height: 48px; }

      @media (max-width: 639px) {
        .btn { flex: 1 1 auto; justify-content: center; }
      }
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

    .visually-hidden {
      position: absolute !important;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class AccountOrdersComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private document = inject(DOCUMENT);

  @ViewChild('dialog') private dialogRef?: ElementRef<HTMLElement>;
  @ViewChild('closeBtn') private set closeBtn(el: ElementRef<HTMLButtonElement> | undefined) {
    // El modal se crea al cargar el pedido: el foco entra en cuanto existe el botón de cerrar
    if (el && !this.focusedOnOpen) {
      this.focusedOnOpen = true;
      setTimeout(() => el.nativeElement.focus());
    }
  }
  private focusedOnOpen = false;
  private returnFocusTo: HTMLElement | null = null;

  /** Pasos visibles del progreso del pedido (los demás estados no muestran la barra). */
  readonly steps = [
    { key: 'paid', label: 'Pagado' },
    { key: 'processing', label: 'Preparando' },
    { key: 'shipped', label: 'Enviado' },
    { key: 'delivered', label: 'Entregado' },
  ];

  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  selectedOrder = signal<Order | null>(null);
  requestingInvoice = signal(false);
  orderInvoices = signal<InvoiceSummary[]>([]);
  downloadingInvoice = signal<string | null>(null);

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
        this.toastService.error('No hemos podido cargar tus pedidos');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  viewOrder(order: OrderListItem): void {
    this.returnFocusTo = this.document.activeElement as HTMLElement | null;
    this.orderService.getOrder(order.order_number).subscribe({
      next: (fullOrder) => {
        this.focusedOnOpen = false;
        this.document.body.style.overflow = 'hidden';
        this.selectedOrder.set(fullOrder);
        this.loadInvoices(fullOrder);
      },
      error: () => {
        this.toastService.error('No se pudo cargar el detalle del pedido');
      }
    });
  }

  closeModal(): void {
    if (!this.selectedOrder()) return;
    this.selectedOrder.set(null);
    this.requestingInvoice.set(false);
    this.orderInvoices.set([]);
    this.document.body.style.overflow = '';
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target?.isConnected) setTimeout(() => target.focus());
  }

  /** Esc cierra; Tab y Mayús+Tab quedan dentro del diálogo. */
  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
      return;
    }
    if (event.key !== 'Tab' || !this.dialogRef) return;
    const focusable = Array.from(
      this.dialogRef.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && (active === first || !this.dialogRef.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** La API serializa los importes Decimal como texto ("0.00"). */
  toNumber(value: number | string | null | undefined): number {
    return Number(value ?? 0);
  }

  /** Formato legible a partir del SKU (CP-PURA-100 → 100 g, …-1000/-1KG → 1 kg). */
  formatFromSku(sku: string | null): string | null {
    const match = sku?.match(/-(\d+)(G|KG)?$/i);
    if (!match) return null;
    const grams = match[2]?.toUpperCase() === 'KG' ? Number(match[1]) * 1000 : Number(match[1]);
    return grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`;
  }

  stepIndex(status: string): number {
    return this.steps.findIndex(s => s.key === status);
  }

  getStatusHelp(status: string): string | null {
    const help: Record<string, string> = {
      paid: 'Hemos recibido el pago. En breve empezamos a prepararlo.',
      processing: 'Estamos preparando tu pedido.',
      shipped: 'Tu pedido va de camino.',
      delivered: 'Pedido entregado. ¡Que lo disfrutes!',
      pending: 'Pendiente de pago.',
      pending_payment: 'Pendiente de pago.',
      payment_processing: 'Estamos confirmando el pago.',
      payment_failed: 'El pago no se completó.',
      cancelled: 'Este pedido está cancelado.',
      refunded: 'Te hemos devuelto el importe.',
      partially_refunded: 'Te hemos devuelto parte del importe.',
    };
    return help[status] ?? null;
  }

  private loadInvoices(order: Order): void {
    this.orderInvoices.set([]);
    if (!this.canRequestInvoice(order.status)) return;
    this.orderService.getInvoices(order.order_number).subscribe({
      next: (invoices) => this.orderInvoices.set(invoices),
      error: () => this.orderInvoices.set([]),
    });
  }

  downloadInvoice(orderNumber: string, invoiceNumber?: string): void {
    this.downloadingInvoice.set(invoiceNumber ?? orderNumber);
    this.orderService.downloadInvoice(orderNumber, invoiceNumber).subscribe({
      next: (blob) => {
        saveBlob(blob, `Factura_${invoiceNumber ?? orderNumber}.pdf`);
        this.downloadingInvoice.set(null);
        // First download of an older order issues the invoice: refresh the list
        if (!invoiceNumber && this.selectedOrder()) this.loadInvoices(this.selectedOrder()!);
      },
      error: () => {
        this.toastService.error('No se pudo descargar la factura. Inténtalo de nuevo.');
        this.downloadingInvoice.set(null);
      }
    });
  }

  cancelOrder(orderNumber: string): void {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) return;

    this.orderService.cancelOrder(orderNumber).subscribe({
      next: () => {
        this.toastService.success('Pedido cancelado');
        this.closeModal();
        this.loadOrders(this.currentPage());
      },
      error: (err: Error) => {
        this.toastService.error('No hemos podido cancelar el pedido: ' + err.message);
      }
    });
  }

  requestInvoice(orderNumber: string): void {
    this.requestingInvoice.set(true);
    this.orderService.requestInvoice(orderNumber).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Factura enviada por email');
        this.requestingInvoice.set(false);
        if (this.selectedOrder()) this.loadInvoices(this.selectedOrder()!);
      },
      error: () => {
        this.toastService.error('No se pudo solicitar la factura. Inténtalo de nuevo.');
        this.requestingInvoice.set(false);
      }
    });
  }

  canRequestInvoice(status: string): boolean {
    return ['paid', 'processing', 'shipped', 'delivered', 'partially_refunded', 'refunded'].includes(status);
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
      'partially_refunded': 'Reembolso parcial',
    };
    return labels[status] || status;
  }
}
