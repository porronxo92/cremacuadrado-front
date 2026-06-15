import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="back-link">
          <a routerLink="/auth/login">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Volver al login
          </a>
        </div>

        <h1>Recuperar contraseña</h1>
        <p class="auth-subtitle">Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.</p>

        @if (!sent()) {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                placeholder="tu@email.com"
                [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <span class="error-text">El email es obligatorio</span>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <span class="error-text">Email no válido</span>
              }
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
              @if (loading()) { Enviando... } @else { Enviar enlace }
            </button>
          </form>
        } @else {
          <div class="success-box">
            <div class="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3>Revisa tu email</h3>
            <p>Si existe una cuenta con ese email, recibirás el enlace en los próximos minutos. Recuerda revisar la carpeta de spam.</p>
            <a routerLink="/auth/login" class="btn btn--secondary btn--block">Volver al login</a>
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

    .back-link {
      margin-bottom: 1.5rem;
      a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
        color: var(--color-muted, #6B6456);
        text-decoration: none;
        &:hover { color: var(--color-granate, #7B1716); }
      }
    }

    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      color: var(--color-ink, #1C1A14);
    }

    .auth-subtitle {
      color: var(--color-muted, #6B6456);
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1.75rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--color-ink, #1C1A14);
      }
      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--color-border, rgba(28,26,20,0.15));
        border-radius: 6px;
        font-size: 1rem;
        box-sizing: border-box;
        &:focus { outline: none; border-color: var(--color-granate, #7B1716); }
        &.error { border-color: #e74c3c; }
      }
    }

    .error-text { color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem; display: block; }

    .error-message {
      background: #fee; color: #c00; padding: 0.75rem;
      border-radius: 6px; font-size: 0.9rem; margin-bottom: 1rem; text-align: center;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: 1.5px solid transparent;
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.25s;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      box-sizing: border-box;

      &--primary {
        background: var(--color-granate, #7B1716);
        color: #F4F1E9;
        border-color: var(--color-granate, #7B1716);
        &:hover:not(:disabled) { opacity: 0.88; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }

      &--secondary {
        background: #F4F1E9;
        color: var(--color-granate, #7B1716);
        border-color: var(--color-granate, #7B1716);
        &:hover { background: var(--color-granate, #7B1716); color: #F4F1E9; }
      }

      &--block { display: block; width: 100%; }
    }

    .success-box {
      text-align: center;
      .success-icon {
        width: 64px; height: 64px;
        background: #d4edda; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1rem;
        svg { color: #27ae60; }
      }
      h3 { color: var(--color-ink, #1C1A14); margin-bottom: 0.75rem; }
      p { color: var(--color-muted, #6B6456); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  sent = signal(false);

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.loading.set(false);
        // Always show success to avoid email enumeration (but still log UI error)
        this.sent.set(true);
      },
    });
  }
}
