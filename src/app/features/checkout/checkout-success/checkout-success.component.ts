import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-page">
      <div class="container">
        <div class="success-card">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <h1>¡Pedido confirmado!</h1>
          <p class="success-message">Gracias por tu compra. Hemos enviado un email de confirmación.</p>
          
          @if (order()) {
            <div class="order-details">
              <div class="order-number">
                <span>Número de pedido:</span>
                <strong>{{ order()!.order_number }}</strong>
              </div>
              
              <div class="order-summary">
                <h3>Resumen del pedido</h3>
                
                <div class="summary-items">
                  @for (item of order()!.items; track item.id) {
                    <div class="summary-item">
                      <span>{{ item.product_name }} × {{ item.quantity }}</span>
                      <span>{{ item.total | currency:'EUR' }}</span>
                    </div>
                  }
                </div>
                
                <hr>
                
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>{{ order()!.subtotal | currency:'EUR' }}</span>
                </div>
                <div class="summary-row">
                  <span>Envío</span>
                  <span>{{ order()!.shipping_cost | currency:'EUR' }}</span>
                </div>
                @if (order()!.discount > 0) {
                  <div class="summary-row discount">
                    <span>Descuento</span>
                    <span>-{{ order()!.discount | currency:'EUR' }}</span>
                  </div>
                }
                
                <hr>
                
                <div class="summary-row total">
                  <span>Total</span>
                  <span>{{ order()!.total | currency:'EUR' }}</span>
                </div>
              </div>
              
              <div class="shipping-info">
                <h3>Dirección de envío</h3>
                <p>
                  {{ order()!.shipping_address.first_name }} {{ order()!.shipping_address.last_name }}<br>
                  {{ order()!.shipping_address.street }}<br>
                  {{ order()!.shipping_address.postal_code }} {{ order()!.shipping_address.city }}<br>
                  {{ order()!.shipping_address.province }}, {{ order()!.shipping_address.country }}
                </p>
              </div>
            </div>
          }
          
          <div class="success-actions">
            <a routerLink="/account/orders" class="btn btn--primary">Ver mis pedidos</a>
            <a routerLink="/catalog" class="btn btn--secondary">Seguir comprando</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-page {
      padding: 3rem 0;
      background: #f9f9f9;
      min-height: calc(100vh - 140px);
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .success-card {
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: #d4edda;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      
      svg {
        color: #28a745;
      }
    }
    
    h1 {
      color: #28a745;
      margin-bottom: 0.5rem;
    }
    
    .success-message {
      color: #666;
      margin-bottom: 2rem;
    }
    
    .order-details {
      text-align: left;
      margin-bottom: 2rem;
    }
    
    .order-number {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      
      span {
        display: block;
        font-size: 0.85rem;
        color: #666;
      }
      
      strong {
        font-size: 1.2rem;
        color: #333;
      }
    }
    
    .order-summary {
      margin-bottom: 1.5rem;
      
      h3 {
        font-size: 1rem;
        margin-bottom: 1rem;
        color: #333;
      }
    }
    
    .summary-items {
      margin-bottom: 1rem;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 0.75rem 0;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;
      color: #666;
      
      &.discount {
        color: #28a745;
      }
      
      &.total {
        font-size: 1.1rem;
        font-weight: 700;
        color: #333;
      }
    }
    
    .shipping-info {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      
      h3 {
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        color: #333;
      }
      
      p {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
        line-height: 1.6;
      }
    }
    
    .success-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      
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
export class CheckoutSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  
  order = signal<Order | null>(null);
  
  ngOnInit(): void {
    const orderId = this.route.snapshot.queryParams['orderId'];
    if (orderId) {
      this.orderService.getOrder(orderId.toString()).subscribe({
        next: (order) => this.order.set(order),
        error: (err) => console.error('Error loading order:', err)
      });
    }
  }
}
