import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        @if (!token()) {
          <div class="invalid-token">
            <h1>Enlace inválido</h1>
            <p>Este enlace de recuperación no es válido o ha caducado.</p>
            <a routerLink="/auth/forgot-password" class="btn btn--primary">Solicitar nuevo enlace</a>
          </div>
        } @else if (!done()) {
          <h1>Nueva contraseña</h1>
          <p class="auth-subtitle">Crea una contraseña segura para tu cuenta.</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="password">Nueva contraseña</label>
              <div class="password-input">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="password"
                  formControlName="password"
                  placeholder="Mínimo 8 caracteres"
                  [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
                <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  }
                </button>
              </div>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <span class="error-text">La contraseña es obligatoria</span>
              }
              @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                <span class="error-text">Mínimo 8 caracteres</span>
              }
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                formControlName="confirmPassword"
                placeholder="Repite la contraseña"
                [class.error]="form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched">
              @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
                <span class="error-text">Las contraseñas no coinciden</span>
              }
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
              @if (loading()) { Guardando... } @else { Guardar contraseña }
            </button>
          </form>
        } @else {
          <div class="success-box">
            <div class="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Contraseña actualizada</h3>
            <p>Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión.</p>
            <a routerLink="/auth/login" class="btn btn--primary btn--block">Iniciar sesión</a>
          </div>
        }
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
      background: var(--color-bg, #F4F1E9);
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: var(--color-ink, #1C1A14); }

    .auth-subtitle {
      color: var(--color-muted, #6B6456); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.75rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
      label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; color: var(--color-ink, #1C1A14); }
      input:not([type='checkbox']) {
        width: 100%; padding: 0.75rem; border: 1px solid var(--color-border, rgba(28,26,20,0.15));
        border-radius: 6px; font-size: 1rem; box-sizing: border-box;
        &:focus { outline: none; border-color: var(--color-granate, #7B1716); }
        &.error { border-color: #e74c3c; }
      }
    }

    .password-input {
      position: relative;
      input { padding-right: 40px; }
      .toggle-password {
        position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
        background: none; border: none; padding: 0.25rem; cursor: pointer; color: #666;
        &:hover { color: #333; }
      }
    }

    .error-text { color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem; display: block; }

    .error-message {
      background: #fee; color: #c00; padding: 0.75rem; border-radius: 6px;
      font-size: 0.9rem; margin-bottom: 1rem; text-align: center;
    }

    .btn {
      padding: 0.75rem 1.5rem; border: 1.5px solid transparent; border-radius: 20px;
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 0.95rem;
      cursor: pointer; transition: all 0.25s; text-decoration: none;
      display: inline-block; text-align: center; box-sizing: border-box;
      &--primary {
        background: var(--color-granate, #7B1716); color: #F4F1E9;
        border-color: var(--color-granate, #7B1716);
        &:hover:not(:disabled) { opacity: 0.88; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
      &--block { display: block; width: 100%; }
    }

    .invalid-token {
      text-align: center;
      h1 { margin-bottom: 1rem; }
      p { color: var(--color-muted, #6B6456); margin-bottom: 1.5rem; }
    }

    .success-box {
      text-align: center;
      .success-icon {
        width: 64px; height: 64px; background: #d4edda; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;
        svg { color: #27ae60; }
      }
      h3 { color: var(--color-ink, #1C1A14); margin-bottom: 0.75rem; }
      p { color: var(--color-muted, #6B6456); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  done = signal(false);
  showPassword = signal(false);
  token = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParams['token'];
    this.token.set(tokenParam || null);
  }

  passwordMatchValidator(form: FormGroup) {
    const pw = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return pw === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tokenVal = this.token();
    if (!tokenVal) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.resetPassword(tokenVal, this.form.value.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || 'El enlace es inválido o ha caducado. Solicita uno nuevo.');
      },
    });
  }
}
