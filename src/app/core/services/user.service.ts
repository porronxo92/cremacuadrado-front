import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { User, Address, ApiMessage, AdminUsersResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private adminApiUrl = `${environment.apiUrl}/admin/users`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get user profile
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }
  
  /**
   * Update user profile
   */
  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, data);
  }
  
  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/change-password`, {
      current_password: currentPassword,
      new_password: newPassword
    });
  }
  
  /**
   * Get user addresses
   */
  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses`);
  }
  
  /**
   * Create new address
   */
  createAddress(data: Omit<Address, 'id' | 'created_at'>): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses`, data);
  }
  
  /**
   * Update address
   */
  updateAddress(id: number, data: Partial<Address>): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/addresses/${id}`, data);
  }
  
  /**
   * Delete address
   */
  deleteAddress(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/addresses/${id}`);
  }
  
  /**
   * Set address as default
   */
  setDefaultAddress(id: number): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses/${id}/set-default`, {});
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all users (admin only)
   */
  getAdminUsers(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    role: string = '',
    is_active: boolean | string = ''
  ): Observable<AdminUsersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (role) params = params.set('role', role);
    if (is_active !== '') params = params.set('is_active', is_active.toString());

    return this.http.get<AdminUsersResponse>(this.adminApiUrl, { params });
  }

  /**
   * Update user status (activate/deactivate)
   */
  updateUserStatus(userId: number, isActive: boolean): Observable<ApiMessage> {
    return this.http.patch<ApiMessage>(`${this.adminApiUrl}/${userId}/status`, {
      is_active: isActive
    });
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(userId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.adminApiUrl}/${userId}`);
  }
}
