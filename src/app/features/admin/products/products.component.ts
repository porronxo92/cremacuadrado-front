import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { Category, ProductImage } from '../../../core/models';

interface AdminVariant {
  id: number;
  sku: string | null;
  format: string;
  weight_grams: number;
  price: number;
  compare_price: number | null;
  stock: number;
  is_active: boolean;
  is_in_stock: boolean;
  is_low_stock: boolean;
  sort_order: number;
  images: ProductImage[];
}

// Admin-specific Product interface (matches API exactly)
interface AdminProduct {
  id: number;
  name: string;
  sku: string | null;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  weight: number | null;
  is_active: boolean;
  is_featured: boolean;
  category: Category | null;
  images: { url: string }[];
  variants: AdminVariant[];
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="admin-products">
      <div class="page-header">
        <h1>Gestión de Productos</h1>
        <button class="btn btn--primary" (click)="openForm()">+ Nuevo producto</button>
      </div>
      
      @if (loading()) {
        <div class="loading">Cargando productos...</div>
      } @else {
        <div class="products-table-container">
          <table class="products-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product.id) {
                <tr>
                  <td>
                    <img [src]="product.images.at(0)?.url || '/assets/images/placeholder.jpg'" [alt]="product.name" class="product-thumb">
                  </td>
                  <td>
                    <strong>{{ product.name }}</strong>
                    <small>{{ product.sku }}</small>
                  </td>
                  <td>
                    <strong>{{ product.price | currency:'EUR' }}</strong>
                    @if (product.compare_price) {
                      <small class="compare-price">{{ product.compare_price | currency:'EUR' }}</small>
                    }
                  </td>
                  <td>
                    <span [class.low-stock]="product.stock <= 5">{{ product.stock }}</span>
                  </td>
                  <td>{{ product.category?.name || '-' }}</td>
                  <td>
                    <span class="status-badge" [class.active]="product.is_active">
                      {{ product.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="btn btn--icon" (click)="toggleVariants(product.id)" title="Variantes"
                      [class.active]="expandedProduct() === product.id">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                      </svg>
                    </button>
                    <button class="btn btn--icon" (click)="editProduct(product)" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn btn--icon btn--danger" (click)="deleteProduct(product.id)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
                @if (expandedProduct() === product.id && product.variants?.length) {
                  <tr class="variants-row">
                    <td colspan="7">
                      <div class="variants-panel">
                        <h4>Variantes de {{ product.name }}</h4>
                        <table class="variants-table">
                          <thead>
                            <tr>
                              <th>Imagen</th>
                              <th>Formato</th>
                              <th>SKU</th>
                              <th>Precio</th>
                              <th>Precio anterior</th>
                              <th>Stock</th>
                              <th>Estado</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (v of product.variants; track v.id) {
                              <tr>
                                <td>
                                  <img [src]="v.images?.at(0)?.url || '/assets/images/placeholder.jpg'"
                                    [alt]="product.name + ' ' + v.format" class="product-thumb">
                                </td>
                                <td><strong>{{ v.format }}</strong></td>
                                <td><small>{{ v.sku || '-' }}</small></td>
                                <td>{{ v.price | currency:'EUR' }}</td>
                                <td>
                                  @if (v.compare_price) {
                                    <small class="compare-price">{{ v.compare_price | currency:'EUR' }}</small>
                                  } @else { - }
                                </td>
                                <td><span [class.low-stock]="v.is_low_stock">{{ v.stock }}</span></td>
                                <td>
                                  <span class="status-badge" [class.active]="v.is_active">
                                    {{ v.is_active ? 'Activo' : 'Inactivo' }}
                                  </span>
                                </td>
                                <td>
                                  <button class="btn btn--icon" (click)="editVariant(product, v)" title="Editar variante">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="7" class="empty">No hay productos</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      
      <!-- Variant edit modal -->
      @if (showVariantForm()) {
        <div class="modal-overlay" (click)="closeVariantForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Editar variante {{ editingVariant()?.format }}</h2>
              <button class="close-btn" (click)="closeVariantForm()">×</button>
            </div>
            <form [formGroup]="variantForm" (ngSubmit)="saveVariant()">
              <div class="modal-body">
                <!-- Image upload section -->
                <div class="form-group">
                  <label>Imagen de la variante</label>
                  <div class="image-upload-area">
                    <img
                      [src]="variantImagePreview() || editingVariant()?.images?.at(0)?.url || '/assets/images/placeholder.jpg'"
                      alt="Imagen variante"
                      class="image-preview-thumb">
                    <div class="image-upload-controls">
                      <input #variantFileInput type="file" accept="image/*" style="display:none"
                        (change)="onVariantImageChange($event)">
                      <button type="button" class="btn btn--secondary btn--sm"
                        [disabled]="variantUploadingImage()"
                        (click)="variantFileInput.click()">
                        {{ variantUploadingImage() ? 'Subiendo...' : 'Cambiar imagen' }}
                      </button>
                      @if (variantImagePreview()) {
                        <small class="upload-success">✓ Nueva imagen lista</small>
                      }
                    </div>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Precio *</label>
                    <input type="number" formControlName="price" step="0.01" min="0">
                  </div>
                  <div class="form-group">
                    <label>Precio anterior</label>
                    <input type="number" formControlName="compare_price" step="0.01" min="0">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Stock *</label>
                    <input type="number" formControlName="stock" min="0">
                  </div>
                  <div class="form-group">
                    <label>SKU</label>
                    <input type="text" formControlName="sku">
                  </div>
                </div>
                <div class="form-group">
                  <label class="checkbox">
                    <input type="checkbox" formControlName="is_active">
                    <span>Variante activa</span>
                  </label>
                </div>
                @if (variantFormError()) {
                  <div class="error-message">{{ variantFormError() }}</div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn--secondary" (click)="closeVariantForm()">Cancelar</button>
                <button type="submit" class="btn btn--primary" [disabled]="savingVariant() || variantUploadingImage()">
                  {{ savingVariant() ? 'Guardando...' : 'Guardar variante' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Product form modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal modal--large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingProduct() ? 'Editar producto' : 'Nuevo producto' }}</h2>
              <button class="close-btn" (click)="closeForm()">×</button>
            </div>
            
            <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="name">Nombre *</label>
                    <input type="text" id="name" formControlName="name">
                  </div>
                  <div class="form-group">
                    <label for="sku">SKU *</label>
                    <input type="text" id="sku" formControlName="sku">
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="description">Descripción *</label>
                  <textarea id="description" formControlName="description" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="price">Precio *</label>
                    <input type="number" id="price" formControlName="price" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="compareAtPrice">Precio anterior</label>
                    <input type="number" id="compareAtPrice" formControlName="compareAtPrice" step="0.01">
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="categoryId">Categoría</label>
                    <select id="categoryId" formControlName="categoryId">
                      <option value="">Sin categoría</option>
                      @for (cat of categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="stockQuantity">Stock *</label>
                    <input type="number" id="stockQuantity" formControlName="stockQuantity">
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Imágenes del producto</label>
                  <div class="product-images-editor">
                    @for (url of productImageUrls(); track url; let i = $index) {
                      <div class="product-image-tile">
                        <img [src]="url" alt="Imagen {{i+1}}" class="image-preview-thumb">
                        <button type="button" class="remove-image-btn" (click)="removeProductImage(i)" title="Eliminar">×</button>
                      </div>
                    }
                    <div class="add-image-tile">
                      <input #productFileInput type="file" accept="image/*" style="display:none"
                        (change)="onProductImageChange($event)">
                      <button type="button" class="btn btn--secondary btn--sm"
                        [disabled]="productUploadingImage()"
                        (click)="productFileInput.click()">
                        @if (productUploadingImage()) { <span>Subiendo...</span> }
                        @else { <span>+ Añadir imagen</span> }
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="ingredients">Ingredientes</label>
                    <input type="text" id="ingredients" formControlName="ingredients">
                  </div>
                  <div class="form-group">
                    <label for="weight">Peso</label>
                    <input type="text" id="weight" formControlName="weight" placeholder="200g">
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="nutritionInfo">Información nutricional</label>
                  <textarea id="nutritionInfo" formControlName="nutritionInfo" rows="2"></textarea>
                </div>
                
                <div class="form-row checkboxes">
                  <label class="checkbox">
                    <input type="checkbox" formControlName="isActive">
                    <span>Producto activo</span>
                  </label>
                  <label class="checkbox">
                    <input type="checkbox" formControlName="isFeatured">
                    <span>Producto destacado</span>
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
    .admin-products {
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
    
    .products-table-container {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .products-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      
      th {
        background: #f9f9f9;
        font-weight: 600;
        font-size: 0.85rem;
        color: #666;
        text-transform: uppercase;
      }
      
      td {
        vertical-align: middle;
        
        strong {
          display: block;
          color: #333;
        }
        
        small {
          color: #999;
          font-size: 0.8rem;
        }
        
        .compare-price {
          text-decoration: line-through;
        }
        
        .low-stock {
          color: #e74c3c;
          font-weight: 600;
        }
      }
      
      .empty {
        text-align: center;
        color: #666;
        padding: 2rem;
      }
    }
    
    .product-thumb {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f8d7da;
      color: #721c24;
      
      &.active {
        background: #d4edda;
        color: #155724;
      }
    }
    
    .actions {
      display: flex;
      gap: 0.25rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s;
      border: none;
      
      &--primary {
        background: #4a7c4e;
        color: #fff;
        
        &:hover:not(:disabled) {
          background: #3d6640;
        }
        
        &:disabled {
          background: #ccc;
        }
      }
      
      &--secondary {
        background: #f5f5f5;
        color: #333;
        
        &:hover {
          background: #eee;
        }
      }
      
      &--icon {
        background: none;
        padding: 0.5rem;
        color: #666;
        
        &:hover {
          background: #f5f5f5;
          color: #333;
        }
        
        &.btn--danger:hover {
          background: #fee;
          color: #e74c3c;
        }
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
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      
      &--large {
        max-width: 700px;
      }
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #eee;
      
      h2 {
        margin: 0;
        font-size: 1.2rem;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
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
      
      &.checkboxes {
        margin-top: 1rem;
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
      
      input:not([type="checkbox"]), select, textarea {
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
      
      textarea {
        resize: vertical;
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

    .variants-row td { padding: 0; background: #f9f9f9; }

    .variants-panel {
      padding: 1rem 1.5rem;
      border-top: 2px solid #4a7c4e;

      h4 {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        color: #4a7c4e;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    }

    .variants-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      th, td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid #eee;
      }

      th {
        background: #f0f0f0;
        font-weight: 600;
        color: #555;
        font-size: 0.78rem;
        text-transform: uppercase;
      }
    }

    .btn--icon.active {
      background: #e8f5e9;
      color: #4a7c4e;
    }

    .btn--sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.82rem;
    }

    .image-upload-area {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border: 1px dashed #ddd;
      border-radius: 6px;
    }

    .image-preview-thumb {
      width: 72px;
      height: 72px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #eee;
      flex-shrink: 0;
    }

    .image-upload-controls {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .upload-success {
      color: #4a7c4e;
      font-size: 0.78rem;
    }

    .product-images-editor {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border: 1px dashed #ddd;
      border-radius: 6px;
      min-height: 90px;
      align-items: flex-start;
    }

    .product-image-tile {
      position: relative;
      width: 72px;
      height: 72px;

      img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid #eee;
      }
    }

    .remove-image-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #e74c3c;
      color: #fff;
      border: none;
      font-size: 0.85rem;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .add-image-tile {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 72px;
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  
  products = signal<AdminProduct[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingProduct = signal<AdminProduct | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  // Variant management
  expandedProduct = signal<number | null>(null);
  showVariantForm = signal(false);
  editingVariant = signal<AdminVariant | null>(null);
  editingVariantProduct = signal<AdminProduct | null>(null);
  savingVariant = signal(false);
  variantFormError = signal<string | null>(null);
  variantForm!: FormGroup;
  variantUploadingImage = signal(false);
  variantImagePreview = signal<string | null>(null);

  // Product image management
  productImageUrls = signal<string[]>([]);
  productUploadingImage = signal(false);

  productForm!: FormGroup;

  private readonly FORMAT_TO_FOLDER: Record<string, string> = {
    '100g': '100gr',
    '200g': '200gr',
    '1kg': '1000gr',
  };

  ngOnInit(): void {
    this.initForm();
    this.initVariantForm();
    this.loadProducts();
    this.loadCategories();
  }

  initVariantForm(): void {
    this.variantForm = this.fb.group({
      price: [0, [Validators.required, Validators.min(0)]],
      compare_price: [null],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      is_active: [true],
    });
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      compareAtPrice: [null],
      categoryId: [null],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      ingredients: [''],
      weight: [''],
      nutritionInfo: [''],
      isActive: [true],
      isFeatured: [false]
    });
  }
  
  loadProducts(): void {
    this.http.get<{items: AdminProduct[]}>(`${environment.apiUrl}/admin/products`).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  
  loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/products/categories`).subscribe({
      next: (categories) => this.categories.set(categories)
    });
  }
  
  openForm(): void {
    this.editingProduct.set(null);
    this.productImageUrls.set([]);
    this.productForm.reset({
      price: 0,
      stockQuantity: 0,
      isActive: true,
      isFeatured: false
    });
    this.showForm.set(true);
  }

  editProduct(product: AdminProduct): void {
    this.editingProduct.set(product);
    this.productImageUrls.set(product.images?.map(i => i.url) ?? []);
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compare_price,
      categoryId: product.category?.id,
      stockQuantity: product.stock,
      isActive: product.is_active,
      isFeatured: product.is_featured
    });
    this.showForm.set(true);
  }
  
  closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
    this.formError.set(null);
  }
  
  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    
    this.saving.set(true);
    this.formError.set(null);
    
    const formValue = this.productForm.value;
    const productData = {
      name: formValue.name,
      sku: formValue.sku,
      description: formValue.description,
      price: formValue.price,
      compare_price: formValue.compareAtPrice || null,
      category_id: formValue.categoryId || null,
      stock: formValue.stockQuantity,
      images: this.productImageUrls(),
      ingredients: formValue.ingredients,
      weight: formValue.weight,
      nutrition_info: formValue.nutritionInfo,
      is_active: formValue.isActive,
      is_featured: formValue.isFeatured
    };
    
    const request = this.editingProduct()
      ? this.http.put(`${environment.apiUrl}/admin/products/${this.editingProduct()!.id}`, productData)
      : this.http.post(`${environment.apiUrl}/admin/products`, productData);
    
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadProducts();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail || 'Error al guardar el producto');
      }
    });
  }
  
  deleteProduct(productId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.http.delete(`${environment.apiUrl}/admin/products/${productId}`).subscribe({
        next: () => this.loadProducts(),
        error: (err) => this.toastService.error('Error: ' + (err.error?.detail || 'Error al eliminar'))
      });
    }
  }

  // ── Variant management ──────────────────────────────────────────────────────

  toggleVariants(productId: number): void {
    this.expandedProduct.set(this.expandedProduct() === productId ? null : productId);
  }

  editVariant(product: AdminProduct, variant: AdminVariant): void {
    this.editingVariant.set(variant);
    this.editingVariantProduct.set(product);
    this.variantImagePreview.set(null);
    this.variantForm.patchValue({
      price: variant.price,
      compare_price: variant.compare_price,
      stock: variant.stock,
      sku: variant.sku || '',
      is_active: variant.is_active,
    });
    this.variantFormError.set(null);
    this.showVariantForm.set(true);
  }

  closeVariantForm(): void {
    this.showVariantForm.set(false);
    this.editingVariant.set(null);
    this.editingVariantProduct.set(null);
    this.variantFormError.set(null);
    this.variantImagePreview.set(null);
  }

  saveVariant(): void {
    if (this.variantForm.invalid) return;
    const variant = this.editingVariant();
    const product = this.editingVariantProduct();
    if (!variant || !product) return;

    this.savingVariant.set(true);
    this.variantFormError.set(null);

    const data: Record<string, unknown> = { ...this.variantForm.value };
    if (this.variantImagePreview()) {
      data['image_url'] = this.variantImagePreview();
    }

    this.http.put(
      `${environment.apiUrl}/admin/products/${product.id}/variants/${variant.id}`,
      data,
    ).subscribe({
      next: () => {
        this.savingVariant.set(false);
        this.toastService.success('Variante actualizada');
        this.closeVariantForm();
        this.loadProducts();
      },
      error: (err) => {
        this.savingVariant.set(false);
        this.variantFormError.set(err.error?.detail || 'Error al guardar la variante');
      },
    });
  }

  onVariantImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const variant = this.editingVariant();
    const product = this.editingVariantProduct();
    if (!variant || !product) return;

    const folder = this.FORMAT_TO_FOLDER[variant.format] ?? variant.format;
    const destPath = `products/${product.name}/${folder}`;

    this.variantUploadingImage.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dest_path', destPath);

    this.http.post<{ url: string }>(`${environment.apiUrl}/admin/upload-image`, formData).subscribe({
      next: (res) => {
        this.variantImagePreview.set(res.url);
        this.variantUploadingImage.set(false);
      },
      error: (err) => {
        this.variantUploadingImage.set(false);
        this.toastService.error('Error al subir imagen: ' + (err.error?.detail || 'Error desconocido'));
      },
    });
    input.value = '';
  }

  onProductImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const productName = this.productForm.value.name || this.editingProduct()?.name || 'producto';
    const destPath = `products/${productName}`;

    this.productUploadingImage.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dest_path', destPath);

    this.http.post<{ url: string }>(`${environment.apiUrl}/admin/upload-image`, formData).subscribe({
      next: (res) => {
        this.productImageUrls.update(urls => [...urls, res.url]);
        this.productUploadingImage.set(false);
      },
      error: (err) => {
        this.productUploadingImage.set(false);
        this.toastService.error('Error al subir imagen: ' + (err.error?.detail || 'Error desconocido'));
      },
    });
    input.value = '';
  }

  removeProductImage(index: number): void {
    this.productImageUrls.update(urls => urls.filter((_, i) => i !== index));
  }
}
