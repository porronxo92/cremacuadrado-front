import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { Address } from '../../../core/models';

@Component({
  selector: 'app-account-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="addresses-page">
      <div class="page-header">
        <h1>Mis direcciones</h1>
        <button class="btn btn--primary" (click)="openAddressForm()">
          + Nueva dirección
        </button>
      </div>
      
      @if (loading()) {
        <div class="loading">Cargando direcciones...</div>
      } @else if (addresses().length === 0 && !showForm()) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <h2>No tienes direcciones guardadas</h2>
          <p>Añade una dirección para que tus compras sean más rápidas.</p>
          <button class="btn btn--primary" (click)="openAddressForm()">Añadir dirección</button>
        </div>
      } @else {
        <div class="addresses-grid">
          @for (address of addresses(); track address.id) {
            <div class="address-card" [class.default]="address.is_default">
              @if (address.is_default) {
                <span class="default-badge">Predeterminada</span>
              }
              <div class="address-content">
                <p class="address-name">{{ address.first_name }} {{ address.last_name }}</p>
                <p>{{ address.street }}</p>
                @if (address.street_2) {
                  <p>{{ address.street_2 }}</p>
                }
                <p>{{ address.postal_code }} {{ address.city }}</p>
                <p>{{ address.province }}, {{ address.country }}</p>
                @if (address.phone) {
                  <p>Tel: {{ address.phone }}</p>
                }
              </div>
              <div class="address-actions">
                <button class="btn btn--text" (click)="editAddress(address)">Editar</button>
                @if (!address.is_default) {
                  <button class="btn btn--text" (click)="setDefault(address.id!)">Predeterminar</button>
                }
                <button class="btn btn--text btn--danger" (click)="deleteAddress(address.id!)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }
      
      <!-- Address form modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingAddress() ? 'Editar dirección' : 'Nueva dirección' }}</h2>
              <button class="close-btn" (click)="closeForm()">×</button>
            </div>
            
            <form [formGroup]="addressForm" (ngSubmit)="saveAddress()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="firstName">Nombre *</label>
                    <input type="text" id="firstName" formControlName="firstName">
                  </div>
                  <div class="form-group">
                    <label for="lastName">Apellidos *</label>
                    <input type="text" id="lastName" formControlName="lastName">
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="addressLine1">Dirección *</label>
                  <input type="text" id="addressLine1" formControlName="addressLine1" placeholder="Calle, número, piso...">
                </div>
                
                <div class="form-group">
                  <label for="addressLine2">Dirección adicional</label>
                  <input type="text" id="addressLine2" formControlName="addressLine2" placeholder="Urbanización, bloque... (opcional)">
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="city">Ciudad *</label>
                    <input type="text" id="city" formControlName="city">
                  </div>
                  <div class="form-group">
                    <label for="postalCode">Código postal *</label>
                    <input type="text" id="postalCode" formControlName="postalCode">
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="state">Provincia *</label>
                    <input type="text" id="state" formControlName="state">
                  </div>
                  <div class="form-group">
                    <label for="country">País *</label>
                    <select id="country" formControlName="country">
                      <option value="ES">España</option>
                      <option value="PT">Portugal</option>
                      <option value="FR">Francia</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="phone">Teléfono</label>
                  <input type="tel" id="phone" formControlName="phone">
                </div>
                
                <div class="form-group">
                  <label class="checkbox">
                    <input type="checkbox" formControlName="isDefault">
                    <span>Usar como dirección predeterminada</span>
                  </label>
                </div>
                
                @if (formError()) {
                  <div class="error-message">{{ formError() }}</div>
                }
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn--secondary" (click)="closeForm()">Cancelar</button>
                <button type="submit" class="btn btn--primary" [disabled]="saving()">
                  @if (saving()) {
                    Guardando...
                  } @else {
                    Guardar
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .addresses-page {
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      
      h1 {
        margin: 0;
        color: #333;
      }
    }
    
    .addresses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .address-card {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      position: relative;
      border: 2px solid transparent;
      
      &.default {
        border-color: #4a7c4e;
      }
    }
    
    .default-badge {
      position: absolute;
      top: -10px;
      right: 10px;
      background: #4a7c4e;
      color: #fff;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .address-content {
      margin-bottom: 1rem;
      
      p {
        margin: 0 0 0.25rem;
        color: #666;
        font-size: 0.9rem;
        
        &.address-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }
      }
    }
    
    .address-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s;
      
      &--primary {
        background: #4a7c4e;
        color: #fff;
        border: none;
        
        &:hover:not(:disabled) {
          background: #3d6640;
        }
        
        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
      
      &--secondary {
        background: #f5f5f5;
        color: #333;
        border: none;
        
        &:hover {
          background: #eee;
        }
      }
      
      &--text {
        background: none;
        border: none;
        color: #4a7c4e;
        padding: 0.25rem 0.5rem;
        
        &:hover {
          text-decoration: underline;
        }
        
        &.btn--danger {
          color: #e74c3c;
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      background: #fff;
      border-radius: 8px;
      
      svg {
        color: #ccc;
        margin-bottom: 1rem;
      }
      
      h2 {
        color: #333;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #666;
        margin-bottom: 1.5rem;
      }
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    
    .modal {
      background: #fff;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #eee;
      
      h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        
        &:hover {
          color: #333;
        }
      }
    }
    
    .modal-body {
      padding: 1.5rem;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #eee;
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
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
      }
      
      input:not([type="checkbox"]), select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #4a7c4e;
        }
      }
    }
    
    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      
      input {
        width: 16px;
        height: 16px;
      }
    }
    
    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
  `]
})
export class AccountAddressesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  
  addresses = signal<Address[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingAddress = signal<Address | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  
  addressForm!: FormGroup;
  
  ngOnInit(): void {
    this.initForm();
    this.loadAddresses();
  }
  
  initForm(): void {
    this.addressForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      state: ['', Validators.required],
      country: ['ES', Validators.required],
      phone: [''],
      isDefault: [false]
    });
  }
  
  loadAddresses(): void {
    this.loading.set(true);
    this.userService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  
  openAddressForm(): void {
    this.editingAddress.set(null);
    this.addressForm.reset({ country: 'ES', isDefault: false });
    this.showForm.set(true);
  }
  
  editAddress(address: Address): void {
    this.editingAddress.set(address);
    this.addressForm.patchValue({
      firstName: address.first_name,
      lastName: address.last_name,
      addressLine1: address.street,
      addressLine2: address.street_2,
      city: address.city,
      postalCode: address.postal_code,
      state: address.province,
      country: address.country,
      phone: address.phone,
      isDefault: address.is_default
    });
    this.showForm.set(true);
  }
  
  closeForm(): void {
    this.showForm.set(false);
    this.editingAddress.set(null);
    this.formError.set(null);
  }
  
  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    
    this.saving.set(true);
    this.formError.set(null);
    
    const formValue = this.addressForm.value;
    const addressData = {
      first_name: formValue.firstName,
      last_name: formValue.lastName,
      street: formValue.addressLine1,
      street_2: formValue.addressLine2 || '',
      city: formValue.city,
      postal_code: formValue.postalCode,
      province: formValue.state,
      country: formValue.country,
      phone: formValue.phone,
      is_default: formValue.isDefault,
      label: null
    };
    
    const request = this.editingAddress()
      ? this.userService.updateAddress(this.editingAddress()!.id!, addressData)
      : this.userService.createAddress(addressData);
    
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadAddresses();
      },
      error: (err: Error) => {
        this.saving.set(false);
        this.formError.set(err.message || 'Error al guardar la dirección');
      }
    });
  }
  
  setDefault(addressId: number): void {
    this.userService.setDefaultAddress(addressId).subscribe({
      next: () => this.loadAddresses(),
      error: (err) => this.toastService.error('Error: ' + err.message)
    });
  }

  deleteAddress(addressId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      this.userService.deleteAddress(addressId).subscribe({
        next: () => this.loadAddresses(),
        error: (err) => this.toastService.error('Error: ' + err.message)
      });
    }
  }
}
