import {
  Component, ElementRef, EventEmitter, HostListener, Injectable, Input, OnDestroy, OnInit, Output,
  computed, inject, input, output, signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { BadgeTone } from './admin-labels';

// ═════════════════════════════════════════════════════════════════════════
// Badge
// ═════════════════════════════════════════════════════════════════════════
@Component({
  selector: 'adm-badge',
  standalone: true,
  template: `<span class="adm-badge" [attr.data-tone]="tone()"><ng-content /></span>`,
})
export class AdminBadgeComponent {
  tone = input<BadgeTone>('neutral');
}

// ═════════════════════════════════════════════════════════════════════════
// Pagination
// ═════════════════════════════════════════════════════════════════════════
@Component({
  selector: 'adm-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (total() > 0) {
      <nav class="adm-pagination" aria-label="Paginación">
        <span class="adm-pagination__info">
          {{ from() }}–{{ to() }} de {{ total() }}
        </span>
        <div class="adm-pagination__pages">
          <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="go(page() - 1)"
                  [disabled]="page() <= 1" aria-label="Página anterior">‹</button>
          @for (p of pages(); track $index) {
            @if (p === 0) {
              <span class="adm-pagination__gap">…</span>
            } @else {
              <button type="button" class="adm-btn adm-btn--sm"
                      [class.adm-btn--primary]="p === page()" [class.adm-btn--ghost]="p !== page()"
                      [attr.aria-current]="p === page() ? 'page' : null" (click)="go(p)">{{ p }}</button>
            }
          }
          <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="go(page() + 1)"
                  [disabled]="page() >= totalPages()" aria-label="Página siguiente">›</button>
        </div>
        <label class="adm-pagination__size">
          <span>Por página</span>
          <select [value]="pageSize()" (change)="changeSize($event)">
            @for (s of sizes; track s) { <option [value]="s" [selected]="s === pageSize()">{{ s }}</option> }
          </select>
        </label>
      </nav>
    }
  `,
})
export class AdminPaginationComponent {
  page = input.required<number>();
  pageSize = input.required<number>();
  total = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();
  pageSizeChange = output<number>();

  readonly sizes = [10, 20, 50, 100];

  from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  /** Page numbers with gaps (0 = ellipsis): 1 … 4 5 6 … 20 */
  pages = computed(() => {
    const last = this.totalPages();
    const cur = this.page();
    const set = new Set([1, last, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= last));
    const sorted = [...set].sort((a, b) => a - b);
    const out: number[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) out.push(0);
      out.push(p);
    });
    return out;
  });

  go(p: number): void {
    if (p >= 1 && p <= this.totalPages() && p !== this.page()) this.pageChange.emit(p);
  }

  changeSize(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Modal (centered on desktop, bottom sheet on mobile). Esc closes, focus trapped.
// ═════════════════════════════════════════════════════════════════════════
@Component({
  selector: 'adm-modal',
  standalone: true,
  template: `
    <div class="adm-modal-backdrop" (click)="requestClose()"></div>
    <div class="adm-modal" [attr.data-size]="size" role="dialog" aria-modal="true" [attr.aria-label]="title">
      <header class="adm-modal__header">
        <h2>{{ title }}</h2>
        <button type="button" class="adm-icon-btn" (click)="requestClose()" aria-label="Cerrar">×</button>
      </header>
      <div class="adm-modal__body"><ng-content /></div>
      <footer class="adm-modal__footer"><ng-content select="[modal-footer]" /></footer>
    </div>
  `,
  host: { class: 'adm-modal-host' },
})
export class AdminModalComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() closable = true;
  @Output() closed = new EventEmitter<void>();

  private static openCount = 0;
  private el = inject(ElementRef<HTMLElement>);
  private doc = inject(DOCUMENT);
  private previouslyFocused: HTMLElement | null = null;

  ngOnInit(): void {
    this.previouslyFocused = this.doc.activeElement as HTMLElement | null;
    AdminModalComponent.openCount++;
    this.doc.body.classList.add('adm-scroll-lock');
    setTimeout(() => {
      const body = this.el.nativeElement.querySelector('.adm-modal__body') as HTMLElement | null;
      const firstInBody = body ? this.focusables(body)[0] : undefined;
      (firstInBody ?? this.focusables()[0])?.focus();
    });
  }

  ngOnDestroy(): void {
    AdminModalComponent.openCount = Math.max(0, AdminModalComponent.openCount - 1);
    if (AdminModalComponent.openCount === 0) this.doc.body.classList.remove('adm-scroll-lock');
    this.previouslyFocused?.focus?.();
  }

  requestClose(): void {
    if (this.closable) this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.requestClose();
    } else if (event.key === 'Tab') {
      const items = this.focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && this.doc.activeElement === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && this.doc.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }
  }

  private focusables(root: HTMLElement = this.el.nativeElement): HTMLElement[] {
    const sel = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll<HTMLElement>(sel));
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Confirm dialog (replaces window.confirm). Usage: `if (await confirm.ask({...}))`
// ═════════════════════════════════════════════════════════════════════════
export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminConfirmService {
  readonly current = signal<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    this.current()?.resolve(false);
    return new Promise(resolve => this.current.set({ ...options, resolve }));
  }

  answer(ok: boolean): void {
    const c = this.current();
    this.current.set(null);
    c?.resolve(ok);
  }
}

@Component({
  selector: 'adm-confirm-host',
  standalone: true,
  imports: [AdminModalComponent],
  template: `
    @if (confirm.current(); as c) {
      <adm-modal [title]="c.title" size="sm" (closed)="confirm.answer(false)">
        <p class="adm-confirm-text">{{ c.message }}</p>
        <div modal-footer>
          <button type="button" class="adm-btn adm-btn--ghost" (click)="confirm.answer(false)">{{ c.cancelText || 'Cancelar' }}</button>
          <button type="button" class="adm-btn" [class.adm-btn--danger]="c.danger" [class.adm-btn--primary]="!c.danger"
                  (click)="confirm.answer(true)">{{ c.confirmText || 'Confirmar' }}</button>
        </div>
      </adm-modal>
    }
  `,
})
export class AdminConfirmHostComponent {
  confirm = inject(AdminConfirmService);
}

// ═════════════════════════════════════════════════════════════════════════
// Stat card
// ═════════════════════════════════════════════════════════════════════════
@Component({
  selector: 'adm-stat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="adm-stat__label">{{ label }}</span>
    <strong class="adm-stat__value">{{ value }}</strong>
    @if (growth !== null && growth !== undefined) {
      <span class="adm-stat__delta" [class.up]="growth >= 0" [class.down]="growth < 0">
        {{ growth >= 0 ? '▲' : '▼' }} {{ growth | number:'1.0-1' }}%
      </span>
    }
    @if (hint) { <span class="adm-stat__hint">{{ hint }}</span> }
  `,
  host: { class: 'adm-stat', '[class.adm-stat--highlight]': 'highlight' },
})
export class AdminStatComponent {
  @Input() label = '';
  @Input() value: string | number | null = '';
  @Input() hint = '';
  @Input() growth: number | null | undefined = null;
  @Input() highlight = false;
}

export const ADMIN_UI = [
  AdminBadgeComponent, AdminPaginationComponent, AdminModalComponent, AdminStatComponent,
] as const;
