import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { ImageUploaderComponent } from '../../../shared/components/admin/image-uploader.component';

interface CategoryItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

type Tab = 'products' | 'blog';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  template: `
    <div class="admin-categories">
      <div class="page-header">
        <h1>Categorías</h1>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'products'" (click)="switchTab('products')">Categorías de producto</button>
        <button class="tab" [class.active]="tab() === 'blog'" (click)="switchTab('blog')">Categorías de blog</button>
      </div>

      <div class="content-grid">
        <div class="list-panel">
          @if (loading()) {
            <div class="loading">Cargando…</div>
          } @else {
            <table class="cat-table">
              <thead><tr><th></th><th>Nombre</th><th>Slug</th><th></th></tr></thead>
              <tbody>
                @for (cat of categories(); track cat.id) {
                  <tr>
                    <td>
                      @if (tab() === 'products' && cat.image_url) {
                        <img [src]="cat.image_url" class="cat-thumb" [alt]="cat.name">
                      }
                    </td>
                    <td>{{ cat.name }}</td>
                    <td><code>{{ cat.slug }}</code></td>
                    <td class="actions">
                      <button class="btn btn--icon" (click)="edit(cat)">✏️</button>
                      <button class="btn btn--icon btn--danger" (click)="remove(cat)">🗑</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <div class="form-panel">
          <h3>{{ editing() ? 'Editar categoría' : 'Nueva categoría' }}</h3>
          <label>Nombre
            <input type="text" [(ngModel)]="formName" (ngModelChange)="onNameChange()" placeholder="Ej. El Obrador">
          </label>
          <label>Slug
            <input type="text" [(ngModel)]="formSlug" placeholder="el-obrador">
          </label>
          <label>Descripción
            <textarea [(ngModel)]="formDescription" rows="2"></textarea>
          </label>

          @if (tab() === 'products') {
            <label>Imagen
              <app-image-uploader destPath="categories" label="Subir imagen" [initialUrl]="formImageUrl"
                (uploaded)="formImageUrl = $event"></app-image-uploader>
            </label>
            <label>Orden
              <input type="number" [(ngModel)]="formSortOrder">
            </label>
          }

          @if (formError()) {
            <p class="error">{{ formError() }}</p>
          }

          <div class="form-actions">
            <button class="btn btn--primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Guardando…' : 'Guardar' }}
            </button>
            @if (editing()) {
              <button class="btn btn--ghost" (click)="resetForm()">Cancelar</button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-categories { padding: 2rem; font-family: 'Poppins', sans-serif; }
    .page-header h1 { font-family: 'Teko', sans-serif; font-size: 2rem; color: #7B1716; text-transform: uppercase; margin-bottom: 1rem; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .tab { border: 1px solid #d8d0bd; background: #fff; padding: 0.5rem 1.1rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; }
    .tab.active { background: #7B1716; color: #E6C15A; border-color: #7B1716; }
    .content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
    .list-panel, .form-panel { background: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 1.25rem; }
    .cat-table { width: 100%; border-collapse: collapse; }
    .cat-table th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #8C7F6A; padding: 0.5rem; }
    .cat-table td { padding: 0.5rem; border-bottom: 1px solid #f2f2f2; }
    .cat-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 3px; }
    .form-panel h3 { font-family: 'Teko', sans-serif; font-size: 1.3rem; color: #7B1716; margin-bottom: 0.75rem; text-transform: uppercase; }
    .form-panel label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; margin-bottom: 0.75rem; color: #5A4F3E; }
    .form-panel input, .form-panel textarea { border: 1px solid #d8d0bd; border-radius: 3px; padding: 0.45rem 0.6rem; font-family: inherit; }
    .form-actions { display: flex; gap: 0.5rem; }
    .btn { border: none; border-radius: 3px; padding: 0.5rem 1rem; font-size: 0.85rem; cursor: pointer; }
    .btn--primary { background: #7B1716; color: #E6C15A; font-weight: 600; }
    .btn--ghost { background: transparent; color: #5A4F3E; }
    .btn--icon { background: transparent; font-size: 1rem; }
    .btn--danger:hover { color: #b00020; }
    .error { color: #b00020; font-size: 0.8rem; }
    .loading { color: #8C7F6A; padding: 2rem; text-align: center; }
    code { background: #F4F1E9; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.75rem; }
  `],
})
export class AdminCategoriesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  tab = signal<Tab>('products');
  categories = signal<CategoryItem[]>([]);
  loading = signal(true);
  saving = signal(false);
  formError = signal<string | null>(null);
  editing = signal<CategoryItem | null>(null);

  formName = '';
  formSlug = '';
  formDescription = '';
  formImageUrl: string | null = null;
  formSortOrder = 0;
  private slugTouched = false;

  ngOnInit(): void {
    this.load();
  }

  private endpoint(): string {
    return this.tab() === 'products' ? '/admin/categories' : '/admin/blog/categories';
  }

  switchTab(tab: Tab): void {
    this.tab.set(tab);
    this.resetForm();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<CategoryItem[]>(`${environment.apiUrl}${this.endpoint()}`).subscribe({
      next: (cats) => { this.categories.set(cats); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onNameChange(): void {
    if (!this.slugTouched || !this.formSlug) {
      this.formSlug = this.formName
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  }

  edit(cat: CategoryItem): void {
    this.editing.set(cat);
    this.formName = cat.name;
    this.formSlug = cat.slug;
    this.formDescription = cat.description || '';
    this.formImageUrl = cat.image_url || null;
    this.formSortOrder = cat.sort_order || 0;
    this.slugTouched = true;
  }

  resetForm(): void {
    this.editing.set(null);
    this.formName = '';
    this.formSlug = '';
    this.formDescription = '';
    this.formImageUrl = null;
    this.formSortOrder = 0;
    this.slugTouched = false;
    this.formError.set(null);
  }

  save(): void {
    if (!this.formName.trim()) {
      this.formError.set('El nombre es obligatorio');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    const payload: Record<string, unknown> = {
      name: this.formName,
      slug: this.formSlug || undefined,
      description: this.formDescription || null,
    };
    if (this.tab() === 'products') {
      payload['image_url'] = this.formImageUrl;
      payload['sort_order'] = this.formSortOrder;
    }

    const existing = this.editing();
    const request = existing
      ? this.http.put(`${environment.apiUrl}${this.endpoint()}/${existing.id}`, payload)
      : this.http.post(`${environment.apiUrl}${this.endpoint()}`, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Categoría guardada');
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail || 'Error al guardar la categoría');
      },
    });
  }

  remove(cat: CategoryItem): void {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}${this.endpoint()}/${cat.id}`).subscribe({
      next: () => { this.toast.success('Categoría eliminada'); this.load(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al eliminar'),
    });
  }
}
