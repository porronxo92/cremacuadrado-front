import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderListItem } from '../../../core/models';

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="account-dashboard">
      <div class="welcome-section">
        <h1>Hola, {{ authService.currentUser()?.first_name }}!</h1>
        <p>Bienvenido a tu cuenta de Cremacuadrado</p>
      </div>
      
      <div class="dashboard-grid">
        <!-- Quick links -->
        <div class="dashboard-card">
          <h2>Acceso rápido</h2>
          <nav class="quick-links">
            <a routerLink="/account/orders" class="quick-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>Mis pedidos</span>
            </a>
            <a routerLink="/account/profile" class="quick-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Mi perfil</span>
            </a>
            <a routerLink="/account/addresses" class="quick-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Direcciones</span>
            </a>
            <a routerLink="/catalog" class="quick-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span>Comprar</span>
            </a>
          </nav>
        </div>
        
        <!-- Recent orders -->
        <div class="dashboard-card">
          <div class="card-header">
            <h2>Pedidos recientes</h2>
            <a routerLink="/account/orders">Ver todos</a>
          </div>
          
          @if (loadingOrders()) {
            <div class="loading">Cargando pedidos...</div>
          } @else if (recentOrders().length === 0) {
            <div class="empty-state">
              <p>No tienes pedidos aún</p>
              <a routerLink="/catalog" class="btn btn--primary">Explorar productos</a>
            </div>
          } @else {
            <div class="orders-list">
              @for (order of recentOrders(); track order.id) {
                <div class="order-item">
                  <div class="order-info">
                    <span class="order-number">{{ order.order_number }}</span>
                    <span class="order-date">{{ order.created_at | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="order-status" [class]="'status--' + order.status">
                    {{ getStatusLabel(order.status) }}
                  </div>
                  <div class="order-total">
                    {{ order.total | currency:'EUR' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
        
        <!-- Account info -->
        <div class="dashboard-card">
          <h2>Información de cuenta</h2>
          <div class="account-info">
            <div class="info-row">
              <span class="label">Nombre</span>
              <span class="value">{{ authService.currentUser()?.first_name }} {{ authService.currentUser()?.last_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">Email</span>
              <span class="value">{{ authService.currentUser()?.email }}</span>
            </div>
            <div class="info-row">
              <span class="label">Teléfono</span>
              <span class="value">{{ authService.currentUser()?.phone || 'No especificado' }}</span>
            </div>
          </div>
          <a routerLink="/account/profile" class="btn btn--secondary">Editar perfil</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .account-dashboard {
      padding: 0;
    }
    
    .welcome-section {
      margin-bottom: 2rem;
      
      h1 {
        margin: 0 0 0.5rem;
        color: #333;
      }
      
      p {
        color: #666;
        margin: 0;
      }
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .dashboard-card {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      
      h2 {
        margin: 0 0 1rem;
        font-size: 1.1rem;
        color: #333;
      }
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      
      h2 {
        margin: 0;
      }
      
      a {
        font-size: 0.9rem;
        color: #4a7c4e;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .quick-links {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: all 0.3s;
      
      &:hover {
        background: #f0f7f0;
        color: #4a7c4e;
      }
      
      svg {
        color: #4a7c4e;
      }
      
      span {
        font-size: 0.9rem;
        font-weight: 500;
      }
    }
    
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .order-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border-radius: 4px;
    }
    
    .order-info {
      flex: 1;
      
      .order-number {
        display: block;
        font-weight: 500;
        color: #333;
        font-size: 0.9rem;
      }
      
      .order-date {
        font-size: 0.8rem;
        color: #666;
      }
    }
    
    .order-status {
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
    
    .order-total {
      font-weight: 600;
      color: #4a7c4e;
    }
    
    .account-info {
      margin-bottom: 1rem;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .label {
        color: #666;
        font-size: 0.9rem;
      }
      
      .value {
        color: #333;
        font-weight: 500;
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 1.5rem;
      
      p {
        color: #666;
        margin-bottom: 1rem;
      }
    }
    
    .loading {
      text-align: center;
      padding: 1.5rem;
      color: #666;
    }
    
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      text-decoration: none;
      font-size: 0.9rem;
      cursor: pointer;
      border: none;
      
      &--primary {
        background: #4a7c4e;
        color: #fff;
        
        &:hover {
          background: #3d6640;
        }
      }
      
      &--secondary {
        background: #f5f5f5;
        color: #333;
        
        &:hover {
          background: #eee;
        }
      }
    }
  `]
})
export class AccountDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private orderService = inject(OrderService);
  
  recentOrders = signal<OrderListItem[]>([]);
  loadingOrders = signal(true);
  
  ngOnInit(): void {
    this.loadRecentOrders();
  }
  
  loadRecentOrders(): void {
    this.orderService.getOrders(1, 3).subscribe({
      next: (response) => {
        this.recentOrders.set(response.items);
        this.loadingOrders.set(false);
      },
      error: () => {
        this.loadingOrders.set(false);
      }
    });
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
