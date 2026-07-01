import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { MiniCartService } from '../../../core/services/mini-cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="header__content">

          <!-- Logo -->
          <a routerLink="/" class="header__logo">
            <img src="/assets/images/logocrema2-100x100.png" alt="Cremacuadrado" class="header__logo-img">
            <div class="header__logo-texts">
              <span class="header__logo-text">Cremacuadrado</span>
              <span class="header__logo-tagline">Crema de pistacho artesanal</span>
            </div>
          </a>

          <!-- Desktop Navigation -->
          <nav class="header__nav">

            <!-- La Tienda (dropdown) -->
            <div class="nav-item nav-item--dropdown">
              <button class="nav-item__trigger" [class.active]="isShopActive()">
                La Tienda
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="nav-item__dropdown">
                <a routerLink="/tienda/crema-pistacho-pura" class="dropdown-item" (click)="closeAll()">
                  <div class="dropdown-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M8 12s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
                  </div>
                  <div class="dropdown-item__text">
                    <strong>Crema Pura 100%</strong>
                    <span>Consciente · Fitness · Ético</span>
                  </div>
                </a>
                <a routerLink="/tienda/crema-pistacho-crunchy" class="dropdown-item" (click)="closeAll()">
                  <div class="dropdown-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                  </div>
                  <div class="dropdown-item__text">
                    <strong>Crema Crunchy</strong>
                    <span>Sibarita · Familias</span>
                  </div>
                </a>
                <div class="dropdown-divider"></div>
                <a routerLink="/tienda" class="dropdown-item dropdown-item--all" (click)="closeAll()">
                  Ver toda la tienda
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
              </div>
            </div>

            <a routerLink="/nuestro-metodo" routerLinkActive="active" class="nav-item__link">Nuestro Método</a>
            <a routerLink="/puntos-de-venta" routerLinkActive="active" class="nav-item__link">Puntos de Venta</a>
            <a routerLink="/para-tiendas" routerLinkActive="active" class="nav-item__link">Profesionales</a>

            <!-- Recetario (dropdown) -->
            <div class="nav-item nav-item--dropdown">
              <button class="nav-item__trigger" [class.active]="isArchiveActive()">
                Recetario
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="nav-item__dropdown">
                <a routerLink="/el-archivo/categoria/recetas" class="dropdown-item" (click)="closeAll()">
                  <div class="dropdown-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M8 12s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
                  </div>
                  <div class="dropdown-item__text">
                    <strong>Recetas</strong>
                    <span>Ideas con nuestras cremas</span>
                  </div>
                </a>
                <a routerLink="/el-archivo/categoria/pistacho-en-el-campo" class="dropdown-item" (click)="closeAll()">
                  <div class="dropdown-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                  </div>
                  <div class="dropdown-item__text">
                    <strong>Pistacho en el campo</strong>
                    <span>Cultivo, economía e industria</span>
                  </div>
                </a>
                <a routerLink="/el-archivo/categoria/el-obrador" class="dropdown-item" (click)="closeAll()">
                  <div class="dropdown-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <div class="dropdown-item__text">
                    <strong>El Obrador</strong>
                    <span>Tostado, repelado, molienda</span>
                  </div>
                </a>
                <div class="dropdown-divider"></div>
                <a routerLink="/el-archivo" class="dropdown-item dropdown-item--all" (click)="closeAll()">
                  Ver todo el archivo
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
              </div>
            </div>

          </nav>

          <!-- Actions -->
          <div class="header__actions">

            <!-- Cart -->
            <button class="header__icon-btn" (click)="miniCartService.toggle()" title="Carrito" aria-label="Abrir carrito">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              @if (cartService.itemCount() > 0) {
                <span class="header__badge">{{ cartService.itemCount() }}</span>
              }
            </button>

            <!-- User / Mi Cuenta -->
            @if (authService.isAuthenticated()) {
              <div class="header__user-menu">
                <button class="header__icon-btn" (click)="toggleUserMenu()" title="Mi cuenta">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span class="header__icon-label">{{ authService.currentUser()?.first_name }}</span>
                </button>
                @if (showUserMenu) {
                  <div class="header__dropdown">
                    <div class="header__dropdown-header">
                      <span>Hola, {{ authService.currentUser()?.first_name }}</span>
                    </div>
                    <a routerLink="/account" (click)="closeUserMenu()">Mi cuenta</a>
                    <a routerLink="/account/orders" (click)="closeUserMenu()">Mis pedidos</a>
                    @if (authService.isAdmin()) {
                      <a routerLink="/admin" (click)="closeUserMenu()">Panel Admin</a>
                    }
                    <hr>
                    <button (click)="logout()">Cerrar sesión</button>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/auth/login" class="header__login-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Mi Cuenta</span>
              </a>
            }

            <!-- Mobile toggle -->
            <button class="header__mobile-toggle" (click)="toggleMobileMenu()" [class.is-open]="showMobileMenu">
              @if (showMobileMenu) {
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>

          </div>
        </div>

        <!-- Mobile Menu -->
        @if (showMobileMenu) {
          <nav class="mobile-menu">

            <!-- La Tienda accordion -->
            <div class="mobile-menu__accordion">
              <button class="mobile-menu__accordion-trigger" (click)="toggleShopMobile()" [class.is-open]="showShopMobile">
                <span>La Tienda</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              @if (showShopMobile) {
                <div class="mobile-menu__sub">
                  <a routerLink="/tienda/crema-pistacho-pura" (click)="closeAll()">
                    <span>Crema Pura 100%</span>
                    <small>Consciente · Fitness · Ético</small>
                  </a>
                  <a routerLink="/tienda/crema-pistacho-crunchy" (click)="closeAll()">
                    <span>Crema Crunchy</span>
                    <small>Sibarita · Familias</small>
                  </a>
                  <a routerLink="/tienda" (click)="closeAll()">Ver toda la tienda →</a>
                </div>
              }
            </div>

            <a routerLink="/nuestro-metodo" routerLinkActive="active" (click)="closeAll()">Nuestro Método</a>
            <a routerLink="/puntos-de-venta" routerLinkActive="active" (click)="closeAll()">Puntos de Venta</a>
            <a routerLink="/para-tiendas" routerLinkActive="active" (click)="closeAll()">Profesionales</a>

            <!-- Recetario accordion -->
            <div class="mobile-menu__accordion">
              <button class="mobile-menu__accordion-trigger" (click)="toggleArchiveMobile()" [class.is-open]="showArchiveMobile">
                <span>Recetario</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              @if (showArchiveMobile) {
                <div class="mobile-menu__sub">
                  <a routerLink="/el-archivo/categoria/recetas" (click)="closeAll()">
                    <span>Recetas</span>
                    <small>Ideas con nuestras cremas</small>
                  </a>
                  <a routerLink="/el-archivo/categoria/pistacho-en-el-campo" (click)="closeAll()">
                    <span>Pistacho en el campo</span>
                    <small>Cultivo, economía e industria</small>
                  </a>
                  <a routerLink="/el-archivo/categoria/el-obrador" (click)="closeAll()">
                    <span>El Obrador</span>
                    <small>Tostado, repelado, molienda</small>
                  </a>
                  <a routerLink="/el-archivo" (click)="closeAll()">Ver todo el archivo →</a>
                </div>
              }
            </div>

            <hr>

            @if (authService.isAuthenticated()) {
              <a routerLink="/account" (click)="closeAll()">Mi cuenta</a>
              <a routerLink="/account/orders" (click)="closeAll()">Mis pedidos</a>
              @if (authService.isAdmin()) {
                <a routerLink="/admin" (click)="closeAll()">Panel Admin</a>
              }
              <button (click)="logout(); closeAll()">Cerrar sesión</button>
            } @else {
              <a routerLink="/auth/login" (click)="closeAll()">Iniciar sesión</a>
              <a routerLink="/auth/register" (click)="closeAll()">Crear cuenta</a>
            }

          </nav>
        }
      </div>
    </header>
  `,
  styles: [`
    $brand: #7B1716;
    $accent: #E6C15A;
    $bg: #F4F1E9;
    $bg-alt: #EDE9DD;
    $text: #1A1208;
    $text-lt: #5A4F3E;
    $text-mt: #8C7F6A;
    $border: #D9D3C5;

    .header {
      background: $bg;
      border-bottom: 1px solid $border;
      position: sticky;
      top: 0;
      z-index: 200;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .header__content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
      gap: 1rem;
    }

    // â”€â”€ Logo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    .header__logo {
      display: flex;
      flex-direction: row;
      align-items: center;
      text-decoration: none;
      gap: 0.6rem;
      flex-shrink: 0;
    }

    .header__logo-img {
      width: 44px;
      height: 44px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .header__logo-texts {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .header__logo-text {
      font-family: 'Teko', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      line-height: 1;
      color: $brand;
    }

    .header__logo-tagline {
      font-family: 'Lora', serif;
      font-size: 0.65rem;
      font-style: italic;
      color: $text-mt;
      letter-spacing: 0.04em;
    }

    // â”€â”€ Desktop Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    .header__nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
      justify-content: center;

      @media (max-width: 960px) {
        display: none;
      }
    }

    %nav-link-base {
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: $text-lt;
      text-decoration: none;
      padding: 0.5rem 0.75rem;
      border-radius: 3px;
      transition: color 150ms ease, background 150ms ease;
      white-space: nowrap;

      &:hover, &.active {
        color: $brand;
        background: rgba($brand, 0.05);
      }
    }

    .nav-item__link {
      @extend %nav-link-base;
    }

    // Dropdown nav item
    .nav-item {
      position: relative;

      &--dropdown:hover .nav-item__dropdown {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }

      // Puente invisible que cubre el gap entre el trigger y el dropdown
      // para que el hover no se pierda al desplazar el ratón hacia la lista
      &--dropdown::after {
        content: '';
        position: absolute;
        top: 100%;
        left: -12px;
        right: -12px;
        height: 14px;
        pointer-events: auto;
      }
    }

    .nav-item__trigger {
      @extend %nav-link-base;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: none;
      border: none;
      cursor: pointer;

      svg { transition: transform 200ms ease; }

      &.active {
        color: $brand;
        background: rgba($brand, 0.05);
      }
    }

    .nav-item--dropdown:hover .nav-item__trigger svg {
      transform: rotate(180deg);
    }

    .nav-item__dropdown {
      position: absolute;
      top: calc(100% + 14px);
      left: 50%;
      transform: translateX(-50%) translateY(-6px);
      background: $bg;
      border: 1px solid $border;
      border-radius: 6px;
      box-shadow: 0 16px 40px -8px rgba($text, 0.16);
      min-width: 260px;
      padding: 0.5rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 180ms ease, transform 180ms ease;

      // arrow
      &::before {
        content: '';
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 10px;
        background: $bg;
        border-left: 1px solid $border;
        border-top: 1px solid $border;
        transform: translateX(-50%) rotate(45deg);
      }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.7rem 0.85rem;
      border-radius: 4px;
      text-decoration: none;
      transition: background 150ms ease;

      &:hover {
        background: $bg-alt;

        .dropdown-item__text strong { color: $brand; }
      }

      &__icon {
        width: 36px;
        height: 36px;
        background: rgba($brand, 0.08);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: $brand;
      }

      &__text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong {
          font-family: 'Poppins', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: $text;
          transition: color 150ms ease;
        }

        span {
          font-family: 'Lora', serif;
          font-size: 0.75rem;
          font-style: italic;
          color: $text-mt;
        }
      }

      &--all {
        justify-content: space-between;
        padding: 0.6rem 0.85rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $brand;

        &:hover { background: rgba($brand, 0.06); }
      }
    }

    .dropdown-divider {
      height: 1px;
      background: $border;
      margin: 0.4rem 0.5rem;
    }

    // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    .header__actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .header__icon-btn {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: none;
      padding: 0.5rem 0.6rem;
      cursor: pointer;
      color: $text-lt;
      text-decoration: none;
      border-radius: 3px;
      transition: color 150ms ease, background 150ms ease;

      &:hover {
        color: $brand;
        background: rgba($brand, 0.05);
      }
    }

    .header__icon-label {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 500;

      @media (max-width: 1100px) { display: none; }
    }

    .header__badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: $brand;
      color: $accent;
      font-family: 'Poppins', sans-serif;
      font-size: 0.55rem;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header__user-menu {
      position: relative;
    }

    .header__dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: $bg;
      border: 1px solid $border;
      border-radius: 6px;
      box-shadow: 0 8px 24px -4px rgba($text, 0.14);
      min-width: 200px;
      padding: 0.5rem 0;
      z-index: 10;

      &-header {
        padding: 0.6rem 1rem 0.4rem;
        border-bottom: 1px solid $border;
        margin-bottom: 0.3rem;

        span {
          font-family: 'Poppins', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: $text-mt;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
      }

      a, button {
        display: block;
        width: 100%;
        padding: 0.6rem 1rem;
        text-align: left;
        text-decoration: none;
        font-family: 'Poppins', sans-serif;
        font-size: 0.8rem;
        font-weight: 500;
        color: $text-lt;
        background: none;
        border: none;
        cursor: pointer;
        transition: background 150ms ease, color 150ms ease;

        &:hover { background: $bg-alt; color: $brand; }
      }

      hr { margin: 0.3rem 0; border: none; border-top: 1px solid $border; }
    }

    .header__login-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: $brand;
      color: $accent;
      padding: 0.45rem 1rem;
      border-radius: 3px;
      text-decoration: none;
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      transition: background 150ms ease, color 150ms ease;
      white-space: nowrap;

      &:hover { background: lighten($brand, 6%); color: lighten($accent, 8%); }

      @media (max-width: 960px) {
        span { display: none; }
        padding: 0.5rem 0.6rem;
      }
    }

    .header__mobile-toggle {
      display: none;
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: $text-lt;
      transition: color 150ms ease;

      &:hover, &.is-open { color: $brand; }

      @media (max-width: 960px) { display: flex; }
    }

    // â”€â”€ Mobile Menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    .mobile-menu {
      padding: 0.75rem 0 1.5rem;
      border-top: 1px solid $border;

      @media (min-width: 961px) { display: none; }

      > a {
        display: block;
        padding: 0.8rem 0.25rem;
        text-decoration: none;
        font-family: 'Poppins', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $text-lt;
        border-bottom: 1px solid rgba($border, 0.5);
        transition: color 150ms ease;

        &:hover, &.active { color: $brand; }
      }

      > button {
        display: block;
        width: 100%;
        padding: 0.8rem 0.25rem;
        text-align: left;
        font-family: 'Poppins', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        color: $text-lt;
        background: none;
        border: none;
        border-bottom: 1px solid rgba($border, 0.5);
        cursor: pointer;
        transition: color 150ms ease;

        &:hover { color: $brand; }
      }

      > hr { margin: 0.5rem 0; border: none; border-top: 1px solid $border; }

      &__accordion {
        border-bottom: 1px solid rgba($border, 0.5);
      }

      &__accordion-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0.8rem 0.25rem;
        background: none;
        border: none;
        cursor: pointer;
        font-family: 'Poppins', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $text-lt;
        transition: color 150ms ease;

        svg { transition: transform 200ms ease; }
        &.is-open { color: $brand; svg { transform: rotate(180deg); } }
        &:hover { color: $brand; }
      }

      &__sub {
        padding: 0 0 0.75rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0;

        a {
          display: flex;
          flex-direction: column;
          padding: 0.6rem 0.5rem;
          text-decoration: none;
          border-radius: 4px;
          transition: background 150ms ease;

          span {
            font-family: 'Poppins', sans-serif;
            font-size: 0.82rem;
            font-weight: 500;
            color: $text;
          }

          small {
            font-family: 'Lora', serif;
            font-size: 0.72rem;
            font-style: italic;
            color: $text-mt;
          }

          &:last-child {
            font-family: 'Poppins', sans-serif;
            font-size: 0.75rem;
            font-weight: 600;
            color: $brand;
            flex-direction: row;
            margin-top: 0.25rem;
          }

          &:hover { background: $bg-alt; }
        }
      }
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  miniCartService = inject(MiniCartService);

  showUserMenu = false;
  showMobileMenu = false;
  showShopMobile = false;
  showArchiveMobile = false;

  isShopActive(): boolean {
    return window.location.pathname.startsWith('/tienda');
  }

  isArchiveActive(): boolean {
    return window.location.pathname.startsWith('/el-archivo');
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    if (!this.showMobileMenu) {
      this.showShopMobile = false;
      this.showArchiveMobile = false;
    }
  }

  toggleShopMobile(): void {
    this.showShopMobile = !this.showShopMobile;
  }

  toggleArchiveMobile(): void {
    this.showArchiveMobile = !this.showArchiveMobile;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  closeAll(): void {
    this.showMobileMenu = false;
    this.showShopMobile = false;
    this.showArchiveMobile = false;
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeUserMenu();
  }
}
