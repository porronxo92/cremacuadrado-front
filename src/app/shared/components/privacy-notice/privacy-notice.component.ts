import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Primera capa de información de privacidad (RGPD art. 13 / LOPDGDD art. 11)
 * que debe acompañar a cada formulario que recoge datos personales.
 */
@Component({
  selector: 'app-privacy-notice',
  standalone: true,
  imports: [RouterModule],
  template: `
    <p class="privacy-notice">
      <strong>Responsable:</strong> CREMACUADRADO SL.
      <strong>Finalidad:</strong> {{ purpose }}.
      <strong>Legitimación:</strong> {{ legalBasis }}.
      <strong>Destinatarios:</strong> no se ceden datos a terceros salvo obligación legal; usamos proveedores
      tecnológicos que actúan como encargados del tratamiento.
      <strong>Derechos:</strong> acceso, rectificación, supresión, oposición, limitación y portabilidad.
      Más información en la <a routerLink="/privacidad" target="_blank">política de privacidad</a>.
    </p>
  `,
  styles: [`
    .privacy-notice { font-family: 'Poppins', sans-serif; font-size: 0.72rem; line-height: 1.55; color: inherit; opacity: 0.8; margin: 0.75rem 0 0; }
    .privacy-notice a { color: inherit; text-decoration: underline; }
  `],
})
export class PrivacyNoticeComponent {
  @Input() purpose = 'atender tu solicitud';
  @Input() legalBasis = 'tu consentimiento';
}
