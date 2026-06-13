import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  Order, OrderListItem, CheckoutData, CheckoutValidation,
  PaymentIntent, ApiMessage
} from '../models';

const CART_SESSION_KEY = 'cc_cart_session';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private checkoutUrl = `${environment.apiUrl}/checkout`;
  private ordersUrl = `${environment.apiUrl}/orders`;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  private getCartSessionHeader(): HttpHeaders {
    if (!isPlatformBrowser(this.platformId)) return new HttpHeaders();
    try {
      const session = localStorage.getItem(CART_SESSION_KEY);
      if (session) {
        return new HttpHeaders({ 'X-Cart-Session': session });
      }
    } catch {}
    return new HttpHeaders();
  }
  
  /**
   * Get shipping cost calculation
   */
  getShippingCost(): Observable<{
    cost: number;
    free_shipping_threshold: number;
    amount_for_free_shipping: number | null;
    message: string | null;
  }> {
    return this.http.get<any>(`${this.checkoutUrl}/shipping-cost`, { headers: this.getCartSessionHeader() });
  }

  /**
   * Validate checkout before payment
   */
  validateCheckout(data: CheckoutData): Observable<CheckoutValidation> {
    return this.http.post<CheckoutValidation>(`${this.checkoutUrl}/validate`, data, { headers: this.getCartSessionHeader() });
  }

  /**
   * Create payment intent (mock in MVP)
   */
  createPaymentIntent(data: CheckoutData): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.checkoutUrl}/create-payment-intent`, data, { headers: this.getCartSessionHeader() });
  }

  /**
   * Complete checkout and create order
   */
  completeCheckout(
    checkoutData: CheckoutData,
    paymentIntentId: string,
    paymentMethod: string = 'card'
  ): Observable<Order> {
    const body = {
      ...checkoutData,
      payment_intent_id: paymentIntentId,
      payment_method: paymentMethod
    };

    return this.http.post<Order>(`${this.checkoutUrl}/complete`, body, { headers: this.getCartSessionHeader() });
  }

  /**
   * Create order (simplified for MVP)
   */
  createOrder(data: any): Observable<Order> {
    return this.http.post<Order>(`${this.checkoutUrl}/complete`, data, { headers: this.getCartSessionHeader() });
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
