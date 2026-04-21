import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cookies-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumb"><div class="container"><a routerLink="/">Inicio</a><span class="breadcrumb__sep">/</span><span>Política de Cookies</span></div></nav>

      <header class="hero">
        <div class="container">
          <div class="hero__badge"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>Legal</div>
          <h1>Política de Cookies</h1>
          <p class="hero__sub">Información sobre las cookies que utilizamos</p>
        </div>
      </header>

      <main class="main">
        <div class="container">
          <div class="layout">
            <button class="toc-toggle" (click)="tocOpen.set(!tocOpen())" [class.is-open]="tocOpen()"><span>Índice de contenidos</span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>

            <nav class="toc" [class.is-open]="tocOpen()">
              <p class="toc__title">Contenido</p>
              <ul>
                <li><a href="#que-son" (click)="tocOpen.set(false)">¿Qué son las cookies?</a></li>
                <li><a href="#tipos" (click)="tocOpen.set(false)">Tipos de cookies</a></li>
                <li><a href="#como-usamos" (click)="tocOpen.set(false)">¿Cómo las usamos?</a></li>
                <li><a href="#desactivar" (click)="tocOpen.set(false)">Desactivar cookies</a></li>
                <li><a href="#terceros" (click)="tocOpen.set(false)">Cookies de terceros</a></li>
                <li><a href="#actualizacion" (click)="tocOpen.set(false)">Actualización</a></li>
              </ul>
            </nav>

            <div class="content">
              <div class="intro-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                <p>CREMACUADRADO SL utiliza cookies a los efectos de optimizar y personalizar la navegación por el sitio web <strong>cremacuadrado.com</strong>. En esta política explicamos qué son, para qué las usamos y cómo puedes controlarlas.</p>
              </div>

              <section class="section" id="que-son">
                <h2><span class="section__num">01</span> ¿Qué son las cookies?</h2>
                <p>Las cookies son pequeños ficheros de información que se alojan en el terminal del usuario cuando visita un sitio web. Sirven para facilitar la navegación, recordar preferencias y optimizar la experiencia del usuario.</p>
                <div class="callout callout--info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <p>Los datos recopilados mediante las cookies pueden ser compartidos con los creadores de estas, pero <strong>en ningún caso la información obtenida será asociada a datos personales</strong> ni a datos que puedan identificar al usuario.</p>
                </div>
              </section>

              <section class="section" id="tipos">
                <h2><span class="section__num">02</span> Tipos de cookies</h2>
                <div class="cookie-grid">
                  <div class="cookie-card cookie-card--essential">
                    <div class="cookie-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <span class="cookie-card__badge">Esenciales</span>
                    <h3>Cookies técnicas</h3>
                    <p>Imprescindibles para el funcionamiento básico. Permiten navegar y utilizar funciones principales como el carrito de compra. No pueden desactivarse.</p>
                  </div>
                  <div class="cookie-card cookie-card--analytics">
                    <div class="cookie-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                    <span class="cookie-card__badge">Analíticas</span>
                    <h3>Cookies de análisis</h3>
                    <p>Nos permiten contar las visitas y conocer el origen del tráfico para mejorar el rendimiento de nuestro sitio. Toda la información es anónima.</p>
                  </div>
                  <div class="cookie-card cookie-card--functional">
                    <div class="cookie-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </div>
                    <span class="cookie-card__badge">Funcionales</span>
                    <h3>Cookies de preferencia</h3>
                    <p>Permiten que el sitio web recuerde información que cambia la forma en que se comporta o se ve (como tu idioma o región).</p>
                  </div>
                </div>
              </section>

              <section class="section" id="como-usamos">
                <h2><span class="section__num">03</span> ¿Cómo utilizamos las cookies?</h2>
                <p>Las cookies de cremacuadrado.com se utilizan para:</p>
                <div class="use-list">
                  <div class="use-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Facilitar y optimizar la navegación del usuario por el portal.</span></div>
                  <div class="use-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Recordar los productos añadidos al carrito de compra.</span></div>
                  <div class="use-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Mantener la sesión del usuario activa durante su visita.</span></div>
                  <div class="use-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Analizar el comportamiento con fines estadísticos para mejorar el sitio.</span></div>
                </div>
              </section>

              <section class="section" id="desactivar">
                <h2><span class="section__num">04</span> ¿Cómo desactivar o eliminar las cookies?</h2>
                <p>Si no deseas que se instalen cookies en tu dispositivo, puedes configurar el navegador para impedirlo. A continuación tienes los enlaces a las instrucciones de los navegadores principales:</p>
                <div class="browser-grid">
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" class="browser-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
                    <span>Google Chrome</span>
                    <small>Configurar cookies</small>
                  </a>
                  <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener" class="browser-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    <span>Mozilla Firefox</span>
                    <small>Configurar cookies</small>
                  </a>
                  <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener" class="browser-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                    <span>Safari</span>
                    <small>Configurar cookies</small>
                  </a>
                  <a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener" class="browser-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    <span>Microsoft Edge</span>
                    <small>Configurar cookies</small>
                  </a>
                </div>
                <div class="callout callout--warning">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <p>Ten en cuenta que la desactivación de algunas cookies puede afectar al correcto funcionamiento del sitio web, como el proceso de compra o el inicio de sesión.</p>
                </div>
              </section>

              <section class="section" id="terceros">
                <h2><span class="section__num">05</span> Cookies de terceros</h2>
                <p>En ocasiones, el sitio web puede incorporar servicios de terceros que instalan sus propias cookies. Estos servicios son externos y se rigen por sus propias políticas de privacidad. Consulta las políticas de privacidad de estos terceros para más información.</p>
              </section>

              <section class="section" id="actualizacion">
                <h2><span class="section__num">06</span> Actualización de la política de cookies</h2>
                <p>CREMACUADRADO SL puede actualizar esta Política de Cookies en función de nuevos requisitos legales o de cambios en los servicios ofrecidos. Se recomienda revisar esta política periódicamente para estar informado de cualquier cambio.</p>
                <a routerLink="/pages/politica-privacidad" class="link-card">
                  <span>Consulta nuestra Política de Privacidad</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
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

    .intro-card { display: flex; align-items: flex-start; gap: 1rem; background: rgba($brand, 0.04); border: 1px solid rgba($brand, 0.12); border-radius: 6px; padding: 1.5rem; margin-bottom: 2.5rem;
      svg { flex-shrink: 0; color: $brand; margin-top: 2px; }
      p { margin: 0; font-family: 'Lora', serif; font-size: 0.95rem; line-height: 1.75; color: $text-lt; }
    }

    .section { margin-bottom: 3rem; scroll-margin-top: 2rem;
      &__num { font-family: 'Teko', sans-serif; font-size: 1rem; color: $accent; margin-right: 0.5rem; }
      h2 { font-family: 'Teko', sans-serif; font-size: clamp(1.5rem, 3vw, 1.8rem); font-weight: 700; text-transform: uppercase; color: $brand; margin: 0 0 1.25rem; padding-bottom: 0.75rem; border-bottom: 2px solid rgba($accent, 0.4); }
      p, li { font-family: 'Lora', serif; font-size: 0.95rem; line-height: 1.85; color: $text-lt; } p { margin: 0 0 1rem; }
      a { color: $brand; text-decoration: underline; text-underline-offset: 3px; &:hover { color: darken($brand, 12%); } }
    }

    .callout { display: flex; align-items: flex-start; gap: 0.85rem; background: rgba($brand, 0.04); border: 1px solid rgba($brand, 0.12); border-radius: 4px; padding: 1.1rem 1.25rem; margin: 1rem 0;
      &--info { background: rgba($accent, 0.08); border-color: rgba($accent, 0.25); svg { color: darken($accent, 15%); } }
      &--warning { background: rgba(#D97706, 0.06); border-color: rgba(#D97706, 0.2); svg { color: #B45309; } }
      svg { flex-shrink: 0; color: $brand; margin-top: 2px; } p { margin: 0; font-family: 'Lora', serif; font-size: 0.9rem; line-height: 1.7; color: $text-lt; }
    }

    .cookie-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; @media (max-width: 900px) { grid-template-columns: 1fr; } }
    .cookie-card { background: $white; border: 1px solid $border; border-radius: 8px; padding: 1.5rem; text-align: center; transition: transform 200ms ease, box-shadow 200ms ease;
      &:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba($text, 0.08); }
      &__icon { width: 56px; height: 56px; margin: 0 auto 1rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      &__badge { display: inline-block; font-family: 'Poppins', sans-serif; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 0.25rem 0.65rem; border-radius: 2rem; margin-bottom: 0.75rem; }
      h3 { font-family: 'Poppins', sans-serif; font-size: 0.95rem; font-weight: 600; color: $text; margin: 0 0 0.5rem; }
      p { font-family: 'Lora', serif; font-size: 0.85rem; color: $text-lt; margin: 0; line-height: 1.6; }
      &--essential { .cookie-card__icon { background: rgba($brand, 0.08); color: $brand; } .cookie-card__badge { background: rgba($brand, 0.1); color: $brand; } }
      &--analytics { .cookie-card__icon { background: rgba(#0EA5E9, 0.1); color: #0284C7; } .cookie-card__badge { background: rgba(#0EA5E9, 0.1); color: #0284C7; } }
      &--functional { .cookie-card__icon { background: rgba(#84CC16, 0.1); color: #65A30D; } .cookie-card__badge { background: rgba(#84CC16, 0.1); color: #65A30D; } }
    }

    .use-list { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1rem; }
    .use-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; background: rgba(#84CC16, 0.06); border-radius: 4px;
      svg { flex-shrink: 0; color: #65A30D; } span { font-family: 'Lora', serif; font-size: 0.9rem; color: $text-lt; }
    }

    .browser-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1.5rem 0; @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 480px) { grid-template-columns: 1fr; } }
    .browser-card { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.25rem 1rem; background: $white; border: 1px solid $border; border-radius: 6px; text-decoration: none; transition: all 150ms ease;
      svg { color: $text-mt; transition: color 150ms ease; }
      span { font-family: 'Poppins', sans-serif; font-size: 0.85rem; font-weight: 500; color: $text; }
      small { font-family: 'Poppins', sans-serif; font-size: 0.7rem; color: $text-mt; }
      &:hover { border-color: $brand; box-shadow: 0 4px 12px rgba($brand, 0.08); svg { color: $brand; } span { color: $brand; } }
    }

    .link-card { display: flex; align-items: center; justify-content: space-between; background: $white; border: 1px solid $border; border-radius: 4px; padding: 1rem 1.25rem; text-decoration: none; transition: all 150ms ease; margin-top: 1rem;
      span { font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 500; color: $brand; }
      svg { color: $brand; transition: transform 150ms ease; }
      &:hover { border-color: $brand; box-shadow: 0 4px 12px rgba($brand, 0.08); svg { transform: translateX(4px); } }
    }
  `]
})
export class CookiesPageComponent {
  tocOpen = signal(false);
}
