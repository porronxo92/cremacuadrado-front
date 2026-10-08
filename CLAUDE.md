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
- Diálogo modal accesible: al abrir, el foco entra en el panel (botón cerrar); Tab queda atrapado dentro; Esc y el overlay lo cierran; al cerrar, el foco vuelve al elemento que lo abrió
- Cerrado: `inert` + `visibility: hidden` (fuera del orden de tabulación y del lector de pantalla)

### B2C — Ficha de producto

**`ProductPage`** — orden exacto de elementos en la columna de compra (NO cambiar):
1. Estrellas + número de reseñas (antes del título)
2. Título en Teko Bold uppercase + tagline Lora italic
3. Reproductor de audio 30s (La Trilogía del Sabor)
4. Selector de formato: 100g / 200g / 1kg
5. Precio dinámico: total + €/100g (se actualiza al cambiar formato)
6. Cantidad + CTA "Añadir al carrito" (con la suscripción desactivada se muestra directamente, sin selector "una vez / suscripción" de una sola opción)
7. Garantías: envío gratis +48€ / 48-72h / pago seguro
8. Bloque club mensual −15% — **oculto** mientras `SUBSCRIPTION_ENABLED = false` (no hay cobro recurrente)

Zona inferior (tras los CTAs):
- Tabs: El producto / Ingredientes / Nutrición / Cómo usarlo
- Tab "El producto" incluye las 3 FAQs obligatorias (aceite separado, duración, conservación)
- Reseñas verificadas (Judge.me)

**Comportamiento móvil**:
- Galería: foto full-width con swipe, puntos de navegación (punto visual de 7px dentro de una zona táctil de 24×24px). Sin thumbnails.
- Barra fija en la parte inferior al hacer scroll: nombre + formato + precio + botón "Añadir al carrito" de 48px, con `env(safe-area-inset-bottom)`.
- Tabs con scroll horizontal y patrón WAI-ARIA (flechas / Inicio / Fin, `aria-controls`, tabindex itinerante)

**`FormatSelector`**
- Props: `formats: [{label, price, pricePerGram, badge, badgeColor}]`, `onChange`
- Al seleccionar, actualiza precio dinámicamente
- Badges: "Para probar" (gris) / "Más popular" (verde) / "Mejor €/g" (amarillo) / "−15% cada mes" (granate suave para suscripción)
- Seleccionado: borde granate de 2px + check (no solo color; el verde `#A2BA1C` sobre crema no llega a 3:1). `aria-pressed`, sin `aria-label` para que se lean formato, precio y badge.

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
- Dos columnas desktop: líneas del pedido (izq) + resumen y acción (der)
- En móvil: una columna + barra fija inferior con total y botón "Ir al pago" (sustituye al botón del resumen)
- Por línea: formato visible, selector cantidad (+/−, 44px, `aria-label` con el nombre del producto) + botón eliminar (48px, `aria-label`)
- Código de descuento: plegado por defecto ("¿Tienes un código de descuento?"), **solo para clientes con cuenta**; a los invitados se les invita a iniciar sesión o registrarse
- Envío: lo calcula el backend (4,95 € península; gratis desde 48 € tras descuentos). La barra de progreso usa subtotal − descuento
- Botón "Ir al pago" → `/checkout`

**Flujo de checkout** (una página, 3 secciones):
1. `/carrito` — resumen
2. `/checkout` — 1 Contacto (enlace "¿Ya tienes cuenta? Inicia sesión"; invitado por defecto; si el email del invitado ya tiene cuenta —`POST /auth/email-status` al salir del campo— aviso para iniciar sesión, sin bloquear el pago) · 2 Dirección de envío (+ factura con NIF opcional) · 3 Pago Stripe (Payment Element)
3. Botón "Confirmar y pagar" (art. 98.2 TRLGDCU: el texto debe dejar claro que obliga a pagar)
4. Stripe redirige a `/gracias`

