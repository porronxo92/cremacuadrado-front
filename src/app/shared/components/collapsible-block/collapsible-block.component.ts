import { Component, Input, OnInit, signal } from '@angular/core';

let nextBlockId = 0;

@Component({
  selector: 'app-collapsible-block',
  standalone: true,
  template: `
    <section class="collapsible-block" [class.open]="isOpen()" [class.closed]="!isOpen()">
      <button
        type="button"
        class="collapsible-block__header"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="contentId">
        <span class="collapsible-block__icon"><ng-content select="[block-icon]"></ng-content></span>
        <span class="collapsible-block__title">{{ title }}</span>
        <span class="collapsible-block__chevron" [class.rotated]="!isOpen()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
      <div class="collapsible-block__content" [id]="contentId" [hidden]="!isOpen()">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .collapsible-block {
      border-radius: 8px;
      overflow: hidden;
    }

    .collapsible-block__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 1.25rem 0.5rem;
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(28, 26, 20, 0.1);
      cursor: pointer;
      text-align: left;
      font: inherit;
      min-height: 48px;
    }

    .collapsible-block__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #7B1716;
    }

    .collapsible-block__title {
      flex: 1;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 1.05rem;
      color: #1C1A14;
    }

    .collapsible-block__chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #7B1716;
      transition: transform 250ms ease;
    }

    .collapsible-block__chevron.rotated {
      transform: rotate(180deg);
    }

    .collapsible-block__content {
      padding: 1.5rem 0.5rem;
    }
  `]
})
export class CollapsibleBlockComponent implements OnInit {
  @Input() title = '';
  @Input() initialOpen = true;

  readonly contentId = `collapsible-block-${nextBlockId++}-content`;
  readonly isOpen = signal(true);

  ngOnInit(): void {
    this.isOpen.set(this.initialOpen);
  }

  toggle(): void {
    this.isOpen.update(open => !open);
  }
}
