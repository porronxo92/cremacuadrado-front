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

  // About / Nosotros
  {
    path: 'nosotros',
    redirectTo: 'pages/sobre-nosotros',
    pathMatch: 'full',
  },
  {
    path: 'pages/sobre-nosotros',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },

  // Contact
  {
    path: 'contacto',
    redirectTo: 'pages/contacto',
    pathMatch: 'full',
  },
  {
    path: 'pages/contacto',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
  },

  // Legal / Info pages
  {
    path: 'pages/politica-privacidad',
    loadComponent: () => import('./features/pages/privacy/privacy.component').then(m => m.PrivacyPageComponent),
  },
  {
    path: 'pages/condiciones',
    loadComponent: () => import('./features/pages/conditions/conditions.component').then(m => m.ConditionsPageComponent),
  },
  {
    path: 'pages/cookies',
    loadComponent: () => import('./features/pages/cookies/cookies.component').then(m => m.CookiesPageComponent),
  },
  {
    path: 'pages/envios',
    loadComponent: () => import('./features/pages/shipping/shipping.component').then(m => m.ShippingPageComponent),
  },
  {
    path: 'pages/puntos-de-venta',
    loadComponent: () => import('./features/pages/puntos-de-venta/puntos-de-venta.component').then(m => m.PuntosDeVentaComponent),
  },

  // Blog
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/blog-list/blog-list.component').then(m => m.BlogListComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./features/blog/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent),
  },

  // Catalog
  {
    path: 'catalog',
    loadComponent: () => import('./features/catalog/product-list/product-list.component').then(m => m.ProductListComponent),
  },
  {
    path: 'catalog/:slug',
    loadComponent: () => import('./features/catalog/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
  },
  
  // Cart
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
  },
  
  // Checkout
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'checkout/success',
    loadComponent: () => import('./features/checkout/checkout-success/checkout-success.component').then(m => m.CheckoutSuccessComponent),
  },
  
  // Auth
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
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
