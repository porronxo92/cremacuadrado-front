# CLAUDE.md — Frontend
## CremaCuadrado · Ecommerce de crema de pistacho manchego artesanal

---

## Resumen del Proyecto

CremaCuadrado es un ecommerce D2C de crema de pistacho manchego artesanal. La interfaz sirve a tres perfiles con embudos completamente distintos: consumidor final B2C (llega de TikTok/Instagram), tiendas gourmet B2B punto de venta, y restaurantes/pastelerías/cafés B2B ingrediente profesional.

**Principio rector de UX**: un solo dominio, tres embudos distintos. La homepage convierte al B2C. Los perfiles B2B tienen sus propias landings. No mezclar argumentos en la misma página.

**Prioridad de dispositivo**: móvil primero. El 70%+ del tráfico llega de redes sociales en móvil.

### Stack tecnológico

> ⚠️ Por definir — el webmaster construye el proyecto a medida usando IA (Claude). Framework exacto pendiente de confirmar.

---

## Arquitectura

### Páginas y rutas

| Ruta | Página | Propósito |
|---|---|---|
| `/` | Homepage | Credibilidad de marca, conversión B2C |
| `/tienda` | Catálogo | Listado de productos |
| `/tienda/crema-pura` | Ficha Pura | Conversión directa B2C |
| `/tienda/crema-crunchy` | Ficha Crunchy | Conversión directa B2C |
| `/carrito` | Carrito | Resumen pedido + inicio checkout |
| `/gracias` | Post-compra | Confirmación + fidelización |
| `/para-tiendas` | Landing B2B PV | Captación puntos de venta |
| `/para-restaurantes` | Landing B2B Pro | Captación ingrediente profesional |
| `/nuestro-metodo` | Método | Autoridad SEO + IAs |
| `/puntos-de-venta` | Mapa | SEO local + captación B2B |
| `/el-archivo` | Blog índice | SEO e IAs |
| `/el-archivo/[slug]` | Blog artículo | SEO e IAs (plantilla) |
| `/pistagreta` | Lista espera | Captura email pre-lanzamiento |
| `/aviso-legal` | Legal | Obligatoria España |
| `/privacidad` | Legal | RGPD |
| `/cookies` | Legal | RGPD |
| `/condiciones-venta` | Legal | Obligatoria España |
| `/devoluciones` | Legal | 14 días por ley |

### Gestión del estado

> ⚠️ Por definir. Necesidades conocidas:
- Estado del carrito (items, cantidades, totales)
- Estado de autenticación del usuario
- Formato seleccionado en ficha de producto (afecta precio dinámico)

---

## Diseño & Estilos

### Paleta de colores — usar siempre estas variables

```css
--color-bg: #F4F1E9;          /* Fondo principal — NUNCA blanco puro */
--color-granate: #7B1716;     /* H1, botones primarios, énfasis */
--color-amarillo: #E6C15A;    /* Hover, acentos, iconos, CTAs sobre oscuro */
--color-verde: #A2BA1C;       /* Línea Pura — badges, bordes activos */
--color-naranja: #F5A542;     /* Línea Crunchy */
--color-ink: #1C1A14;         /* Texto cuerpo */
--color-muted: #6B6456;       /* Textos secundarios */
--color-card-bg: #EDE9DF;     /* Fondo de tarjetas */
--color-border: rgba(28,26,20,0.1); /* Bordes estándar */
```

### Tipografía — Google Fonts

| Fuente | Uso | Notas críticas |
|---|---|---|
| **Teko Bold** | H1 y H2 MUY cortos (2-4 palabras) | `text-transform: uppercase` + `letter-spacing: -0.02em`. NUNCA para frases largas. |
| **Lora** | H3, subtítulos, cuerpo, citas | Regular (400) e Italic. `line-height: 1.6` |
| **Poppins** | Nav, botones, precios, formularios, UI | Weights: 300 / 500 / 600 |

### Botones

