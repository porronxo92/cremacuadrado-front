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
          <a routerLink="/catalog" class="btn btn--primary">Explorar productos</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <div class="order-card">
              <div class="order-header">
                <div class="order-info">
                  <span class="order-number">Pedido {{ order.order_number }}</span>
                  <span class="order-date">{{ order.created_at | date:'dd MMMM yyyy' }}</span>
                </div>
                <div class="order-status" [class]="'status--' + order.status">
                  {{ getStatusLabel(order.status) }}
                </div>
              </div>
              
              <div class="order-summary-brief">
                <span>{{ order.item_count }} artículo(s)</span>
              </div>
              
              <div class="order-footer">
                <div class="order-total">
                  <span>Total:</span>
                  <strong>{{ order.total | currency:'EUR' }}</strong>
                </div>
                <div class="order-actions">
                  @if (order.status === 'pending') {
                    <button class="btn btn--outline" (click)="cancelOrder(order.order_number)">Cancelar pedido</button>
                  }
                  <button class="btn btn--secondary" (click)="viewOrder(order)">Ver detalles</button>
                </div>
              </div>
            </div>
          }
        </div>
        
        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button 
              (click)="loadOrders(currentPage() - 1)"
              [disabled]="currentPage() === 1">
              Anterior
            </button>
            <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
            <button 
              (click)="loadOrders(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()">
              Siguiente
            </button>
          </div>
        }
      }
      
      <!-- Order detail modal -->
      @if (selectedOrder()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Pedido {{ selectedOrder()!.order_number }}</h2>
              <button class="close-btn" (click)="closeModal()">×</button>
            </div>
            
            <div class="modal-body">
              <div class="detail-section">
                <h3>Estado</h3>
                <div class="order-status" [class]="'status--' + selectedOrder()!.status">
                  {{ getStatusLabel(selectedOrder()!.status) }}
                </div>
              </div>
              
              <div class="detail-section">
                <h3>Productos</h3>
                @for (item of selectedOrder()!.items; track item.id) {
                  <div class="detail-item">
                    <span>{{ item.product_name }} × {{ item.quantity }}</span>
                    <span>{{ item.total | currency:'EUR' }}</span>
                  </div>
                }
              </div>
              
              <div class="detail-section">
                <h3>Resumen</h3>
                <div class="detail-item">
                  <span>Subtotal</span>
                  <span>{{ selectedOrder()!.subtotal | currency:'EUR' }}</span>
                </div>
                <div class="detail-item">
                  <span>Envío</span>
                  <span>{{ selectedOrder()!.shipping_cost | currency:'EUR' }}</span>
                </div>
                @if (selectedOrder()!.discount > 0) {
                  <div class="detail-item discount">
                    <span>Descuento</span>
                    <span>-{{ selectedOrder()!.discount | currency:'EUR' }}</span>
                  </div>
                }
                <div class="detail-item total">
                  <span>Total</span>
                  <span>{{ selectedOrder()!.total | currency:'EUR' }}</span>
                </div>
              </div>
              
              <div class="detail-section">
                <h3>Dirección de envío</h3>
                <p>
                  {{ selectedOrder()!.shipping_address.first_name }} {{ selectedOrder()!.shipping_address.last_name }}<br>
                  {{ selectedOrder()!.shipping_address.street }}<br>
                  {{ selectedOrder()!.shipping_address.postal_code }} {{ selectedOrder()!.shipping_address.city }}<br>
                  {{ selectedOrder()!.shipping_address.province }}, {{ selectedOrder()!.shipping_address.country }}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page {
      h1 {
        margin: 0 0 2rem;
        color: #333;
      }
    }
    
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .order-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f9f9f9;
      border-bottom: 1px solid #eee;
    }
    
    .order-info {
      .order-number {
        display: block;
        font-weight: 600;
        color: #333;
      }
      
      .order-date {
        font-size: 0.85rem;
        color: #666;
      }
    }
    
    .order-status {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      
      &.status--pending {
        background: #fff3cd;
        color: #856404;
      }
      
      &.status--processing {
        background: #cce5ff;
        color: #004085;
      }
      
      &.status--shipped {
        background: #d4edda;
        color: #155724;
      }
      
      &.status--delivered {
        background: #d4edda;
        color: #155724;
      }
      
      &.status--cancelled {
        background: #f8d7da;
        color: #721c24;
      }
    }
    
    .order-items {
      padding: 1rem 1.5rem;
    }
    
    .order-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .item-image {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .item-info {
      flex: 1;
      
      h4 {
        margin: 0 0 0.25rem;
        font-size: 0.95rem;
        color: #333;
      }
      
      p {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
      }
    }
    
    .item-total {
      font-weight: 600;
      color: #333;
    }
    
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f9f9f9;
      border-top: 1px solid #eee;
    }
    
    .order-total {
      span {
        color: #666;
        margin-right: 0.5rem;
      }
      
      strong {
        font-size: 1.1rem;
        color: #4a7c4e;
      }
    }
    
    .order-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s;
      
      &--primary {
        background: #4a7c4e;
        color: #fff;
        border: none;
        
        &:hover {
          background: #3d6640;
        }
      }
      
      &--secondary {
        background: #333;
        color: #fff;
        border: none;
        
        &:hover {
          background: #222;
        }
      }
      
      &--outline {
        background: none;
        border: 1px solid #ddd;
        color: #666;
        
        &:hover {
          border-color: #e74c3c;
          color: #e74c3c;
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      background: #fff;
      border-radius: 8px;
      
      svg {
        color: #ccc;
        margin-bottom: 1rem;
      }
      
      h2 {
        color: #333;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #666;
        margin-bottom: 1.5rem;
      }
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #eee;
      border-top-color: #4a7c4e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      
      button {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        background: #fff;
        border-radius: 4px;
        cursor: pointer;
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &:hover:not(:disabled) {
          border-color: #4a7c4e;
          color: #4a7c4e;
        }
      }
      
      span {
        color: #666;
      }
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    
    .modal {
      background: #fff;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #eee;
      
      h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        
        &:hover {
          color: #333;
        }
      }
    }
    
    .modal-body {
      padding: 1.5rem;
    }
    
    .detail-section {
      margin-bottom: 1.5rem;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      h3 {
        font-size: 0.9rem;
        color: #666;
        margin: 0 0 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      p {
        margin: 0;
        color: #333;
        line-height: 1.6;
      }
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      
      &.discount {
        color: #27ae60;
      }
      
      &.total {
        font-weight: 700;
        font-size: 1.1rem;
        border-top: 1px solid #eee;
        padding-top: 0.75rem;
        margin-top: 0.5rem;
      }
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
  
  ngOnInit(): void {
    this.loadOrders(1);
  }
  
  loadOrders(page: number): void {
    this.loading.set(true);
    this.currentPage.set(page);
    
    this.orderService.getOrders(page, 10).subscribe({
      next: (response) => {
        this.orders.set(response.items);
        this.totalPages.set(response.pages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  
  viewOrder(order: OrderListItem): void {
    this.orderService.getOrder(order.order_number).subscribe({
      next: (fullOrder) => {
        this.selectedOrder.set(fullOrder);
      }
    });
  }
  
  closeModal(): void {
    this.selectedOrder.set(null);
  }
  
  cancelOrder(orderNumber: string): void {
    if (confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
      this.orderService.cancelOrder(orderNumber).subscribe({
        next: () => {
          this.loadOrders(this.currentPage());
        },
        error: (err: Error) => {
          this.toastService.error('Error al cancelar el pedido: ' + err.message);
        }
      });
    }
  }
  
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }
}
