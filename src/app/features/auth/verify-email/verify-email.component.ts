import { Component, OnInit, inject, signal, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type State = 'loading' | 'done' | 'error';

@Component({
    selector: 'app-verify-email',
    imports: [RouterModule],
    template: `
    <div class="auth-page">
      <div class="auth-card" aria-live="polite">
        @switch (state()) {
          @case ('loading') {
            <h1>Verificando tu email…</h1>
            <p class="auth-subtitle">Un momento, por favor.</p>
          }
          @case ('done') {
            <div class="success-icon">
              <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h1>Email verificado</h1>
            <p class="auth-subtitle">Tu cuenta ya está confirmada.</p>
            @if (auth.isAuthenticated()) {
              <a routerLink="/account/profile" class="btn btn--primary btn--block">Ir a mi cuenta</a>
            } @else {
              <a routerLink="/auth/login" class="btn btn--primary btn--block">Iniciar sesión</a>
            }
          }
          @case ('error') {
            <h1>Enlace inválido</h1>
            <p class="auth-subtitle">{{ error() }}</p>
            <a routerLink="/auth/login" class="btn btn--primary btn--block">Iniciar sesión</a>
          }
        }
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .auth-page {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: var(--color-bg, #F4F1E9);
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      text-align: center;
    }

    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: var(--color-ink, #1C1A14); }

    .auth-subtitle {
      color: var(--color-muted, #6B6456); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;
    }

    .success-icon {
      width: 64px; height: 64px; background: #d4edda; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;
      svg { color: #27ae60; }
    }

    .btn {
      min-height: 48px; padding: 0.75rem 1.5rem; border: 1.5px solid transparent; border-radius: 20px;
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 0.95rem;
      cursor: pointer; transition: all 0.25s; text-decoration: none;
      display: inline-block; text-align: center; box-sizing: border-box;
      &--primary {
        background: var(--color-granate, #7B1716); color: #F4F1E9;
        border-color: var(--color-granate, #7B1716);
        &:hover { opacity: 0.88; }
      }
      &--block { display: block; width: 100%; }
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  auth = inject(AuthService);

  state = signal<State>('loading');
  error = signal('Este enlace de verificación no es válido o ha caducado.');

  ngOnInit(): void {
    // El token se consume una sola vez: solo en el navegador, nunca en el render SSR
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.state.set('error');
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.state.set('done');
        // Refresca email_verified (y lo que dependa de él, como el cupón del perfil)
        this.auth.loadCurrentUser();
      },
      error: (err) => {
        if (err?.message) this.error.set(err.message);
        this.state.set('error');
      },
    });
  }
}
