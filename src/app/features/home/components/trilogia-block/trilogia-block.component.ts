import { Component } from '@angular/core';

const STEPS = [
  {
    number: '01',
    name: 'Tostado',
    phrase: 'El calor activa los aceites naturales del pistacho, concentrando el sabor hasta su punto óptimo.',
    icon: 'assets/images/tostado.svg',
  },
  {
    number: '02',
    name: 'Repelado',
    phrase: 'Retiramos la piel para obtener la cremosidad y el color verde intenso sin amargor residual.',
    icon: 'assets/images/repelado.svg',
  },
  {
    number: '03',
    name: 'Molino de piedra',
    phrase: 'La piedra tritura lentamente sin calentar el aceite: la textura perfecta en su estado más puro.',
    icon: 'assets/images/molido.svg',
  },
];

@Component({
  selector: 'app-trilogia-block',
  standalone: true,
  template: `
    <section class="trilogia">
      <div class="trilogia__container">
        <div class="trilogia__header">
          <h2 class="trilogia__title">LA TRILOGÍA DEL SABOR</h2>
          <p class="trilogia__subtitle">Método desarrollado a base de prueba y error</p>
        </div>
        <div class="trilogia__grid">
          @for (step of steps; track step.number) {
            <div class="trilogia__step">
              <div class="trilogia__step-top">
                <span class="trilogia__step-num">{{ step.number }}</span>
                <div class="trilogia__step-icon">
                  <img [src]="step.icon" [alt]="step.name" width="28" height="28" loading="lazy">
                </div>
              </div>
              <h3 class="trilogia__step-name">{{ step.name }}</h3>
              <p class="trilogia__step-phrase">{{ step.phrase }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    $brand:  #7B1716;
    $accent: #E6C15A;
    $bg:     #F4F1E9;
    $ink:    #1C1A14;
    $muted:  #6B6456;
    $border: rgba(28, 26, 20, 0.1);

    :host { display: block; }

    .trilogia {
      background: $bg;
      padding: 4rem 0 5rem;
    }

    .trilogia__container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .trilogia__header {
      text-align: center;
      margin-bottom: 3.5rem;
    }

    .trilogia__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(2rem, 4vw, 2.8rem);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $brand;
      margin: 0 0 0.5rem;
    }

    .trilogia__subtitle {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1rem;
      color: $muted;
      margin: 0;
      line-height: 1.6;
    }

    .trilogia__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 2.5rem;
        max-width: 480px;
        margin: 0 auto;
      }
    }

    .trilogia__step {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1.75rem 1.5rem;
      border: 1px solid $border;
      border-radius: 6px;
      background: white;
      transition: box-shadow 200ms;

      &:hover {
        box-shadow: 0 8px 24px rgba($ink, 0.06);
      }
    }

    .trilogia__step-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .trilogia__step-num {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 2.4rem;
      line-height: 1;
      color: $accent;
      letter-spacing: -0.02em;
    }

    .trilogia__step-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba($brand, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      color: $brand;
      flex-shrink: 0;

      img {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }
    }

    .trilogia__step-name {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 1.4rem;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: $ink;
      margin: 0;
    }

    .trilogia__step-phrase {
      font-family: 'Lora', serif;
      font-size: 0.88rem;
      color: $muted;
      line-height: 1.65;
      margin: 0;
    }
  `]
})
export class TrilogiaBlockComponent {
  readonly steps = STEPS;
}