> Decisión de negocio: **no hay incentivo de la cuchara** al crear cuenta por ahora, y no hay paso de identificación separado (Google / crear cuenta / invitado). No añadirlos sin confirmarlo.

**Formulario del checkout** (reglas de la skill ui-ux-pro-max, ver «Reglas UX y accesibilidad»):
- El botón de pago **nunca** se desactiva por validación (solo mientras procesa). Al pulsarlo con datos pendientes: resumen de errores arriba (`role="alert"`, recibe el foco, cada error enlaza a su campo) + error en línea bajo cada campo
- Cada campo con error: `aria-invalid` + `aria-describedby` → mensaje que dice qué falta y cómo arreglarlo
- `autocomplete` en todos los campos (`email`, `given-name`, `family-name`, `shipping address-line1`, `shipping address-level2`, `shipping postal-code`, `billing …`), `inputmode="numeric"` en códigos postales
- Campos de 48px y `font-size: 1rem` (evita el zoom de iOS)
- Casilla "Necesito factura… (con NIF)"; dentro, "La dirección fiscal es la misma que la de envío" marcada por defecto
- Resumen del pedido con nombre + formato + precio unitario

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
- Sin pop-up de email/cupón (eliminado). La captación de email está solo en el bloque de newsletter de la home.

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

### Registro con incentivo — en pausa
La cuchara de regalo con el primer pedido **no está activa** (decisión de negocio). No mostrar el mensaje "Recibe una cuchara CremaCuadrado con tu primer pedido" hasta que se confirme.

---

## Comunicación con el Backend

> ⚠️ Librería de fetching por definir (fetch nativo / axios / React Query).

### Patrones conocidos

- El precio **siempre se valida en el servidor** antes de crear la sesión de Stripe. El frontend no envía precios, solo IDs de variante y cantidades.
- El coste de envío **siempre lo calcula el backend**, nunca el frontend.
- Los formularios B2B hacen POST al backend, que guarda el lead en una tabla propia y envía emails de confirmación/notificación. (Integración con un CRM externo tipo HubSpot queda como posible mejora futura, no implementada.)

### Estados de UI requeridos

Todos los formularios y botones de compra deben manejar:
- **Loading**: deshabilitar botón + indicador visual durante la petición (`aria-busy`). Es el único motivo para deshabilitar un botón de envío: nunca por validación.
- **Error**: mensaje claro al usuario que diga causa + cómo arreglarlo, anunciado con `role="alert"` / `aria-live`. Nunca exponer errores técnicos internos.
- **Errores HTTP**: el `errorInterceptor` devuelve `{ status, message }` → usar `err.message`, nunca `err.error?.detail` (siempre es `undefined` y el cliente ve un mensaje genérico).
- **Vacío**: estados de lista vacía en carrito, pedidos, etc.

---

## Convenciones de Código

### Nomenclatura de páginas y componentes

- Componentes en PascalCase: `ProductPage`, `FormatSelector`, `CollapsibleBlock`
- Hooks en camelCase con prefijo `use`: `useCart`, `useAuth`, `useFormatPrice`
- Utilidades en camelCase: `formatPrice`, `calculateShipping`, `formatDate`

### Reglas UX y accesibilidad (skill `ui-ux-pro-max`)

Reglas tomadas de la skill instalada en `.agents/skills/ui-ux-pro-max` (WCAG 2.2, Apple HIG, Material). Prioridad: 1 accesibilidad → 2 táctil → 3 rendimiento → 5 responsive → 6 tipografía/color → 7 animación → 8 formularios → 9 navegación. Las líneas rojas de marca y de UX de este documento mandan sobre la skill.

