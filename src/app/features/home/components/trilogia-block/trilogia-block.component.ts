import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface TrilogiaStep {
  id: string;
  name: string;
  phrase: string;
  icon: string;
  photo: string;
  alt: string;
  /** Giro con el que entra el icono en la foto */
  rot: string;
}

const STEPS: TrilogiaStep[] = [
  {
    id: 'tostado',
    name: 'Tostado ligero',
    phrase: 'Calor justo: activa los aceites sin tapar el sabor del pistacho.',
    icon: 'assets/images/tostado.svg',
    photo: 'assets/images/trilogia/tostado.webp',
    alt: 'Pistachos recién tostados en una bandeja de acero',
    rot: '-8deg',
  },
  {
    id: 'repelado',
    name: 'Repelado',
    phrase: 'Sin piel: más cremosidad y sin amargor.',
    icon: 'assets/images/repelado.svg',
    photo: 'assets/images/trilogia/repelado.webp',
    alt: 'Pistachos soltando la piel violeta',
    rot: '6deg',
  },
  {
    id: 'molino',
    name: 'Molino de piedra',
    phrase: 'Muele despacio, sin calentar el aceite.',
    icon: 'assets/images/molido.svg',
    photo: 'assets/images/trilogia/molino.webp',
    alt: 'Molino de piedra convirtiendo el pistacho en crema',
    rot: '-90deg',
  },
];

/** Fracción mínima de la sección en pantalla para que el ciclo avance */
const IN_VIEW_RATIO = 0.35;
/** Desplazamiento horizontal mínimo (px) para contar un swipe */
const SWIPE_PX = 40;

/**
 * La Trilogía del Sabor: recorrido automático por los tres pasos del método.
 * Los tres pasos están siempre en el HTML (también en SSR). En escritorio se
 * ven los tres y la animación decide cuál protagoniza la foto; por debajo de
 * 880 px solo se ve el activo, junto a la foto, con tres segmentos de progreso.
 * El ritmo lo marca la animación CSS de la barra del paso activo: al terminar
 * (animationend) se pasa al siguiente.
 *
 * No hay botón de pausa (decisión de negocio). El ciclo solo se detiene con el
 * ratón encima, con foco de teclado dentro, fuera de pantalla o con la pestaña oculta.
 */
