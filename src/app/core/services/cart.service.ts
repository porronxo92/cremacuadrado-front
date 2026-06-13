import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Cart, CartItem } from '../models';

const CART_KEY = 'cc_cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private platformId = inject(PLATFORM_ID);

  private cartSignal = signal<Cart | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  readonly cart = this.cartSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly itemCount = computed(() => this.cartSignal()?.item_count ?? 0);
  readonly subtotal = computed(() => this.cartSignal()?.subtotal ?? 0);
  readonly total = computed(() => this.cartSignal()?.total ?? 0);
  readonly items = computed(() => this.cartSignal()?.items ?? []);
  readonly isEmpty = computed(() => this.itemCount() === 0);

  constructor(private http: HttpClient) {
    // 1. Restore from localStorage immediately (zero network latency)
    this.restoreFromStorage();
    // 2. Silently sync with server in the background — does not block rendering
    this.syncFromServer();
  }

  private resolveUrl(url: string | null): string | null {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      // Replace any host (e.g. localhost:8000) with the configured mediaUrl
      return `${environment.mediaUrl}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  private normalizeCart(cart: Cart): Cart {
    return {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        product_image: this.resolveUrl(item.product_image),
      })),
    };
  }

  private restoreFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) this.cartSignal.set(JSON.parse(raw));
    } catch {
      // Corrupted storage — ignore, server sync will fix it
    }
  }

  private syncFromServer(): void {
    this.http.get<Cart>(this.apiUrl).pipe(
      map(cart => this.normalizeCart(cart)),
      tap(cart => {
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  loadCart(): void {
    this.isLoadingSignal.set(true);
    this.http.get<Cart>(this.apiUrl).pipe(
      map(cart => this.normalizeCart(cart)),
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

  addItem(productVariantId: number, quantity: number = 1): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.post<Cart>(`${this.apiUrl}/items`, {
      product_variant_id: productVariantId,
      quantity
    }).pipe(
      map(cart => this.normalizeCart(cart)),
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

  updateItemQuantity(itemId: number, quantity: number): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, { quantity }).pipe(
      map(cart => this.normalizeCart(cart)),
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

  removeItem(itemId: number): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`).pipe(
      map(cart => this.normalizeCart(cart)),
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

  clearCart(): Observable<{ message: string }> {
    this.isLoadingSignal.set(true);
    return this.http.delete<{ message: string }>(this.apiUrl).pipe(
      tap(() => {
        this.cartSignal.set(null);
        if (isPlatformBrowser(this.platformId)) localStorage.removeItem(CART_KEY);
        this.isLoadingSignal.set(false);
        this.syncFromServer();
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  applyCoupon(code: string): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.post<Cart>(`${this.apiUrl}/apply-coupon`, { code }).pipe(
      map(cart => this.normalizeCart(cart)),
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

  removeCoupon(): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.delete<Cart>(`${this.apiUrl}/remove-coupon`).pipe(
      map(cart => this.normalizeCart(cart)),
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

  resetCart(): void {
    this.cartSignal.set(null);
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem(CART_KEY);
    this.syncFromServer();
  }

  private saveCartToStorage(cart: Cart): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }
}
