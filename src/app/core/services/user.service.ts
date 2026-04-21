import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { User, Address, ApiMessage } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  
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
}
