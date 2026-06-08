import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="contact-page">

      <!-- Hero -->
      <section class="contact-hero">
        <div class="container">
          <span class="contact-hero__tag">Hablemos</span>
          <h1>Contacto</h1>
          <p class="contact-hero__sub">Como el amigo que siempre llega con algo bueno para compartir.<br>Estamos aquí para lo que necesites.</p>
        </div>
      </section>

      <!-- Contact Grid -->
      <section class="contact-section">
        <div class="container">
          <div class="contact-grid">

            <!-- Info -->
            <div class="contact-info">
              <h2>¿Cómo podemos<br>ayudarte?</h2>
              <div class="contact-info__divider"></div>

              <div class="contact-info__item">
                <div class="contact-info__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <span class="contact-info__label">Email general</span>
                  <a href="mailto:info@cremacuadrado.com" class="contact-info__value">info&#64;cremacuadrado.com</a>
                </div>
              </div>

              <div class="contact-info__item">
                <div class="contact-info__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <span class="contact-info__label">Reclamaciones</span>
                  <a href="mailto:ayuda@cremacuadrado.com" class="contact-info__value">ayuda&#64;cremacuadrado.com</a>
                </div>
              </div>

              <div class="contact-info__item">
                <div class="contact-info__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <span class="contact-info__label">Dirección</span>
                  <span class="contact-info__value">Camino del Arca 18<br>13005 Ciudad Real</span>
                </div>
              </div>

              <!-- Social -->
              <div class="contact-social">
                <span class="contact-social__label">Síguenos</span>
                <div class="contact-social__links">
                  <a href="https://instagram.com/cremacuadrado" target="_blank" rel="noopener" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a href="https://facebook.com/cremacuadrado" target="_blank" rel="noopener" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                  <a href="https://tiktok.com/@cremacuadrado" target="_blank" rel="noopener" aria-label="TikTok">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- Form -->
            <div class="contact-form-wrap">
              @if (sent()) {
                <div class="contact-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h3>¡Mensaje enviado!</h3>
                  <p>Te responderemos lo antes posible en <strong>info&#64;cremacuadrado.com</strong></p>
                  <button class="btn-back" (click)="resetForm()">Enviar otro mensaje</button>
                </div>
              } @else {
                <form class="contact-form" (ngSubmit)="sendForm()" #contactForm="ngForm">
                  <h3 class="contact-form__title">Escríbenos</h3>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="name">Nombre y apellidos *</label>
                      <input
                        id="name" name="name" type="text"
                        [(ngModel)]="formData.name"
                        required minlength="2"
                        placeholder="Tu nombre completo"
                        #nameField="ngModel"
                        [class.is-invalid]="nameField.invalid && nameField.touched"
                      >
                      @if (nameField.invalid && nameField.touched) {
                        <span class="field-error">Introduce tu nombre</span>
                      }
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="email">Email *</label>
                    <input
                      id="email" name="email" type="email"
                      [(ngModel)]="formData.email"
                      required email
                      placeholder="tu@email.com"
                      #emailField="ngModel"
                      [class.is-invalid]="emailField.invalid && emailField.touched"
                    >
                    @if (emailField.invalid && emailField.touched) {
                      <span class="field-error">Email no válido</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="message">Mensaje *</label>
                    <textarea
                      id="message" name="message"
                      [(ngModel)]="formData.message"
                      required minlength="10"
                      placeholder="¿En qué podemos ayudarte?"
                      rows="5"
                      #msgField="ngModel"
                      [class.is-invalid]="msgField.invalid && msgField.touched"
                    ></textarea>
                    @if (msgField.invalid && msgField.touched) {
                      <span class="field-error">El mensaje es demasiado corto</span>
                    }
                  </div>

                  <div class="form-check">
                    <label class="checkbox-label">
                      <input type="checkbox" name="privacy" [(ngModel)]="formData.privacy" required #privacyField="ngModel">
                      <span class="checkbox-text">
                        He leído y acepto la
                        <a routerLink="/privacidad">Política de Privacidad</a> *
                      </span>
                    </label>
                  </div>

                  <div class="form-check">
                    <label class="checkbox-label">
                      <input type="checkbox" name="marketing" [(ngModel)]="formData.marketing">
                      <span class="checkbox-text">Acepto el envío de comunicaciones comerciales, promociones y ofertas</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    class="btn-submit"
                    [disabled]="contactForm.invalid || sending()"
                  >
                    @if (sending()) { Enviando... } @else { Enviar mensaje }
                  </button>
                </form>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="faq-section">
        <div class="container">
          <div class="faq-header">
            <span class="faq-header__tag">Respuestas</span>
            <h2>Preguntas Frecuentes</h2>
            <div class="faq-header__divider"></div>
          </div>

          <div class="faq-list">
            @for (item of faqItems; track item.question; let i = $index) {
              <div class="faq-item" [class.faq-item--open]="item.open">
                <button class="faq-item__question" (click)="toggleFaq(i)" [attr.aria-expanded]="item.open">
                  <span>{{ item.question }}</span>
                  <svg class="faq-item__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div class="faq-item__answer">
                  <p>{{ item.answer }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    $brand:   #7B1716;
    $accent:  #E6C15A;
    $bg:      #F4F1E9;
    $bg-alt:  #EDE9DD;
    $text:    #1A1208;
    $text-lt: #5A4F3E;
    $text-mt: #8C7F6A;
    $border:  #D9D3C5;

    .contact-page { background: $bg; min-height: 100vh; }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }

    // ── Hero ────────────────────────────────────────────
    .contact-hero {
      background: $brand;
      padding: 4rem 0 3.5rem;
      text-align: center;

      &__tag {
        font-family: 'Poppins', sans-serif;
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: rgba($accent, 0.8);
        display: block;
        margin-bottom: 0.6rem;
      }

      h1 {
        font-family: 'Teko', sans-serif;
        font-size: 3.5rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        line-height: 1;
        color: $accent;
        margin: 0 0 0.75rem;
        @media (max-width: 768px) { font-size: 2.5rem; }
      }

      &__sub {
        font-family: 'Lora', serif;
        font-style: italic;
        font-size: 1rem;
        color: rgba(244, 241, 233, 0.8);
        margin: 0;
        line-height: 1.6;
      }
    }

    // ── Contact grid ────────────────────────────────────
    .contact-section { padding: 4rem 0; }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1.6fr;
      gap: 3rem;
      align-items: start;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }

    // Info panel
    .contact-info {
      h2 {
        font-family: 'Teko', sans-serif;
        font-size: 2.2rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        color: $brand;
        line-height: 1.1;
        margin: 0 0 1rem;
      }

      &__divider {
        width: 3rem;
        height: 2px;
        background: $accent;
        margin-bottom: 2rem;
      }

      &__item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      &__icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        background: rgba($brand, 0.08);
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $brand;
        margin-top: 2px;
      }

      &__label {
        display: block;
        font-family: 'Poppins', sans-serif;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: $text-mt;
        margin-bottom: 0.2rem;
      }

      &__value {
        font-family: 'Lora', serif;
        font-size: 0.95rem;
        color: $text-lt;
        text-decoration: none;
        line-height: 1.5;
        display: block;
        transition: color 150ms ease;

        &:hover { color: $brand; }
      }
    }

    .contact-social {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid $border;

      &__label {
        font-family: 'Poppins', sans-serif;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: $text-mt;
        display: block;
        margin-bottom: 0.75rem;
      }

      &__links {
        display: flex;
        gap: 0.75rem;

        a {
          width: 40px;
          height: 40px;
          border: 1px solid $border;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: $text-lt;
          transition: all 150ms ease;

          &:hover {
            border-color: $brand;
            color: $brand;
            background: rgba($brand, 0.05);
          }
        }
      }
    }

    // Form panel
    .contact-form-wrap {
      background: #fff;
      border: 1px solid $border;
      border-radius: 2px;
      padding: 2.5rem;

      @media (max-width: 480px) { padding: 1.5rem; }
    }

    .contact-form {
      &__title {
        font-family: 'Teko', sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: $brand;
        margin: 0 0 1.75rem;
      }
    }

    .form-row { display: grid; grid-template-columns: 1fr; gap: 0; }

    .form-group {
      margin-bottom: 1.25rem;

      label {
        display: block;
        font-family: 'Poppins', sans-serif;
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $text-lt;
        margin-bottom: 0.4rem;
      }

      input, textarea {
        width: 100%;
        padding: 0.65rem 0.9rem;
        font-family: 'Lora', serif;
        font-size: 0.95rem;
        border: 1px solid $border;
        border-radius: 2px;
        background: $bg;
        color: $text;
        outline: none;
        transition: border-color 150ms ease, box-shadow 150ms ease;
        resize: vertical;

        &::placeholder { color: $text-mt; font-style: italic; }
        &:focus { border-color: $brand; box-shadow: 0 0 0 3px rgba($brand, 0.08); }
        &.is-invalid { border-color: #A01C1C; }
      }
    }

    .field-error {
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      color: #A01C1C;
      margin-top: 0.25rem;
      display: block;
    }

    .form-check {
      margin-bottom: 0.85rem;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      cursor: pointer;

      input[type="checkbox"] {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
        margin-top: 2px;
        accent-color: $brand;
        cursor: pointer;
      }

      .checkbox-text {
        font-family: 'Poppins', sans-serif;
        font-size: 0.78rem;
        font-weight: 300;
        color: $text-lt;
        line-height: 1.5;

        a {
          color: $brand;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      }
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: 1.25rem;
      padding: 0.85rem 2rem;
      background: $brand;
      color: $accent;
      border: 2px solid $brand;
      border-radius: 2px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: background 200ms ease;

      &:hover:not(:disabled) { background: #8E1C1B; border-color: #8E1C1B; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    // Success state
    .contact-success {
      text-align: center;
      padding: 3rem 1rem;
      color: $brand;

      svg { margin-bottom: 1rem; }

      h3 {
        font-family: 'Teko', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        text-transform: uppercase;
        color: $brand;
        margin: 0 0 0.5rem;
      }

      p {
        font-family: 'Lora', serif;
        font-size: 0.95rem;
        color: $text-lt;
        margin: 0 0 1.5rem;
      }
    }

    .btn-back {
      background: transparent;
      border: 1px solid $border;
      border-radius: 2px;
      padding: 0.5rem 1.25rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 500;
      color: $text-lt;
      cursor: pointer;
      transition: border-color 150ms ease, color 150ms ease;

      &:hover { border-color: $brand; color: $brand; }
    }

    // ── FAQ ─────────────────────────────────────────────
    .faq-section {
      padding: 4rem 0 5rem;
      background: $bg-alt;
    }

    .faq-header {
      text-align: center;
      margin-bottom: 2.5rem;

      &__tag {
        font-family: 'Poppins', sans-serif;
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: $text-mt;
        display: block;
        margin-bottom: 0.5rem;
      }

      h2 {
        font-family: 'Teko', sans-serif;
        font-size: 2.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        color: $brand;
        margin: 0 0 0.5rem;
        @media (max-width: 768px) { font-size: 2rem; }
      }

      &__divider {
        width: 3rem;
        height: 2px;
        background: $accent;
        margin: 0 auto;
      }
    }

    .faq-list {
      max-width: 780px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .faq-item {
      border-bottom: 1px solid $border;

      &:first-child { border-top: 1px solid $border; }

      &__question {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1.15rem 0;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        color: $text;
        transition: color 150ms ease;

        &:hover { color: $brand; }

        span { flex: 1; }
      }

      &__icon {
        flex-shrink: 0;
        transition: transform 300ms ease;
        color: $text-mt;
      }

      &--open &__icon {
        transform: rotate(180deg);
        color: $brand;
      }

      &--open &__question { color: $brand; }

      &__answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height 350ms ease, padding 350ms ease;
        padding: 0;

        p {
          font-family: 'Lora', serif;
          font-size: 0.92rem;
          line-height: 1.75;
          color: $text-lt;
          margin: 0;
          padding-bottom: 1.25rem;
        }
      }

      &--open &__answer {
        max-height: 600px;
        padding-top: 0;
      }
    }
  `]
})
export class ContactComponent {
  formData = { name: '', email: '', message: '', privacy: false, marketing: false };
  sent = signal(false);
  sending = signal(false);

  faqItems: FaqItem[] = [
    {
      question: '¿Qué tiene de especial nuestra crema?',
      answer: 'La fabricación es artesanal, única y exclusiva de cremas de pistacho. El comportamiento de este fruto seco está en el centro de nuestro proyecto. Hemos desarrollado sistemas y maquinarias especiales para tratarlo y perseguimos darle valor. Sin quitarle nada a los demás frutos secos, nos centramos en el pistacho para destacar y producir algo único.',
      open: false
    },
    {
      question: 'Mi crema tiene una capa de aceite. ¿Está mala?',
      answer: '¡De mala nada! Es perfectamente normal, pasa en la CRUNCHY y pasa en la PURA. El pistacho tiene aceite en su composición, y este puede acumularse naturalmente en la superficie cuando el tarro está en la misma posición por unas semanas. Esto pasa por no utilizar emulsionantes. Dale un meneo con una cucharita llegando también a las partes más profundas del tarro y verás que en pocos segundos estará como nueva.',
      open: false
    },
    {
      question: '¿Dónde conservo mis tarros?',
      answer: '¡El frigorífico déjalo para otras cosas! Nuestros tarros se tienen que conservar como el aceite de oliva: en un lugar fresco y apartado de la luz solar. Meterlo en la nevera puede provocar que el aceite se congele y se separe aún más. Además, si no cierras bien la tapa, el pistacho puede acumular olores de otros alimentos.',
      open: false
    },
    {
      question: '¿Qué tiene mejor el pistacho ibérico del que viene de fuera?',
      answer: 'El pistacho nacional ofrece mayor seguridad (controles europeos más estrictos), es más sostenible (se produce localmente, con hasta un 60% en secano) y apoya a familias y empresas de nuestra tierra. Nuestro objetivo no es hacer dinero de la manera más sencilla, queremos ofrecer un producto de calidad con impacto positivo en nuestra región.',
      open: false
    },
    {
      question: 'Soy repostero/restaurante/comerciante. ¿Podemos colaborar?',
      answer: '¡Por supuesto! Queremos conocer quién usará nuestro producto y cómo podemos hacer sinergias. Disponemos de contenedores a granel para creaciones de platos o repostería, y puedes ser nuestro distribuidor si quieres vender nuestros tarritos. Escríbenos a info@cremacuadrado.com y te contestaremos lo antes posible.',
      open: false
    },
    {
      question: '¿Cuánto tardaría en llegar mi pedido?',
      answer: 'Nosotros lo enviamos en 1 día (2 en casos extremos). La empresa de transportes tiene un compromiso de 48 horas. Así que en 48-72 horas deberías recibir tu pedido.',
      open: false
    },
    {
      question: 'Mi pedido no llega. ¿Qué hago?',
      answer: 'Tu pedido debería actualizarse constantemente de forma automática, pero puede pasar que tarde más de lo normal o en los peores escenarios se pierda. Si no recibes ninguna actualización escríbenos a ayuda@cremacuadrado.com.',
      open: false
    },
    {
      question: 'En mi pedido hay un tarro roto. ¿Qué hago?',
      answer: 'No hay algo que nos entristezca más, no obstante lo embalamos lo mejor posible. Obviamente no podemos dejar un cliente sin dinero y sin tarro, así que podemos realizar una devolución del valor de la mercancía o en caso de pérdida total enviarte el pedido de nuevo gratuitamente. Reclámalo lo antes posible enviando una foto a ayuda@cremacuadrado.com.',
      open: false
    }
  ];

  toggleFaq(index: number): void {
    this.faqItems[index].open = !this.faqItems[index].open;
  }

  sendForm(): void {
    this.sending.set(true);
    // Simulate send (no real backend endpoint for contact form yet)
    setTimeout(() => {
      this.sending.set(false);
      this.sent.set(true);
    }, 900);
  }

  resetForm(): void {
    this.formData = { name: '', email: '', message: '', privacy: false, marketing: false };
    this.sent.set(false);
  }
}
