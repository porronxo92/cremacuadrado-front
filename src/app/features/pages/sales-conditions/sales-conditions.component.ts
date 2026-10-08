import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { COMPANY, TERMS_VERSION } from '../../../core/legal';
import { LegalLayoutComponent, LegalTocItem } from '../../../shared/components/legal-layout/legal-layout.component';

/**
 * Condiciones generales de venta (TRLGDCU arts. 60, 97 y ss.; LSSI art. 27).
 * ⚠️ Texto base redactado técnicamente: debe revisarlo el asesor legal del cliente.
 * Si cambia, sube TERMS_VERSION aquí (core/legal.ts) y en el backend (config.TERMS_VERSION).
 */
@Component({
  selector: 'app-sales-conditions',
  standalone: true,
  imports: [RouterModule, LegalLayoutComponent],
  template: `
    <app-legal-layout title="Condiciones generales de venta" [version]="version" updated="octubre de 2026" [toc]="toc">
      <section id="vendedor">
        <h2>1. Quién vende</h2>
        <p>Las compras en <strong>cremacuadrado.com</strong> se realizan a {{ company.name }}, NIF {{ company.nif }},
          con domicilio en {{ company.address }}, inscrita en el {{ company.registry }}.
          Contacto: <a href="mailto:{{ company.email }}">{{ company.email }}</a> · teléfono {{ company.phone }}.</p>
        <p>Estas condiciones se aplican a las compras de consumidores y usuarios a través de la tienda online.
          Están disponibles en español, que es el idioma del contrato.</p>
      </section>

      <section id="productos">
        <h2>2. Productos</h2>
        <p>Vendemos crema de pistacho manchego artesanal en distintos formatos. En la ficha de cada producto
          encontrarás sus características esenciales: ingredientes, <strong>alérgenos</strong> (contiene frutos
          de cáscara: pistacho), información nutricional, cantidad neta, modo de conservación y precio.</p>
        <p>Las imágenes son orientativas. Al tratarse de un producto artesanal puede haber ligeras diferencias
          de color o textura entre lotes, que no afectan a su calidad.</p>
      </section>

      <section id="precios">
        <h2>3. Precios y gastos de envío</h2>
        <p>Los precios se muestran en euros e <strong>incluyen el IVA</strong>. Antes de pagar verás desglosado el
          precio de los productos, los gastos de envío y el importe total.</p>
        <ul>
          <li>Envío a España peninsular: 4,95 €. <strong>Gratis</strong> para pedidos de 48 € o más (tras descuentos).</li>
          <li>De momento no enviamos a Baleares, Canarias, Ceuta, Melilla ni al extranjero. Para estos destinos
            escríbenos a <a href="mailto:{{ company.email }}">{{ company.email }}</a>.</li>
        </ul>
        <p>Cuando anunciemos una rebaja indicaremos el precio más bajo aplicado en los 30 días anteriores.</p>
      </section>

      <section id="compra">
        <h2>4. Cómo se realiza la compra</h2>
        <ol>
          <li>Añade los productos al carrito y pulsa «Tramitar pedido».</li>
          <li>Indica tus datos de contacto y la dirección de envío (puedes comprar como invitado o con tu cuenta).
            Si necesitas factura con NIF, marca la casilla correspondiente.</li>
          <li>Revisa el resumen: productos, gastos de envío y total con IVA. Puedes corregir cualquier dato antes de pagar.</li>
          <li>Acepta estas condiciones y pulsa <strong>«Confirmar y pagar»</strong>. En ese momento se
            perfecciona el contrato.</li>
          <li>Te enviaremos por email la confirmación del pedido con su resumen, estas condiciones y la factura.</li>
        </ol>
        <p>Guardamos el documento electrónico del pedido. Puedes consultarlo en «Mi cuenta → Mis pedidos» o
          solicitárnoslo por email.</p>
      </section>

      <section id="pago">
        <h2>5. Pago</h2>
        <p>Aceptamos tarjeta de crédito o débito y otros medios ofrecidos por nuestra pasarela de pago, Stripe.
          El pago se procesa en un formulario seguro de Stripe con autenticación reforzada (3-D Secure):
          CremaCuadrado no ve ni guarda los datos de tu tarjeta.</p>
      </section>

      <section id="entrega">
        <h2>6. Entrega</h2>
        <p>Preparamos el pedido en 1 día hábil y lo entregamos mediante Correos en 48–72 horas desde la confirmación
          del pago. En cualquier caso, el plazo máximo de entrega es de 30 días naturales. Si no pudiéramos
          cumplirlo te avisaremos y podrás cancelar el pedido con reembolso completo.</p>
        <p>Recibirás el número de seguimiento por email. Revisa el paquete al recibirlo y avísanos en un plazo
          razonable si llega dañado (envía una foto a <a href="mailto:{{ company.email }}">{{ company.email }}</a>):
          te lo reponemos o reembolsamos sin coste.</p>
      </section>

      <section id="desistimiento">
        <h2>7. Derecho de desistimiento (14 días)</h2>
        <p>Puedes desistir de la compra <strong>sin indicar el motivo</strong> en un plazo de 14 días naturales desde
          que recibes el pedido (o el último producto, si llega en varios envíos).</p>
        <p><strong>Excepción:</strong> al tratarse de alimentos, no cabe el desistimiento de los tarros que hayan sido
          <strong>abiertos o desprecintados</strong> tras la entrega, por razones de protección de la salud y de higiene
          (art. 103.e del TRLGDCU).</p>
        <h3>Cómo ejercerlo</h3>
        <ul>
          <li>Con el <a routerLink="/desistimiento">formulario de desistimiento online</a> (botón «Desistir del contrato»), o</li>
          <li>enviándonos una declaración clara por email a <a href="mailto:{{ company.email }}">{{ company.email }}</a>
            o por correo postal. Puedes usar el <a routerLink="/desistimiento" fragment="modelo">modelo de formulario</a>, aunque no es obligatorio.</li>
        </ul>
        <h3>Consecuencias</h3>
        <p>Te devolveremos todos los pagos recibidos, <strong>incluidos los gastos de envío ordinarios</strong>, en un
          plazo máximo de 14 días naturales desde que nos comuniques tu decisión, por el mismo medio de pago que
          usaste. Podemos retener el reembolso hasta recibir los productos o hasta que acredites su envío.</p>
        <p>Debes devolver los productos en los 14 días siguientes a la comunicación. <strong>Los gastos directos de
          devolución corren a tu cargo</strong>, salvo que el producto sea defectuoso o no corresponda con el pedido.</p>
      </section>

      <section id="garantia">
        <h2>8. Garantía y conformidad</h2>
        <p>Respondemos de la falta de conformidad de los productos conforme al TRLGDCU. Si un producto llega
          defectuoso, en mal estado o no corresponde con tu pedido, te lo reponemos o reembolsamos sin coste.
          Consulta siempre la fecha de consumo preferente indicada en el envase.</p>
      </section>

      <section id="reclamaciones">
        <h2>9. Atención al cliente y reclamaciones</h2>
        <p>Puedes contactarnos en <a href="mailto:{{ company.email }}">{{ company.email }}</a> o en el {{ company.phone }}.
          Respondemos en el menor plazo posible y, en todo caso, en un máximo de un mes. Tenemos hojas de
          reclamaciones a tu disposición: solicítalas por email.</p>
        <p>No estamos adheridos a ningún sistema de resolución alternativa de litigios, aunque puedes acudir a las
          Juntas Arbitrales de Consumo o a la oficina de consumo de tu localidad.</p>
      </section>

      <section id="ley">
        <h2>10. Ley aplicable y jurisdicción</h2>
        <p>Estas condiciones se rigen por la legislación española. Si eres consumidor, podrás reclamar ante los
          juzgados de tu domicilio.</p>
        <p>Versión {{ version }}. Las condiciones aplicables a cada pedido son las vigentes en el momento de realizarlo
          y quedan registradas con él.</p>
      </section>
    </app-legal-layout>
  `,
})
export class SalesConditionsComponent {
  private seo = inject(SeoService);
  readonly company = COMPANY;
  readonly version = TERMS_VERSION;
  readonly toc: LegalTocItem[] = [
    { id: 'vendedor', label: 'Quién vende' },
    { id: 'productos', label: 'Productos' },
    { id: 'precios', label: 'Precios y envío' },
    { id: 'compra', label: 'Proceso de compra' },
    { id: 'pago', label: 'Pago' },
    { id: 'entrega', label: 'Entrega' },
    { id: 'desistimiento', label: 'Desistimiento' },
    { id: 'garantia', label: 'Garantía' },
    { id: 'reclamaciones', label: 'Reclamaciones' },
    { id: 'ley', label: 'Ley aplicable' },
  ];

  constructor() {
    this.seo.set({
      title: 'Condiciones generales de venta',
      description: 'Condiciones de compra en CremaCuadrado: precios con IVA, envíos, pago seguro, desistimiento en 14 días y garantía.',
      path: '/condiciones-venta',
    });
  }
}
