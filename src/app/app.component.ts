import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AnnouncementBarComponent } from './shared/components/announcement-bar/announcement-bar.component';
import { MiniCartComponent } from './shared/components/mini-cart/mini-cart.component';
import { WhatsappButtonComponent } from './shared/components/whatsapp-button/whatsapp-button.component';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner.component';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, AnnouncementBarComponent, MiniCartComponent, WhatsappButtonComponent, CookieBannerComponent],
    template: `
    <a class="skip-link" href="#contenido-principal">Saltar al contenido</a>
    <div class="app" [class.app--fab]="!isAdminRoute()">
      @if (!isAdminRoute()) {
        <app-announcement-bar />
        <app-header />
      }
      <main class="main-content" id="contenido-principal" tabindex="-1">
        <router-outlet />
      </main>
      @if (!isAdminRoute()) {
        <app-footer />
        <app-whatsapp-button />
      }
      <app-toast />
      <app-mini-cart />
      @if (!isAdminRoute()) {
        <app-cookie-banner />
      }
    </div>
  `,
    styles: [`
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .main-content {
      flex: 1;
    }

    /* Hueco del botón flotante de WhatsApp (alto + margen + zona segura) para que
       ningún control quede inalcanzable debajo (WCAG 2.4.11). Lo aplica el pie en
       su propio padding, así el hueco toma el fondo del pie y no queda una franja
       de otro color tras él. */
    .app--fab {
      --footer-fab-clearance: calc(var(--fab-clearance) + env(safe-area-inset-bottom, 0px));
    }
  `]
})
export class AppComponent {
  private router = inject(Router);
  title = 'CremaCuadrado';
  
  isAdminRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects.startsWith('/admin'))
    ),
    { initialValue: false }
  );
}
