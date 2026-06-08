import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-conditions-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumb"><div class="container"><a routerLink="/">Inicio</a><span class="breadcrumb__sep">/</span><span>Aviso Legal</span></div></nav>

      <header class="hero">
        <div class="container">
          <div class="hero__badge"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Legal</div>
          <h1>Aviso Legal</h1>
          <p class="hero__sub">Condiciones de uso de cremacuadrado.com</p>
        </div>
      </header>

      <main class="main">
        <div class="container">
          <div class="layout">
            <button class="toc-toggle" (click)="tocOpen.set(!tocOpen())" [class.is-open]="tocOpen()"><span>Índice de contenidos</span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>

            <nav class="toc" [class.is-open]="tocOpen()">
              <p class="toc__title">Contenido</p>
              <ul>
                <li><a href="#titular" (click)="tocOpen.set(false)">Titular del sitio</a></li>
                <li><a href="#ley-aplicable" (click)="tocOpen.set(false)">Ley aplicable</a></li>
                <li><a href="#aceptacion" (click)="tocOpen.set(false)">Aceptación del usuario</a></li>
                <li><a href="#contenido" (click)="tocOpen.set(false)">Contenido y uso</a></li>
                <li><a href="#propiedad" (click)="tocOpen.set(false)">Propiedad intelectual</a></li>
                <li><a href="#responsabilidad" (click)="tocOpen.set(false)">Responsabilidad</a></li>
                <li><a href="#cookies" (click)="tocOpen.set(false)">Cookies</a></li>
                <li><a href="#enlaces" (click)="tocOpen.set(false)">Enlaces</a></li>
              </ul>
            </nav>

            <div class="content">
              <section class="section" id="titular">
                <h2><span class="section__num">01</span> Titular del sitio web</h2>
                <p>En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de Julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, se informa que el Sitio Web <strong>cremacuadrado.com</strong> es titularidad de:</p>
                <div class="info-grid">
                  <div class="info-item"><span class="info-item__label">Sociedad</span><span class="info-item__value">CREMACUADRADO SL</span></div>
                  <div class="info-item"><span class="info-item__label">NIF</span><span class="info-item__value">B56673700</span></div>
                  <div class="info-item"><span class="info-item__label">Domicilio</span><span class="info-item__value">Camino del Arca 18 – 13005 Ciudad Real</span></div>
                  <div class="info-item info-item--full"><span class="info-item__label">Registro</span><span class="info-item__value">Registro Mercantil de Ciudad Real — hoja CR-33764, Tomo 725</span></div>
                </div>
              </section>

              <section class="section" id="ley-aplicable">
                <h2><span class="section__num">02</span> Ley aplicable y jurisdicción</h2>
                <div class="highlight-cards">
                  <div class="highlight-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <div><strong>Legislación española</strong><p>Todas las relaciones entre CREMACUADRADO SL y los usuarios están sometidas a la legislación y jurisdicción españolas.</p></div>
                  </div>
                  <div class="highlight-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    <div><strong>Jurisdicción Ciudad Real</strong><p>Las partes se someten expresamente a los Juzgados y Tribunales de Ciudad Real para resolver cualquier controversia.</p></div>
                  </div>
                </div>
              </section>

              <section class="section" id="aceptacion">
                <h2><span class="section__num">03</span> Aceptación del usuario</h2>
                <p>Este Aviso Legal regula el acceso y utilización de la página web que CREMACUADRADO SL pone a disposición de los usuarios de Internet. Se considera usuario la persona que acceda, navegue, utilice o participe en los servicios y actividades de la página web.</p>
                <div class="callout callout--warning">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <p>El acceso y navegación en el sitio web supone la <strong>aceptación de la totalidad de las presentes Condiciones de Uso</strong>. En caso de desacuerdo, el usuario debe abstenerse de usar el sitio web.</p>
                </div>
              </section>

              <section class="section" id="contenido">
                <h2><span class="section__num">04</span> Contenido y uso</h2>
                <p>La visita al sitio web por parte del usuario deberá hacerse de forma responsable y de conformidad a la legalidad vigente, la buena fe, el presente Aviso Legal y respetando los derechos de propiedad intelectual e industrial.</p>
                <div class="rule-list">
                  <div class="rule-item rule-item--forbidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    <span>Uso de contenidos con finalidades ilícitas</span>
                  </div>
                  <div class="rule-item rule-item--forbidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    <span>Acciones que causen daños no consentidos</span>
                  </div>
                  <div class="rule-item rule-item--forbidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    <span>Vulneración de derechos de terceros</span>
                  </div>
                </div>
              </section>

              <section class="section" id="propiedad">
                <h2><span class="section__num">05</span> Propiedad intelectual e industrial</h2>
                <p>Los derechos de propiedad intelectual del contenido de las páginas web, su diseño gráfico y códigos son titularidad de CREMACUADRADO SL.</p>
                <div class="callout">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <p>Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otra actividad realizada con los contenidos, salvo consentimiento previo, expreso y por escrito de CREMACUADRADO SL.</p>
                </div>
                <p>Todos los nombres comerciales, marcas o signos distintos contenidos en las páginas web son propiedad de sus dueños y están protegidos por la ley.</p>
              </section>

              <section class="section" id="responsabilidad">
                <h2><span class="section__num">06</span> Responsabilidad y garantías</h2>
                <p>CREMACUADRADO SL no puede hacerse responsable de las siguientes situaciones:</p>
                <div class="disclaimer-grid">
                  <div class="disclaimer-item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Continuidad y disponibilidad de los contenidos</span></div>
                  <div class="disclaimer-item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Ausencia de errores en los contenidos</span></div>
                  <div class="disclaimer-item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Ausencia de virus y componentes dañinos</span></div>
                  <div class="disclaimer-item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Daños causados por vulneraciones de seguridad</span></div>
                  <div class="disclaimer-item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Uso inadecuado por parte de los usuarios</span></div>
                  <div class="disclaimer-item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Uso de Internet por menores sin permiso</span></div>
                </div>
                <p class="note">CREMACUADRADO SL podrá suspender temporalmente y sin previo aviso la accesibilidad al sitio web por motivos de mantenimiento.</p>
              </section>

              <section class="section" id="cookies">
                <h2><span class="section__num">07</span> Cookies</h2>
                <p>CREMACUADRADO SL utiliza cookies con el objetivo de optimizar y personalizar la navegación por el sitio web.</p>
                <a routerLink="/cookies" class="link-card">
                  <span>Consulta nuestra Política de Cookies</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
              </section>

              <section class="section" id="enlaces">
                <h2><span class="section__num">08</span> Enlaces (links)</h2>
                <p>La presencia de enlaces en la página web de CREMACUADRADO SL hacia otros sitios de Internet tiene finalidad meramente informativa y no suponen sugerencia, invitación o recomendación sobre los mismos.</p>
                <p>CREMACUADRADO SL no asumirá responsabilidad por los contenidos de un enlace perteneciente a un sitio web ajeno.</p>
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
      a { color: $text-lt; text-decoration: none; &:hover { color: $brand; } } &__sep { opacity: 0.5; }
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
      svg { transition: transform 300ms ease; color: $text-mt; } &.is-open svg { transform: rotate(180deg); } @media (max-width: 900px) { display: flex; }
    }

    .toc { position: sticky; top: 2rem; background: $white; border: 1px solid $border; border-radius: 4px; padding: 1.5rem;
      @media (max-width: 900px) { position: static; display: none; margin-bottom: 2rem; &.is-open { display: block; } }
      &__title { font-family: 'Poppins', sans-serif; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: $text-mt; margin: 0 0 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid $border; @media (max-width: 900px) { display: none; } }
      ul { list-style: none; padding: 0; margin: 0; } li { margin-bottom: 0.15rem; }
      a { display: block; padding: 0.6rem 0.75rem; font-family: 'Poppins', sans-serif; font-size: 0.82rem; color: $text-lt; text-decoration: none; border-radius: 4px; transition: all 150ms ease; &:hover { background: rgba($brand, 0.05); color: $brand; padding-left: 1rem; } }
    }

    .content { min-width: 0; }

    .section { margin-bottom: 3rem; scroll-margin-top: 2rem;
      &__num { font-family: 'Teko', sans-serif; font-size: 1rem; color: $accent; margin-right: 0.5rem; }
      h2 { font-family: 'Teko', sans-serif; font-size: clamp(1.5rem, 3vw, 1.8rem); font-weight: 700; text-transform: uppercase; color: $brand; margin: 0 0 1.25rem; padding-bottom: 0.75rem; border-bottom: 2px solid rgba($accent, 0.4); }
      p, li { font-family: 'Lora', serif; font-size: 0.95rem; line-height: 1.85; color: $text-lt; } p { margin: 0 0 1rem; }
      a { color: $brand; text-decoration: underline; text-underline-offset: 3px; &:hover { color: darken($brand, 12%); } }
      .note { font-size: 0.88rem; color: $text-mt; font-style: italic; }
    }

    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; @media (max-width: 600px) { grid-template-columns: 1fr; } }
    .info-item { background: $white; border: 1px solid $border; border-radius: 4px; padding: 1rem 1.25rem;
      &--full { grid-column: 1 / -1; }
      &__label { display: block; font-family: 'Poppins', sans-serif; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: $text-mt; margin-bottom: 0.25rem; }
      &__value { font-family: 'Lora', serif; font-size: 0.92rem; color: $text; }
    }

    .highlight-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; @media (max-width: 600px) { grid-template-columns: 1fr; } }
    .highlight-card { display: flex; gap: 1rem; background: $white; border: 1px solid $border; border-radius: 6px; padding: 1.25rem;
      svg { flex-shrink: 0; color: $brand; margin-top: 2px; }
      strong { display: block; font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 600; color: $text; margin-bottom: 0.25rem; }
      p { font-family: 'Lora', serif; font-size: 0.85rem; color: $text-lt; margin: 0; line-height: 1.6; }
    }

    .callout { display: flex; align-items: flex-start; gap: 0.85rem; background: rgba($brand, 0.04); border: 1px solid rgba($brand, 0.12); border-radius: 4px; padding: 1.1rem 1.25rem; margin: 1rem 0;
      &--warning { background: rgba(#D97706, 0.06); border-color: rgba(#D97706, 0.2); svg { color: #B45309; } }
      svg { flex-shrink: 0; color: $brand; margin-top: 2px; } p { margin: 0; font-family: 'Lora', serif; font-size: 0.9rem; line-height: 1.7; color: $text-lt; }
    }

    .rule-list { display: flex; flex-direction: column; gap: 0.6rem; margin: 1rem 0; }
    .rule-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; border-radius: 4px;
      &--forbidden { background: rgba(#DC2626, 0.05); border: 1px solid rgba(#DC2626, 0.12); svg { color: #DC2626; } }
      span { font-family: 'Lora', serif; font-size: 0.9rem; color: $text-lt; }
    }

    .disclaimer-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; margin: 1rem 0; @media (max-width: 600px) { grid-template-columns: 1fr; } }
    .disclaimer-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.9rem; background: rgba($text-mt, 0.06); border-radius: 4px;
      svg { flex-shrink: 0; color: $text-mt; } span { font-family: 'Lora', serif; font-size: 0.85rem; color: $text-lt; }
    }

    .link-card { display: flex; align-items: center; justify-content: space-between; background: $white; border: 1px solid $border; border-radius: 4px; padding: 1rem 1.25rem; text-decoration: none; transition: all 150ms ease; margin-top: 1rem;
      span { font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 500; color: $brand; }
      svg { color: $brand; transition: transform 150ms ease; }
      &:hover { border-color: $brand; box-shadow: 0 4px 12px rgba($brand, 0.08); svg { transform: translateX(4px); } }
    }
  `]
})
export class ConditionsPageComponent {
  tocOpen = signal(false);
}
