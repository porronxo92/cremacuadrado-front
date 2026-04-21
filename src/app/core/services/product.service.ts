import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  
  constructor(private http: HttpClient) {}

  /** Reemplaza la base de la URL de medios por la configurada en el environment */
  private resolveUrl(url: string | null): string | null {
    if (!url) return null;
    // Sustituye cualquier origen absoluto (http://localhost:8000, https://...) por mediaUrl
    try {
      const parsed = new URL(url);
      return `${environment.mediaUrl}${parsed.pathname}${parsed.search}`;
    } catch {
      return url; // ya es relativa, devolver tal cual
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
  
  /**
   * Get products with filters and pagination
   */
  getProducts(filters: ProductFilters = {}): Observable<PaginatedResponse<ProductListItem>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.page_size) params = params.set('page_size', filters.page_size.toString());
    if (filters.category) params = params.set('category', filters.category);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.min_price !== undefined) params = params.set('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params = params.set('max_price', filters.max_price.toString());
    if (filters.in_stock !== undefined) params = params.set('in_stock', filters.in_stock.toString());
    if (filters.featured !== undefined) params = params.set('featured', filters.featured.toString());
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.sort_order) params = params.set('sort_order', filters.sort_order);
    
    return this.http.get<PaginatedResponse<ProductListItem>>(this.apiUrl, { params }).pipe(
      map(res => ({ ...res, items: res.items.map((i: ProductListItem) => this.normalizeListItem(i)) }))
    );
  }
  
  /**
   * Get featured products for homepage
   */
  getFeaturedProducts(limit: number = 4): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.apiUrl}/featured`, {
      params: { limit: limit.toString() }
    }).pipe(map(items => items.map(i => this.normalizeListItem(i))));
  }
  
  /**
   * Get product by slug
   */
  getProduct(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${slug}`).pipe(
      map(p => this.normalizeProduct(p))
    );
  }
  
  /**
   * Get product reviews
   */
  getProductReviews(slug: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/${slug}/reviews`);
  }
  
  /**
   * Create a product review
   */
  createReview(slug: string, data: { rating: number; title?: string; comment?: string }): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/${slug}/reviews`, data);
  }
  
  /**
   * Get all categories
   */
  getCategories(includeEmpty: boolean = false): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, {
      params: { include_empty: includeEmpty.toString() }
    });
  }
}
