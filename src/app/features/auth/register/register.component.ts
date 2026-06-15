import { Component, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Crear cuenta</h1>
        <p class="auth-subtitle">Únete a la familia Cremacuadrado</p>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Nombre</label>
              <input 
                type="text" 
                id="firstName" 
                formControlName="firstName"
                placeholder="Tu nombre">
            </div>
            <div class="form-group">
              <label for="lastName">Apellidos</label>
              <input 
                type="text" 
                id="lastName" 
                formControlName="lastName"
                placeholder="Tus apellidos">
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="tu@email.com"
              [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
            @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
              <span class="error-text">El email es obligatorio</span>
            }
            @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
              <span class="error-text">Email no válido</span>
            }
          </div>

          <div class="form-group">
            <label for="phone">Teléfono <span class="optional">(opcional)</span></label>
            <input
              type="tel"
              id="phone"
              formControlName="phone"
              placeholder="+34 600 000 000">
          </div>
          
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              placeholder="Mínimo 8 caracteres"
              [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
            @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
              <span class="error-text">La contraseña es obligatoria</span>
            }
            @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
              <span class="error-text">Mínimo 8 caracteres</span>
            }
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirmar contraseña</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword"
              placeholder="Repite tu contraseña"
              [class.error]="registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched">
            @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
              <span class="error-text">Las contraseñas no coinciden</span>
            }
          </div>
          
          <div class="form-group">
            <label class="checkbox">
              <input type="checkbox" formControlName="acceptTerms">
              <span>Acepto los <a routerLink="/condiciones-venta" target="_blank">términos y condiciones</a> y la <a routerLink="/privacidad" target="_blank">política de privacidad</a></span>
            </label>
            @if (registerForm.get('acceptTerms')?.hasError('requiredTrue') && registerForm.get('acceptTerms')?.touched) {
              <span class="error-text">Debes aceptar los términos y condiciones</span>
            }
          </div>
          
          @if (error()) {
            <div class="error-message">
              {{ error() }}
            </div>
          }
          
          <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
            @if (loading()) { Creando cuenta... } @else { Crear cuenta }
          </button>
        </form>

        @if (googleEnabled) {
          <div class="divider"><span>o regístrate con</span></div>
          <div id="google-register-btn" class="google-btn-wrapper"></div>
        }

        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Iniciar sesión</a></p>
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
      max-width: 450px;
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
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
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
      
      input:not([type="checkbox"]) {
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
    
    .checkbox {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.85rem;
      color: #666;
      line-height: 1.4;
      
      input {
        margin-top: 3px;
        width: 16px;
        height: 16px;
      }
      
      a {
        color: #4a7c4e;
      }
    }
    
    .error-text {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
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
    
    .optional { font-weight: 400; color: #999; font-size: 0.8rem; }

    .divider {
      display: flex; align-items: center; margin: 1.5rem 0 1rem; gap: 0.75rem;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: #ddd; }
      span { color: #999; font-size: 0.85rem; white-space: nowrap; }
    }

    .google-btn-wrapper { display: flex; justify-content: center; margin-bottom: 0.5rem; }

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
          &:hover { text-decoration: underline; }
        }
      }
    }
  `]
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  registerForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  readonly googleEnabled = !!environment.googleClientId;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  ngAfterViewInit(): void {
    if (!this.googleEnabled) return;
    const google = (window as any).google;
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => this.handleGoogleCredential(response),
    });
    google.accounts.id.renderButton(
      document.getElementById('google-register-btn'),
      { theme: 'outline', size: 'large', width: 340, text: 'signup_with' }
    );
  }

  ngOnDestroy(): void {
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
        this.error.set(err?.error?.detail || 'Error al registrarse con Google');
      },
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { firstName, lastName, email, phone, password } = this.registerForm.value;

    this.authService.register({
      email, password,
      first_name: firstName,
      last_name: lastName,
      phone: phone || undefined,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al crear la cuenta');
      }
    });
  }
}
