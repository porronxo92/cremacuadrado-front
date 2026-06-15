# CremaCuadrado - Frontend

> Tienda online de crema de pistacho manchego artesanal. SPA Angular 18 + API REST (Python/FastAPI en Vercel).

---

## 🚀 Stack Tecnológico

### Frontend (este repositorio)
- **Angular 18** — SPA con standalone components, lazy loading, Angular Signals
- **TypeScript 5.4** — tipado estricto en todo el proyecto
- **SCSS** — estilos globales en `src/styles.scss`
- **Angular Router** — con `withViewTransitions`, `withInMemoryScrolling`, `PreloadAllModules`
- **HttpClient** — con interceptores: `credentials`, `auth` (JWT), `error`
- **Deploy**: Vercel (`vercel.json` con SPA rewrite `/* → index.html`)

### Backend (repositorio separado)
- **Python / FastAPI** desplegado en `https://cremacuadrado-back.vercel.app/api/v1`
- **API REST** — gestión de productos, carrito, pedidos, usuarios, blog, cupones
- El frontend no conoce lógica de precios ni de envío; todo se calcula en el backend

### Autenticación
- JWT almacenado en `localStorage` bajo las claves `cc_access_token`, `cc_refresh_token`, `cc_user`
- `AuthService` usa Angular Signals (`signal`, `computed`)
- Guards: `authGuard` (rutas privadas), `adminGuard` (panel admin), `guestGuard` (auth)

---

## 🔧 Comandos Esenciales

```bash
# Desarrollo local (API en localhost:8000)
npm start           # ng serve → http://localhost:4200

# Build
npm run build       # development
npm run build:prod  # production → dist/cremacuadrado/browser/

# Tests
npm test
```

### Variables de entorno

| Archivo | `apiUrl` | Uso |
|---|---|---|
| `environment.ts` | `http://localhost:8000/api/v1` | Desarrollo |
| `environment.prod.ts` | `https://cremacuadrado-back.vercel.app/api/v1` | Producción |

---

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── app.component.ts          # Root component
│   ├── app.config.ts             # Bootstrap: router, httpClient, interceptors
│   ├── app.routes.ts             # Rutas lazy-loaded
│   ├── core/
│   │   ├── guards/               # authGuard, adminGuard, guestGuard
│   │   ├── interceptors/         # credentials, auth (JWT), error
│   │   ├── models/index.ts       # Interfaces TypeScript (Product, Cart, Order, User…)
│   │   ├── services/             # auth, blog, cart, mini-cart, order, product, toast, user
│   │   └── utils/format-price.ts
│   ├── features/
│   │   ├── home/                 # Homepage (HeroBlock, TrilogiaBlock)
│   │   ├── catalog/              # product-list, product-detail (AudioPlayer, FormatSelector, PriceDisplay)
│   │   ├── cart/                 # Carrito
│   │   ├── checkout/             # Checkout + checkout-success (/gracias)
│   │   ├── auth/                 # login, register
│   │   ├── account/              # dashboard, orders, profile, addresses (protegido)
│   │   ├── admin/                # dashboard, orders, products (rol admin)
│   │   ├── blog/                 # blog-list (/el-archivo), blog-detail
│   │   ├── about/                # /nuestro-metodo
│   │   ├── contact/              # /contacto
│   │   └── pages/                # privacidad, cookies, condiciones-venta, devoluciones, puntos-de-venta
│   └── shared/
│       └── components/           # announcement-bar, header, footer, mini-cart, toast, not-found
├── assets/
│   ├── images/                   # blog/, nosotros/
│   └── videos/
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## 🗺️ Rutas

| Ruta | Componente | Guard |
|---|---|---|
| `/` | `HomeComponent` | — |
| `/tienda` | `ProductListComponent` | — |
| `/tienda/:slug` | `ProductDetailComponent` | — |
| `/carrito` | `CartComponent` | — |
| `/checkout` | `CheckoutComponent` | — |
| `/gracias` | `CheckoutSuccessComponent` | — |
| `/el-archivo` | `BlogListComponent` | — |
| `/el-archivo/:slug` | `BlogDetailComponent` | — |
| `/nuestro-metodo` | `AboutComponent` | — |
| `/contacto` | `ContactComponent` | — |
| `/puntos-de-venta` | `PuntosDeVentaComponent` | — |
| `/privacidad` | `PrivacyPageComponent` | — |
| `/condiciones-venta` | `ConditionsPageComponent` | — |
| `/cookies` | `CookiesPageComponent` | — |
| `/devoluciones` | `ShippingPageComponent` | — |
| `/auth/login` | `LoginComponent` | `guestGuard` |
| `/auth/register` | `RegisterComponent` | `guestGuard` |
| `/account` | `AccountLayoutComponent` + hijos | `authGuard` |
| `/account/orders` | `AccountOrdersComponent` | `authGuard` |
| `/account/profile` | `AccountProfileComponent` | `authGuard` |
| `/account/addresses` | `AccountAddressesComponent` | `authGuard` |
| `/admin` | `AdminLayoutComponent` + hijos | `adminGuard` |
| `/admin/orders` | `AdminOrdersComponent` | `adminGuard` |
| `/admin/products` | `AdminProductsComponent` | `adminGuard` |
| `/**` | `NotFoundComponent` | — |

Hay redirects de compatibilidad para rutas antiguas en inglés (`/catalog`, `/cart`, `/blog`…).

---

## 📦 Modelos de Datos Principales