```css
/* Primario */
background: #F4F1E9;
color: #7B1716;
border: 1.5px solid #7B1716;
border-radius: 20px;
font-family: 'Poppins', sans-serif;
font-weight: 600;

/* Hover primario */
background: #7B1716;
color: #F4F1E9;

/* CTA sobre fondo oscuro (hero granate) */
background: #E6C15A;
color: #1C1A14;
border-radius: 20px;
```

> ⚠️ El border-radius de 2px se reserva para contenedores y tarjetas, no para botones. Los botones usan 20px (redondeados).

### Breakpoints

> ⚠️ Por definir. Prioridad: mobile-first.

### Espaciado

- Uso generoso de espacio en blanco. La web debe "respirar".
- Estilo visual: galería de arte / revista de alta cocina. Nunca saturación de elementos.

---

## Componentes Clave

### Global

**`AnnouncementBar`**
- Franja de 32px sobre el header
- Fondo `#7B1716`, texto crema
- Rota entre 3 mensajes cada 4 segundos
- En móvil: mensaje fijo sin rotación

**`Header`**
- Sticky con reducción de altura al hacer scroll (56px → 44px, transición CSS)
- Logo + tagline "pistacho manchego artesanal" (tagline desaparece en móvil)
- Navegación con 2 dropdowns: LA TIENDA y PROFESIONALES
- Mini-carrito lateral (slide-in desde la derecha) al hacer clic en icono carrito
- En móvil: hamburguesa → overlay full-screen en fondo granate con botón "Comprar ahora" fijo al fondo

**`MiniCart`**
- Slide-in desde la derecha
- No redirige a /carrito — muestra resumen con botón "Tramitar pedido"

### B2C — Ficha de producto

**`ProductPage`** — orden exacto de elementos en la columna de compra (NO cambiar):
1. Estrellas + número de reseñas (antes del título)
2. Título en Teko Bold uppercase + tagline Lora italic
3. Reproductor de audio 30s (La Trilogía del Sabor)
4. Selector de formato: 100g / 200g / 1kg / Suscripción mensual
5. Precio dinámico: total + €/100g (se actualiza al cambiar formato)
6. CTA "Añadir al carrito"
7. Garantías: envío gratis +48€ / 48-72h / pago seguro
8. Bloque club mensual −15%

Zona inferior (tras los CTAs):
- Tabs: El producto / Ingredientes / Nutrición / Cómo usarlo
- Tab "El producto" incluye las 3 FAQs obligatorias (aceite separado, duración, conservación)
- Reseñas verificadas (Judge.me)

**Comportamiento móvil**:
- Galería: foto full-width con swipe, puntos de navegación. Sin thumbnails.
- Barra fija en la parte inferior al hacer scroll: nombre + formato + precio + botón "Añadir al carrito". Mínimo 48px de alto.
- Tabs con scroll horizontal

**`FormatSelector`**
- Props: `formats: [{label, price, pricePerGram, badge, badgeColor}]`, `onChange`
- Al seleccionar, actualiza precio dinámicamente
- Badges: "Para probar" (gris) / "Más popular" (verde) / "Mejor €/g" (amarillo) / "−15% cada mes" (granate suave para suscripción)

**`AudioPlayer`**
- Reproductor compacto en píldora redondeada, fondo `#EDE9DF`
- Icono play + título "Cómo obtenemos la crema" + subtítulo "Tostado · Repelado · Molino de piedra" + barra de progreso + duración
- Recibe archivo mp3 vía prop o URL

**`PriceDisplay`**
- Props: `price` (en céntimos), `format` (100g/200g/1kg)
- Muestra precio total en Teko Bold granate + precio por 100g en Poppins Light gris
- Calcula €/100g automáticamente

### Carrito y checkout

