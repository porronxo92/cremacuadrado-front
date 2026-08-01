import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Reusable drag & drop image uploader. Uploads directly to
 * POST /admin/upload-image (Vercel Blob) and emits the resulting public URL.
 */
@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="uploader"
      [class.dragging]="dragging()"
      [class.compact]="compact"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        [multiple]="multiple" hidden (change)="onFileChange($event)">

      @if (uploading()) {
        <div class="uploader__state">
          <span class="spinner"></span>
          <span>Subiendo…</span>
        </div>
      } @else if (previewUrl()) {
        <img [src]="previewUrl()" [alt]="label" class="uploader__preview">
        <span class="uploader__hint">Cambiar imagen</span>
      } @else {
        <div class="uploader__state">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>{{ label }}</span>
          <small>Arrastra una imagen o haz clic</small>
        </div>
      }
    </div>
  `,
  styles: [`
    .uploader {
      border: 2px dashed #d8d0bd;
      border-radius: 4px;
      padding: 1rem;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      position: relative;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .uploader.compact { min-height: 56px; padding: 0.5rem; }
    .uploader:hover, .uploader.dragging { border-color: #7B1716; background: rgba(123,23,22,0.04); }
    .uploader__state {
      display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
      color: #5A4F3E; font-family: 'Poppins', sans-serif; font-size: 0.85rem;
    }
    .uploader__state small { color: #8C7F6A; font-size: 0.75rem; }
    .uploader__preview { max-width: 100%; max-height: 140px; object-fit: contain; border-radius: 2px; }
    .uploader__hint {
      position: absolute; bottom: 4px; left: 0; right: 0; text-align: center;
      font-size: 0.7rem; color: #fff; background: rgba(26,18,8,0.6); padding: 2px 0;
    }
    .spinner {
      width: 18px; height: 18px; border: 2px solid #d8d0bd; border-top-color: #7B1716;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ImageUploaderComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  /** Vercel Blob destination folder, e.g. "blog", "categories", "products/Crema Pura". */
  @Input() destPath = 'misc';
  @Input() label = 'Subir imagen';
  @Input() multiple = false;
  @Input() compact = false;

  @Input() set initialUrl(url: string | null | undefined) {
    this.previewUrl.set(url ?? null);
  }

  @Output() uploaded = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<string>();

  uploading = signal(false);
  dragging = signal(false);
  previewUrl = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.uploadFiles(Array.from(files));
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploadFiles(Array.from(input.files));
    }
    input.value = '';
  }

  private uploadFiles(files: File[]): void {
    const toUpload = this.multiple ? files : [files[0]];
    this.uploading.set(true);

    let remaining = toUpload.length;
    for (const file of toUpload) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dest_path', this.destPath);

      this.http.post<{ url: string }>(`${environment.apiUrl}/admin/upload-image`, formData).subscribe({
        next: (res) => {
          this.previewUrl.set(res.url);
          this.uploaded.emit(res.url);
          remaining -= 1;
          if (remaining <= 0) this.uploading.set(false);
        },
        error: (err) => {
          remaining -= 1;
          if (remaining <= 0) this.uploading.set(false);
          const message = err.error?.detail || 'Error al subir la imagen';
          this.uploadError.emit(message);
          this.toast.error(message);
        },
      });
    }
  }
}
