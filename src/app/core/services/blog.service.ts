import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { BlogPost, BlogPostListItem, BlogCategory, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = `${environment.apiUrl}/blog`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get blog posts with pagination
   */
  getPosts(page: number = 1, pageSize: number = 10, category?: string): Observable<PaginatedResponse<BlogPostListItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());
    
    if (category) {
      params = params.set('category', category);
    }
    
    return this.http.get<PaginatedResponse<BlogPostListItem>>(`${this.apiUrl}/posts`, { params });
  }
  
  /**
   * Get single blog post by slug
   */
  getPost(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/posts/${slug}`);
  }
  
  /**
   * Get blog categories
   */
  getCategories(): Observable<BlogCategory[]> {
    return this.http.get<BlogCategory[]>(`${this.apiUrl}/categories`);
  }
}
