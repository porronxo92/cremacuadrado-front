import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { MarkdownEditorComponent } from '../../../shared/components/admin/markdown-editor.component';
import { ImageUploaderComponent } from '../../../shared/components/admin/image-uploader.component';

interface BlogCategoryLite {
  id: number;
  slug: string;
  name: string;
}

interface BlogPostDetail {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  status: string;
  categories: BlogCategoryLite[];
  meta_title?: string | null;
  meta_description?: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Component({
  selector: 'app-admin-blog-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MarkdownEditorComponent, ImageUploaderComponent],
  template: `
    <div class="blog-editor">
      <div class="page-header">
        <h1>{{ isNew() ? 'Nueva entrada' : 'Editar entrada' }}</h1>
        <a class="btn btn--ghost" routerLink="/admin/blog">← Volver al listado</a>
      </div>

      @if (loading()) {
        <div class="loading">Cargando…</div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save('keep')" class="editor-grid">
          <div class="editor-main">
            <label>Título
              <input type="text" formControlName="title" (input)="onTitleChange()" placeholder="Título del artículo">
            </label>

            <label>Slug (URL)
              <input type="text" formControlName="slug" placeholder="mi-articulo">
              <small>/el-archivo/{{ form.value.slug || 'slug' }}</small>
            </label>

            <label>Resumen (excerpt)
              <textarea formControlName="excerpt" rows="2" placeholder="Resumen corto para las tarjetas de listado"></textarea>
            </label>

            <label>Contenido (Markdown)</label>
            <app-markdown-editor formControlName="content" [destPath]="'blog'"></app-markdown-editor>

            @if (formError()) {
              <p class="error">{{ formError() }}</p>
            }
          </div>

          <aside class="editor-sidebar">
            <div class="panel">
              <h3>Publicación</h3>
              <p class="status-line">
                Estado actual:
                <span class="status-badge" [class.published]="form.value.status === 'published'">
                  {{ form.value.status === 'published' ? 'Publicado' : 'Borrador' }}
                </span>
              </p>
              <div class="panel-actions">
                <button type="button" class="btn btn--primary" (click)="save('publish')" [disabled]="saving()">
                  {{ saving() ? 'Guardando…' : 'Guardar y publicar' }}
                </button>
                <button type="button" class="btn btn--secondary" (click)="save('draft')" [disabled]="saving()">
                  Guardar como borrador
                </button>
              </div>
            </div>

            <div class="panel">
              <h3>Imagen destacada</h3>
              <app-image-uploader destPath="blog" label="Subir portada"
                [initialUrl]="form.value.featured_image_url"
                (uploaded)="onFeaturedImage($event)"></app-image-uploader>
            </div>

            <div class="panel">
              <h3>Categorías</h3>
              @for (cat of categories(); track cat.id) {
                <label class="checkbox-row">
                  <input type="checkbox" [checked]="isCategorySelected(cat.id)" (change)="toggleCategory(cat.id)">
                  {{ cat.name }}
                </label>
              }
            </div>

            <div class="panel">
              <h3>SEO</h3>
              <label>Meta título
                <input type="text" formControlName="meta_title">
              </label>
              <label>Meta descripción
                <textarea formControlName="meta_description" rows="2"></textarea>
              </label>
            </div>
          </aside>
        </form>
      }
    </div>
  `,
  styles: [`
    .blog-editor { padding: 2rem; font-family: 'Poppins', sans-serif; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-family: 'Teko', sans-serif; font-size: 2rem; color: #7B1716; text-transform: uppercase; }
    .btn { border: none; border-radius: 3px; padding: 0.55rem 1.1rem; font-size: 0.85rem; cursor: pointer; text-decoration: none; }
    .btn--primary { background: #7B1716; color: #E6C15A; font-weight: 600; }
    .btn--secondary { background: #F4F1E9; color: #1A1208; }
    .btn--ghost { background: transparent; color: #5A4F3E; }
    .editor-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
    .editor-main { display: flex; flex-direction: column; gap: 1rem; background: #fff; padding: 1.5rem; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .editor-main label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; color: #5A4F3E; font-weight: 500; }
    .editor-main input, .editor-main textarea { border: 1px solid #d8d0bd; border-radius: 3px; padding: 0.55rem 0.75rem; font-family: inherit; font-size: 0.95rem; }
    .editor-main small { color: #8C7F6A; }
    .editor-sidebar { display: flex; flex-direction: column; gap: 1rem; }
    .panel { background: #fff; padding: 1.1rem; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .panel h3 { font-family: 'Teko', sans-serif; font-size: 1.2rem; color: #7B1716; margin-bottom: 0.6rem; text-transform: uppercase; }
    .panel label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; margin-bottom: 0.6rem; }
    .panel input, .panel textarea { border: 1px solid #d8d0bd; border-radius: 3px; padding: 0.45rem 0.6rem; font-family: inherit; }
    .panel-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }
    .checkbox-row { flex-direction: row !important; align-items: center; gap: 0.5rem !important; font-size: 0.85rem; }
    .status-line { font-size: 0.85rem; color: #5A4F3E; }
    .status-badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 12px; background: #eee; color: #666; }
    .status-badge.published { background: #E9F3DC; color: #4a7c2c; }
    .error { color: #b00020; font-size: 0.85rem; }
    .loading { padding: 3rem; text-align: center; color: #8C7F6A; }
  `],
})
export class AdminBlogEditorComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  form!: FormGroup;
  categories = signal<BlogCategoryLite[]>([]);
  selectedCategoryIds = signal<number[]>([]);
  loading = signal(true);
  saving = signal(false);
  formError = signal<string | null>(null);
  postId = signal<number | null>(null);
  slugTouchedByUser = false;

