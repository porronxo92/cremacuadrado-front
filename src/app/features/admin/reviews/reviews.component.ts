import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface AdminReview {
  id: number;
  product_name: string;
  user_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  status: ReviewStatus;
  created_at: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-reviews">
      <div class="page-header">
        <h1>Moderación de reseñas</h1>
      </div>

      <div class="filter-tabs">
        <button class="chip" [class.active]="statusFilter() === 'pending'" (click)="setStatus('pending')">Pendientes</button>
        <button class="chip" [class.active]="statusFilter() === 'approved'" (click)="setStatus('approved')">Aprobadas</button>
        <button class="chip" [class.active]="statusFilter() === 'rejected'" (click)="setStatus('rejected')">Rechazadas</button>
      </div>

      @if (loading()) {
        <div class="loading">Cargando…</div>
      } @else if (reviews().length === 0) {
        <div class="empty">
          @if (statusFilter() === 'pending') {
            No hay reseñas pendientes de moderar. 🎉
          } @else {
            No hay reseñas {{ statusFilter() === 'approved' ? 'aprobadas' : 'rechazadas' }}.
          }
        </div>
      } @else {
        <div class="review-list">
          @for (review of reviews(); track review.id) {
            <div class="review-card">
              <div class="review-card__header">
                <div>
                  <strong>{{ review.product_name }}</strong>
                  <span class="stars">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
                  @if (review.is_verified_purchase) {
                    <span class="verified">Compra verificada</span>
                  }
                </div>
                <small>{{ review.created_at | date:'dd/MM/yyyy' }}</small>
              </div>
              <p class="review-author">{{ review.user_name }}</p>
              @if (review.title) { <p class="review-title">{{ review.title }}</p> }
              <p class="review-comment">{{ review.comment }}</p>
              <div class="review-actions">
                @if (review.status !== 'approved') {
                  <button class="btn btn--approve" (click)="approve(review)">✓ Aprobar</button>
                }
                @if (review.status !== 'rejected') {
                  <button class="btn btn--reject" (click)="reject(review)">✕ Rechazar</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-reviews { padding: 2rem; font-family: 'Poppins', sans-serif; max-width: 900px; }
    .page-header h1 { font-family: 'Teko', sans-serif; font-size: 2rem; color: #7B1716; text-transform: uppercase; margin-bottom: 1.5rem; }
    .filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .chip { border: 1px solid #D9D3C5; background: #fff; color: #5A4F3E; border-radius: 20px; padding: 0.4rem 1rem; font-size: 0.85rem; cursor: pointer; transition: all 0.15s; }
    .chip.active { background: #7B1716; color: #E6C15A; border-color: #7B1716; }
    .loading, .empty { padding: 3rem; text-align: center; color: #8C7F6A; }
    .review-list { display: flex; flex-direction: column; gap: 1rem; }
    .review-card { background: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 1.1rem 1.3rem; }
    .review-card__header { display: flex; justify-content: space-between; align-items: center; }
    .stars { color: #E6C15A; margin-left: 0.5rem; }
    .verified { margin-left: 0.5rem; font-size: 0.7rem; background: #E9F3DC; color: #4a7c2c; padding: 0.15rem 0.5rem; border-radius: 10px; }
    .review-author { font-size: 0.8rem; color: #8C7F6A; margin: 0.3rem 0; }
    .review-title { font-weight: 600; margin: 0.2rem 0; }
    .review-comment { color: #1A1208; line-height: 1.5; margin-bottom: 0.75rem; }
    .review-actions { display: flex; gap: 0.5rem; }
    .btn { border: none; border-radius: 3px; padding: 0.45rem 1rem; font-size: 0.8rem; cursor: pointer; }
    .btn--approve { background: #E9F3DC; color: #4a7c2c; }
    .btn--reject { background: #FBE7E7; color: #b00020; }
  `],
})
export class AdminReviewsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  reviews = signal<AdminReview[]>([]);
  loading = signal(true);
  statusFilter = signal<ReviewStatus>('pending');

  ngOnInit(): void {
    this.load();
  }

  setStatus(status: ReviewStatus): void {
    this.statusFilter.set(status);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<{ items: AdminReview[] }>(
      `${environment.apiUrl}/admin/reviews?status=${this.statusFilter()}&page_size=100`
    ).subscribe({
      next: (res) => { this.reviews.set(res.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  approve(review: AdminReview): void {
    this.http.put(`${environment.apiUrl}/admin/reviews/${review.id}/approve`, {}).subscribe({
      next: () => { this.toast.success('Reseña aprobada'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al aprobar'),
    });
  }

  reject(review: AdminReview): void {
    this.http.put(`${environment.apiUrl}/admin/reviews/${review.id}/reject`, {}).subscribe({
      next: () => { this.toast.success('Reseña rechazada'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al rechazar'),
    });
  }
}
