import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { COMPANY, PRIVACY_VERSION } from '../../../core/legal';
import { LegalLayoutComponent, LegalTocItem } from '../../../shared/components/legal-layout/legal-layout.component';

/**
 * Política de privacidad (RGPD arts. 13-14, LOPDGDD art. 11).
 * ⚠️ Texto base redactado a partir de lo que hace realmente el software: debe
 * revisarlo el asesor legal del cliente. Los plazos coinciden con RETENTION_*
 * del backend (app/config.py). Si cambia, sube PRIVACY_VERSION en ambos lados.
 */
@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [RouterModule, LegalLayoutComponent],
  template: `
    <app-legal-layout title="Política de privacidad" [version]="version" updated="octubre de 2026" [toc]="toc">
      <section id="responsable">
        <h2>1. Responsable del tratamiento</h2>
        <p>{{ company.name }} · NIF {{ company.nif }} · {{ company.address }}.<br>
          Contacto para privacidad: <a href="mailto:{{ company.privacyEmail }}">{{ company.privacyEmail }}</a> · {{ company.phone }}.</p>
        <p>Esta política cumple el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos
          y garantía de los derechos digitales (LOPDGDD).</p>
      </section>

      <section id="tratamientos">
        <h2>2. Qué datos tratamos, para qué y con qué base</h2>
        <div class="legal-table-wrap">
          <table>
            <thead><tr><th>Finalidad</th><th>Datos</th><th>Base jurídica</th><th>Conservación</th></tr></thead>
            <tbody>
              <tr>
                <td>Gestionar pedidos, pagos, envíos, devoluciones y atención al cliente</td>
                <td>Nombre, email, teléfono, dirección, NIF (si pides factura), productos comprados</td>
                <td>Ejecución del contrato (art. 6.1.b RGPD)</td>
                <td>Durante la relación y después, bloqueados, 6 años (Código de Comercio) y 4 años a efectos fiscales</td>
              </tr>
              <tr>
                <td>Emitir y conservar facturas</td>
                <td>Datos fiscales y del pedido</td>
                <td>Obligación legal (art. 6.1.c)</td>
                <td>6 años</td>
              </tr>
              <tr>
                <td>Cuenta de cliente</td>
                <td>Email, nombre, contraseña (cifrada), direcciones guardadas</td>
                <td>Ejecución del contrato</td>
                <td>Hasta que elimines la cuenta</td>
              </tr>
              <tr>
                <td>Newsletter y comunicaciones comerciales</td>
                <td>Email y fecha/IP del consentimiento</td>
                <td>Consentimiento (art. 6.1.a RGPD, art. 21 LSSI) con doble confirmación</td>
                <td>Hasta que te des de baja. Altas sin confirmar: 30 días</td>
              </tr>
              <tr>
                <td>Responder consultas del formulario de contacto</td>
                <td>Nombre, email y mensaje</td>
                <td>Consentimiento</td>
                <td>1 año</td>
              </tr>
              <tr>
                <td>Solicitudes de tiendas y profesionales (B2B)</td>
                <td>Nombre, establecimiento, ciudad, email y teléfono</td>
                <td>Consentimiento y medidas precontractuales</td>
                <td>2 años</td>
              </tr>
              <tr>
                <td>Reseñas de productos</td>
                <td>Nombre de pila, valoración y comentario</td>
                <td>Consentimiento</td>
                <td>Mientras esté publicada</td>
              </tr>
              <tr>
                <td>Seguridad, prevención del fraude y registro de accesos</td>
                <td>IP, navegador, intentos de acceso</td>
                <td>Interés legítimo (art. 6.1.f) y obligación de seguridad (art. 32 RGPD)</td>
                <td>Hasta 2 años</td>
              </tr>
              <tr>
                <td>Prueba de los consentimientos y de la aceptación de las condiciones</td>
                <td>Fecha, IP, versión del texto aceptado</td>
                <td>Obligación legal (art. 7.1 RGPD)</td>
                <td>Mientras puedan exigirse responsabilidades</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Si eres cliente, podremos enviarte información sobre productos similares a los que compraste solo si lo
          autorizaste al registrarte o en tu perfil; puedes oponerte en cualquier momento (art. 21.2 LSSI).
          No tomamos decisiones automatizadas ni elaboramos perfiles con efectos jurídicos.</p>
      </section>

      <section id="destinatarios">
        <h2>3. Destinatarios y encargados del tratamiento</h2>
        <p>No vendemos ni cedemos tus datos. Solo los comunicamos a la Administración cuando la ley lo exige
          (p. ej., la Agencia Tributaria). Para prestar el servicio usamos estos proveedores, con contrato de
          encargo del tratamiento:</p>
        <div class="legal-table-wrap">
          <table>
            <thead><tr><th>Proveedor</th><th>Servicio</th><th>Ubicación / garantías</th></tr></thead>
            <tbody>
              <tr><td>Supabase Inc.</td><td>Base de datos</td><td>Servidores en la UE (Irlanda)</td></tr>
              <tr><td>Vercel Inc.</td><td>Alojamiento web y almacenamiento de facturas</td><td>EE. UU. — Marco de Privacidad de Datos UE-EE. UU. y cláusulas contractuales tipo</td></tr>
              <tr><td>Stripe Payments Europe Ltd.</td><td>Pagos con tarjeta</td><td>UE (Irlanda); transferencias a EE. UU. con DPF y cláusulas tipo</td></tr>
              <tr><td>Sociedad Estatal Correos y Telégrafos</td><td>Envío de pedidos</td><td>España</td></tr>
              <tr><td>Resend / Titan (proveedores de email)</td><td>Envío de emails transaccionales y comerciales</td><td>EE. UU. — cláusulas contractuales tipo</td></tr>
              <tr><td>Google LLC</td><td>Inicio de sesión con Google (solo si lo usas o lo aceptas)</td><td>EE. UU. — Marco de Privacidad de Datos UE-EE. UU.</td></tr>
              <tr><td>CARTO / OpenStreetMap</td><td>Mapa de puntos de venta (solo si lo aceptas o lo muestras)</td><td>UE / EE. UU. — cláusulas contractuales tipo</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="derechos">
        <h2>4. Tus derechos</h2>
        <p>Puedes ejercer gratuitamente tus derechos de <strong>acceso, rectificación, supresión, oposición,
          limitación del tratamiento y portabilidad</strong>, y retirar tu consentimiento en cualquier momento
          sin que afecte a los tratamientos anteriores:</p>
        <ul>
          <li>Desde <a routerLink="/account/profile">Mi cuenta → Perfil</a>: descargar tus datos, cambiar tus
            preferencias de comunicaciones y eliminar la cuenta.</li>
          <li>Con el enlace «Darte de baja» incluido en cada email comercial.</li>
          <li>Escribiendo a <a href="mailto:{{ company.privacyEmail }}">{{ company.privacyEmail }}</a>. Te responderemos en
            un mes como máximo.</li>
        </ul>
        <p>Al eliminar la cuenta borramos tus direcciones, carritos y solicitudes, y anonimizamos tu perfil.
          Conservamos bloqueados los pedidos y facturas durante los plazos legales indicados arriba.</p>
        <p>Si consideras que no hemos atendido bien tus derechos, puedes reclamar ante la
          <a href="https://www.aepd.es" target="_blank" rel="noopener">Agencia Española de Protección de Datos</a>.</p>
      </section>

      <section id="menores">
        <h2>5. Menores</h2>
        <p>La tienda no está dirigida a menores de 14 años y no tratamos conscientemente sus datos (art. 7 LOPDGDD).</p>
      </section>

      <section id="seguridad">
        <h2>6. Seguridad</h2>
        <p>Aplicamos medidas técnicas y organizativas adecuadas: conexión cifrada (HTTPS), contraseñas almacenadas con
          bcrypt, pagos gestionados íntegramente por Stripe (no vemos los datos de la tarjeta), control de acceso y
          registro de los accesos del personal, copias de seguridad y eliminación periódica de los datos que ya no
          son necesarios. Si se produjera una brecha de seguridad que afecte a tus datos, lo notificaremos a la AEPD
          en 72 horas y, cuando proceda, a ti.</p>
      </section>

      <section id="cookies">
        <h2>7. Cookies</h2>
        <p>Consulta la <a routerLink="/cookies">política de cookies</a>. Puedes cambiar tu elección en cualquier
          momento desde «Configurar cookies», en el pie de la web.</p>
      </section>
    </app-legal-layout>
  `,
})
export class PrivacyPageComponent {
  private seo = inject(SeoService);
  readonly company = COMPANY;
  readonly version = PRIVACY_VERSION;
  readonly toc: LegalTocItem[] = [
    { id: 'responsable', label: 'Responsable' },
    { id: 'tratamientos', label: 'Datos, finalidades y plazos' },
    { id: 'destinatarios', label: 'Destinatarios' },
    { id: 'derechos', label: 'Tus derechos' },
    { id: 'menores', label: 'Menores' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'cookies', label: 'Cookies' },
  ];

  constructor() {
    this.seo.set({
      title: 'Política de Privacidad',
      description: 'Cómo trata CremaCuadrado tus datos: finalidades, bases jurídicas, proveedores, plazos de conservación y tus derechos.',
      path: '/privacidad',
    });
  }
}
