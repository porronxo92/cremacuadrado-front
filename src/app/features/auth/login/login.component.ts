import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '@env/environment';

import { GoogleIdentityService } from '../../../core/services/google-identity.service';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Iniciar sesión</h1>
        <p class="auth-subtitle">Bienvenido de nuevo a CremaCuadrado</p>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              placeholder="tu@email.com"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
            @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
              <span class="error-text">El email es obligatorio</span>
            }
            @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
              <span class="error-text">Email no válido</span>
            }
          </div>
          
          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="password-input">
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                id="password" 
                formControlName="password"
                placeholder="••••••••"
                [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())">
                @if (showPassword()) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
              </button>
            </div>
            @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
              <span class="error-text">La contraseña es obligatoria</span>
            }
          </div>
          
          <div class="form-options">
            <label class="checkbox">
              <input type="checkbox" formControlName="rememberMe">
              <span>Recordarme</span>
            </label>
            <a routerLink="/auth/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>
          
          @if (error()) {
            <div class="error-message">
              {{ error() }}
            </div>
          }
          
          <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
            @if (loading()) {
              Iniciando sesión...
            } @else {
              Iniciar sesión
            }
          </button>
        </form>
        
        @if (googleEnabled) {
          <div class="divider"><span>o</span></div>
          @if (!googleLoaded()) {
            <button type="button" class="google-placeholder" (click)="loadGoogle()" [disabled]="googleLoading()">
              {{ googleLoading() ? 'Cargando Google…' : 'Continuar con Google' }}
            </button>
            <p class="google-note">Al pulsar se cargará el servicio de Google, que instala sus propias cookies.</p>
          }
          <div id="google-signin-btn" class="google-btn-wrapper"></div>
        }

        <div class="auth-footer">
          <p>¿No tienes cuenta? <a routerLink="/auth/register">Crear cuenta</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f9f9f9;
    }
    
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      
      h1 {
        margin: 0 0 0.5rem;
        text-align: center;
        color: #333;
      }
    }
    
    .auth-subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 2rem;
    }
    
    .form-group {
      margin-bottom: 1.25rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
      }
      
      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #4a7c4e;
        }
        
        &.error {
          border-color: #e74c3c;
        }
      }
    }
    
    .password-input {
      position: relative;
      
      input {
        padding-right: 40px;
      }
      
      .toggle-password {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: #666;
        
        &:hover {
          color: #333;
        }
      }
    }
    
    .error-text {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
    }
    
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: #666;
      
      input {
        width: 16px;
        height: 16px;
      }
    }
    
    .forgot-link {
      font-size: 0.9rem;
      color: #4a7c4e;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .error-message {
      background: #fee;
      color: #c00;
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      
      &--primary {
        background: #4a7c4e;
        color: #fff;
        
        &:hover:not(:disabled) {
          background: #3d6640;
        }
        
        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
      
      &--block {
        display: block;
        width: 100%;
      }
    }
    
    .divider {
      display: flex;
      align-items: center;
      margin: 1.5rem 0 1rem;
      gap: 0.75rem;
      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #ddd;
      }
      span { color: #999; font-size: 0.85rem; white-space: nowrap; }
    }

    .google-placeholder {
      display: block; width: 100%; max-width: 340px; margin: 0 auto; min-height: 48px;
      border: 1px solid #dadce0; border-radius: 4px; background: #fff; color: #3c4043;
      font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 0.9rem; cursor: pointer;
    }
    .google-note { text-align: center; font-size: 0.72rem; color: #6B6456; margin: 0.5rem 0 0; }

    .google-btn-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .auth-footer {
      margin-top: 1.5rem;
      text-align: center;

      p {
        color: #666;
        font-size: 0.9rem;

        a {
          color: #4a7c4e;
          font-weight: 600;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  `]
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  // window/Google SDK only exist in the browser, not during SSR
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  loginForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  readonly googleEnabled = !!environment.googleClientId;
  readonly googleLoaded = signal(false);
  readonly googleLoading = signal(false);
  private googleIdentity = inject(GoogleIdentityService);
  private cookieConsent = inject(CookieConsentService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.googleEnabled) return;
    // Solo se carga sin clic si el usuario ya aceptó los servicios externos
    if (this.cookieConsent.external()) this.loadGoogle();
  }

  loadGoogle(): void {
    this.googleLoading.set(true);
    this.googleIdentity.load().then(google => {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: { credential: string }) => this.handleGoogleCredential(response),
      });
      this.googleLoaded.set(true);
      this.googleLoading.set(false);
      setTimeout(() => google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: 340, text: 'signin_with' }
      ));
    }).catch(() => {
      this.googleLoading.set(false);
      this.error.set('No se pudo cargar el inicio de sesión con Google');
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    const google = (window as any).google;
    google?.accounts?.id?.cancel();
  }

  handleGoogleCredential(response: { credential: string }): void {
    this.loading.set(true);
    this.error.set(null);
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || 'Error al iniciar sesión con Google');
      },
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Credenciales inválidas');
      }
    });
  }
}
