import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumb"><div class="container"><a routerLink="/">Inicio</a><span class="breadcrumb__sep">/</span><span>Política de Privacidad</span></div></nav>

      <header class="hero">
        <div class="container">
          <div class="hero__badge"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Legal</div>
          <h1>Política de Privacidad</h1>
          <p class="hero__sub">Última revisión: 25 de julio de 2024</p>
        </div>
      </header>

      <main class="main">
        <div class="container">
          <div class="layout">
            <button class="toc-toggle" (click)="tocOpen.set(!tocOpen())" [class.is-open]="tocOpen()"><span>Índice de contenidos</span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>

            <nav class="toc" [class.is-open]="tocOpen()">
              <p class="toc__title">Contenido</p>
              <ul>
                <li><a href="#quienes-somos" (click)="tocOpen.set(false)">¿Quiénes somos?</a></li>
                <li><a href="#datos-recopilados" (click)="tocOpen.set(false)">Datos que recopilamos</a></li>
                <li><a href="#finalidad" (click)="tocOpen.set(false)">¿Por qué tratamos tus datos?</a></li>
                <li><a href="#legitimacion" (click)="tocOpen.set(false)">Legitimación</a></li>
                <li><a href="#destinatarios" (click)="tocOpen.set(false)">Destinatarios</a></li>
                <li><a href="#conservacion" (click)="tocOpen.set(false)">Conservación</a></li>
                <li><a href="#derechos" (click)="tocOpen.set(false)">Tus derechos</a></li>
                <li><a href="#menores" (click)="tocOpen.set(false)">Menores de edad</a></li>
                <li><a href="#seguridad" (click)="tocOpen.set(false)">Seguridad</a></li>
              </ul>
            </nav>

            <div class="content">
              <div class="intro-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <p>Con el objeto de garantizar los derechos fundamentales con los datos de los usuarios, esta página cumple con el <strong>Reglamento General de Protección de Datos (RGPD) (UE) 2016/679</strong> del Parlamento Europeo y del Consejo de 27 de abril de 2016.</p>
              </div>

              <section class="section" id="quienes-somos">
                <h2><span class="section__num">01</span> ¿Quiénes somos?</h2>
                <div class="info-grid">
                  <div class="info-item"><span class="info-item__label">Responsable</span><span class="info-item__value">CREMACUADRADO SL</span></div>
                  <div class="info-item"><span class="info-item__label">NIF</span><span class="info-item__value">B56673700</span></div>
                  <div class="info-item"><span class="info-item__label">Dirección</span><span class="info-item__value">Camino del Arca 18 – 13005 Ciudad Real</span></div>
                  <div class="info-item"><span class="info-item__label">Teléfono</span><span class="info-item__value">623 294 886</span></div>
                  <div class="info-item info-item--full"><span class="info-item__label">Correo</span><a href="mailto:admin@cremacuadrado.com" class="info-item__value">admin&#64;cremacuadrado.com</a></div>
                </div>
              </section>

              <section class="section" id="datos-recopilados">
                <h2><span class="section__num">02</span> ¿Qué datos personales recopilamos?</h2>
                <p>Los datos personales que el usuario puede llegar a proporcionar:</p>
                <div class="data-list">
                  <div class="data-list__item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Nombre, dirección y fecha de nacimiento</span></div>
                  <div class="data-list__item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.8 12.2 19.79 19.79 0 0 1 1.74 3.6 2 2 0 0 1 3.71 1.4h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.07a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Número de teléfono y correo electrónico</span></div>
                  <div class="data-list__item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Ubicación geográfica</span></div>
                  <div class="data-list__item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span>Dirección IP, fecha y hora de acceso, navegador y sistema operativo</span></div>
                </div>
              </section>

              <section class="section" id="finalidad">
                <h2><span class="section__num">03</span> ¿Por qué y para qué tratamos tus datos?</h2>
                <ul>
                  <li>Gestionar nuestros servicios, ya sea online o en establecimientos físicos.</li>
                  <li>Gestionar el envío de la información solicitada.</li>
                  <li>Desarrollar acciones comerciales y mantenimiento de la relación con el usuario.</li>
                  <li>Gestionar concursos, sorteos u otras actividades promocionales.</li>
                  <li>Facilitar información a Autoridades o terceras empresas por motivos de auditoría.</li>
                </ul>
              </section>

              <section class="section" id="legitimacion">
                <h2><span class="section__num">04</span> ¿Cuál es la legitimación?</h2>
                <div class="legal-cards">
                  <div class="legal-card">
                    <div class="legal-card__icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                    <h4>Consentimiento del interesado</h4>
                    <p>Para contratación de servicios y productos, formularios de contacto y e-newsletter.</p>
                  </div>
                  <div class="legal-card">
                    <div class="legal-card__icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
                    <h4>Interés legítimo</h4>
                    <p>Para acciones de marketing directo con clientes existentes.</p>
                  </div>
                  <div class="legal-card">
                    <div class="legal-card__icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                    <h4>Obligación legal</h4>
                    <p>Prevención del fraude, comunicación con Autoridades y reclamaciones.</p>
                  </div>
                </div>
              </section>

              <section class="section" id="destinatarios">
                <h2><span class="section__num">05</span> ¿A qué destinatarios se comunican tus datos?</h2>
                <p>Solo cuando sea estrictamente necesario se proporcionarán datos de los usuarios a terceros. <strong>Nunca se venderán datos a terceros.</strong> Los proveedores de servicios externos solo usarán los datos para proporcionar los servicios contratados.</p>
              </section>

              <section class="section" id="conservacion">
                <h2><span class="section__num">06</span> ¿Cuánto tiempo conservamos tus datos?</h2>
                <p>Los datos se conservarán únicamente durante el tiempo necesario para los fines para los que fueron recabados. Una vez que no sean necesarios, quedarán bloqueados hasta que prescriban las posibles responsabilidades legales.</p>
              </section>

              <section class="section" id="derechos">
                <h2><span class="section__num">07</span> ¿Qué derechos te asisten?</h2>
                <p>Puedes ejercitar tus derechos enviando una petición a <a href="mailto:admin@cremacuadrado.com">admin&#64;cremacuadrado.com</a>:</p>
                <div class="rights-grid">
                  <div class="right-item"><strong>Acceso</strong><span>Pedir información sobre tus datos</span></div>
                  <div class="right-item"><strong>Rectificación</strong><span>Comunicar cambios en tus datos</span></div>
                  <div class="right-item"><strong>Supresión</strong><span>Solicitar eliminación de tus datos</span></div>
                  <div class="right-item"><strong>Limitación</strong><span>Restringir el tratamiento</span></div>
                  <div class="right-item"><strong>Oposición</strong><span>Retirar el consentimiento</span></div>
                  <div class="right-item"><strong>Portabilidad</strong><span>Obtener copia de tus datos</span></div>
                </div>
                <div class="callout callout--info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <p>Si consideras que tus derechos han sido desatendidos, puedes reclamar ante la <strong>Agencia Española de Protección de Datos</strong> — <a href="https://www.aepd.es" target="_blank" rel="noopener">www.aepd.es</a></p>
                </div>
              </section>

              <section class="section" id="menores">
                <h2><span class="section__num">08</span> ¿Cómo tratamos los datos de menores?</h2>
                <p>Nuestros servicios no van dirigidos específicamente a menores. En los casos en que un servicio se dirija a menores de catorce años, se exigirá el consentimiento válido de sus tutores legales, conforme al artículo 8 del RGPD.</p>
              </section>

              <section class="section" id="seguridad">
                <h2><span class="section__num">09</span> Medidas de seguridad</h2>
                <p>CREMACUADRADO SL ha adoptado los niveles de seguridad legalmente requeridos:</p>
                <div class="security-list">
                  <div class="security-item"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Uso de firma electrónica en intercambios comerciales</span></div>
                  <div class="security-item"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Certificado web SSL para garantizar la seguridad</span></div>
                  <div class="security-item"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Cifrado de datos sensibles en servicios externos</span></div>
                  <div class="security-item"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Cifrado de credenciales de acceso</span></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    $brand: #7B1716; $accent: #E6C15A; $bg: #F4F1E9; $bg-alt: #EDE9DD; $white: #FFFFFF;
    $text: #1A1208; $text-lt: #5A4F3E; $text-mt: #8C7F6A; $border: #D9D3C5;

    .page { background: $bg; min-height: 100vh; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; @media (max-width: 480px) { padding: 0 1rem; } }

    .breadcrumb { background: $bg-alt; padding: 0.75rem 0; border-bottom: 1px solid $border;
      .container { display: flex; align-items: center; gap: 0.5rem; font-family: 'Poppins', sans-serif; font-size: 0.72rem; color: $text-mt; }
      a { color: $text-lt; text-decoration: none; &:hover { color: $brand; } }
      &__sep { opacity: 0.5; }
    }

    .hero { background: linear-gradient(135deg, $brand 0%, darken($brand, 8%) 100%); padding: 4rem 0 3.5rem; text-align: center;
      @media (max-width: 768px) { padding: 3rem 0 2.5rem; }
      &__badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba($white, 0.1); padding: 0.4rem 1rem; border-radius: 2rem; font-family: 'Poppins', sans-serif; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: rgba($accent, 0.9); margin-bottom: 1rem; svg { opacity: 0.8; } }
      h1 { font-family: 'Teko', sans-serif; font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 700; text-transform: uppercase; color: $accent; margin: 0 0 0.5rem; line-height: 1; }
      &__sub { font-family: 'Poppins', sans-serif; font-size: 0.8rem; color: rgba($bg, 0.6); margin: 0; }
    }

    .main { padding: 3rem 0 5rem; @media (max-width: 768px) { padding: 2rem 0 4rem; } }
    .layout { display: grid; grid-template-columns: 240px 1fr; gap: 3rem; align-items: start; @media (max-width: 900px) { grid-template-columns: 1fr; gap: 0; } }

    .toc-toggle { display: none; width: 100%; padding: 1rem; background: $white; border: 1px solid $border; border-radius: 4px; margin-bottom: 1.5rem; cursor: pointer; align-items: center; justify-content: space-between; font-family: 'Poppins', sans-serif; font-size: 0.85rem; font-weight: 500; color: $text;
      svg { transition: transform 300ms ease; color: $text-mt; } &.is-open svg { transform: rotate(180deg); }
      @media (max-width: 900px) { display: flex; }
    }

    .toc { position: sticky; top: 2rem; background: $white; border: 1px solid $border; border-radius: 4px; padding: 1.5rem;
      @media (max-width: 900px) { position: static; display: none; margin-bottom: 2rem; &.is-open { display: block; } }
      &__title { font-family: 'Poppins', sans-serif; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: $text-mt; margin: 0 0 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid $border; @media (max-width: 900px) { display: none; } }
      ul { list-style: none; padding: 0; margin: 0; } li { margin-bottom: 0.15rem; }
      a { display: block; padding: 0.6rem 0.75rem; font-family: 'Poppins', sans-serif; font-size: 0.82rem; color: $text-lt; text-decoration: none; border-radius: 4px; transition: all 150ms ease; &:hover { background: rgba($brand, 0.05); color: $brand; padding-left: 1rem; } }
    }

    .content { min-width: 0; }

    .intro-card { display: flex; align-items: flex-start; gap: 1rem; background: rgba($brand, 0.04); border: 1px solid rgba($brand, 0.12); border-radius: 6px; padding: 1.5rem; margin-bottom: 2.5rem;
      svg { flex-shrink: 0; color: $brand; margin-top: 2px; }
      p { margin: 0; font-family: 'Lora', serif; font-size: 0.95rem; line-height: 1.75; color: $text-lt; }
    }

    .section { margin-bottom: 3rem; scroll-margin-top: 2rem;
      &__num { font-family: 'Teko', sans-serif; font-size: 1rem; color: $accent; margin-right: 0.5rem; }
      h2 { font-family: 'Teko', sans-serif; font-size: clamp(1.5rem, 3vw, 1.8rem); font-weight: 700; text-transform: uppercase; color: $brand; margin: 0 0 1.25rem; padding-bottom: 0.75rem; border-bottom: 2px solid rgba($accent, 0.4); }
      p, li { font-family: 'Lora', serif; font-size: 0.95rem; line-height: 1.85; color: $text-lt; }
      p { margin: 0 0 1rem; } ul { padding-left: 1.5rem; margin: 0.5rem 0 1rem; li { margin-bottom: 0.5rem; } }
      a { color: $brand; text-decoration: underline; text-underline-offset: 3px; &:hover { color: darken($brand, 12%); } }
    }

    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; @media (max-width: 600px) { grid-template-columns: 1fr; } }
    .info-item { background: $white; border: 1px solid $border; border-radius: 4px; padding: 1rem 1.25rem;
      &--full { grid-column: 1 / -1; }
      &__label { display: block; font-family: 'Poppins', sans-serif; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: $text-mt; margin-bottom: 0.25rem; }
      &__value { font-family: 'Lora', serif; font-size: 0.92rem; color: $text; }
      a { color: $brand; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    .data-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
    .data-list__item { display: flex; align-items: center; gap: 0.85rem; background: $white; border: 1px solid $border; border-radius: 4px; padding: 0.9rem 1.1rem;
      svg { flex-shrink: 0; color: $brand; } span { font-family: 'Lora', serif; font-size: 0.9rem; color: $text-lt; }
    }

    .legal-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; @media (max-width: 768px) { grid-template-columns: 1fr; } }
    .legal-card { background: $white; border: 1px solid $border; border-radius: 6px; padding: 1.5rem; text-align: center; transition: transform 200ms ease, box-shadow 200ms ease;
      &:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba($text, 0.08); }
      &__icon { width: 56px; height: 56px; margin: 0 auto 1rem; background: rgba($brand, 0.08); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: $brand; }
      h4 { font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 600; color: $text; margin: 0 0 0.5rem; }
      p { font-family: 'Lora', serif; font-size: 0.85rem; color: $text-lt; margin: 0; line-height: 1.6; }
    }

    .rights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 1rem 0; @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 480px) { grid-template-columns: 1fr; } }
    .right-item { background: $white; border: 1px solid $border; border-radius: 4px; padding: 1rem;
      strong { display: block; font-family: 'Poppins', sans-serif; font-size: 0.82rem; font-weight: 600; color: $brand; margin-bottom: 0.2rem; }
      span { font-family: 'Lora', serif; font-size: 0.82rem; color: $text-lt; }
    }

    .callout { display: flex; align-items: flex-start; gap: 0.85rem; background: rgba($brand, 0.04); border: 1px solid rgba($brand, 0.12); border-radius: 4px; padding: 1.1rem 1.25rem; margin-top: 1.5rem;
      &--info { background: rgba($accent, 0.08); border-color: rgba($accent, 0.25); svg { color: darken($accent, 15%); } }
      svg { flex-shrink: 0; color: $brand; margin-top: 2px; } p { margin: 0; font-size: 0.9rem; }
    }

    .security-list { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1rem; }
    .security-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: rgba(#A2BA1C, 0.08); border-radius: 4px;
      svg { flex-shrink: 0; color: #5A6A00; } span { font-family: 'Lora', serif; font-size: 0.9rem; color: $text-lt; }
    }
  `]
})
export class PrivacyPageComponent {
  tocOpen = signal(false);
}
