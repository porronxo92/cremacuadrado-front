import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Cart, CartItem } from '../models';

const CART_KEY = 'cc_cart';
const CART_SESSION_KEY = 'cc_cart_session';

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

  private getCartSessionHeader(): HttpHeaders {
    if (!isPlatformBrowser(this.platformId)) return new HttpHeaders();
    try {
      // 1. Prefer the value stored explicitly in localStorage
      const stored = localStorage.getItem(CART_SESSION_KEY);
      if (stored) return new HttpHeaders({ 'X-Cart-Session': stored });

      // 2. Fall back: read the cart_session cookie set by the backend
      const match = document.cookie.match(/(?:^|; )cart_session=([^;]+)/);
      if (match) {
        const session = decodeURIComponent(match[1]);
        localStorage.setItem(CART_SESSION_KEY, session); // cache it
        return new HttpHeaders({ 'X-Cart-Session': session });
      }
    } catch {}
    return new HttpHeaders();
  }

  private saveCartSession(headers: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const session = headers.get('X-Cart-Session');
      if (session) {
        localStorage.setItem(CART_SESSION_KEY, session);
      }
    } catch {}
  }

  private resolveUrl(url: string | null): string | null {
    if (!url) return null;

    // If URL is relative (starts with /), prepend mediaUrl
    if (url.startsWith('/')) {
      return `${environment.mediaUrl}${url}`;
    }

    // If URL is absolute, replace the host with mediaUrl
    try {
      const parsed = new URL(url);
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
    this.http.get<Cart>(this.apiUrl, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap(response => {
        this.saveCartSession(response.headers);
        const serverCart = this.normalizeCart(response.body!);
        const localCart = this.cartSignal();
        // Don't overwrite a non-empty local cart with an empty server response
        // (happens when the backend doesn't recognise the session yet)
        if (serverCart.item_count === 0 && (localCart?.item_count ?? 0) > 0) return;
        this.cartSignal.set(serverCart);
        this.saveCartToStorage(serverCart);
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  loadCart(): void {
    this.isLoadingSignal.set(true);
    this.http.get<Cart>(this.apiUrl, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap(response => {
        this.saveCartSession(response.headers);
        const cart = this.normalizeCart(response.body!);
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
    }, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap(response => {
        this.saveCartSession(response.headers);
        const cart = this.normalizeCart(response.body!);
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      map(response => this.normalizeCart(response.body!)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  updateItemQuantity(itemId: number, quantity: number): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, { quantity }, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap(response => {
        this.saveCartSession(response.headers);
        const cart = this.normalizeCart(response.body!);
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      map(response => this.normalizeCart(response.body!)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  removeItem(itemId: number): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap(response => {
        this.saveCartSession(response.headers);
        const cart = this.normalizeCart(response.body!);
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      map(response => this.normalizeCart(response.body!)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  clearCart(): Observable<{ message: string }> {
    this.isLoadingSignal.set(true);
    return this.http.delete<{ message: string }>(this.apiUrl, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap((response) => {
        this.saveCartSession(response.headers);
        this.cartSignal.set(null);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem(CART_KEY);
          localStorage.removeItem(CART_SESSION_KEY);
        }
        this.isLoadingSignal.set(false);
        this.syncFromServer();
      }),
      map(response => response.body!),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  applyCoupon(code: string): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.post<Cart>(`${this.apiUrl}/apply-coupon`, { code }, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap(response => {
        this.saveCartSession(response.headers);
        const cart = this.normalizeCart(response.body!);
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      map(response => this.normalizeCart(response.body!)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  removeCoupon(): Observable<Cart> {
    this.isLoadingSignal.set(true);
    return this.http.delete<Cart>(`${this.apiUrl}/remove-coupon`, { headers: this.getCartSessionHeader(), observe: 'response' }).pipe(
      tap(response => {
        this.saveCartSession(response.headers);
        const cart = this.normalizeCart(response.body!);
        this.cartSignal.set(cart);
        this.saveCartToStorage(cart);
        this.isLoadingSignal.set(false);
      }),
      map(response => this.normalizeCart(response.body!)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        throw error;
      })
    );
  }

  resetCart(): void {
    this.cartSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CART_SESSION_KEY);
    }
    this.syncFromServer();
  }

  private saveCartToStorage(cart: Cart): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }
}
