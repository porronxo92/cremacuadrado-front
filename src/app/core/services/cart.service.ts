import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { Cart, CartItem } from '../models';

const CART_KEY = 'cc_cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  
  // State using signals
  private cartSignal = signal<Cart | null>(null);
  private isLoadingSignal = signal<boolean>(false);
  
  // Computed values
  readonly cart = this.cartSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly itemCount = computed(() => this.cartSignal()?.item_count ?? 0);
  readonly subtotal = computed(() => this.cartSignal()?.subtotal ?? 0);
  readonly total = computed(() => this.cartSignal()?.total ?? 0);
  readonly items = computed(() => this.cartSignal()?.items ?? []);
  readonly isEmpty = computed(() => this.itemCount() === 0);
  
  constructor(private http: HttpClient) {
    // Load cart on initialization
    this.loadCart();
  }
  
  /**
   * Load cart from API
   */
  loadCart(): void {
    this.isLoadingSignal.set(true);
    this.http.get<Cart>(this.apiUrl).pipe(
      tap(cart => {
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      catchError(() => {
        this.isLoadingSignal.set(false);
        return of(null);
      })
    ).subscribe();
  }
  
  /**
   * Add item to cart
   */
  addItem(productId: number, quantity: number = 1): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.post<Cart>(`${this.apiUrl}/items`, {
      product_id: productId,
      quantity
    }).pipe(
      tap(cart => {
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Update item quantity
   */
  updateItemQuantity(itemId: number, quantity: number): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, { quantity }).pipe(
      tap(cart => {
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Remove item from cart
   */
  removeItem(itemId: number): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(cart => {
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Clear entire cart
   */
  clearCart(): Observable<{ message: string }> {
    this.isLoadingSignal.set(true);
    return this.http.delete<{ message: string }>(this.apiUrl).pipe(
      tap(() => {
        this.cartSignal.set(null);
        localStorage.removeItem(CART_KEY);
        this.isLoadingSignal.set(false);
        this.loadCart(); // Reload empty cart
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Apply coupon code
   */
  applyCoupon(code: string): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.post<Cart>(`${this.apiUrl}/apply-coupon`, { code }).pipe(
      tap(cart => {
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Remove coupon
   */
  removeCoupon(): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.delete<Cart>(`${this.apiUrl}/remove-coupon`).pipe(
      tap(cart => {
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Reset cart state (after checkout)
   */
  resetCart(): void {
    this.cartSignal.set(null);
    localStorage.removeItem(CART_KEY);
    this.loadCart();
  }
  
  /**
   * Save cart to localStorage for persistence
   */
  private saveCartToStorage(cart: Cart): void {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
}
