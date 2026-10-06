import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '@env/environment';
import { SeoService } from '../../core/services/seo.service';
import { saveBlob } from '../../core/utils/save-blob';

/**
 * /factura?pedido=…&token=… — enlace firmado del email de confirmación.
 * Descarga la factura (el mismo PDF guardado) sin iniciar sesión: sirve
 * también para compras como invitado.
 */
@Component({
  selector: 'app-invoice-download',
  standalone: true,
  imports: [RouterModule],
  template: `
    <section class="inv">
      <div class="inv__card">
        <h1>Tu factura</h1>
        @switch (state()) {
          @case ('loading') { <p>Preparando la descarga…</p> }
          @case ('done') {
            <p role="status">Se ha descargado la factura del pedido {{ order }}.</p>
            <button type="button" class="inv__btn" (click)="download()">Descargar de nuevo</button>
          }
          @case ('error') { <p role="alert" class="inv__error">El enlace no es válido o ha caducado. Escríbenos a info&#64;cremacuadrado.com.</p> }
        }
        <a routerLink="/" class="inv__link">Volver a la tienda</a>
      </div>
    </section>
  `,
  styles: [`
    .inv { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 3rem 1rem; background: #F4F1E9; }
    .inv__card { max-width: 480px; text-align: center; background: #fff; border-radius: 8px; padding: 2.5rem 2rem; }
    h1 { font-family: 'Teko', sans-serif; text-transform: uppercase; color: #7B1716; font-size: 2.4rem; margin: 0 0 1rem; }
    p { font-family: 'Lora', serif; line-height: 1.6; }
    .inv__error { color: #a3261f; }
    .inv__btn { min-height: 48px; padding: 0 1.5rem; border-radius: 20px; border: 1.5px solid #7B1716; background: #7B1716;
      color: #F4F1E9; font-family: 'Poppins', sans-serif; font-weight: 600; cursor: pointer; }
    .inv__link { display: block; margin-top: 1.25rem; color: #7B1716; font-family: 'Poppins', sans-serif; }
  `],
})
export class InvoiceDownloadComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly order = this.route.snapshot.queryParamMap.get('pedido') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly state = signal<'loading' | 'done' | 'error'>('loading');

  ngOnInit(): void {
    this.seo.set({ title: 'Tu factura', description: 'Descarga de la factura de tu pedido en CremaCuadrado.', path: '/factura' });
    if (this.isBrowser) this.download();
  }

  download(): void {
    if (!this.order || !this.token) {
      this.state.set('error');
      return;
    }
    this.http.get(`${environment.apiUrl}/orders/invoice-download`, {
      params: { order: this.order, token: this.token },
      responseType: 'blob',
    }).subscribe({
      next: blob => { saveBlob(blob, `Factura_${this.order}.pdf`); this.state.set('done'); },
      error: () => this.state.set('error'),
    });
  }
}
