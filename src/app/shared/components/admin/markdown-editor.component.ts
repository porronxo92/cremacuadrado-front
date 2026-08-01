import { Component, ElementRef, forwardRef, inject, Input, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Markdown editor with toolbar, image upload and live preview.
 * Implements ControlValueAccessor so it can be used as `formControlName="content"`.
 */
@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarkdownEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="md-editor">
      <div class="md-toolbar">
        <button type="button" title="Negrita" (click)="wrapSelection('**', '**')"><strong>N</strong></button>
        <button type="button" title="Cursiva" (click)="wrapSelection('*', '*')"><em>K</em></button>
        <button type="button" title="Título" (click)="insertLinePrefix('## ')">H2</button>
        <button type="button" title="Subtítulo" (click)="insertLinePrefix('### ')">H3</button>
        <button type="button" title="Lista" (click)="insertLinePrefix('- ')">• Lista</button>
        <button type="button" title="Lista numerada" (click)="insertLinePrefix('1. ')">1. Lista</button>
        <button type="button" title="Cita" (click)="insertLinePrefix('> ')">" Cita</button>
        <button type="button" title="Enlace" (click)="insertLink()">🔗 Enlace</button>
        <button type="button" title="Insertar imagen" (click)="imageInput.click()" [disabled]="uploadingImage()">
          {{ uploadingImage() ? 'Subiendo…' : '🖼 Imagen' }}
        </button>
        <input #imageInput type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" hidden
          (change)="onImageSelected($event)">
        <div class="md-toolbar__spacer"></div>
        <button type="button" class="md-toolbar__toggle" (click)="showPreview.set(!showPreview())">
          {{ showPreview() ? 'Ocultar vista previa' : 'Vista previa' }}
        </button>
      </div>

      <div class="md-body" [class.split]="showPreview()">
        <textarea
          #textarea
          class="md-textarea"
          [ngModel]="value()"
          (ngModelChange)="onTextChange($event)"
          [rows]="rows"
          placeholder="Escribe en Markdown… **negrita**, ## título, - lista, ![alt](url) imagen"
        ></textarea>

        @if (showPreview()) {
          <div class="md-preview" [innerHTML]="previewHtml()"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .md-editor {
      border: 1px solid #d8d0bd;
      border-radius: 4px;
      overflow: hidden;
      font-family: 'Poppins', sans-serif;
    }
    .md-toolbar {
      display: flex; flex-wrap: wrap; gap: 0.25rem;
      background: #F4F1E9; border-bottom: 1px solid #d8d0bd;
      padding: 0.4rem;
    }
    .md-toolbar button {
      background: #fff; border: 1px solid #d8d0bd; border-radius: 3px;
      padding: 0.3rem 0.55rem; font-size: 0.8rem; cursor: pointer; color: #1A1208;
    }
    .md-toolbar button:hover { border-color: #7B1716; color: #7B1716; }
    .md-toolbar button:disabled { opacity: 0.6; cursor: wait; }
    .md-toolbar__spacer { flex: 1; }
    .md-toolbar__toggle { font-weight: 600; }
    .md-body { display: flex; }
    .md-body.split .md-textarea { width: 50%; border-right: 1px solid #d8d0bd; }
    .md-body.split .md-preview { width: 50%; }
    .md-textarea {
      width: 100%; border: none; outline: none; resize: vertical;
      padding: 0.85rem; font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.9rem; line-height: 1.5; color: #1A1208;
    }
    .md-preview {
      padding: 0.85rem; overflow-y: auto; max-height: 480px;
      font-family: 'Lora', serif; color: #1A1208; line-height: 1.6;
    }
    .md-preview :is(h1,h2,h3) { font-family: 'Teko', sans-serif; color: #7B1716; }
    .md-preview img { max-width: 100%; border-radius: 2px; }
    .md-preview a { color: #7B1716; }
  `],
})
export class MarkdownEditorComponent implements ControlValueAccessor {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private toast = inject(ToastService);

  @ViewChild('textarea') private textareaRef?: ElementRef<HTMLTextAreaElement>;

  /** Vercel Blob destination folder for images inserted from this editor. */
  @Input() destPath = 'blog';
  @Input() rows = 16;

  value = signal('');
  showPreview = signal(true);
  uploadingImage = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  previewHtml = signal<SafeHtml>('');

  writeValue(value: string): void {
    this.value.set(value || '');
    this.updatePreview();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onTextChange(newValue: string): void {
    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();
    this.updatePreview();
  }

  private updatePreview(): void {
    const rawHtml = marked.parse(this.value(), { async: false }) as string;
    const clean = DOMPurify.sanitize(rawHtml);
    this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(clean));
  }

  private getTextarea(): HTMLTextAreaElement | null {
    return this.textareaRef?.nativeElement ?? null;
  }

  private replaceSelection(newText: string, cursorOffset = 0): void {
    const textarea = this.getTextarea();
    const current = this.value();
    if (!textarea) {
      this.onTextChange(current + newText);
      return;
    }
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const updated = current.slice(0, start) + newText + current.slice(end);
    this.onTextChange(updated);
    queueMicrotask(() => {
      textarea.focus();
      const pos = start + newText.length + cursorOffset;
      textarea.setSelectionRange(pos, pos);
    });
  }

  wrapSelection(before: string, after: string): void {
    const textarea = this.getTextarea();
    const current = this.value();
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = current.slice(start, end) || 'texto';
    const updated = current.slice(0, start) + before + selected + after + current.slice(end);
    this.onTextChange(updated);
    queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  insertLinePrefix(prefix: string): void {
    const textarea = this.getTextarea();
    const current = this.value();
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const lineStart = current.lastIndexOf('\n', start - 1) + 1;
    const updated = current.slice(0, lineStart) + prefix + current.slice(lineStart);
    this.onTextChange(updated);
  }

  insertLink(): void {
    this.replaceSelection('[texto del enlace](https://)', -1);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dest_path', this.destPath);

    this.http.post<{ url: string }>(`${environment.apiUrl}/admin/upload-image`, formData).subscribe({
      next: (res) => {
        this.uploadingImage.set(false);
        this.replaceSelection(`![Imagen](${res.url})`);
      },
      error: (err) => {
        this.uploadingImage.set(false);
        this.toast.error(err.error?.detail || 'Error al subir la imagen');
      },
    });
    input.value = '';
  }
}
