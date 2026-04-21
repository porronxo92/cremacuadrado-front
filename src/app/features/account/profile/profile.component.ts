import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <h1>Mi perfil</h1>
      
      <!-- Profile form -->
      <div class="profile-section">
        <h2>Información personal</h2>
        
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Nombre</label>
              <input type="text" id="firstName" formControlName="firstName">
            </div>
            <div class="form-group">
              <label for="lastName">Apellidos</label>
              <input type="text" id="lastName" formControlName="lastName">
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" formControlName="email" readonly>
            <small>El email no se puede cambiar</small>
          </div>
          
          <div class="form-group">
            <label for="phone">Teléfono</label>
            <input type="tel" id="phone" formControlName="phone">
          </div>
          
          @if (profileSuccess()) {
            <div class="success-message">Perfil actualizado correctamente</div>
          }
          
          @if (profileError()) {
            <div class="error-message">{{ profileError() }}</div>
          }
          
          <button type="submit" class="btn btn--primary" [disabled]="savingProfile()">
            @if (savingProfile()) {
              Guardando...
            } @else {
              Guardar cambios
            }
          </button>
        </form>
      </div>
      
      <!-- Password form -->
      <div class="profile-section">
        <h2>Cambiar contraseña</h2>
        
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <div class="form-group">
            <label for="currentPassword">Contraseña actual</label>
            <input type="password" id="currentPassword" formControlName="currentPassword">
          </div>
          
          <div class="form-group">
            <label for="newPassword">Nueva contraseña</label>
            <input type="password" id="newPassword" formControlName="newPassword">
            @if (passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched) {
              <span class="error-text">Mínimo 8 caracteres</span>
            }
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirmar nueva contraseña</label>
            <input type="password" id="confirmPassword" formControlName="confirmPassword">
            @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
              <span class="error-text">Las contraseñas no coinciden</span>
            }
          </div>
          
          @if (passwordSuccess()) {
            <div class="success-message">Contraseña actualizada correctamente</div>
          }
          
          @if (passwordError()) {
            <div class="error-message">{{ passwordError() }}</div>
          }
          
          <button type="submit" class="btn btn--primary" [disabled]="savingPassword()">
            @if (savingPassword()) {
              Cambiando...
            } @else {
              Cambiar contraseña
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      h1 {
        margin: 0 0 2rem;
        color: #333;
      }
    }
    
    .profile-section {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      
      h2 {
        margin: 0 0 1.5rem;
        font-size: 1.1rem;
        color: #333;
      }
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
        
        &[readonly] {
          background: #f5f5f5;
          color: #666;
        }
      }
      
      small {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: #666;
      }
    }
    
    .error-text {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
    }
    
    .success-message {
      background: #d4edda;
      color: #155724;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      
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
    }
  `]
})
export class AccountProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  savingProfile = signal(false);
  profileSuccess = signal(false);
  profileError = signal<string | null>(null);
  
  savingPassword = signal(false);
  passwordSuccess = signal(false);
  passwordError = signal<string | null>(null);
  
  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }
  
  initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [''],
      phone: ['']
    });
    
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
  
  loadProfile(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone
      });
    }
  }
  
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    
    this.savingProfile.set(true);
    this.profileSuccess.set(false);
    this.profileError.set(null);
    
    const { firstName, lastName, phone } = this.profileForm.value;
    
    this.userService.updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone
    }).subscribe({
      next: (user) => {
        this.savingProfile.set(false);
        this.profileSuccess.set(true);
        setTimeout(() => this.profileSuccess.set(false), 3000);
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.profileError.set(err.message || 'Error al guardar el perfil');
      }
    });
  }
  
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    
    this.savingPassword.set(true);
    this.passwordSuccess.set(false);
    this.passwordError.set(null);
    
    const { currentPassword, newPassword } = this.passwordForm.value;
    
    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess.set(false), 3000);
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.passwordError.set(err.message || 'Error al cambiar la contraseña');
      }
    });
  }
}