**`CartPage`** (`/carrito`)
- Dos columnas desktop: resumen del pedido (izq) + acción (der)
- En móvil: una columna + botón "Ir al pago" fijo en la parte inferior
- Selector cantidad (+/−) + botón eliminar por línea
- Campo código de descuento: oculto por defecto, desplegable al hacer clic
- Envío calculado dinámicamente: 6€ península / 8,50€ Baleares / Gratis si subtotal ≥ 48€
- Botón "Ir al pago" → inicia el flujo de identificación

**Flujo de checkout** (4 pasos):
1. `/carrito` — resumen
2. Identificación — 3 opciones: Google OAuth / Crear cuenta (incentivo cuchara) / Invitado
3. Datos de envío — con checkbox "datos de facturación iguales" (marcado por defecto)
4. Pago — Stripe. Botón "Confirmar pedido"
5. Stripe redirige a `/gracias`

**`CheckoutIdentification`**
- Opción Google: botón OAuth (un clic, datos autorellenados)
- Opción Crear cuenta: email + contraseña + mensaje incentivo "Recibe una cuchara CremaCuadrado con tu primer pedido"
- Opción Invitado: solo email

**`ShippingForm`**
- Campos: nombre, apellidos, dirección, provincia, código postal, teléfono
- Checkbox "Los datos de facturación son los mismos" — marcado por defecto
- Si desmarca: aparecen campos de facturación con NIF/CIF

### Homepage

**`HomePage`** — 5 bloques en orden exacto:
1. Hero (vídeo loop + H1 + reseña + CTAs) + Trilogía del Sabor debajo
2. Los dos productos (Pura y Crunchy)
3. Reseñas (4 en grid 2×2)
4. Bloque B2B (dos opciones sobre fondo oscuro)
5. Captura de email

**`HeroBlock`**
- Vídeo de fondo: dos personas untando crema en tostadas. Sin audio, loop.
- El bloque debe aceptar tanto imagen como vídeo (clase intercambiable en CSS)
- Pop-up de email: NO al cargar. Activa al segundo scroll o 30 segundos. En móvil: banner deslizante inferior, NUNCA modal full-screen.

**`TrilogiaBlock`**
- Inmediatamente debajo del hero, fondo crema, fuera del vídeo
- Título: "La trilogía del sabor" + subtítulo Lora italic: "Método desarrollado a base de prueba y error"
- 3 columnas: Tostado / Repelado / Molino de piedra — cada uno con icono + nombre + frase específica

### Landings B2B

**`CollapsibleBlock`**
- Comportamiento compartido para /para-tiendas y /para-restaurantes
- Toggle de clases `open/closed` con JS simple
- Chevron rota 180° con transición CSS al cerrar
- Por defecto: todos abiertos
- El formulario final no es colapsable — siempre visible

**`B2BLeadForm`**
- Props: `type` (punto_de_venta | profesional)
- Botón del hero hace scroll suave al formulario (anchor link)
- Al enviar: POST al backend correspondiente → se guarda el lead en tabla propia (BBDD) → email de confirmación automático al solicitante + notificación interna a b2b@cremacuadrado.com

### Blog

**`BlogIndex`** (`/el-archivo`)
- Artículo destacado full-width (foto 60% + contenido 40%)
- Grid de 3 columnas debajo
- Filtros de categoría en pills: Todas / Recetas / Pistacho en el campo / El obrador
- Filtrado sin recargar la página
- Bloque newsletter fondo granate al final (lista separada "Suscriptores blog")

**`BlogPost`** (`/el-archivo/[slug]`)
- Estructura obligatoria para SEO: H1 con keyword + introducción en Lora italic con borde izquierdo amarillo + H2/H3 + CTA intermedio + CTA final + artículos relacionados
- CTA intermedio: bloque granate suave con "¿Te apetece probarla? Ver los productos →"

### Post-compra

**`ThankYouPage`** (`/gracias`)
- 3 bloques en orden:
  1. Hero confirmación (fondo granate, check en amarillo, 3 píldoras informativas)
  2. Resumen del pedido + Carta de Lucas y Stefano con variable dinámica [ciudad de destino] + Aviso email reseña
  3. Propuesta club mensual con botón "Ahora no" obligatorio

