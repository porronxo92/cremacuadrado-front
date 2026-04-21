# Cremacuadrado — Frontend

Frontend de la tienda online de **Cremacuadrado**, especializada en cremas de pistacho artesanales de La Mancha. Desarrollado con **Angular 18** usando arquitectura standalone y lazy loading completo.

---

## Tecnologías

| Herramienta | Versión |
|---|---|
| Angular | 18 |
| TypeScript | 5.4 |
| RxJS | 7.8 |
| Angular CLI | 18 |
| Node.js | ≥ 18 |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth, Admin, Guest guards
│   │   ├── interceptors/    # JWT auth, credentials, error handling
│   │   ├── models/          # Interfaces y tipos del dominio
│   │   └── services/        # Auth, Producto, Carrito, Pedido, Blog, Usuario
│   ├── features/
│   │   ├── home/            # Página principal
│   │   ├── catalog/         # Listado y detalle de producto
│   │   ├── cart/            # Carrito de la compra
│   │   ├── checkout/        # Proceso de compra y confirmación
│   │   ├── auth/            # Login y registro
│   │   ├── account/         # Dashboard, pedidos, perfil, direcciones
│   │   ├── admin/           # Panel de administración (productos, pedidos)
│   │   ├── blog/            # Listado y detalle de artículos
│   │   ├── about/           # Sobre nosotros
│   │   ├── contact/         # Contacto
│   │   └── pages/           # Páginas legales e informativas
│   └── shared/
│       └── components/      # Header, Footer, Toast, Not Found
├── assets/
│   └── images/
└── environments/
    ├── environment.ts       # Desarrollo (apunta a localhost:8000)
    └── environment.prod.ts  # Producción
```

---

## Rutas principales

| Ruta | Descripción | Protegida |
|---|---|---|
| `/` | Home | — |
| `/catalog` | Catálogo de productos | — |
| `/catalog/:slug` | Detalle de producto | — |
| `/cart` | Carrito | — |
| `/checkout` | Proceso de pago | — |
| `/blog` | Blog | — |
| `/auth/login` | Inicio de sesión | Solo invitados |
| `/auth/register` | Registro | Solo invitados |
| `/account` | Área de cliente | Autenticado |
| `/admin` | Panel de administración | Admin |
| `/pages/sobre-nosotros` | Sobre nosotros | — |
| `/pages/contacto` | Contacto | — |

---

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar el servidor de desarrollo

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

> El backend debe estar corriendo en `http://localhost:8000`. Ver el repo del backend para instrucciones de arranque.

### 3. Build de producción

```bash
npm run build
```

El resultado se genera en `dist/`.

---

## Variables de entorno

Los ficheros de entorno están en `src/environments/`:

- `environment.ts` — desarrollo, apunta a `http://localhost:8000/api/v1`
- `environment.prod.ts` — producción, apunta a `/api/v1` (relativo al host)

No se suben ficheros `.env` al repositorio. Consulta `.gitignore` para más detalles.

---

## Tests

```bash
npm test
```

Ejecuta los tests unitarios con Karma + Jasmine.
Ecommerce Cremacuadrado
