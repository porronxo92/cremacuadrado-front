import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  private async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      const s = await loadStripe(environment.stripePublishableKey);
      if (!s) throw new Error('Stripe failed to load. Check your publishable key.');
      this.stripe = s;
    }
    return this.stripe;
  }

  async initElements(clientSecret: string): Promise<void> {
    const stripe = await this.getStripe();
    this.elements = stripe.elements({ clientSecret, locale: 'es' });
  }

  mountPaymentElement(containerId: string): void {
    if (!this.elements) throw new Error('Call initElements() before mounting');
    this.paymentElement = this.elements.create('payment', {
      layout: 'tabs',
    });
    this.paymentElement.mount(containerId);
  }

  /** Recarga el importe del PaymentIntent tras cambiarlo en el backend (p. ej. envío a Baleares). */
  async refreshAmount(): Promise<void> {
    await this.elements?.fetchUpdates();
  }

  async confirmPayment(returnUrl: string): Promise<{ error?: { message: string } }> {
    const stripe = await this.getStripe();
    if (!this.elements) return { error: { message: 'El formulario de pago no está inicializado' } };

    const result = await stripe.confirmPayment({
      elements: this.elements,
      confirmParams: { return_url: returnUrl },
    });

    if (result.error) {
      return { error: { message: result.error.message ?? 'No hemos podido procesar el pago. Inténtalo de nuevo.' } };
    }
    return {};
  }

  destroy(): void {
    this.paymentElement?.destroy();
    this.paymentElement = null;
    this.elements = null;
  }
}