**Accesibilidad**
- Contraste de texto ≥ 4,5:1 (texto grande ≥ 3:1); bordes de controles, iconos con significado y estados seleccionados ≥ 3:1. Sobre crema `#F4F1E9`: granate 9,4:1 ✅, `#6B6456` 5,2:1 ✅, **amarillo `#E6C15A` 1,5:1 ❌ y verde `#A2BA1C` 1,9:1 ❌** → amarillo y verde solo como acento o fondo, nunca como texto ni como único indicador de estado.
- No transmitir información solo con color: añadir icono o texto (p. ej. el check del formato seleccionado).
- Foco visible: lo garantiza `styles.scss` (`:focus-visible` con `!important`); no quitarlo en componentes. Los elementos fijos (barra de compra, banner de cookies) no deben tapar el control enfocado.
- Botones solo con icono: `aria-label` que incluya el producto («Eliminar Crema Pura 200g del carrito»). Iconos decorativos con `aria-hidden="true"`; imagen junto a un texto que ya la nombra: `alt=""`.
- Contadores y cantidades que cambian: `aria-live="polite"`.
- Paneles y modales (mini-carrito, menú móvil, cookies): foco al abrir, foco atrapado, Esc cierra, foco devuelto al cerrar; cerrados con `inert`.
- Pestañas: patrón WAI-ARIA completo (flechas, `aria-controls`, `aria-labelledby`). Si no es una pestaña (p. ej. puntos de una galería), no usar `role="tab"`.
- Respetar `prefers-reduced-motion` (ya global en `styles.scss`).

**Táctil**
- Objetivo de proyecto: **48px** para botones y controles del embudo de compra en móvil (por encima de 44pt iOS / 48dp Android). Mínimo legal web WCAG 2.2 AA: 24×24px; los controles secundarios muy compactos (+/− del mini-carrito, puntos de la galería) pueden quedarse en 40–44px o en 24px con zona táctil ampliada.
- Separación ≥ 8px entre objetivos táctiles; `touch-action: manipulation` en steppers.
- Barras fijas inferiores: `padding-bottom: env(safe-area-inset-bottom)` y reservar su alto en la página.

**Formularios** (`input-labels`, `error-placement`, `error-summary`, `focus-management`, `autofill-support`)
- Etiqueta visible por campo (el placeholder nunca sustituye a la etiqueta).
- Validar al salir del campo o al enviar, no en cada pulsación.
- Error específico bajo el campo, enlazado con `aria-describedby` + `aria-invalid`.
- Al enviar con errores: resumen enfocable arriba con enlaces a cada campo; el botón de envío sigue activo.
- `autocomplete` y `type`/`inputmode` correctos en todos los campos.
- `font-size` ≥ 16px en campos (evita zoom en iOS).

**Tipografía y color**
- Texto de interfaz ≥ 12px (badges incluidos); cuerpo 16px, `line-height` 1.5–1.6.
- Usar las variables de `styles.scss` (`--color-brand`, `--color-text-light`, `--color-error`…), no hex sueltos, y nunca blanco puro de fondo.

**Uso de la skill**
- Instalación local (`.agents/` y `.claude/skills/` están en `.gitignore`): `npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max`
- Búsqueda: `python .agents/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --domain ux` (o `--stack angular`). En Windows, con `PYTHONIOENCODING=utf-8`. Las rutas `${CLAUDE_PLUGIN_ROOT}/...` del `SKILL.md` no aplican a esta instalación.
- No usar `--design-system` ni `--persist`: la identidad de marca ya está definida aquí.
- Las guías `--stack angular` están escritas para Angular 22; el proyecto usa Angular 18 (descartar las de zoneless, etc.).

**Otros**
- Imágenes con `alt` descriptivo incluyendo keyword cuando aplique (para SEO)

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
- ❌ No añadir pop-ups promocionales (el de cupón se eliminó). La única modal permitida al cargar es la de consentimiento de cookies (obligación legal, exenta de la penalización de Google), y en móvil va como hoja inferior, nunca a pantalla completa.
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
- ❌ No lanzar la web sin la modal de cookies con opción real de rechazar al mismo nivel que aceptar — obligatorio RGPD España
- ❌ No operar sin las 5 páginas legales: aviso legal, privacidad, cookies, condiciones de venta, devoluciones
