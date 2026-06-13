import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  Product, ProductListItem, Category, Review,
  PaginatedResponse
} from '../models';

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  featured?: boolean;
  sort_by?: 'name' | 'price' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  // In-session cache: slug → Observable (shareReplay keeps the last emission)
  private productCache = new Map<string, Observable<Product>>();
  private featuredCache: Observable<ProductListItem[]> | null = null;
  private listCache: Observable<PaginatedResponse<ProductListItem>> | null = null;

  constructor(private http: HttpClient) {}

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

  private normalizeListItem(item: ProductListItem): ProductListItem {
    return { ...item, primary_image: this.resolveUrl(item.primary_image) };
  }

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      images: product.images.map(img => ({ ...img, url: this.resolveUrl(img.url) ?? img.url })),
    };
  }

  getProducts(filters: ProductFilters = {}): Observable<PaginatedResponse<ProductListItem>> {
    // Only cache the default "all products" call used by the catalog page
    const isDefaultCall = Object.keys(filters).length === 0;
    if (isDefaultCall && this.listCache) return this.listCache;

    let params = new HttpParams();
    if (filters.page)           params = params.set('page', filters.page.toString());
    if (filters.page_size)      params = params.set('page_size', filters.page_size.toString());
    if (filters.category)       params = params.set('category', filters.category);
    if (filters.search)         params = params.set('search', filters.search);
    if (filters.min_price !== undefined) params = params.set('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params = params.set('max_price', filters.max_price.toString());
    if (filters.in_stock !== undefined)  params = params.set('in_stock', filters.in_stock.toString());
    if (filters.featured !== undefined)  params = params.set('featured', filters.featured.toString());
    if (filters.sort_by)        params = params.set('sort_by', filters.sort_by);
    if (filters.sort_order)     params = params.set('sort_order', filters.sort_order);

    const req$ = this.http.get<PaginatedResponse<ProductListItem>>(this.apiUrl, { params }).pipe(
      map(res => ({ ...res, items: res.items.map((i: ProductListItem) => this.normalizeListItem(i)) })),
      shareReplay(1)
    );

    if (isDefaultCall) this.listCache = req$;
    return req$;
  }

  getFeaturedProducts(limit: number = 4): Observable<ProductListItem[]> {
    if (!this.featuredCache) {
      this.featuredCache = this.http.get<ProductListItem[]>(`${this.apiUrl}/featured`, {
        params: { limit: limit.toString() }
      }).pipe(
        map(items => items.map(i => this.normalizeListItem(i))),
        shareReplay(1)
      );
    }
    return this.featuredCache;
  }

  getProduct(slug: string): Observable<Product> {
    if (!this.productCache.has(slug)) {
      const req$ = this.http.get<Product>(`${this.apiUrl}/${slug}`).pipe(
        map(p => this.normalizeProduct(p)),
        shareReplay(1)
      );
      this.productCache.set(slug, req$);
    }
    return this.productCache.get(slug)!;
  }

  /** Call after a successful addToCart to invalidate cached list (stock may change) */
  invalidateCache(slug?: string): void {
    if (slug) this.productCache.delete(slug);
    this.listCache = null;
    this.featuredCache = null;
  }

  getProductReviews(slug: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/${slug}/reviews`);
  }

  createReview(slug: string, data: { rating: number; title?: string; comment?: string }): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/${slug}/reviews`, data);
  }

  getCategories(includeEmpty: boolean = false): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, {
      params: { include_empty: includeEmpty.toString() }
    });
  }
}
