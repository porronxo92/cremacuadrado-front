import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Home
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },

  // Nuestro Método
  {
    path: 'nuestro-metodo',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },

  // Contact
  {
    path: 'contacto',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
  },

  // Legal pages
  {
    path: 'privacidad',
    loadComponent: () => import('./features/pages/privacy/privacy.component').then(m => m.PrivacyPageComponent),
  },
  {
    path: 'condiciones-venta',
    loadComponent: () => import('./features/pages/conditions/conditions.component').then(m => m.ConditionsPageComponent),
  },
  {
    path: 'cookies',
    loadComponent: () => import('./features/pages/cookies/cookies.component').then(m => m.CookiesPageComponent),
  },
  {
    path: 'devoluciones',
    loadComponent: () => import('./features/pages/shipping/shipping.component').then(m => m.ShippingPageComponent),
  },
  {
    path: 'puntos-de-venta',
    loadComponent: () => import('./features/pages/puntos-de-venta/puntos-de-venta.component').then(m => m.PuntosDeVentaComponent),
  },
  {
    path: 'para-tiendas',
    loadComponent: () => import('./features/pages/para-tiendas/para-tiendas.component').then(m => m.ParaTiendasComponent),
  },

  // Blog
  {
    path: 'el-archivo',
    loadComponent: () => import('./features/blog/blog-list/blog-list.component').then(m => m.BlogListComponent),
  },
  {
    path: 'el-archivo/categoria/:categorySlug',
    loadComponent: () => import('./features/blog/blog-list/blog-list.component').then(m => m.BlogListComponent),
  },
  {
    path: 'el-archivo/:slug',
    loadComponent: () => import('./features/blog/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent),
  },

  // Tienda (catálogo)
  {
    path: 'tienda',
    loadComponent: () => import('./features/catalog/product-list/product-list.component').then(m => m.ProductListComponent),
  },
  {
    path: 'tienda/:slug',
    loadComponent: () => import('./features/catalog/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
  },

  // Carrito
  {
    path: 'carrito',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
  },

  // Checkout
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'gracias',
    loadComponent: () => import('./features/checkout/checkout-success/checkout-success.component').then(m => m.CheckoutSuccessComponent),
  },

  // Redirecciones de compatibilidad (rutas antiguas en inglés)
  { path: 'catalog', redirectTo: '/tienda', pathMatch: 'full' },
  { path: 'catalog/:slug', redirectTo: '/tienda/:slug', pathMatch: 'full' },
  { path: 'cart', redirectTo: '/carrito', pathMatch: 'full' },
  { path: 'blog', redirectTo: '/el-archivo', pathMatch: 'full' },
  { path: 'blog/:slug', redirectTo: '/el-archivo/:slug', pathMatch: 'full' },
  { path: 'checkout/success', redirectTo: '/gracias', pathMatch: 'full' },
  { path: 'pages/sobre-nosotros', redirectTo: '/nuestro-metodo', pathMatch: 'full' },
  { path: 'nosotros', redirectTo: '/nuestro-metodo', pathMatch: 'full' },
  { path: 'pages/contacto', redirectTo: '/contacto', pathMatch: 'full' },
  { path: 'pages/politica-privacidad', redirectTo: '/privacidad', pathMatch: 'full' },
  { path: 'pages/condiciones', redirectTo: '/condiciones-venta', pathMatch: 'full' },
  { path: 'pages/cookies', redirectTo: '/cookies', pathMatch: 'full' },
  { path: 'pages/envios', redirectTo: '/devoluciones', pathMatch: 'full' },
  { path: 'pages/puntos-de-venta', redirectTo: '/puntos-de-venta', pathMatch: 'full' },
  
  // Auth — login/register behind guestGuard; forgot/reset accessible to all
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  
  // Account (protected)
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account-layout.component').then(m => m.AccountLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/account/dashboard/dashboard.component').then(m => m.AccountDashboardComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/account/orders/orders.component').then(m => m.AccountOrdersComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/account/profile/profile.component').then(m => m.AccountProfileComponent),
      },
      {
        path: 'addresses',
        loadComponent: () => import('./features/account/addresses/addresses.component').then(m => m.AccountAddressesComponent),
      },
    ],
  },
  
  // Admin (protected)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/orders.component').then(m => m.AdminOrdersComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/products/products.component').then(m => m.AdminProductsComponent),
      },
    ],
  },
  
  // 404
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