  isNew(): boolean {
    return this.postId() === null;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      slug: ['', Validators.required],
      excerpt: [''],
      content: ['', Validators.required],
      featured_image_url: [null],
      status: ['draft'],
      meta_title: [''],
      meta_description: [''],
    });

    this.form.get('slug')!.valueChanges.subscribe(() => { this.slugTouchedByUser = true; });

    this.loadCategories();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      this.postId.set(Number(idParam));
      this.loadPost(Number(idParam));
    } else {
      this.loading.set(false);
    }
  }

  loadCategories(): void {
    this.http.get<BlogCategoryLite[]>(`${environment.apiUrl}/admin/blog/categories`).subscribe({
      next: (cats) => this.categories.set(cats),
    });
  }

  loadPost(id: number): void {
    this.http.get<BlogPostDetail>(`${environment.apiUrl}/admin/blog/posts/${id}`).subscribe({
      next: (post) => {
        this.form.patchValue({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featured_image_url: post.featured_image_url,
          status: post.status,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
        });
        this.selectedCategoryIds.set(post.categories.map(c => c.id));
        this.slugTouchedByUser = true;
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el artículo');
        this.loading.set(false);
      },
    });
  }

  onTitleChange(): void {
    if (!this.slugTouchedByUser || !this.form.value.slug) {
      this.form.patchValue({ slug: slugify(this.form.value.title || '') }, { emitEvent: false });
    }
  }

  onFeaturedImage(url: string): void {
    this.form.patchValue({ featured_image_url: url });
  }

  isCategorySelected(id: number): boolean {
    return this.selectedCategoryIds().includes(id);
  }

  toggleCategory(id: number): void {
    this.selectedCategoryIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  save(mode: 'draft' | 'publish' | 'keep'): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Completa el título, el slug y el contenido');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const value = this.form.value;
    let status = value.status;
    if (mode === 'publish') status = 'published';
    if (mode === 'draft') status = 'draft';

    const payload = {
      title: value.title,
      slug: value.slug,
      excerpt: value.excerpt || null,
      content: value.content,
      featured_image_url: value.featured_image_url || null,
      meta_title: value.meta_title || null,
      meta_description: value.meta_description || null,
      status,
      category_ids: this.selectedCategoryIds(),
    };

    const id = this.postId();
    const request = id
      ? this.http.put(`${environment.apiUrl}/admin/blog/posts/${id}`, payload)
      : this.http.post(`${environment.apiUrl}/admin/blog/posts`, payload);

    request.subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.toast.success('Artículo guardado');
        if (!id && res?.id) {
          this.router.navigate(['/admin/blog', res.id]);
        } else {
          this.form.patchValue({ status });
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail || 'Error al guardar el artículo');
      },
    });
  }
}
