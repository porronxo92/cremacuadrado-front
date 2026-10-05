import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { COMPANY, COOKIES_VERSION } from '../../../core/legal';
import { LegalLayoutComponent, LegalTocItem } from '../../../shared/components/legal-layout/legal-layout.component';

/**
 * Política de cookies (LSSI art. 22.2, guía de cookies AEPD 2023).
 * La tabla refleja lo que la web instala de verdad: si se añade cualquier
 * servicio (analítica, píxel, vídeo embebido…), añádelo aquí, crea su categoría
 * en CookieConsentService y sube COOKIES_VERSION para volver a pedir consentimiento.
 */
@Component({
  selector: 'app-cookies-page',
  standalone: true,
  imports: [RouterModule, LegalLayoutComponent],
  template: `
    <app-legal-layout title="Política de cookies" [version]="version" updated="octubre de 2026" [toc]="toc">
      <section id="que-son">
        <h2>1. Qué son</h2>
        <p>Las cookies y tecnologías similares (como el almacenamiento local del navegador) son pequeños archivos o
          datos que se guardan en tu dispositivo al visitar una web. Las «técnicas» son imprescindibles para que la
          web funcione y no necesitan tu consentimiento; el resto solo se usan si las aceptas.</p>
      </section>

      <section id="gestion">
        <h2>2. Tu elección</h2>
        <p>Al entrar te mostramos un aviso para <strong>aceptar, rechazar o configurar</strong> las cookies no técnicas.
          Hasta que decides, no se carga ningún servicio de terceros. Tu elección se guarda 13 meses y puedes
          cambiarla en cualquier momento:</p>
        <p><button type="button" class="ck-btn" (click)="consent.openSettings()">Configurar cookies</button></p>
        <p>Actualmente:
          <strong>{{ consent.hasDecided() ? (consent.external() ? 'has aceptado los servicios de Google' : 'has rechazado los servicios de Google') : 'aún no has decidido' }}</strong>.</p>
      </section>

      <section id="listado">
        <h2>3. Cookies que usamos</h2>
        <h3>Técnicas (necesarias, no requieren consentimiento)</h3>
        <div class="legal-table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Titular</th><th>Finalidad</th><th>Duración</th></tr></thead>
            <tbody>
              <tr><td>cart_session (cookie) · cc_cart_session (almacenamiento local)</td><td>CremaCuadrado</td><td>Recordar el carrito de compra</td><td>30 días</td></tr>
              <tr><td>cc_access_token, cc_refresh_token, cc_user (almacenamiento local)</td><td>CremaCuadrado</td><td>Mantener la sesión iniciada</td><td>Hasta cerrar sesión (token de 7 días)</td></tr>
              <tr><td>cc_cookie_consent (almacenamiento local)</td><td>CremaCuadrado</td><td>Recordar tu elección sobre cookies</td><td>13 meses</td></tr>
              <tr><td>__stripe_mid, __stripe_sid</td><td>Stripe</td><td>Pago seguro y prevención del fraude (solo en el pago)</td><td>1 año / 30 minutos</td></tr>
              <tr><td>sqladmin_session</td><td>CremaCuadrado</td><td>Sesión del panel de administración (solo personal)</td><td>8 horas</td></tr>
            </tbody>
          </table>
        </div>

        <h3>Servicios externos de Google (solo si los aceptas o pulsas el botón correspondiente)</h3>
        <div class="legal-table-wrap">
          <table>
            <thead><tr><th>Servicio</th><th>Titular</th><th>Finalidad</th><th>Más información</th></tr></thead>
            <tbody>
              <tr><td>Google Maps (NID, AEC y similares)</td><td>Google LLC</td><td>Mostrar el mapa de puntos de venta</td>
                <td><a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener">Política de Google</a></td></tr>
              <tr><td>Iniciar sesión con Google (g_state, G_ENABLED_IDPS y similares)</td><td>Google LLC</td><td>Identificarte con tu cuenta de Google</td>
                <td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacidad de Google</a></td></tr>
            </tbody>
          </table>
        </div>
        <p>Google puede tratar datos en EE. UU., amparado en el Marco de Privacidad de Datos UE-EE. UU.</p>
        <p><strong>No usamos cookies analíticas, publicitarias ni de redes sociales.</strong> Los iconos de Instagram,
          Facebook, TikTok y WhatsApp son enlaces normales: no cargan nada de esas redes hasta que haces clic.</p>
      </section>

      <section id="navegador">
        <h2>4. Desde tu navegador</h2>
        <p>También puedes borrar o bloquear cookies desde la configuración de
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Chrome</a>,
          <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener">Firefox</a>,
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a> o
          <a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noopener">Edge</a>.
          Si bloqueas las técnicas, el carrito y el inicio de sesión dejarán de funcionar.</p>
      </section>

      <section id="contacto">
        <h2>5. Responsable y contacto</h2>
        <p>{{ company.name }} · <a href="mailto:{{ company.privacyEmail }}">{{ company.privacyEmail }}</a>.
          Más información sobre cómo tratamos tus datos en la <a routerLink="/privacidad">política de privacidad</a>.</p>
      </section>
    </app-legal-layout>
  `,
  styles: [`
    .ck-btn { min-height: 48px; padding: 0 1.4rem; border-radius: 20px; border: 1.5px solid #7B1716; background: #F4F1E9;
      color: #7B1716; font-family: 'Poppins', sans-serif; font-weight: 600; cursor: pointer;
      &:hover { background: #7B1716; color: #F4F1E9; } }
  `],
})
export class CookiesPageComponent {
  private seo = inject(SeoService);
  readonly consent = inject(CookieConsentService);
  readonly company = COMPANY;
  readonly version = COOKIES_VERSION;
  readonly toc: LegalTocItem[] = [
    { id: 'que-son', label: 'Qué son' },
    { id: 'gestion', label: 'Tu elección' },
    { id: 'listado', label: 'Cookies que usamos' },
    { id: 'navegador', label: 'Desde tu navegador' },
    { id: 'contacto', label: 'Contacto' },
  ];

  constructor() {
    this.seo.set({
      title: 'Política de Cookies',
      description: 'Qué cookies usa CremaCuadrado, para qué y cómo aceptarlas, rechazarlas o cambiar tu elección.',
      path: '/cookies',
    });
  }
}
