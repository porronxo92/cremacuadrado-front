import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NewsletterService } from '../../core/services/newsletter.service';
import { SeoService } from '../../core/services/seo.service';

type Mode = 'confirm' | 'unsubscribe';

/** /newsletter/confirmar?token=… (doble opt-in) y /newsletter/baja?token=… */
@Component({
  selector: 'app-newsletter-action',
  standalone: true,
  imports: [RouterModule],
  template: `
    <section class="nl-action">
      <div class="nl-action__card">
        <h1>{{ mode === 'confirm' ? 'Suscripción' : 'Baja de la newsletter' }}</h1>
        @switch (state()) {
          @case ('loading') { <p>Un momento…</p> }
          @case ('done') { <p role="status">{{ message() }}</p> }
          @case ('error') { <p role="alert" class="nl-action__error">{{ message() }}</p> }
        }
        <a routerLink="/" class="nl-action__btn">Volver a la tienda</a>
      </div>
    </section>
  `,
  styles: [`
    .nl-action { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 3rem 1rem; background: #F4F1E9; }
    .nl-action__card { max-width: 520px; text-align: center; background: #fff; border-radius: 8px; padding: 2.5rem 2rem; }
    h1 { font-family: 'Teko', sans-serif; text-transform: uppercase; color: #7B1716; font-size: 2.4rem; margin: 0 0 1rem; }
    p { font-family: 'Lora', serif; color: #1C1A14; line-height: 1.6; }
    .nl-action__error { color: #a3261f; }
    .nl-action__btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 1.5rem; padding: 0 1.5rem; border: 1.5px solid #7B1716; border-radius: 20px;
      color: #7B1716; font-family: 'Poppins', sans-serif; font-weight: 600; text-decoration: none; }
  `],
})
export class NewsletterActionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private newsletter = inject(NewsletterService);
  private seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);

  mode: Mode = (this.route.snapshot.data['mode'] as Mode) ?? 'confirm';
  state = signal<'loading' | 'done' | 'error'>('loading');
  message = signal('');

  ngOnInit(): void {
    this.seo.set({
      title: this.mode === 'confirm' ? 'Confirmar suscripción' : 'Darse de baja',
      description: 'Gestión de la suscripción a la newsletter de CremaCuadrado.',
      path: this.mode === 'confirm' ? '/newsletter/confirmar' : '/newsletter/baja',
    });
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      this.message.set('El enlace no es válido.');
      return;
    }
    const call = this.mode === 'confirm' ? this.newsletter.confirm(token) : this.newsletter.unsubscribe(token);
    call.subscribe({
      next: res => { this.state.set('done'); this.message.set(res.message); },
      error: err => { this.state.set('error'); this.message.set(err?.message || 'El enlace no es válido o ha caducado.'); },
    });
  }
}
