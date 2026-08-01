import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h1>Admin</h1>
          <span>Cremacuadrado</span>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            Pedidos
          </a>
          <a routerLink="/admin/products" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m7.5 4.27 9 5.15"></path>
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
              <path d="m3.3 7 8.7 5 8.7-5"></path>
              <path d="M12 22V12"></path>
            </svg>
            Productos
          </a>
          <a routerLink="/admin/categorias" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3h7v7H3z"></path><path d="M14 3h7v7h-7z"></path>
              <path d="M14 14h7v7h-7z"></path><path d="M3 14h7v7H3z"></path>
            </svg>
            Categorías
          </a>
          <a routerLink="/admin/blog" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Blog &amp; Recetas
          </a>
          <a routerLink="/admin/resenas" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Reseñas
          </a>
          <a routerLink="/admin/cupones" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2.59 12.58a2 2 0 0 1 0-2.83L9.76 2.59a2 2 0 0 1 2.83 0L20.59 10.58a2 2 0 0 1 0 2.83z"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
            </svg>
            Cupones
          </a>
          <a routerLink="/admin/puntos-de-venta" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Puntos de venta
          </a>
          <a routerLink="/admin/leads" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>
            Leads
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <a routerLink="/" class="back-to-store">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Volver a la tienda
          </a>
        </div>
      </aside>
      
      <!-- Main content -->
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }
    
    .admin-sidebar {
      width: 250px;
      background: #1a1a2e;
      color: #fff;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      
      @media (max-width: 768px) {
        width: 100%;
        position: relative;
        height: auto;
      }
    }
    
    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      
      h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #4a7c4e;
      }
      
      span {
        font-size: 0.8rem;
        opacity: 0.7;
      }
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
      
      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        transition: all 0.3s;
        
        &:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        
        &.active {
          background: rgba(74, 124, 78, 0.3);
          color: #4a7c4e;
          border-left: 3px solid #4a7c4e;
        }
      }
    }
    
    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      
      .back-to-store {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        font-size: 0.9rem;
        
        &:hover {
          color: #fff;
        }
      }
    }
    
    .admin-content {
      flex: 1;
      margin-left: 250px;
      padding: 2rem;
      background: #f5f5f5;
      min-height: 100vh;
      
      @media (max-width: 768px) {
        margin-left: 0;
      }
    }
  `]
})
export class AdminLayoutComponent {}
