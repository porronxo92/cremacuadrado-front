import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { REVIEW_STATUS, statusInfo } from '../shared/admin-labels';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';

interface AdminReview {
  id: number;
  product_id: number;
  product_name: string;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  admin_response: string | null;
  created_at: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Reseñas</h1>
          <p>Modera lo que publican los clientes</p>
        </div>
      </header>

      <div class="adm-chips" role="tablist">
        @for (s of statuses; track s.id) {
          <button type="button" class="adm-chip" [class.is-active]="f.status === s.id" (click)="f.status = s.id; state.apply()">{{ s.label }}</button>
        }
      </div>

      <div class="adm-filters">
        <label class="adm-field adm-field--search">
          <span>Buscar</span>
          <input type="search" [(ngModel)]="f.search" (input)="state.typed()" placeholder="Texto o email del cliente">
        </label>
        <label class="adm-field">
          <span>Valoración</span>
          <select [(ngModel)]="f.rating" (change)="state.apply()">
            <option value="">Todas</option>
            @for (r of [5, 4, 3, 2, 1]; track r) { <option [value]="r">{{ r }} ★</option> }
          </select>
        </label>
      </div>

      @if (loading()) {
        <div class="adm-loading">Cargando reseñas…</div>
      } @else {
        <div class="list">
          @for (r of reviews(); track r.id) {
            <article class="adm-card review">
              <header>
                <div>
                  <strong>{{ r.product_name }}</strong>
                  <span class="stars" [attr.aria-label]="r.rating + ' de 5 estrellas'">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
                  @if (r.is_verified_purchase) { <adm-badge tone="success">Compra verificada</adm-badge> }
                  <adm-badge [tone]="st(r.status).tone">{{ st(r.status).label }}</adm-badge>
                </div>
                <span class="adm-muted">{{ r.created_at | date:'dd/MM/yyyy' }}</span>
              </header>
              <p class="author">
                @if (r.user_id) {
                  <a class="adm-link" [routerLink]="['/admin/clientes', r.user_id]">{{ r.user_name }}</a> · {{ r.user_email }}
                } @else { {{ r.user_name }} }
              </p>
              @if (r.title) { <p class="title">{{ r.title }}</p> }
              @if (r.comment) { <p class="comment">{{ r.comment }}</p> }
              @if (r.admin_response) {
                <p class="response"><strong>Nota de la tienda:</strong> {{ r.admin_response }}</p>
              }
              <div class="actions">
                @if (r.status !== 'approved') {
                  <button type="button" class="adm-btn adm-btn--sm adm-btn--primary" (click)="moderate(r, 'approve')">Aprobar</button>
                }
                @if (r.status !== 'rejected') {
                  <button type="button" class="adm-btn adm-btn--sm adm-btn--danger" (click)="moderate(r, 'reject')">Rechazar</button>
                }
                <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="openResponse(r)">
                  {{ r.admin_response ? 'Editar nota' : 'Añadir nota' }}
                </button>
              </div>
            </article>
          } @empty {
            <div class="adm-empty-state">
              {{ f.status === 'pending' ? 'No hay reseñas pendientes de moderar 🎉' : 'No hay reseñas con estos filtros' }}
            </div>
          }
        </div>
        <adm-pagination [page]="state.page()" [pageSize]="state.pageSize()" [total]="state.total()"
                        [totalPages]="state.totalPages()" (pageChange)="state.goTo($event)"
                        (pageSizeChange)="state.setPageSize($event)" />
      }
    </div>

    @if (responding(); as r) {
      <adm-modal title="Nota de la tienda" size="sm" (closed)="responding.set(null)">
        <p class="adm-muted">Se guarda junto a la reseña. De momento no se muestra en la web pública.</p>
        <label class="adm-field">
          <span>Texto</span>
          <textarea [(ngModel)]="responseDraft" rows="5" maxlength="2000"></textarea>
        </label>
        <div modal-footer>
          <button type="button" class="adm-btn adm-btn--ghost" (click)="responding.set(null)">Cancelar</button>
          <button type="button" class="adm-btn adm-btn--primary" (click)="saveResponse(r)">Guardar</button>
        </div>
      </adm-modal>
    }
  `,
  styles: [`
    .list { display: flex; flex-direction: column; gap: 0.75rem; }
    .review header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem;
      > div { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; } }
    .stars { color: #C88A1A; letter-spacing: 1px; }
    .author { margin: 0.35rem 0; font-size: 0.82rem; color: var(--adm-muted); }
    .title { margin: 0.35rem 0 0; font-weight: 600; }
    .comment { margin: 0.35rem 0 0; line-height: 1.6; }
    .response { margin: 0.75rem 0 0; padding: 0.6rem 0.8rem; background: var(--adm-surface-alt); border-left: 3px solid var(--adm-accent); font-size: 0.85rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
  `],
})
export class AdminReviewsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  readonly statuses = [
    { id: 'pending', label: 'Pendientes' },
    { id: 'approved', label: 'Aprobadas' },
    { id: 'rejected', label: 'Rechazadas' },
    { id: 'all', label: 'Todas' },
  ];

  state = adminListState({ status: 'pending', search: '', rating: '' }, () => this.load());
  f = this.state.filters;

  reviews = signal<AdminReview[]>([]);
  loading = signal(true);
  responding = signal<AdminReview | null>(null);
  responseDraft = '';

  ngOnInit(): void {
    this.load();
  }

  st(s: string) { return statusInfo(REVIEW_STATUS, s); }

  load(): void {
    this.loading.set(true);
    this.api.page<AdminReview>('/reviews', this.state.query()).subscribe({
      next: res => {
        this.reviews.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar las reseñas');
      },
    });
  }

  moderate(r: AdminReview, action: 'approve' | 'reject'): void {
    this.api.put(`/reviews/${r.id}/${action}`, {}).subscribe({
      next: () => {
        this.toast.success(action === 'approve' ? 'Reseña aprobada' : 'Reseña rechazada');
        this.load();
      },
      error: err => this.toast.error(err.message || 'No se pudo moderar'),
    });
  }

  openResponse(r: AdminReview): void {
    this.responseDraft = r.admin_response || '';
    this.responding.set(r);
  }

  saveResponse(r: AdminReview): void {
    this.api.put(`/reviews/${r.id}/response`, { admin_response: this.responseDraft }).subscribe({
      next: () => {
        this.reviews.update(list => list.map(x => (x.id === r.id ? { ...x, admin_response: this.responseDraft.trim() || null } : x)));
        this.responding.set(null);
        this.toast.success('Nota guardada');
      },
      error: err => this.toast.error(err.message || 'No se pudo guardar'),
    });
  }
}
