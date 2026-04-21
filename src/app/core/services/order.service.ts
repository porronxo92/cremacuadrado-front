import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { 
  Order, OrderListItem, CheckoutData, CheckoutValidation, 
  PaymentIntent, ApiMessage 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private checkoutUrl = `${environment.apiUrl}/checkout`;
  private ordersUrl = `${environment.apiUrl}/orders`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get shipping cost calculation
   */
  getShippingCost(): Observable<{
    cost: number;
    free_shipping_threshold: number;
    amount_for_free_shipping: number | null;
    message: string | null;
  }> {
    return this.http.get<any>(`${this.checkoutUrl}/shipping-cost`);
  }
  
  /**
   * Validate checkout before payment
   */
  validateCheckout(data: CheckoutData): Observable<CheckoutValidation> {
    return this.http.post<CheckoutValidation>(`${this.checkoutUrl}/validate`, data);
  }
  
  /**
   * Create payment intent (mock in MVP)
   */
  createPaymentIntent(data: CheckoutData): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.checkoutUrl}/create-payment-intent`, data);
  }
  
  /**
   * Complete checkout and create order
   */
  completeCheckout(
    checkoutData: CheckoutData,
    paymentIntentId: string,
    paymentMethod: string = 'card'
  ): Observable<Order> {
    // Combine checkout data with payment completion data
    const body = {
      ...checkoutData,
      payment_intent_id: paymentIntentId,
      payment_method: paymentMethod
    };
    
    return this.http.post<Order>(`${this.checkoutUrl}/complete`, body);
  }
  
  /**
   * Create order (simplified for MVP)
   */
  createOrder(data: any): Observable<Order> {
    return this.http.post<Order>(`${this.checkoutUrl}/complete`, data);
  }
  
  /**
   * Get user's orders with pagination
   */
  getOrders(page: number = 1, limit: number = 10): Observable<{items: OrderListItem[], pages: number}> {
    return this.http.get<{items: OrderListItem[], pages: number}>(this.ordersUrl, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }
  
  /**
   * Cancel an order
   */
  cancelOrder(orderNumber: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.ordersUrl}/${orderNumber}/cancel`, {});
  }
  
  /**
   * Get order by number
   */
  getOrder(orderNumber: string): Observable<Order> {
    return this.http.get<Order>(`${this.ordersUrl}/${orderNumber}`);
  }
  
  /**
   * Reorder a previous order
   */
  reorder(orderNumber: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.ordersUrl}/${orderNumber}/reorder`, {});
  }
}
