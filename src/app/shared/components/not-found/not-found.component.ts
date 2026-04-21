import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found">
      <div class="not-found__content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>Lo sentimos, la página que buscas no existe o ha sido movida.</p>
        <a routerLink="/" class="not-found__btn">Volver al inicio</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .not-found__content {
      text-align: center;
      
      h1 {
        font-size: 6rem;
        color: #4a7c4e;
        margin: 0;
        line-height: 1;
      }
      
      h2 {
        font-size: 1.5rem;
        color: #333;
        margin: 1rem 0;
      }
      
      p {
        color: #666;
        margin-bottom: 2rem;
      }
    }
    
    .not-found__btn {
      display: inline-block;
      background: #4a7c4e;
      color: #fff;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        background: #3d6640;
      }
    }
  `]
})
export class NotFoundComponent {}
