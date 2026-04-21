import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-orders">
      <h1>Gestión de Pedidos</h1>
      
      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Estado:</label>
          <select [(ngModel)]="statusFilter" (change)="loadOrders()">
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="processing">En proceso</option>
            <option value="shipped">Enviados</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Buscar:</label>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Nº pedido o email..." (keyup.enter)="loadOrders()">
        </div>
      </div>
      
      @if (loading()) {
        <div class="loading">Cargando pedidos...</div>
      } @else {
        <div class="orders-table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <tr>
                  <td>
                    <strong>{{ order.order_number }}</strong>
                    <small>{{ order.item_count }} artículos</small>
                  </td>
                  <td>
                    <span>{{ order.shipping_address.first_name }} {{ order.shipping_address.last_name }}</span>
                  </td>
                  <td>{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td><strong>{{ order.total | currency:'EUR' }}</strong></td>
                  <td>
                    <span class="status-badge" [class]="'status--' + order.status">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="btn btn--icon" (click)="viewOrder(order)" title="Ver detalles">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <select 
                      class="status-select"
                      [value]="order.status"
                      (change)="updateStatus(order.id, $any($event.target).value)">
                      <option value="pending">Pendiente</option>
                      <option value="processing">En proceso</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">No hay pedidos</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">Anterior</button>
            <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
            <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()">Siguiente</button>
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
              <div class="order-grid">
                <div class="order-section">
                  <h3>Cliente</h3>
                  <p>
                    {{ selectedOrder()!.shipping_address.first_name }} {{ selectedOrder()!.shipping_address.last_name }}<br>
                    Tel: {{ selectedOrder()!.shipping_address.phone }}
                  </p>
                </div>
                
                <div class="order-section">
                  <h3>Dirección de envío</h3>
                  <p>
                    {{ selectedOrder()!.shipping_address.street }}<br>
                    {{ selectedOrder()!.shipping_address.postal_code }} {{ selectedOrder()!.shipping_address.city }}<br>
                    {{ selectedOrder()!.shipping_address.province }}, {{ selectedOrder()!.shipping_address.country }}
                  </p>
                </div>
              </div>
              
              <div class="order-section">
                <h3>Productos</h3>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selectedOrder()!.items; track item.id) {
                      <tr>
                        <td>{{ item.product_name }}</td>
                        <td>{{ item.unit_price | currency:'EUR' }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.total | currency:'EUR' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              
              <div class="order-totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>{{ selectedOrder()!.subtotal | currency:'EUR' }}</span>
                </div>
                <div class="total-row">
                  <span>Envío</span>
                  <span>{{ selectedOrder()!.shipping_cost | currency:'EUR' }}</span>
                </div>
                @if (selectedOrder()!.discount > 0) {
                  <div class="total-row discount">
                    <span>Descuento</span>
                    <span>-{{ selectedOrder()!.discount | currency:'EUR' }}</span>
                  </div>
                }
                <div class="total-row grand-total">
                  <span>Total</span>
                  <span>{{ selectedOrder()!.total | currency:'EUR' }}</span>
                </div>
              </div>
              
              @if (selectedOrder()!.customer_notes) {
                <div class="order-section">
                  <h3>Notas del cliente</h3>
                  <p class="notes">{{ selectedOrder()!.customer_notes }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-orders {
      h1 {
        margin: 0 0 2rem;
        color: #333;
      }
    }
    
    .filters {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      label {
        font-size: 0.9rem;
        color: #666;
      }
      
      select, input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
      }
      
      input {
        width: 200px;
      }
    }
    
    .orders-table-container {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .orders-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      
      th {
        background: #f9f9f9;
        font-weight: 600;
        font-size: 0.85rem;
        color: #666;
        text-transform: uppercase;
      }
      
      td {
        strong {
          display: block;
          color: #333;
        }
        
        small {
          color: #999;
          font-size: 0.8rem;
        }
        
        span {
          display: block;
        }
      }
      
      .empty {
        text-align: center;
        color: #666;
        padding: 2rem;
      }
    }
    
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
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
    
    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .btn--icon {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #666;
      border-radius: 4px;
      
      &:hover {
        background: #f5f5f5;
        color: #333;
      }
    }
    
    .status-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      
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
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
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
      max-width: 700px;
      max-height: 90vh;
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
        font-size: 1.2rem;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
      }
    }
    
    .modal-body {
      padding: 1.5rem;
    }
    
    .order-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      
      @media (max-width: 500px) {
        grid-template-columns: 1fr;
      }
    }
    
    .order-section {
      margin-bottom: 1.5rem;
      
      h3 {
        font-size: 0.85rem;
        color: #666;
        text-transform: uppercase;
        margin: 0 0 0.5rem;
      }
      
      p {
        margin: 0;
        color: #333;
        line-height: 1.6;
      }
      
      .notes {
        background: #f9f9f9;
        padding: 0.75rem;
        border-radius: 4px;
        font-style: italic;
      }
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #eee;
        font-size: 0.9rem;
      }
      
      th {
        background: #f9f9f9;
        font-weight: 500;
        color: #666;
      }
    }
    
    .order-totals {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      
      &.discount {
        color: #27ae60;
      }
      
      &.grand-total {
        font-weight: 700;
        font-size: 1.1rem;
        border-top: 1px solid #ddd;
        padding-top: 0.75rem;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  
  orders = signal<Order[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  selectedOrder = signal<Order | null>(null);
  
  statusFilter = '';
  searchTerm = '';
  
  ngOnInit(): void {
    this.loadOrders();
  }
  
  loadOrders(): void {
    this.loading.set(true);
    
    let url = `${environment.apiUrl}/admin/orders?page=${this.currentPage()}&limit=20`;
    if (this.statusFilter) {
      url += `&status=${this.statusFilter}`;
    }
    if (this.searchTerm) {
      url += `&search=${this.searchTerm}`;
    }
    
    this.http.get<{items: Order[], pages: number}>(url).subscribe({
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
  
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadOrders();
  }
  
  viewOrder(order: Order): void {
    this.selectedOrder.set(order);
  }
  
  closeModal(): void {
    this.selectedOrder.set(null);
  }
  
  updateStatus(orderId: number, status: string): void {
    this.http.patch(`${environment.apiUrl}/admin/orders/${orderId}/status`, { status }).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (err) => {
        this.toastService.error('Error al actualizar el estado: ' + err.message);
      }
    });
  }
  
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'En proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }
}
