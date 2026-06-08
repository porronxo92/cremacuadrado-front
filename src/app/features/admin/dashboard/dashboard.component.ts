import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_customers: number;
  orders_today: number;
  revenue_today: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dashboard">
      <h1>Panel de Administración</h1>
      
      @if (loading()) {
        <div class="loading">Cargando estadísticas...</div>
      } @else {
        <!-- Stats cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon orders">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.total_orders || 0 }}</span>
              <span class="stat-label">Pedidos totales</span>
            </div>
          </div>
          
          <div class="stat-card highlight">
            <div class="stat-icon pending">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.pending_orders || 0 }}</span>
              <span class="stat-label">Pedidos pendientes</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon revenue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.total_revenue || 0 | currency:'EUR' }}</span>
              <span class="stat-label">Ingresos totales</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon customers">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.total_customers || 0 }}</span>
              <span class="stat-label">Clientes</span>
            </div>
          </div>
        </div>
        
        <!-- Today's stats -->
        <div class="today-stats">
          <h2>Hoy</h2>
          <div class="today-grid">
            <div class="today-card">
              <span class="today-value">{{ stats()?.orders_today || 0 }}</span>
              <span class="today-label">Pedidos</span>
            </div>
            <div class="today-card">
              <span class="today-value">{{ stats()?.revenue_today || 0 | currency:'EUR' }}</span>
              <span class="today-label">Ingresos</span>
            </div>
          </div>
        </div>
        
        <!-- Quick links -->
        <div class="quick-actions">
          <h2>Acciones rápidas</h2>
          <div class="actions-grid">
            <a routerLink="/admin/orders" class="action-card">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>Gestionar pedidos</span>
            </a>
            <a routerLink="/admin/products" class="action-card">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m7.5 4.27 9 5.15"></path>
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="M12 22V12"></path>
              </svg>
              <span>Gestionar productos</span>
            </a>
            <a routerLink="/tienda" class="action-card">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>Ver tienda</span>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-dashboard {
      h1 {
        margin: 0 0 2rem;
        color: #333;
      }
      
      h2 {
        margin: 0 0 1rem;
        font-size: 1.1rem;
        color: #666;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      
      &.highlight {
        border: 2px solid #f39c12;
      }
    }
    
    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.orders {
        background: #e3f2fd;
        color: #1976d2;
      }
      
      &.pending {
        background: #fff3e0;
        color: #f57c00;
      }
      
      &.revenue {
        background: #e8f5e9;
        color: #388e3c;
      }
      
      &.customers {
        background: #f3e5f5;
        color: #7b1fa2;
      }
    }
    
    .stat-info {
      .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #333;
      }
      
      .stat-label {
        font-size: 0.85rem;
        color: #666;
      }
    }
    
    .today-stats {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .today-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .today-card {
      text-align: center;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
      
      .today-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #4a7c4e;
      }
      
      .today-label {
        font-size: 0.85rem;
        color: #666;
      }
    }
    
    .quick-actions {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    
    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
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
        font-weight: 500;
        text-align: center;
      }
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadStats();
  }
  
  loadStats(): void {
    this.http.get<DashboardStats>(`${environment.apiUrl}/admin/stats`).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