Definidos en `src/app/core/models/index.ts`:

- **`Product`** — id, slug, name, price, compare_price, stock, images (solo `variant_id=NULL`), audio_url, nutrition, reviews, variants
- **`ProductVariant`** — id, format (100g/200g/1kg), price, stock, is_in_stock, is_low_stock, **`images?: ProductImage[]`** (imágenes específicas de esa variante para el carrusel)
- **`ProductImage`** — id, url, alt_text, sort_order, is_primary
- **`ProductListItem`** — versión resumida para listados
- **`Cart`** — items, subtotal, coupon, discount, shipping_cost, total
- **`CartItem`** — product_id, quantity, price_at_add, total
- **`Order`** — order_number, status, items, shipping_address, billing_address, totales
- **`User`** — email, first_name, last_name, role (`customer` | `admin`)
- **`Address`** — street, city, province, postal_code, country
- **`Review`** — rating, comment, is_verified_purchase

---

## 🎨 Identidad de Marca

### Paleta de Colores (variables CSS globales)

```css
--color-bg: #F4F1E9;          /* Fondo principal — NUNCA blanco puro */
--color-granate: #7B1716;     /* H1, botones primarios, énfasis */
--color-amarillo: #E6C15A;    /* Hover, acentos, CTAs sobre oscuro */
--color-verde: #A2BA1C;       /* Línea Pura */
--color-naranja: #F5A542;     /* Línea Crunchy */
--color-ink: #1C1A14;         /* Texto cuerpo */
--color-muted: #6B6456;       /* Textos secundarios */
--color-card-bg: #EDE9DF;     /* Fondo de tarjetas */
--color-border: rgba(28,26,20,0.1);
```

### Tipografías (Google Fonts)

| Fuente | Uso |
|---|---|
| **Teko Bold** | H1/H2 muy cortos (2-4 palabras), `uppercase`. NUNCA para frases largas. |
| **Lora** | H3, subtítulos, cuerpo, citas. `line-height: 1.6` |
| **Poppins** | Nav, botones, precios, formularios, UI |

### Botones

```css
/* Primario */
background: #F4F1E9; color: #7B1716;
border: 1.5px solid #7B1716; border-radius: 20px;
font-family: 'Poppins'; font-weight: 600;

/* Hover */
background: #7B1716; color: #F4F1E9;

/* CTA sobre fondo oscuro */
background: #E6C15A; color: #1C1A14; border-radius: 20px;
```

---

## 🛍️ Galería de imágenes de producto (ficha de detalle)

El componente `product-detail.component.ts` usa un computed `currentImages` que reacciona al formato/variante seleccionado:

```typescript
readonly currentImages = computed<ProductImage[]>(() => {
  const variant = this.selectedVariant();
  const p = this.product();
  if (!p) return [];
  const variantImgs = variant?.images ?? [];
  return variantImgs.length > 0 ? variantImgs : (p.images ?? []);
});
```

- Si la variante tiene imágenes propias → se muestran esas en el carrusel
- Si no → fallback a las imágenes del producto (las de `variant_id=NULL`)
- Al cambiar formato (`onFormatChange`) se resetea `selectedImage` y el scroll del carrusel vuelve al inicio

---

## 🛠️ Panel Admin de Productos (`/admin/products`)

**Componente**: `features/admin/products/products.component.ts`

### Funcionalidades

1. **Tabla de productos** — thumbnail, nombre, precio, stock, categoría, estado, acciones
2. **Variantes expandibles** — botón en cada fila despliega tabla de variantes (inline)
3. **Modal editar variante** — campos: precio, precio anterior, stock, SKU, activo
   - Muestra thumbnail de la imagen actual de la variante
   - Botón "Cambiar imagen" abre file picker → sube inmediatamente a `/admin/upload-image` con `dest_path = "products/{productName}/{formatFolder}"`
   - El formato se mapea a carpeta: `100g`→`100gr`, `200g`→`200gr`, `1kg`→`1000gr`
   - La URL subida se envía en el campo `image_url` al guardar la variante
4. **Modal editar/crear producto** — grid visual de imágenes:
   - Tiles 72×72 con thumbnail + botón × para eliminar
   - Botón "Añadir imagen" → file picker → sube y añade al array
   - El array de URLs se envía al backend como `images[]`

### Signals clave
```typescript
variantImagePreview = signal<string | null>(null);  // URL recién subida
variantUploadingImage = signal(false);
productImageUrls = signal<string[]>([]);             // URLs de imágenes del producto
productUploadingImage = signal(false);
```

---

## 🐛 Troubleshooting

### CORS en desarrollo
El interceptor `credentialsInterceptor` añade `withCredentials: true`. Si el backend local falla por CORS, verificar que `localhost:8000` tiene los headers correctos.

### JWT expirado
El interceptor `authInterceptor` adjunta el `Bearer` token en cada request. Si la sesión expira, `AuthService` limpia localStorage y redirige a `/auth/login`.

### Error 404 en Vercel
`vercel.json` tiene el rewrite `/* → index.html` para que el router de Angular funcione correctamente en producción.

### Imágenes de variante no aparecen en el carrusel
- Verificar en BBDD que `product_images.variant_id` apunta al ID correcto de la variante
- Verificar que el archivo existe en `backend/static/images/products/{nombre}/{carpeta}/`
- La API devuelve `variants[].images[]` — revisar con `GET /api/v1/products/{slug}` en `/docs`

---

**Última actualización**: Junio 2026 — Estado: En desarrollo activo
