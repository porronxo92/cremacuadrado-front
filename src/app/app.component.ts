import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AnnouncementBarComponent } from './shared/components/announcement-bar/announcement-bar.component';
import { MiniCartComponent } from './shared/components/mini-cart/mini-cart.component';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, AnnouncementBarComponent, MiniCartComponent],
  template: `
    <div class="app">
      @if (!isAdminRoute()) {
        <app-announcement-bar />
        <app-header />
      }
      <main class="main-content">
        <router-outlet />
      </main>
      @if (!isAdminRoute()) {
        <app-footer />
      }
      <app-toast />
      <app-mini-cart />
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
  `],
})
export class AppComponent {
  private router = inject(Router);
  title = 'Cremacuadrado';
  
  isAdminRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects.startsWith('/admin'))
    ),
    { initialValue: false }
  );
}
