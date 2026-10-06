import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProductFormat {
  id: string | number;
  label: string;
  grams: number;
  price: number; // cents
  badge?: string;
  badgeColor?: 'gray' | 'green' | 'yellow' | 'brand';
}

@Component({
  selector: 'app-format-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fmt-grid" role="group" aria-label="Selecciona el formato">
      @for (fmt of formats; track fmt.id) {
        <button
          type="button"
          class="fmt-card"
          [class.is-active]="selected?.id === fmt.id"
          [class.is-best]="fmt.badgeColor === 'yellow'"
          (click)="select(fmt)"
          [attr.aria-pressed]="selected?.id === fmt.id">
          <!-- Sin aria-label: el lector lee el texto visible (formato, precio y etiqueta) -->
          @if (selected?.id === fmt.id) {
            <span class="fmt-card__check" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          }
          <div class="fmt-card__name">{{ fmt.label }}</div>
          <div class="fmt-card__price">{{ fmt.price / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}</div>
          @if (fmt.badge) {
            <div class="fmt-card__badge fmt-card__badge--{{ fmt.badgeColor ?? 'gray' }}">{{ fmt.badge }}</div>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    $brand:  #7B1716;
    $accent: #E6C15A;
    $bg:     #F4F1E9;
    $ink:    #1C1A14;
    $muted:  #6B6456;
    $verde:  #A2BA1C;
    $border: rgba(28,26,20,0.1);

    :host { display: block; }

    .fmt-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .fmt-card {
      position: relative;
      min-height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 8px 6px;
      background: $bg;
      border: 1.5px solid $border;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      transition: border-color 150ms, background 150ms;

      touch-action: manipulation;

      // Seleccionado: borde granate de 2px + check (contraste ≥ 3:1 y no depende solo del color)
      &:hover { border-color: rgba($brand, 0.45); }
      &.is-best:not(.is-active) { border-color: $accent; }
      &.is-active { border: 2px solid $brand; padding: 7.5px 5.5px; background: rgba($brand, 0.04); }
    }

    .fmt-card__name {
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: $ink;
    }

    .fmt-card__price {
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: $brand;
    }

    .fmt-card__check {
      position: absolute;
      top: -7px;
      right: -7px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: $brand;
      color: $accent;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fmt-card__badge {
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 20px;
      white-space: nowrap;
      margin-top: 1px;

      &--gray   { background: rgba(28,26,20,0.07); color: $muted; }
      &--green  { background: rgba(162,186,28,0.15); color: #5A6B0A; }
      &--yellow { background: rgba(230,193,90,0.2);  color: #7A5800; }
      &--brand  { background: rgba($brand,0.1);       color: $brand; }
    }
  `]
})
export class FormatSelectorComponent {
  @Input() formats: ProductFormat[] = [];
  @Input() selected: ProductFormat | null = null;
  @Output() formatChange = new EventEmitter<ProductFormat>();

  select(fmt: ProductFormat): void {
    this.formatChange.emit(fmt);
  }
}
