import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiMessage } from '../../../core/models';
import {
  AdminCart, AdminCoupon, AdminDashboard, AdminOrder, AdminPayment, AdminRefund, AdminShipment,
  AdminUserDetail, AdminUserRow, AdminUserUpdate, AdminWebhookEvent, CouponRedemption,
  LowStockVariant, OrderPayments, OrderShipment, Page, QueryParams,
} from './admin.models';

/** Single entry point for every `/admin/*` call made by the admin panel. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  /** Builds HttpParams skipping empty values (HttpParams URL-encodes for us). */
  static params(query: QueryParams = {}): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }

  get<T>(path: string, query?: QueryParams): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { params: AdminApiService.params(query) });
  }

  page<T>(path: string, query?: QueryParams): Observable<Page<T>> {
    return this.get<Page<T>>(path, query);
  }

  post<T>(path: string, body: unknown = null, query?: QueryParams): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { params: AdminApiService.params(query) });
  }

  put<T>(path: string, body: unknown = null): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body);
  }

  patch<T>(path: string, body: unknown = null, query?: QueryParams): Observable<T> {
    return this.http.patch<T>(`${this.base}${path}`, body, { params: AdminApiService.params(query) });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`);
  }

  /** Downloads a CSV/PDF endpoint and saves it with the given file name. */
  download(path: string, query: QueryParams, filename: string): Observable<void> {
    return new Observable<void>(subscriber => {
      const sub = this.http
        .get(`${this.base}${path}`, { params: AdminApiService.params(query), responseType: 'blob' })
        .subscribe({
          next: blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            subscriber.next();
            subscriber.complete();
          },
          error: err => subscriber.error(err),
        });
      return () => sub.unsubscribe();
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  dashboard(query: QueryParams): Observable<AdminDashboard> {
    return this.get('/dashboard', query);
  }

  // ── Orders ─────────────────────────────────────────────────────────────
  orders(query: QueryParams): Observable<Page<AdminOrder>> {
    return this.page('/orders', query);
  }
  order(id: number): Observable<AdminOrder> {
    return this.get(`/orders/${id}`);
  }
  orderPayments(id: number): Observable<OrderPayments> {
    return this.get(`/orders/${id}/payments`);
  }
  orderShipment(id: number): Observable<OrderShipment> {
    return this.get(`/orders/${id}/shipment`);
  }
  updateOrderStatus(id: number, status: string): Observable<AdminOrder> {
    return this.patch(`/orders/${id}/status`, { status });
  }
  updateOrderTracking(id: number, tracking: string): Observable<AdminOrder> {
    return this.patch(`/orders/${id}/tracking`, null, { tracking_number: tracking });
  }
  updateOrderNotes(id: number, adminNotes: string): Observable<AdminOrder> {
    return this.patch(`/orders/${id}/notes`, { admin_notes: adminNotes });
  }
  syncOrderTracking(id: number): Observable<unknown> {
    return this.post(`/orders/${id}/tracking/sync`);
  }

  // ── Users ──────────────────────────────────────────────────────────────
  users(query: QueryParams): Observable<Page<AdminUserRow>> {
    return this.page('/users', query);
  }
  user(id: number): Observable<AdminUserDetail> {
    return this.get(`/users/${id}`);
  }
  updateUser(id: number, data: AdminUserUpdate): Observable<ApiMessage> {
    return this.patch(`/users/${id}`, data);
  }
  setUserActive(id: number, isActive: boolean): Observable<ApiMessage> {
    return this.patch(`/users/${id}/status`, { is_active: isActive });
  }
  deleteUser(id: number): Observable<ApiMessage> {
    return this.delete(`/users/${id}`);
  }
  setUserPassword(id: number, newPassword: string, notifyUser: boolean): Observable<ApiMessage> {
    return this.post(`/users/${id}/password`, { new_password: newPassword, notify_user: notifyUser });
  }
  sendUserReset(id: number): Observable<ApiMessage> {
    return this.post(`/users/${id}/send-reset`);
  }
  unlockUser(id: number): Observable<ApiMessage> {
    return this.post(`/users/${id}/unlock`);
  }
  logoutUserEverywhere(id: number): Observable<ApiMessage> {
    return this.post(`/users/${id}/logout-all`);
  }

  // ── Coupons ────────────────────────────────────────────────────────────
  coupons(query: QueryParams): Observable<Page<AdminCoupon>> {
    return this.page('/coupons', query);
  }
  couponRedemptions(id: number, query: QueryParams): Observable<Page<CouponRedemption>> {
    return this.page(`/coupons/${id}/redemptions`, query);
  }

  // ── Activity ───────────────────────────────────────────────────────────
  carts(query: QueryParams): Observable<Page<AdminCart>> {
    return this.page('/carts', query);
  }
  payments(query: QueryParams): Observable<Page<AdminPayment>> {
    return this.page('/payments', query);
  }
  refunds(query: QueryParams): Observable<Page<AdminRefund>> {
    return this.page('/refunds', query);
  }
  webhookEvents(query: QueryParams): Observable<Page<AdminWebhookEvent>> {
    return this.page('/webhook-events', query);
  }
  webhookEvent(id: number): Observable<AdminWebhookEvent> {
    return this.get(`/webhook-events/${id}`);
  }
  shipments(query: QueryParams): Observable<Page<AdminShipment>> {
    return this.page('/shipments', query);
  }
  lowStock(): Observable<LowStockVariant[]> {
    return this.get('/stock/low');
  }
}
