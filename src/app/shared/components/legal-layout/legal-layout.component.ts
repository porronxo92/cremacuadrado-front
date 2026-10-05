import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface LegalTocItem {
  id: string;
  label: string;
}

/**
 * Plantilla común de las páginas legales: migas, cabecera, índice navegable
 * con teclado (enlaces con href a cada sección) y estilos del contenido.
 */
@Component({
  selector: 'app-legal-layout',
  standalone: true,
  imports: [RouterModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="legal">
      <nav class="legal__breadcrumb" aria-label="Migas de pan">
        <div class="legal__container"><a routerLink="/">Inicio</a><span aria-hidden="true">/</span><span>{{ title }}</span></div>
      </nav>

      <header class="legal__hero">
        <div class="legal__container">
          <p class="legal__badge">Legal</p>
          <h1>{{ title }}</h1>
          @if (updated) { <p class="legal__sub">Versión {{ version }} · última actualización: {{ updated }}</p> }
        </div>
      </header>

      <div class="legal__container legal__layout">
        @if (toc.length) {
          <nav class="legal__toc" aria-label="Índice de contenidos">
            <button type="button" class="legal__toc-toggle" (click)="tocOpen.set(!tocOpen())" [attr.aria-expanded]="tocOpen()">
              Índice de contenidos
            </button>
            <ul [class.is-open]="tocOpen()">
              @for (item of toc; track item.id) {
                <li><a [routerLink]="[]" [fragment]="item.id" (click)="tocOpen.set(false)">{{ item.label }}</a></li>
              }
            </ul>
          </nav>
        }
        <article class="legal__content">
          <ng-content />
        </article>
      </div>
    </div>
  `,
  styles: [`
    .legal { background: #F4F1E9; min-height: 100vh; padding-bottom: 4rem; }
    .legal__container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
    .legal__breadcrumb { background: #EDE9DD; padding: 0.75rem 0; border-bottom: 1px solid #D9D3C5;
      font-family: 'Poppins', sans-serif; font-size: 0.75rem; color: #6B6456;
      .legal__container { display: flex; gap: 0.5rem; }
      a { color: #5A4F3E; } }
    .legal__hero { background: #7B1716; padding: 3.5rem 0 3rem; text-align: center; color: #F4F1E9; }
    .legal__badge { display: inline-block; margin: 0 0 0.75rem; padding: 0.3rem 0.9rem; border-radius: 2rem; background: rgba(255,255,255,0.1);
      font-family: 'Poppins', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #E6C15A; }
    .legal__hero h1 { font-family: 'Teko', sans-serif; font-weight: 700; text-transform: uppercase; color: #E6C15A;
      font-size: clamp(2.4rem, 5vw, 3.4rem); line-height: 1; margin: 0 0 0.5rem; }
    .legal__sub { margin: 0; font-family: 'Poppins', sans-serif; font-size: 0.8rem; color: rgba(244,241,233,0.8); }

    .legal__layout { display: grid; grid-template-columns: 240px 1fr; gap: 3rem; align-items: start; padding-top: 2.5rem;
      @media (max-width: 900px) { grid-template-columns: 1fr; gap: 1rem; } }
    .legal__toc { position: sticky; top: 5rem; background: #fff; border: 1px solid #D9D3C5; border-radius: 4px; padding: 1rem;
      @media (max-width: 900px) { position: static; }
      ul { list-style: none; margin: 0; padding: 0; @media (max-width: 900px) { display: none; &.is-open { display: block; } } }
      a { display: block; padding: 0.5rem 0.6rem; border-radius: 4px; font-family: 'Poppins', sans-serif; font-size: 0.82rem; color: #5A4F3E; text-decoration: none;
        &:hover, &:focus-visible { background: rgba(123,23,22,0.06); color: #7B1716; } } }
    .legal__toc-toggle { display: none; width: 100%; min-height: 48px; background: none; border: 0; text-align: left;
      font-family: 'Poppins', sans-serif; font-weight: 600; cursor: pointer;
      @media (max-width: 900px) { display: block; } }

    .legal__content { min-width: 0; font-family: 'Lora', serif; color: #3d352a; line-height: 1.8; font-size: 0.97rem;
      section { margin-bottom: 2.5rem; scroll-margin-top: 6rem; }
      h2 { font-family: 'Teko', sans-serif; font-weight: 700; text-transform: uppercase; color: #7B1716;
        font-size: clamp(1.5rem, 3vw, 1.85rem); margin: 0 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(230,193,90,0.5); }
      h3 { font-family: 'Poppins', sans-serif; font-size: 1rem; color: #1C1A14; margin: 1.5rem 0 0.5rem; }
      p { margin: 0 0 1rem; }
      ul, ol { padding-left: 1.4rem; margin: 0 0 1rem; li { margin-bottom: 0.4rem; } }
      a { color: #7B1716; text-decoration: underline; text-underline-offset: 3px; }
      .legal-table-wrap { overflow-x: auto; margin: 0 0 1rem; }
      table { width: 100%; border-collapse: collapse; font-family: 'Poppins', sans-serif; font-size: 0.82rem; background: #fff; }
      th, td { border: 1px solid #D9D3C5; padding: 0.6rem 0.7rem; text-align: left; vertical-align: top; }
      th { background: #EDE9DD; }
      .legal-box { background: #fff; border: 1px solid #D9D3C5; border-left: 4px solid #E6C15A; border-radius: 4px; padding: 1rem 1.25rem; margin: 0 0 1rem; }
    }
  `],
})
export class LegalLayoutComponent {
  @Input({ required: true }) title = '';
  @Input() updated = '';
  @Input() version = '';
  @Input() toc: LegalTocItem[] = [];
  readonly tocOpen = signal(false);
}
