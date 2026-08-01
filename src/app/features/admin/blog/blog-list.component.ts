import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

interface BlogCategoryLite {
  id: number;
  slug: string;
  name: string;
}

interface AdminBlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  categories: BlogCategoryLite[];
  published_at: string | null;
  status: string | null;
}

@Component({
  selector: 'app-admin-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-blog">
      <div class="page-header">
        <h1>Blog &amp; Recetas</h1>
        <a class="btn btn--primary" routerLink="/admin/blog/nuevo">+ Nueva entrada</a>
      </div>

      <div class="filters">
        <button class="chip" [class.active]="statusFilter() === null" (click)="setStatus(null)">Todas</button>
        <button class="chip" [class.active]="statusFilter() === 'published'" (click)="setStatus('published')">Publicadas</button>
        <button class="chip" [class.active]="statusFilter() === 'draft'" (click)="setStatus('draft')">Borradores</button>
        <input class="search" type="search" placeholder="Buscar por título…" [value]="search()"
          (input)="onSearch($event)">
      </div>

      @if (loading()) {
        <div class="loading">Cargando artículos…</div>
      } @else if (posts().length === 0) {
        <div class="empty">No hay entradas todavía.</div>
      } @else {
        <div class="posts-table-container">
          <table class="posts-table">
            <thead>
              <tr>
                <th>Portada</th>
                <th>Título</th>
                <th>Categorías</th>
                <th>Estado</th>
                <th>Publicado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (post of posts(); track post.id) {
                <tr>
                  <td>
                    <img [src]="post.featured_image_url || '/assets/images/placeholder.jpg'" [alt]="post.title" class="post-thumb">
                  </td>
                  <td>
                    <strong>{{ post.title }}</strong>
                    <small>/el-archivo/{{ post.slug }}</small>
                  </td>
                  <td>
                    @for (cat of post.categories; track cat.id) {
                      <span class="cat-badge">{{ cat.name }}</span>
                    }
                  </td>
                  <td>
                    <span class="status-badge" [class.published]="post.status === 'published'">
                      {{ post.status === 'published' ? 'Publicado' : 'Borrador' }}
                    </span>
                  </td>
                  <td>{{ post.published_at ? (post.published_at | date:'dd/MM/yyyy') : '—' }}</td>
                  <td class="actions">
                    <a class="btn btn--icon" [routerLink]="['/admin/blog', post.id]" title="Editar">✏️</a>
                    @if (post.status === 'published') {
                      <button class="btn btn--icon" title="Despublicar" (click)="unpublish(post)">⏸</button>
                    } @else {
                      <button class="btn btn--icon" title="Publicar" (click)="publish(post)">▶</button>
                    }
                    <button class="btn btn--icon btn--danger" title="Eliminar" (click)="deletePost(post)">🗑</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-blog { padding: 2rem; font-family: 'Poppins', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-family: 'Teko', sans-serif; font-size: 2rem; color: #7B1716; text-transform: uppercase; }
    .btn { border: none; border-radius: 3px; padding: 0.55rem 1.1rem; font-size: 0.85rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn--primary { background: #7B1716; color: #E6C15A; font-weight: 600; }
    .btn--icon { background: transparent; padding: 0.35rem 0.5rem; font-size: 1rem; }
    .btn--danger:hover { color: #b00020; }
    .filters { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .chip { border: 1px solid #d8d0bd; background: #fff; border-radius: 20px; padding: 0.35rem 0.9rem; font-size: 0.8rem; cursor: pointer; }
    .chip.active { background: #7B1716; color: #E6C15A; border-color: #7B1716; }
    .search { margin-left: auto; border: 1px solid #d8d0bd; border-radius: 3px; padding: 0.4rem 0.75rem; min-width: 220px; }
    .loading, .empty { padding: 3rem; text-align: center; color: #8C7F6A; }
    .posts-table-container { background: #fff; border-radius: 4px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .posts-table { width: 100%; border-collapse: collapse; }
    .posts-table th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #8C7F6A; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
    .posts-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f2f2f2; vertical-align: middle; }
    .post-thumb { width: 56px; height: 42px; object-fit: cover; border-radius: 3px; }
    .posts-table small { display: block; color: #8C7F6A; }
    .cat-badge { display: inline-block; background: #F4F1E9; color: #5A4F3E; border-radius: 3px; padding: 0.15rem 0.5rem; font-size: 0.7rem; margin-right: 0.25rem; }
    .status-badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 12px; background: #eee; color: #666; }
    .status-badge.published { background: #E9F3DC; color: #4a7c2c; }
    .actions { white-space: nowrap; }
  `],
})
export class AdminBlogListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  posts = signal<AdminBlogPost[]>([]);
  loading = signal(true);
  statusFilter = signal<string | null>(null);
  search = signal('');
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  setStatus(status: string | null): void {
    this.statusFilter.set(status);
    this.load();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 350);
  }

  load(): void {
    this.loading.set(true);
    let params = '?page_size=100';
    if (this.statusFilter()) params += `&status=${this.statusFilter()}`;
    if (this.search()) params += `&search=${encodeURIComponent(this.search())}`;

    this.http.get<{ items: AdminBlogPost[] }>(`${environment.apiUrl}/admin/blog/posts${params}`).subscribe({
      next: (res) => {
        this.posts.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  publish(post: AdminBlogPost): void {
    this.http.patch(`${environment.apiUrl}/admin/blog/posts/${post.id}/publish`, {}).subscribe({
      next: () => { this.toast.success('Artículo publicado'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al publicar'),
    });
  }

  unpublish(post: AdminBlogPost): void {
    this.http.patch(`${environment.apiUrl}/admin/blog/posts/${post.id}/unpublish`, {}).subscribe({
      next: () => { this.toast.success('Artículo pasado a borrador'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al despublicar'),
    });
  }

  deletePost(post: AdminBlogPost): void {
    if (!confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return;
    this.http.delete(`${environment.apiUrl}/admin/blog/posts/${post.id}`).subscribe({
      next: () => { this.toast.success('Artículo eliminado'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al eliminar'),
    });
  }
}
