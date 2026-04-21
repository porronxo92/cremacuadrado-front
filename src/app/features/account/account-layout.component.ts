import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="account-layout">
      <div class="container">
        <div class="account-layout__grid">
          <!-- Sidebar -->
          <aside class="account-sidebar">
            <h2>Mi cuenta</h2>
            <nav class="account-nav">
              <a routerLink="/account" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Dashboard
              </a>
              <a routerLink="/account/orders" routerLinkActive="active">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                Mis pedidos
              </a>
              <a routerLink="/account/profile" routerLinkActive="active">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Mi perfil
              </a>
              <a routerLink="/account/addresses" routerLinkActive="active">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Direcciones
              </a>
            </nav>
          </aside>
          
          <!-- Main content -->
          <main class="account-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .account-layout {
      padding: 2rem 0;
      min-height: calc(100vh - 140px);
      background: #f9f9f9;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .account-layout__grid {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    
    .account-sidebar {
      @media (max-width: 768px) {
        background: #fff;
        padding: 1rem;
        border-radius: 8px;
      }
      
      h2 {
        margin: 0 0 1.5rem;
        font-size: 1.2rem;
        color: #333;
        
        @media (max-width: 768px) {
          display: none;
        }
      }
    }
    
    .account-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      @media (max-width: 768px) {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        text-decoration: none;
        color: #666;
        border-radius: 4px;
        transition: all 0.3s;
        
        &:hover {
          background: #fff;
          color: #4a7c4e;
        }
        
        &.active {
          background: #4a7c4e;
          color: #fff;
        }
        
        svg {
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          flex: 1;
          min-width: fit-content;
          justify-content: center;
          font-size: 0.9rem;
          padding: 0.5rem 0.75rem;
          
          svg {
            display: none;
          }
        }
      }
    }
    
    .account-content {
      background: transparent;
    }
  `]
})
export class AccountLayoutComponent {}