### Nuestro Método

**`NuestroMetodo`** (`/nuestro-metodo`)
- Hero oscuro + bloque origen (pistacho español, obrador en Ciudad Real)
- 3 pasos visuales: número Teko Bold amarillo + icono en círculo + título + frase qué hacemos + resultado
- Frase destacada del paso 02 en bloque granate suave
- Bloque FAQ del aceite en fondo #EDE9DF
- CTA final granate

### Puntos de Venta

**`PuntosDeVentaPage`** (`/puntos-de-venta`)
- Mapa Google Maps embed con marcadores en color granate
- Lista de texto bajo el mapa (obligatoria para SEO — el mapa no es indexable)
- CTA "Comprar online" si no hay tienda cercana
- Formulario de captación fondo granate: nombre + email + teléfono

---

## Flujos de Usuario Principales

### B2C — Compra desde redes sociales
1. TikTok/Instagram → enlace → **ficha de producto** (aterrizaje directo)
2. Selecciona formato → precio se actualiza
3. "Añadir al carrito" → mini-carrito lateral
4. "Tramitar pedido" → /carrito
5. Identificación (Google / cuenta / invitado)
6. Datos de envío
7. Stripe → pago
8. /gracias → email de confirmación inmediato

### B2C — Discovery desde homepage
1. Homepage → Trilogía del Sabor → productos → "Añadir al carrito"
2. Resto del flujo igual

### B2B — Punto de venta
1. Menú PROFESIONALES → Para tiendas gourmet → /para-tiendas
2. Lee bloques colapsables
3. Rellena formulario → "Conocer precios de venta"
4. Backend → guarda lead en tabla propia (BBDD) → email confirmación + notificación interna a b2b@cremacuadrado.com
5. Lucas/Stefano llaman en 48h

### B2B — Ingrediente profesional
1. Menú PROFESIONALES → Para restaurantes y obradores → /para-restaurantes
2. Lee bloques colapsables
3. Rellena formulario → "Conocer precios profesionales"
4. Backend → guarda lead en tabla propia (BBDD) → email confirmación + notificación interna a b2b@cremacuadrado.com con tipo de negocio
5. Lucas/Stefano llaman en 48h

### Registro con incentivo
1. En el checkout, opción "Crear cuenta"
2. Mensaje visible: "Recibe una cuchara CremaCuadrado con tu primer pedido"
3. Al completar el pedido: `has_received_spoon = true`, cuchara incluida en el envío

---

## Comunicación con el Backend

> ⚠️ Librería de fetching por definir (fetch nativo / axios / React Query).

### Patrones conocidos

- El precio **siempre se valida en el servidor** antes de crear la sesión de Stripe. El frontend no envía precios, solo IDs de variante y cantidades.
- El coste de envío **siempre lo calcula el backend**, nunca el frontend.
- Los formularios B2B hacen POST al backend, que guarda el lead en una tabla propia y envía emails de confirmación/notificación. (Integración con un CRM externo tipo HubSpot queda como posible mejora futura, no implementada.)

### Estados de UI requeridos

Todos los formularios y botones de compra deben manejar:
- **Loading**: deshabilitar botón + indicador visual durante la petición
- **Error**: mensaje claro al usuario. Nunca exponer errores técnicos internos.
- **Vacío**: estados de lista vacía en carrito, pedidos, etc.

---

## Convenciones de Código

### Nomenclatura de páginas y componentes

- Componentes en PascalCase: `ProductPage`, `FormatSelector`, `CollapsibleBlock`
- Hooks en camelCase con prefijo `use`: `useCart`, `useAuth`, `useFormatPrice`
- Utilidades en camelCase: `formatPrice`, `calculateShipping`, `formatDate`

### Accesibilidad

