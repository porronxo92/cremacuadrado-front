import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-shipping-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <div class="container">
          <a routerLink="/">Inicio</a>
          <span class="breadcrumb__sep">/</span>
          <span>Envíos y Entregas</span>
        </div>
      </nav>

      <!-- Hero -->
      <header class="hero">
        <div class="container">
          <div class="hero__badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Pedidos
          </div>
          <h1>Envíos y Entregas</h1>
          <p class="hero__sub">Todo lo que necesitas saber sobre el envío de tu pedido</p>
        </div>
      </header>

      <!-- Highlights -->
      <section class="highlights">
        <div class="container">
          <div class="highlights__grid">
            <article class="feature-card">
              <div class="feature-card__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <h3>Envío en 24–48h</h3>
              <p>Preparamos tu pedido en 1 día hábil</p>
            </article>
            <article class="feature-card">
              <div class="feature-card__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.8 12.2 19.79 19.79 0 0 1 1.74 3.6 2 2 0 0 1 3.71 1.4h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.07a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <h3>Soporte al cliente</h3>
              <p>ayuda&#64;cremacuadrado.com</p>
            </article>
            <article class="feature-card">
              <div class="feature-card__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Embalaje protegido</h3>
              <p>Tus tarros, bien cuidados</p>
            </article>
            <article class="feature-card">
              <div class="feature-card__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </div>
              <h3>Garantía total</h3>
              <p>Si hay problema, lo solucionamos</p>
            </article>
          </div>
        </div>
      </section>

      <!-- Main content -->
      <main class="main">
        <div class="container">
          <div class="layout">
            
            <!-- Mobile TOC toggle -->
            <button class="toc-toggle" (click)="tocOpen.set(!tocOpen())" [class.is-open]="tocOpen()">
              <span>Índice de contenidos</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            <!-- TOC -->
            <nav class="toc" [class.is-open]="tocOpen()">
              <p class="toc__title">Contenido</p>
              <ul>
                <li><a href="#plazos" (click)="tocOpen.set(false)">Plazos de entrega</a></li>
                <li><a href="#costes" (click)="tocOpen.set(false)">Costes de envío</a></li>
                <li><a href="#seguimiento" (click)="tocOpen.set(false)">Seguimiento</a></li>
                <li><a href="#incidencias" (click)="tocOpen.set(false)">Incidencias</a></li>
                <li><a href="#devoluciones" (click)="tocOpen.set(false)">Devoluciones</a></li>
                <li><a href="#contacto" (click)="tocOpen.set(false)">Contacto</a></li>
              </ul>
            </nav>

            <!-- Content -->
            <div class="content">
              <section class="section" id="plazos">
                <h2><span class="section__num">01</span> Plazos de entrega</h2>
                <div class="timeline">
                  <div class="timeline__item">
                    <div class="timeline__marker">1</div>
                    <div class="timeline__body">
                      <h4>Preparación del pedido</h4>
                      <p>Una vez confirmado el pago, preparamos tu pedido en <strong>1 día hábil</strong> (en casos excepcionales, 2 días).</p>
                    </div>
                  </div>
                  <div class="timeline__item">
                    <div class="timeline__marker">2</div>
                    <div class="timeline__body">
                      <h4>Entrega por transporte</h4>
                      <p>La empresa de transportes tiene un compromiso de <strong>48 horas</strong> desde la recogida.</p>
                    </div>
                  </div>
                  <div class="timeline__item">
                    <div class="timeline__marker">3</div>
                    <div class="timeline__body">
                      <h4>Tiempo total estimado</h4>
                      <p>Recibirás tu pedido en <strong>48–72 horas</strong> desde la confirmación.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section class="section" id="costes">
                <h2><span class="section__num">02</span> Costes de envío</h2>
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr><th>Destino</th><th>Coste</th><th>Plazo</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Península</td><td>Calculado en el carrito</td><td>48–72 h</td></tr>
                      <tr><td>Islas Baleares</td><td>Consultar</td><td>3–5 días</td></tr>
                      <tr><td>Canarias / Ceuta / Melilla</td><td>Consultar</td><td>5–7 días</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="callout">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <p>Para envíos internacionales escríbenos a <a href="mailto:info@cremacuadrado.com">info&#64;cremacuadrado.com</a>.</p>
                </div>
              </section>

              <section class="section" id="seguimiento">
                <h2><span class="section__num">03</span> Seguimiento del pedido</h2>
                <p>Una vez enviado tu pedido, recibirás un correo electrónico con el <strong>número de seguimiento</strong>. Tu pedido se actualizará constantemente para que puedas conocer en todo momento dónde se encuentra.</p>
                <p>También puedes consultar el estado de tus pedidos en <a routerLink="/account/orders">Mis Pedidos</a> dentro de tu cuenta.</p>
              </section>

              <section class="section" id="incidencias">
                <h2><span class="section__num">04</span> Incidencias con el pedido</h2>
                <div class="alert-card">
                  <div class="alert-card__header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <strong>Mi pedido no llega</strong>
                  </div>
                  <p>Escríbenos a <a href="mailto:ayuda@cremacuadrado.com">ayuda&#64;cremacuadrado.com</a> con tu número de pedido. Lo localizamos y te informamos a la mayor brevedad.</p>
                </div>
                <div class="alert-card alert-card--warning">
                  <div class="alert-card__header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <strong>Tarro roto o dañado</strong>
                  </div>
                  <p>Embalamos con cariño, pero a veces ocurren imprevistos. Si recibes un tarro dañado:</p>
                  <ul>
                    <li>Envía una foto del daño a <a href="mailto:ayuda@cremacuadrado.com">ayuda&#64;cremacuadrado.com</a></li>
                    <li>Reclámanoslo lo antes posible tras la recepción</li>
                    <li>Gestionaremos <strong>devolución</strong> o <strong>reenvío gratuito</strong></li>
                  </ul>
                </div>
              </section>

              <section class="section" id="devoluciones">
                <h2><span class="section__num">05</span> Política de devoluciones</h2>
                <p>Tienes <strong>14 días naturales</strong> desde la recepción para ejercer tu derecho de desistimiento, conforme a la normativa de consumidores.</p>
                <p>Los productos deben estar en su estado original y sin abrir. Para iniciar una devolución contacta en <a href="mailto:ayuda@cremacuadrado.com">ayuda&#64;cremacuadrado.com</a>.</p>
              </section>

              <section class="section" id="contacto">
                <h2><span class="section__num">06</span> ¿Tienes más preguntas?</h2>
                <p>Estamos aquí para ayudarte. No dudes en <a routerLink="/contacto">contactarnos</a> o escribirnos directamente:</p>
                <div class="contact-buttons">
                  <a href="mailto:info@cremacuadrado.com" class="contact-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    info&#64;cremacuadrado.com
                  </a>
                  <a href="mailto:ayuda@cremacuadrado.com" class="contact-btn contact-btn--alt">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ayuda&#64;cremacuadrado.com
                  </a>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════════════════
       VARIABLES
       ═══════════════════════════════════════════════════════════════════════ */
    $brand: #7B1716;
    $accent: #E6C15A;
    $bg: #F4F1E9;
    $bg-alt: #EDE9DD;
    $white: #FFFFFF;
    $text: #1A1208;
    $text-lt: #5A4F3E;
    $text-mt: #8C7F6A;
    $border: #D9D3C5;

    /* ═══════════════════════════════════════════════════════════════════════
       BASE
       ═══════════════════════════════════════════════════════════════════════ */
    .page {
      background: $bg;
      min-height: 100vh;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;

      @media (max-width: 480px) {
        padding: 0 1rem;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       BREADCRUMB
       ═══════════════════════════════════════════════════════════════════════ */
    .breadcrumb {
      background: $bg-alt;
      padding: 0.75rem 0;
      border-bottom: 1px solid $border;

      .container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.72rem;
        color: $text-mt;
      }

      a {
        color: $text-lt;
        text-decoration: none;
        transition: color 150ms ease;

        &:hover { color: $brand; }
      }

      &__sep { opacity: 0.5; }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       HERO
       ═══════════════════════════════════════════════════════════════════════ */
    .hero {
      background: linear-gradient(135deg, $brand 0%, darken($brand, 8%) 100%);
      padding: 4rem 0 3.5rem;
      text-align: center;

      @media (max-width: 768px) {
        padding: 3rem 0 2.5rem;
      }

      &__badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba($white, 0.1);
        padding: 0.4rem 1rem;
        border-radius: 2rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: rgba($accent, 0.9);
        margin-bottom: 1rem;

        svg { opacity: 0.8; }
      }

      h1 {
        font-family: 'Teko', sans-serif;
        font-size: clamp(2.5rem, 5vw, 3.5rem);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        color: $accent;
        margin: 0 0 0.5rem;
        line-height: 1;
      }

      &__sub {
        font-family: 'Lora', serif;
        font-style: italic;
        font-size: clamp(0.9rem, 2vw, 1.05rem);
        color: rgba($bg, 0.75);
        margin: 0;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       HIGHLIGHTS
       ═══════════════════════════════════════════════════════════════════════ */
    .highlights {
      background: $white;
      padding: 3rem 0;
      border-bottom: 1px solid $border;

      @media (max-width: 768px) {
        padding: 2rem 0;
      }

      &__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;

        @media (max-width: 900px) {
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }
      }
    }

    .feature-card {
      background: $bg;
      border: 1px solid $border;
      border-radius: 4px;
      padding: 1.5rem;
      text-align: center;
      transition: transform 200ms ease, box-shadow 200ms ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba($text, 0.08);
      }

      &__icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        background: rgba($brand, 0.08);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $brand;
      }

      h3 {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: $text;
        margin: 0 0 0.35rem;
      }

      p {
        font-family: 'Lora', serif;
        font-size: 0.82rem;
        color: $text-mt;
        margin: 0;
        line-height: 1.5;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       MAIN CONTENT
       ═══════════════════════════════════════════════════════════════════════ */
    .main {
      padding: 3rem 0 5rem;

      @media (max-width: 768px) {
        padding: 2rem 0 4rem;
      }
    }

    .layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 3rem;
      align-items: start;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       MOBILE TOC TOGGLE
       ═══════════════════════════════════════════════════════════════════════ */
    .toc-toggle {
      display: none;
      width: 100%;
      padding: 1rem;
      background: $white;
      border: 1px solid $border;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      cursor: pointer;
      align-items: center;
      justify-content: space-between;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      color: $text;

      svg {
        transition: transform 300ms ease;
        color: $text-mt;
      }

      &.is-open svg {
        transform: rotate(180deg);
      }

      @media (max-width: 900px) {
        display: flex;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       TOC
       ═══════════════════════════════════════════════════════════════════════ */
    .toc {
      position: sticky;
      top: 2rem;
      background: $white;
      border: 1px solid $border;
      border-radius: 4px;
      padding: 1.5rem;

      @media (max-width: 900px) {
        position: static;
        display: none;
        margin-bottom: 2rem;
        padding: 1rem 1.5rem;

        &.is-open {
          display: block;
        }
      }

      &__title {
        font-family: 'Poppins', sans-serif;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: $text-mt;
        margin: 0 0 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid $border;

        @media (max-width: 900px) {
          display: none;
        }
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        margin-bottom: 0.15rem;
      }

      a {
        display: block;
        padding: 0.6rem 0.75rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.82rem;
        color: $text-lt;
        text-decoration: none;
        border-radius: 4px;
        transition: all 150ms ease;

        &:hover {
          background: rgba($brand, 0.05);
          color: $brand;
          padding-left: 1rem;
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CONTENT
       ═══════════════════════════════════════════════════════════════════════ */
    .content {
      min-width: 0;
    }

    .section {
      margin-bottom: 3rem;
      scroll-margin-top: 2rem;

      &__num {
        font-family: 'Teko', sans-serif;
        font-size: 1rem;
        color: $accent;
        margin-right: 0.5rem;
      }

      h2 {
        font-family: 'Teko', sans-serif;
        font-size: clamp(1.5rem, 3vw, 1.8rem);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        color: $brand;
        margin: 0 0 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid rgba($accent, 0.4);
      }

      p, li {
        font-family: 'Lora', serif;
        font-size: 0.95rem;
        line-height: 1.85;
        color: $text-lt;
      }

      p {
        margin: 0 0 1rem;
      }

      ul {
        padding-left: 1.5rem;
        margin: 0.5rem 0 1rem;

        li {
          margin-bottom: 0.5rem;
        }
      }

      a {
        color: $brand;
        text-decoration: underline;
        text-underline-offset: 3px;
        transition: color 150ms ease;

        &:hover { color: darken($brand, 12%); }
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       TIMELINE
       ═══════════════════════════════════════════════════════════════════════ */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
      padding-left: 2rem;

      &::before {
        content: '';
        position: absolute;
        left: 15px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(to bottom, $brand, rgba($brand, 0.2));
      }

      &__item {
        display: flex;
        gap: 1.25rem;
        position: relative;
      }

      &__marker {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        background: $brand;
        color: $accent;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Poppins', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        position: relative;
        z-index: 1;
        box-shadow: 0 0 0 4px $bg;
      }

      &__body {
        flex: 1;
        padding-bottom: 2rem;

        h4 {
          font-family: 'Poppins', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: $text;
          margin: 0 0 0.4rem;
        }

        p {
          margin: 0;
          font-size: 0.9rem;
        }
      }

      @media (max-width: 480px) {
        padding-left: 1.5rem;

        &::before {
          left: 11px;
        }

        &__marker {
          width: 24px;
          height: 24px;
          font-size: 0.7rem;
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       TABLE
       ═══════════════════════════════════════════════════════════════════════ */
    .table-wrap {
      overflow-x: auto;
      margin-bottom: 1rem;
      border-radius: 4px;
      border: 1px solid $border;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 400px;

      th, td {
        padding: 0.85rem 1rem;
        text-align: left;
      }

      thead {
        background: $brand;

        th {
          font-family: 'Poppins', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: $accent;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid $border;
          transition: background 150ms ease;

          &:last-child { border-bottom: none; }
          &:hover { background: rgba($brand, 0.02); }
        }

        td {
          font-family: 'Lora', serif;
          font-size: 0.9rem;
          color: $text-lt;
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CALLOUT
       ═══════════════════════════════════════════════════════════════════════ */
    .callout {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      background: rgba($brand, 0.04);
      border: 1px solid rgba($brand, 0.12);
      border-radius: 4px;
      padding: 1.1rem 1.25rem;

      svg {
        flex-shrink: 0;
        color: $brand;
        margin-top: 2px;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       ALERT CARD
       ═══════════════════════════════════════════════════════════════════════ */
    .alert-card {
      background: $white;
      border: 1px solid $border;
      border-left: 4px solid $brand;
      border-radius: 0 4px 4px 0;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;

      &--warning {
        border-left-color: darken($accent, 10%);

        .alert-card__header svg {
          color: darken($accent, 10%);
        }
      }

      &__header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.6rem;

        svg { color: $brand; }

        strong {
          font-family: 'Poppins', sans-serif;
          font-size: 0.95rem;
          color: $text;
        }
      }

      p {
        margin: 0 0 0.5rem;
        font-size: 0.9rem;
      }

      ul {
        margin: 0.5rem 0 0;
        padding-left: 1.25rem;

        li {
          font-size: 0.88rem;
          margin-bottom: 0.35rem;
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CONTACT BUTTONS
       ═══════════════════════════════════════════════════════════════════════ */
    .contact-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .contact-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1.25rem;
      background: $brand;
      color: $accent;
      border: 2px solid $brand;
      border-radius: 4px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 200ms ease;

      &:hover {
        background: darken($brand, 8%);
        border-color: darken($brand, 8%);
        transform: translateY(-2px);
      }

      &--alt {
        background: transparent;
        color: $brand;
        border-color: $border;

        &:hover {
          background: $brand;
          color: $accent;
          border-color: $brand;
        }
      }

      @media (max-width: 480px) {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ShippingPageComponent {
  tocOpen = signal(false);
}