@Component({
  selector: 'app-trilogia-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="trilogia"
      aria-labelledby="trilogia-title"
      [class.is-paused]="paused()"
      [style.--trilogia-step-ms]="stepMs() + 'ms'"
      (pointerenter)="onPointer($event, true)"
      (pointerleave)="onPointer($event, false)"
      (focusin)="onFocusIn($event)"
      (focusout)="onFocusOut($event)">
      <div class="trilogia__container" (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)">
        <div class="trilogia__header">
          <p class="trilogia__eyebrow">Nuestro método · 3 pasos</p>
          <h2 class="trilogia__title" id="trilogia-title">LA TRILOGÍA DEL SABOR</h2>
          <p class="trilogia__subtitle">Método desarrollado a base de prueba y error</p>
        </div>

        <div class="trilogia__stage">
          @for (step of steps; track step.id; let i = $index) {
            <img
              class="trilogia__photo"
              [class.is-active]="i === active()"
              [src]="step.photo"
              [alt]="i === active() ? step.alt : ''"
              width="720"
              height="900"
              [attr.loading]="i === 0 ? 'eager' : 'lazy'"
              [attr.fetchpriority]="i === 0 ? 'high' : null"
              decoding="async">
          }
          <div class="trilogia__scrim" aria-hidden="true"></div>

          <div class="trilogia__now">
            <span class="trilogia__badge" aria-hidden="true">
              @for (step of steps; track step.id; let i = $index) {
                <img
                  class="trilogia__badge-icon"
                  [class.is-active]="i === active()"
                  [style.--trilogia-rot]="step.rot"
                  [src]="step.icon"
                  alt=""
                  width="80"
                  height="80">
              }
            </span>
            <span class="trilogia__now-text">
              <span class="trilogia__now-step">Paso {{ active() + 1 }} de {{ steps.length }}</span>
              <span class="trilogia__now-name" [attr.aria-live]="paused() ? 'polite' : null">{{ current().name }}</span>
            </span>
          </div>
        </div>

        <ul class="trilogia__grid">
          @for (step of steps; track step.id; let i = $index) {
            <li class="trilogia__step" [class.is-active]="i === active()" [style.--i]="i">
              <span class="trilogia__step-icon">
                <img [src]="step.icon" alt="" width="40" height="40" loading="lazy">
              </span>
              <div class="trilogia__step-text">
                <span class="trilogia__step-num" aria-hidden="true">0{{ i + 1 }}</span>
                <h3 class="trilogia__step-name">
                  <button
                    type="button"
                    class="trilogia__step-btn"
                    [attr.aria-current]="i === active() ? 'step' : null"
                    (click)="go(i)">{{ step.name }}</button>
                </h3>
                <p class="trilogia__step-phrase">{{ step.phrase }}</p>
              </div>
              <span class="trilogia__bar" aria-hidden="true">
                <span class="trilogia__bar-fill" (animationend)="next()"></span>
              </span>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: [`
    $photo-scrim: rgba(38, 18, 12, 0.62);
    $line: rgba(123, 23, 22, 0.16);   // granate al 16 %
    $ring: rgba(123, 23, 22, 0.28);
    $seg-gap: 8px;                    // hueco entre segmentos de progreso (móvil)

    :host { display: block; }

    .trilogia {
      container-type: inline-size;
      background: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-narrative);
      padding: var(--spacing-2xl) max(16px, env(safe-area-inset-right, 0px)) var(--spacing-2xl) max(16px, env(safe-area-inset-left, 0px));
    }

    // ── Móvil primero (< 880 px): cabecera arriba; foto a la izquierda y paso activo a la derecha ──
    .trilogia__container {
      max-width: 1180px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 42fr) minmax(0, 58fr);
      grid-template-areas: 'head head' 'stage side';
      gap: 20px var(--spacing-md);
    }

    .trilogia__header {
      grid-area: head;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .trilogia__eyebrow {
      margin: 0;
      font: 600 12px/1.3 var(--font-ui);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-brand);
    }

    // En una línea: el tamaño sigue al ancho de la sección (cqi) hasta 56 px
    .trilogia__title {
      margin: 0;
      font-family: var(--font-title);
      font-weight: 700;
      font-size: clamp(28px, 10.5cqi, 56px);
      line-height: 0.9;
      text-transform: uppercase;
      white-space: nowrap;
      color: var(--color-brand);
    }

    .trilogia__subtitle {
      margin: 0;
      font-style: italic;
      font-size: 16px;
      line-height: 1.45;
      color: var(--color-text-light);
    }

    // ── Foto + icono protagonista ──
    .trilogia__stage {
      grid-area: stage;
      align-self: start;
      position: relative;
      overflow: hidden;
      border-radius: 6px;
      background: var(--color-bg-alt);
      aspect-ratio: 4 / 5;
      touch-action: pan-y;
    }

    .trilogia__photo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transform: scale(1);
      transition: opacity 0.9s ease, transform 6s linear;

      &.is-active {
        opacity: 1;
        transform: scale(1.06);
      }
    }

    .trilogia__scrim {
      display: none;
      position: absolute;
      inset: auto 0 0;
      height: 55%;
      background: linear-gradient(to top, $photo-scrim, rgba(38, 18, 12, 0));
    }

    .trilogia__now {
      position: absolute;
      left: 10px;
      bottom: 10px;
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .trilogia__badge {
      position: relative;
      flex: 0 0 auto;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--color-bg);
      box-shadow: 0 6px 18px rgba(38, 18, 12, 0.25);
    }

    .trilogia__badge-icon {
      position: absolute;
      inset: 14%;
      width: 72%;
      height: 72%;
      object-fit: contain;
      opacity: 0;
      transform: scale(0.7) rotate(var(--trilogia-rot, 0deg));
      transition: opacity 0.5s ease, transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);

      &.is-active {
        opacity: 1;
        transform: none;
      }
    }

    // En móvil el nombre ya está al lado: el texto de la foto queda solo para lectores de pantalla
    .trilogia__now-text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    .trilogia__now-step {
      font: 600 12px/1.3 var(--font-ui);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-bg);
    }

    .trilogia__now-name {
      font-family: var(--font-title);
      font-weight: 700;
      font-size: 46px;
      line-height: 0.95;
      text-transform: uppercase;
      color: #fff;
    }

    // ── Pasos: en móvil, los tres en la misma celda y solo se ve el activo ──
    .trilogia__grid {
      grid-area: side;
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      min-width: 0;
      touch-action: pan-y;
    }

    .trilogia__step {
      grid-area: 1 / 1;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-bottom: 28px;   // sitio para los segmentos de progreso
    }

    .trilogia__step-icon { display: none; }

    .trilogia__step-text {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      min-width: 0;
      // Solo opacidad: los inactivos siguen en el orden de tabulación y para lectores de pantalla
      opacity: 0;
      transition: opacity var(--transition-slow);

      .is-active & { opacity: 1; }
    }

    .trilogia__step-num {
      font: 600 12px/1.3 var(--font-ui);
      letter-spacing: 0.14em;
      color: var(--color-brand);
    }

    .trilogia__step-name {
      margin: 0;
      font: inherit;
    }

    // Botón "estirado". En móvil su ::after es la zona táctil de su segmento de
    // progreso (el texto, apilado e invisible en los inactivos, no recibe toques);
    // en escritorio cubre la fila entera. El anillo de foco global se traslada al
    // ::after (mismo estilo).
    .trilogia__step-btn {
      all: unset;
      cursor: pointer;
      pointer-events: none;
      font-family: var(--font-narrative);
      font-weight: 400;
      font-size: 21px;
      line-height: 1.15;
      color: var(--color-text);

      &::after {
        content: '';
        position: absolute;
        pointer-events: auto;
        bottom: 0;
        height: 28px;
        left: calc(var(--i) * (100% + #{$seg-gap}) / 3);
        width: calc((100% - 2 * #{$seg-gap}) / 3);
        border-radius: var(--radius-md);
      }

      &:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }

      &:focus-visible::after {
        outline: 3px solid var(--color-accent);
        outline-offset: 2px;
        box-shadow: 0 0 0 5px var(--color-text);
      }
    }

    // Con el paso inactivo al 62 % (escritorio), el texto oscuro mantiene ≥ 4,5:1 sobre crema
    .trilogia__step-phrase {
      margin: 0;
      font-size: clamp(14px, 4cqi, 16px);
      line-height: 1.45;
      color: var(--color-text);
    }

    // Barra de progreso: su animación CSS marca el ritmo del ciclo.
    // En móvil, cada paso pinta su barra como uno de tres segmentos.
    .trilogia__bar {
      position: absolute;
      bottom: 12px;
      left: calc(var(--i) * (100% + #{$seg-gap}) / 3);
      width: calc((100% - 2 * #{$seg-gap}) / 3);
      height: 3px;
      border-radius: 2px;
      background: $line;
      overflow: hidden;
      pointer-events: none;   // se pinta encima del ::after del botón: el toque debe llegar a este
    }

    .trilogia__bar-fill {
      display: block;
      height: 100%;
      background: var(--color-brand);
      transform-origin: left center;
      transform: scaleX(0);

      .is-active & {
        animation: trilogia-progress var(--trilogia-step-ms, 5000ms) linear forwards;
      }

      .is-paused .is-active & {
        animation-play-state: paused;
      }
    }

    @keyframes trilogia-progress {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }

    // ── Escritorio: foto a la izquierda, cabecera y lista completa a la derecha ──
    @container (min-width: 880px) {
      .trilogia { padding-block: var(--spacing-3xl); }

      .trilogia__container {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        grid-template-areas: 'stage head' 'stage side';
        column-gap: 80px;
        row-gap: 36px;
        align-items: start;
      }

      .trilogia__header {
        align-self: end;
        gap: 14px;
      }

      .trilogia__eyebrow { font-size: 13px; }

      .trilogia__title {
        font-size: 84px;
        line-height: 0.86;
        white-space: normal;
        text-wrap: balance;
      }

      .trilogia__subtitle {
        font-size: 19px;
        line-height: 1.5;
        max-width: 34ch;
      }

      .trilogia__scrim { display: block; }

      .trilogia__now {
        left: 24px;
        right: 24px;
        bottom: 24px;
        gap: 20px;
      }

      .trilogia__badge {
        width: 112px;
        height: 112px;
        box-shadow: 0 10px 30px rgba(38, 18, 12, 0.25);
      }

      .trilogia__now-text {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip: auto;
        white-space: normal;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .trilogia__grid {
        display: flex;
        flex-direction: column;
      }

      .trilogia__step {
        grid-area: auto;
        display: grid;
        grid-template-columns: 64px minmax(0, 1fr);
        column-gap: 18px;
        align-items: start;
        padding: 20px 0 22px;
        opacity: 0.62;
        transition: opacity var(--transition-slow);

        &.is-active { opacity: 1; }
      }

      .trilogia__step:hover .trilogia__step-btn { color: var(--color-brand); }

      .trilogia__step-icon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        box-sizing: border-box;
        border: 1.5px solid $ring;
        transition: background var(--transition-slow), border-color var(--transition-slow);

        img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .is-active & {
          background: #fff;
          border-color: var(--color-brand);
        }
      }

      .trilogia__step-text,
      .is-active .trilogia__step-text {
        opacity: 1;
        transition: none;
      }

      .trilogia__step-btn {
        font-size: 25px;
        pointer-events: auto;

        &::after {
          inset: 0;
          height: auto;
          width: auto;
        }
      }

      .trilogia__step-phrase { font-size: 16px; }

      .trilogia__bar {
        bottom: 0;
        left: 82px;
        right: 0;
        width: auto;
        height: 2px;
        border-radius: 0;
      }
    }

    // styles.scss reduce todas las animaciones a 0,01 ms con "reducir movimiento".
    // El ciclo sigue (sin fundido, zoom ni giro), pero la barra marca su ritmo y
    // debe durar lo que toca en lugar de saltar de paso en paso sin pausa.
    @media (prefers-reduced-motion: reduce) {
      .trilogia__photo.is-active { transform: none; }

      .is-active .trilogia__bar-fill {
        animation-duration: var(--trilogia-step-ms, 5000ms) !important;
      }
    }
  `]
})
export class TrilogiaBlockComponent {
  /** Duración de cada paso en milisegundos */
  readonly stepMs = input(5000);

  readonly steps = STEPS;

  readonly active = signal(0);
  readonly current = computed(() => this.steps[this.active()]);

  readonly hover = signal(false);
  readonly keyboardFocus = signal(false);
  readonly inView = signal(false);
  readonly tabHidden = signal(false);

  readonly paused = computed(() => this.hover() || this.keyboardFocus() || !this.inView() || this.tabHidden());

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private touchStart: { x: number; y: number } | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (!this.isBrowser) return;

      // isIntersecting es true con cualquier intersección; el umbral se mira en intersectionRatio
      const io = new IntersectionObserver(
        ([entry]) => this.inView.set(entry.intersectionRatio >= IN_VIEW_RATIO),
        { threshold: [0, IN_VIEW_RATIO] },
      );
      io.observe(this.host.nativeElement);

      const onVisibility = () => this.tabHidden.set(document.hidden);
      onVisibility();
      document.addEventListener('visibilitychange', onVisibility);

      destroyRef.onDestroy(() => {
        io.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
      });
    });
  }

  /** Salta al paso i (con vuelta circular). Si ya es el activo, su barra empieza de cero. */
  go(i: number): void {
    const target = (i + this.steps.length) % this.steps.length;
    if (target === this.active()) {
      this.restartActiveBar();
      return;
    }
    this.active.set(target);
  }

  /** Lo llama el fin de la animación CSS de la barra del paso activo */
  next(): void {
    this.go(this.active() + 1);
  }

  /** Solo el ratón pausa: en táctil, pointerenter llega al tocar y no hay leave hasta tocar fuera */
  onPointer(event: PointerEvent, inside: boolean): void {
    if (event.pointerType === 'mouse') this.hover.set(inside);
  }

  onFocusIn(event: FocusEvent): void {
    const el = event.target as HTMLElement | null;
    this.keyboardFocus.set(!!el?.matches?.(':focus-visible'));
  }

  onFocusOut(event: FocusEvent): void {
    const to = event.relatedTarget as Node | null;
    if (!to || !this.host.nativeElement.contains(to)) this.keyboardFocus.set(false);
  }

  onTouchStart(event: TouchEvent): void {
    const t = event.touches[0];
    this.touchStart = t ? { x: t.clientX, y: t.clientY } : null;
  }

  onTouchEnd(event: TouchEvent): void {
    const start = this.touchStart;
    const t = event.changedTouches[0];
    this.touchStart = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Un gesto más vertical que horizontal es scroll, no swipe
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) this.go(this.active() + (dx < 0 ? 1 : -1));
  }

  private restartActiveBar(): void {
    const fill = this.host.nativeElement.querySelector<HTMLElement>('.trilogia__step.is-active .trilogia__bar-fill');
    // currentTime = 0 conserva el animation-play-state de CSS (play() lo anularía)
    fill?.getAnimations?.().forEach((a) => (a.currentTime = 0));
  }
}
