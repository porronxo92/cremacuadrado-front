import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { pricePerHundredGrams } from '../../../../core/utils/format-price';

@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="price-display">
      <span class="price-display__total">
        {{ price / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}
      </span>
      <span class="price-display__per100">
        {{ per100g / 100 | currency:'EUR':'symbol':'1.2-2':'es' }}/100g
      </span>
    </div>
  `,
  styles: [`
    $brand: #7B1716;
    $muted: #6B6456;

    :host { display: block; }

    .price-display {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .price-display__total {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 2.6rem;
      line-height: 1;
      letter-spacing: -0.02em;
      color: $brand;
    }

    .price-display__per100 {
      font-family: 'Poppins', sans-serif;
      font-weight: 300;
      font-size: 0.82rem;
      color: $muted;
    }
  `]
})
export class PriceDisplayComponent {
  @Input() price = 0;    // cents
  @Input() grams = 100;  // grams for the selected format

  get per100g(): number {
    return pricePerHundredGrams(this.price, this.grams);
  }
}
