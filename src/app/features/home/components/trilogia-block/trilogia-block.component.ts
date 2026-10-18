import { Component } from '@angular/core';

const STEPS = [
  {
    number: '01',
    name: 'Tostado',
    phrase: 'El calor activa los aceites y concentra el sabor.',
    icon: 'assets/images/tostado.svg',
  },
  {
    number: '02',
    name: 'Repelado',
    phrase: 'Sin piel: más cremosidad y sin amargor.',
    icon: 'assets/images/repelado.svg',
  },
  {
    number: '03',
    name: 'Molino de piedra',
    phrase: 'Muele despacio, sin calentar el aceite.',
    icon: 'assets/images/molido.svg',
  },
];

@Component({
  selector: 'app-trilogia-block',
  standalone: true,
  template: `
    <section class="trilogia" aria-labelledby="trilogia-title">
      <div class="trilogia__container">
        <div class="trilogia__header">
          <h2 class="trilogia__title" id="trilogia-title">LA TRILOGÍA DEL SABOR</h2>
          <p class="trilogia__subtitle">Método desarrollado a base de prueba y error</p>
        </div>
        <ul class="trilogia__grid">
          @for (step of steps; track step.number) {
            <li class="trilogia__step">
              <span class="trilogia__step-icon">
                <img [src]="step.icon" alt="" width="24" height="24" loading="lazy">
              </span>
              <div class="trilogia__step-text">
                <h3 class="trilogia__step-name">{{ step.name }}</h3>
                <p class="trilogia__step-phrase">{{ step.phrase }}</p>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: [`
    $brand:  #7B1716;
    $bg:     #F4F1E9;
    $ink:    #1C1A14;
    $muted:  #6B6456;
    $border: rgba(28, 26, 20, 0.1);

    :host { display: block; }

    .trilogia {
      background: $bg;
      padding: 1.5rem 0 1.75rem;

      @media (max-width: 768px) { padding: 1rem 0 1.25rem; }
    }

    .trilogia__container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;

      @media (max-width: 768px) { padding: 0 0.75rem; }
    }

    .trilogia__header {
      text-align: center;
      margin-bottom: 1rem;

      @media (max-width: 768px) { margin-bottom: 0.75rem; }
    }

    .trilogia__title {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: clamp(1.5rem, 3vw, 1.9rem);
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: $brand;
      margin: 0 0 0.15rem;
    }

    .trilogia__subtitle {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.875rem;
      color: $muted;
      margin: 0;
      line-height: 1.4;
    }

    .trilogia__grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .trilogia__step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.9rem;
      border: 1px solid $border;
      border-radius: 6px;
      background: white;

      @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
        gap: 0.35rem;
        padding: 0.6rem 0.4rem;
      }
    }

    .trilogia__step-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba($brand, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img {
        width: 22px;
        height: 22px;
        object-fit: contain;
      }
    }

    .trilogia__step-name {
      font-family: 'Teko', sans-serif;
      font-weight: 700;
      font-size: 1.15rem;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: $ink;
      margin: 0;
    }

    .trilogia__step-phrase {
      font-family: 'Lora', serif;
      font-size: 0.8125rem;
      color: $muted;
      line-height: 1.4;
      margin: 0.1rem 0 0;

      @media (max-width: 768px) { font-size: 0.75rem; }
    }
  `]
})
export class TrilogiaBlockComponent {
  readonly steps = STEPS;
}
