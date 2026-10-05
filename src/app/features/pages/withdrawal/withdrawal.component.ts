import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { AuthService } from '../../../core/services/auth.service';
import { SeoService } from '../../../core/services/seo.service';
import { COMPANY } from '../../../core/legal';
import { LegalLayoutComponent, LegalTocItem } from '../../../shared/components/legal-layout/legal-layout.component';
import { PrivacyNoticeComponent } from '../../../shared/components/privacy-notice/privacy-notice.component';

interface WithdrawalReceipt {
  reference: string;
  order_number: string;
  requested_at: string;
  within_term: boolean;
  message: string;
}

/**
 * /desistimiento — información del derecho de desistimiento, función online para
 * ejercerlo («botón de desistimiento», Directiva (UE) 2023/2673) y modelo de
 * formulario del Anexo B del TRLGDCU.
 */
@Component({
  selector: 'app-withdrawal',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LegalLayoutComponent, PrivacyNoticeComponent],
  template: `
    <app-legal-layout title="Desistir de un pedido" [toc]="toc">
      <section id="derecho">
        <h2>Tu derecho de desistimiento</h2>
        <p>Tienes <strong>14 días naturales desde la recepción</strong> del pedido para desistir de la compra sin
          indicar el motivo. Te devolvemos todos los pagos, incluidos los gastos de envío ordinarios, en un máximo de
          14 días por el mismo medio de pago. Los gastos directos de devolución corren a tu cargo, salvo producto
          defectuoso o erróneo.</p>
        <p class="legal-box"><strong>Importante:</strong> por razones de salud e higiene no se admite el desistimiento
          de tarros abiertos o desprecintados tras la entrega (art. 103.e TRLGDCU). Más detalles en las
          <a routerLink="/condiciones-venta" fragment="desistimiento">condiciones de venta</a>.</p>
      </section>

      <section id="formulario">
        <h2>Desistir del contrato</h2>
        @if (receipt(); as r) {
          <div class="legal-box" role="status">
            <p><strong>Solicitud registrada: {{ r.reference }}</strong> (pedido {{ r.order_number }},
              {{ r.requested_at + 'Z' | date:'dd/MM/yyyy HH:mm' }}).</p>
            <p>{{ r.message }}</p>
            @if (!r.within_term) {
              <p>Según nuestros registros han pasado más de 14 días desde la entrega. Revisaremos tu caso y te contestaremos.</p>
            }
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="wd-form" novalidate>
            <div class="wd-grid">
              <label>Número de pedido *
                <input type="text" formControlName="order_number" placeholder="CC-261005-ABC123" autocomplete="off">
              </label>
              <label>Email usado en la compra *
                <input type="email" formControlName="email" autocomplete="email">
              </label>
              <label class="wd-full">Nombre y apellidos *
                <input type="text" formControlName="full_name" autocomplete="name">
              </label>
              <label class="wd-full">Productos que devuelves (déjalo vacío si es el pedido completo)
                <textarea formControlName="items_text" rows="2"></textarea>
              </label>
              <label class="wd-full">Motivo (opcional, no es obligatorio indicarlo)
                <textarea formControlName="reason" rows="2"></textarea>
              </label>
            </div>
            @if (error()) { <p class="wd-error" role="alert">{{ error() }}</p> }
            <button type="submit" class="wd-submit" [disabled]="form.invalid || sending()">
              {{ sending() ? 'Enviando…' : 'Confirmar desistimiento' }}
            </button>
            <app-privacy-notice purpose="gestionar tu solicitud de desistimiento y el reembolso" legalBasis="cumplimiento de una obligación legal" />
          </form>
        }
      </section>

      <section id="modelo">
        <h2>Modelo de formulario de desistimiento</h2>
        <p>Si lo prefieres, copia este texto y envíalo a <a href="mailto:{{ company.email }}">{{ company.email }}</a>
          o por correo postal a {{ company.name }}, {{ company.address }}. No es obligatorio usarlo.</p>
        <div class="legal-box">
          <p>A la atención de {{ company.name }}, {{ company.address }}, {{ company.email }}:</p>
          <p>Por la presente le comunico/comunicamos (*) que desisto de/desistimos de (*) mi/nuestro (*) contrato de
            venta del siguiente bien/prestación del siguiente servicio (*):</p>
          <p>– Pedido recibido el (*): _______________<br>
            – Número de pedido: _______________<br>
            – Nombre del consumidor o de los consumidores: _______________<br>
            – Domicilio del consumidor o de los consumidores: _______________<br>
            – Firma del consumidor o de los consumidores (solo si el presente formulario se presenta en papel)<br>
            – Fecha: _______________</p>
          <p>(*) Táchese lo que no proceda.</p>
        </div>
      </section>
    </app-legal-layout>
  `,
  styles: [`
    .wd-form { background: #fff; border: 1px solid #D9D3C5; border-radius: 6px; padding: 1.25rem; }
    .wd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; @media (max-width: 600px) { grid-template-columns: 1fr; } }
    .wd-full { grid-column: 1 / -1; }
    label { display: flex; flex-direction: column; gap: 0.35rem; font-family: 'Poppins', sans-serif; font-size: 0.82rem; color: #1C1A14; }
    input, textarea { min-height: 44px; padding: 0.6rem 0.75rem; border: 1px solid #c9c2b2; border-radius: 4px; font: inherit; font-size: 0.95rem; }
    .wd-submit { margin-top: 1.25rem; min-height: 48px; padding: 0 1.5rem; border-radius: 20px; border: 1.5px solid #7B1716;
      background: #7B1716; color: #F4F1E9; font-family: 'Poppins', sans-serif; font-weight: 600; cursor: pointer;
      &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .wd-error { color: #a3261f; font-family: 'Poppins', sans-serif; font-size: 0.85rem; margin: 1rem 0 0; }
  `],
})
export class WithdrawalComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private seo = inject(SeoService);

  readonly company = COMPANY;
  readonly toc: LegalTocItem[] = [
    { id: 'derecho', label: 'Tu derecho' },
    { id: 'formulario', label: 'Desistir online' },
    { id: 'modelo', label: 'Modelo de formulario' },
  ];
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly receipt = signal<WithdrawalReceipt | null>(null);

  readonly form = this.fb.group({
    order_number: [this.route.snapshot.queryParamMap.get('pedido') ?? '', [Validators.required, Validators.minLength(5)]],
    email: [this.auth.currentUser()?.email ?? '', [Validators.required, Validators.email]],
    full_name: [this.fullName(), [Validators.required, Validators.minLength(2)]],
    items_text: [''],
    reason: [''],
  });

  constructor() {
    this.seo.set({
      title: 'Desistir de un pedido',
      description: 'Ejerce tu derecho de desistimiento de 14 días en CremaCuadrado con el formulario online o el modelo oficial.',
      path: '/desistimiento',
    });
  }

  private fullName(): string {
    const user = this.auth.currentUser();
    return user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '';
  }

  submit(): void {
    if (this.form.invalid || this.sending()) return;
    this.sending.set(true);
    this.error.set(null);
    this.http.post<WithdrawalReceipt>(`${environment.apiUrl}/withdrawals`, this.form.value).subscribe({
      next: r => { this.sending.set(false); this.receipt.set(r); },
      error: err => { this.sending.set(false); this.error.set(err?.message || 'No hemos podido registrar la solicitud.'); },
    });
  }
}
