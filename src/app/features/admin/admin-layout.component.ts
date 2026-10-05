import { Component, HostListener, ViewEncapsulation, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminConfirmHostComponent } from './shared/admin-ui.components';

interface NavItem { path: string; label: string; icon: string; exact?: boolean }
interface NavGroup { title: string; items: NavItem[] }

// Inline SVG paths (24×24, stroke icons)
const ICONS: Record<string, string> = {
  dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  orders: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  invoices: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  shipments: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  carts: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  coupons: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2.59 12.58a2 2 0 0 1 0-2.83L9.76 2.59a2 2 0 0 1 2.83 0L20.59 10.58a2 2 0 0 1 0 2.83z"/><line x1="9" y1="9" x2="9.01" y2="9"/>',
  reviews: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  leads: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  products: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  categories: '<path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>',
  blog: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  pos: '<path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminConfirmHostComponent],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./shared/admin-shell.scss', './shared/admin-shell-data.scss', './admin-layout.component.scss'],
  template: `
    <div class="adm-shell adm-layout">
      <header class="adm-topbar">
        <button class="adm-topbar__toggle" type="button" (click)="toggleMenu()"
                [attr.aria-expanded]="menuOpen()" aria-controls="adm-sidebar" aria-label="Abrir menú de administración">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="adm-brand">CremaCuadrado <small>Admin</small></span>
      </header>

      @if (menuOpen()) {
        <div class="adm-sidebar-backdrop" (click)="closeMenu()"></div>
      }

      <aside id="adm-sidebar" class="adm-sidebar" [class.is-open]="menuOpen()" aria-label="Navegación de administración">
        <div class="adm-sidebar__header">
          <span class="adm-brand">CremaCuadrado <small>Admin</small></span>
          <button class="adm-sidebar__close" type="button" (click)="closeMenu()" aria-label="Cerrar menú">×</button>
        </div>

        <nav class="adm-nav" (click)="closeMenu()">
          @for (group of nav; track group.title) {
            <p class="adm-nav__title">{{ group.title }}</p>
            @for (item of group.items; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: !!item.exact }">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon(item.icon)"></svg>
                {{ item.label }}
              </a>
            }
          }
        </nav>

        <div class="adm-sidebar__footer" (click)="closeMenu()">
          <a routerLink="/">← Volver a la tienda</a>
        </div>
      </aside>

      <main class="adm-content">
        <router-outlet />
      </main>

      <adm-confirm-host />
    </div>
  `,
})
export class AdminLayoutComponent {
  menuOpen = signal(false);

  // Icons are static constants defined above, so bypassing the sanitizer is safe
  // (the default sanitizer strips SVG child elements).
  private icons: Record<string, SafeHtml> = Object.fromEntries(
    Object.entries(ICONS).map(([k, v]) => [k, inject(DomSanitizer).bypassSecurityTrustHtml(v)]),
  );

  readonly nav: NavGroup[] = [
    {
      title: 'Ventas',
      items: [
        { path: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
        { path: '/admin/orders', label: 'Pedidos', icon: 'orders' },
        { path: '/admin/pagos', label: 'Pagos y reembolsos', icon: 'payments' },
        { path: '/admin/facturas', label: 'Facturas', icon: 'invoices' },
        { path: '/admin/cumplimiento', label: 'Cumplimiento (RGPD)', icon: 'shield' },
        { path: '/admin/envios', label: 'Envíos', icon: 'shipments' },
      ],
    },
    {
      title: 'Clientes',
      items: [
        { path: '/admin/clientes', label: 'Clientes', icon: 'users' },
        { path: '/admin/carritos', label: 'Carritos abandonados', icon: 'carts' },
        { path: '/admin/cupones', label: 'Cupones', icon: 'coupons' },
        { path: '/admin/resenas', label: 'Reseñas', icon: 'reviews' },
        { path: '/admin/leads', label: 'Leads', icon: 'leads' },
      ],
    },
    {
      title: 'Catálogo y contenido',
      items: [
        { path: '/admin/products', label: 'Productos', icon: 'products' },
        { path: '/admin/categorias', label: 'Categorías', icon: 'categories' },
        { path: '/admin/blog', label: 'Blog y recetas', icon: 'blog' },
        { path: '/admin/puntos-de-venta', label: 'Puntos de venta', icon: 'pos' },
      ],
    },
  ];

  icon(name: string): SafeHtml | string {
    return this.icons[name] ?? '';
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