- Todos los botones tienen texto descriptivo o `aria-label`
- Imágenes con `alt` descriptivo incluyendo keyword cuando aplique (para SEO)
- Mínimo 48px de altura en elementos táctiles en móvil (estándar de accesibilidad)
- El mini-carrito y el menú móvil son accesibles con teclado (foco atrapado mientras están abiertos)

### Imágenes y rendimiento

- Formato WebP obligatorio
- Máximo 200KB por imagen en homepage
- Los vídeos de fondo en hero: mp4, máximo 8MB, mínimo 1080p, sin audio, loop
- Carga lazy para imágenes below the fold y para vídeos en los pasos del proceso
- Core Web Vitals: LCP < 2,5 segundos

### SEO técnico

- H1 único por página con keyword principal
- Meta description única por página (máximo 155 caracteres)
- Schema markup en ficha de producto (`Product`), blog (`Article`), FAQ (`FAQPage`)
- ALT text descriptivo con keyword en todas las imágenes de producto y proceso
- Lista de texto bajo el mapa de /puntos-de-venta (el mapa embed no es indexable)

---

## Comandos Esenciales

> ⚠️ Por definir según stack elegido.

---

## Lo que NUNCA se debe hacer

### Identidad de marca y textos
- ❌ No usar "hecha a mano" — se usa maquinaria (molino eléctrico, repeladora mecánica)
- ❌ No usar "pistacho manchego certificado" — el origen es principalmente manchego pero no está certificado
- ❌ No usar "artesanal" para la cuchara — es una cuchara con el logo, no un producto artesanal
- ❌ No usar "consistencia lote a lote" — es artesanal, hay variaciones naturales entre lotes
- ❌ No usar "la única" o "la primera" sin certeza absoluta — claim legal, riesgo de reclamación
- ❌ No usar "ibérico" para el pistacho — usar "español" o "manchego"

### UX y conversión
- ❌ No mostrar pop-up de email al cargar la página. Activa al segundo scroll o 30 segundos.
- ❌ No usar modal full-screen en móvil para el pop-up de email — Google penaliza los intersticiales intrusivos en móvil
- ❌ No cambiar el orden de los 8 elementos de la zona de compra en la ficha de producto — está optimizado para conversión
- ❌ No añadir upsells ni productos relacionados en /carrito — debe ser completamente limpio
- ❌ No mezclar argumentos B2C y B2B en la misma página. La homepage es para B2C; B2B tiene sus landings.
- ❌ No mostrar el botón "Ahora no" opcional en la propuesta del club mensual en /gracias — es obligatorio para que no parezca una trampa
- ❌ No redirigir al usuario a /carrito al hacer clic en "Añadir al carrito" — debe abrir el mini-carrito lateral sin interrumpir la navegación
- ❌ No poner Pistagreta junto a los productos comprables en el catálogo o en la homepage — tiene su propio bloque de teaser separado
- ❌ No mostrar precios mayoristas B2B en páginas públicas — solo se comunican por teléfono
- ❌ No mencionar "devolución 14 días" en el carrito — siembra dudas en el momento de compra. Va en las páginas legales.

### Teko Bold — uso restringido
- ❌ No usar Teko Bold para frases largas. Solo para 2-4 palabras de impacto: "PURA 100%", "CRUNCHY", precios grandes, números grandes.
- ✅ Correcto: títulos de producto, precio en Teko Bold, números de pasos (01, 02, 03), "−15%"
- ❌ Incorrecto: "Dale a tu cliente algo que no encuentra en ningún supermercado" en Teko Bold

### Performance
- ❌ No cargar vídeos de proceso hasta que el usuario llegue a ese bloque (lazy loading)
- ❌ No usar imágenes PNG o JPG donde WebP es posible
- ❌ No poner imágenes de más de 200KB en la homepage

### Legal
- ❌ No lanzar la web sin el banner de cookies con opción real de rechazar — obligatorio RGPD España
- ❌ No operar sin las 5 páginas legales: aviso legal, privacidad, cookies, condiciones de venta, devoluciones
