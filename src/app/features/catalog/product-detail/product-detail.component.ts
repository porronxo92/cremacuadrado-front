import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, ProductListItem } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="product-detail">
      <div class="container">
        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Cargando producto...</p>
          </div>
        } @else if (!product()) {
          <div class="not-found">
            <h2>Producto no encontrado</h2>
            <a routerLink="/catalog">Volver a la tienda</a>
          </div>
        } @else {
          <!-- Breadcrumb -->
          <nav class="breadcrumb">
            <a routerLink="/">Inicio</a>
            <span>/</span>
            <a routerLink="/catalog">Tienda</a>
            <span>/</span>
            <span>{{ product()!.name }}</span>
          </nav>
          
          <div class="product">
            <!-- Gallery -->
            <div class="product__gallery">
              <div class="product__main-image">
                <img [src]="selectedImage() || (product()!.images && product()!.images!.length > 0 ? product()!.images![0].url : '/assets/images/placeholder.jpg')" [alt]="product()!.name">
              </div>
              @if (product()!.images && product()!.images!.length > 1) {
                <div class="product__thumbnails">
                  @for (image of product()!.images!; track $index) {
                    <button 
                      [class.active]="selectedImage() === image.url || (!selectedImage() && $index === 0)"
                      (click)="selectImage(image.url)">
                      <img [src]="image.url" [alt]="product()!.name">
                    </button>
                  }
                </div>
              }
            </div>
            
            <!-- Info -->
            <div class="product__info">
              @if (product()!.category) {
                <span class="product__category">{{ product()!.category!.name }}</span>
              }
              
              <h1 class="product__title">{{ product()!.name }}</h1>
              
              <div class="product__price">
                @if (product()!.compare_price && product()!.compare_price! > product()!.price) {
                  <span class="price-compare">{{ product()!.compare_price | currency:'EUR' }}</span>
                  <span class="price-discount">
                    -{{ getDiscount() }}%
                  </span>
                }
                <span class="price-current">{{ product()!.price | currency:'EUR' }}</span>
              </div>
              
              <div class="product__description" [innerHTML]="product()!.description">
              </div>
              
              <!-- Quantity & Add to cart -->
              <div class="product__actions">
                <div class="quantity-selector">
                  <button (click)="decreaseQuantity()" [disabled]="quantity === 1">-</button>
                  <input type="number" [(ngModel)]="quantity" min="1" [max]="product()!.stock">
                  <button (click)="increaseQuantity()" [disabled]="quantity >= product()!.stock">+</button>
                </div>
                
                <button 
                  class="btn btn--primary btn--large"
                  (click)="addToCart()"
                  [disabled]="!product()!.is_in_stock || addingToCart()">
                  @if (addingToCart()) {
                    Añadiendo...
                  } @else if (product()!.is_in_stock) {
                    Añadir al carrito - {{ (product()!.price * quantity) | currency:'EUR' }}
                  } @else {
                    Producto agotado
                  }
                </button>
              </div>
              
              <!-- Stock info -->
              <div class="product__stock">
                @if (!product()!.is_low_stock && product()!.is_in_stock) {
                  <span class="stock-available">✓ En stock</span>
                } @else if (product()!.is_low_stock) {
                  <span class="stock-low">⚠ Últimas {{ product()!.stock }} unidades</span>
                } @else {
                  <span class="stock-out">✗ Agotado</span>
                }
              </div>
              
              <!-- Features -->
              <div class="product__features">
                <div class="feature">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <span>Envío gratuito a partir de 30€</span>
                </div>
                <div class="feature">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Pago seguro garantizado</span>
                </div>
                <div class="feature">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>100% pistacho natural</span>
                </div>
              </div>
              
              <!-- Nutrition -->
              @if (product()!.nutrition) {
                <div class="product__nutrition">
                  <h3>Información nutricional (por 100g)</h3>
                  <div class="nutrition-grid">
                    @if (product()!.nutrition!.energy_kcal) {
                      <div class="nutrition-item">
                        <span class="label">Energía</span>
                        <span class="value">{{ product()!.nutrition!.energy_kcal }} kcal</span>
                      </div>
                    }
                    @if (product()!.nutrition!.fat !== null) {
                      <div class="nutrition-item">
                        <span class="label">Grasas</span>
                        <span class="value">{{ product()!.nutrition!.fat }}g</span>
                      </div>
                    }
                    @if (product()!.nutrition!.carbohydrates !== null) {
                      <div class="nutrition-item">
                        <span class="label">Carbohidratos</span>
                        <span class="value">{{ product()!.nutrition!.carbohydrates }}g</span>
                      </div>
                    }
                    @if (product()!.nutrition!.proteins !== null) {
                      <div class="nutrition-item">
                        <span class="label">Proteínas</span>
                        <span class="value">{{ product()!.nutrition!.proteins }}g</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          
          <!-- Related products -->
          @if (relatedProducts().length > 0) {
            <div class="related-products">
              <h2>Productos relacionados</h2>
              <div class="related-grid">
                @for (related of relatedProducts(); track related.id) {
                  <a [routerLink]="['/catalog', related.slug]" class="related-card">
                    <img [src]="related.primary_image || '/assets/images/placeholder.jpg'" [alt]="related.name">
                    <h4>{{ related.name }}</h4>
                    <span class="price">{{ related.price | currency:'EUR' }}</span>
                  </a>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .product-detail {
      padding: 2rem 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      
      a {
        color: #666;
        text-decoration: none;
        
        &:hover {
          color: #4a7c4e;
        }
      }
      
      span {
        color: #999;
      }
    }
    
    .product {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }
    
    .product__gallery {
    }
    
    .product__main-image {
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      background: #f5f5f5;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .product__thumbnails {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      
      button {
        width: 70px;
        height: 70px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        background: none;
        
        &.active {
          border-color: #4a7c4e;
        }
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
    
    .product__category {
      display: inline-block;
      background: #f0f7f0;
      color: #4a7c4e;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    
    .product__title {
      font-size: 2rem;
      color: #333;
      margin: 0.5rem 0 1rem;
    }
    
    .product__price {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      
      .price-compare {
        color: #999;
        text-decoration: line-through;
        font-size: 1.2rem;
      }
      
      .price-discount {
        background: #e74c3c;
        color: #fff;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      
      .price-current {
        color: #4a7c4e;
        font-size: 2rem;
        font-weight: 700;
      }
    }
    
    .product__description {
      color: #666;
      line-height: 1.7;
      margin-bottom: 1.5rem;

      ::ng-deep {
        p {
          margin: 0 0 1rem;
        }

        h3 {
          font-size: 1.1rem;
          color: #333;
          margin: 1.5rem 0 0.75rem;
        }

        ul {
          margin: 0 0 1rem;
          padding-left: 1.25rem;

          li {
            margin-bottom: 0.4rem;
            position: relative;

            &::marker {
              color: #4a7c4e;
            }
          }
        }

        strong {
          color: #333;
        }
      }
    }
    
    .product__actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      
      @media (max-width: 480px) {
        flex-direction: column;
      }
    }
    
    .quantity-selector {
      display: flex;
      align-items: stretch;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      
      button {
        width: 40px;
        border: none;
        background: #f5f5f5;
        cursor: pointer;
        font-size: 1.2rem;
        
        &:hover:not(:disabled) {
          background: #eee;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      
      input {
        width: 60px;
        text-align: center;
        border: none;
        border-left: 1px solid #ddd;
        border-right: 1px solid #ddd;
        font-size: 1rem;
        
        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
        }
      }
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
      
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
      
      &--large {
        flex: 1;
        padding: 1rem 2rem;
        font-size: 1.1rem;
      }
    }
    
    .product__stock {
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      
      .stock-available {
        color: #27ae60;
      }
      
      .stock-low {
        color: #f39c12;
      }
      
      .stock-out {
        color: #e74c3c;
      }
    }
    
    .product__features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      
      .feature {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.9rem;
        color: #666;
        
        svg {
          color: #4a7c4e;
        }
      }
    }
    
    .product__ingredients {
      margin-bottom: 1rem;

      h3 {
        font-size: 1rem;
        color: #333;
        margin-bottom: 0.5rem;
      }

      p {
        color: #666;
        font-size: 0.9rem;
        line-height: 1.6;
      }
    }

    .product__nutrition {
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #f8faf8 0%, #f0f5f0 100%);
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e0e8e0;

      h3 {
        font-size: 1rem;
        color: #333;
        margin: 0 0 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #4a7c4e;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &::before {
          content: '🥗';
          font-size: 1.1rem;
        }
      }
    }

    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .nutrition-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.08);
      }

      .label {
        color: #666;
        font-size: 0.9rem;
      }

      .value {
        font-weight: 600;
        color: #4a7c4e;
        font-size: 0.95rem;
      }
    }
    
    .related-products {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
      
      h2 {
        text-align: center;
        margin-bottom: 2rem;
        color: #333;
      }
    }
    
    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    
    .related-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-decoration: none;
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-4px);
      }
      
      img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
      }
      
      h4 {
        padding: 0.75rem 1rem 0.25rem;
        margin: 0;
        color: #333;
        font-size: 1rem;
      }
      
      .price {
        display: block;
        padding: 0 1rem 1rem;
        color: #4a7c4e;
        font-weight: 600;
      }
    }
    
    .loading, .not-found {
      text-align: center;
      padding: 3rem;
      color: #666;
      
      a {
        color: #4a7c4e;
      }
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #eee;
      border-top-color: #4a7c4e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  
  product = signal<Product | null>(null);
  relatedProducts = signal<ProductListItem[]>([]);
  loading = signal(true);
  addingToCart = signal(false);
  selectedImage = signal<string | null>(null);
  
  quantity = 1;
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.loadProduct(params['slug']);
      }
    });
  }
  
  loadProduct(slug: string): void {
    this.loading.set(true);
    this.productService.getProduct(slug).subscribe({
      next: (product: Product) => {
        this.product.set(product);
        this.loading.set(false);
        this.quantity = 1;
        this.selectedImage.set(null);
        
        // Load related products
        if (product.category?.slug) {
          this.loadRelatedProducts(product.category.slug, product.id);
        }
      },
      error: (err: Error) => {
        console.error('Error loading product:', err);
        this.loading.set(false);
      }
    });
  }
  
  loadRelatedProducts(categorySlug: string, excludeId: number): void {
    this.productService.getProducts({ category: categorySlug, page_size: 4 }).subscribe({
      next: (response) => {
        this.relatedProducts.set(response.items.filter(p => p.id !== excludeId).slice(0, 4));
      }
    });
  }
  
  selectImage(image: string): void {
    this.selectedImage.set(image);
  }
  
  increaseQuantity(): void {
    if (this.product() && this.quantity < this.product()!.stock) {
      this.quantity++;
    }
  }
  
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
  
  getDiscount(): number {
    if (this.product()?.compare_price && this.product()!.compare_price! > this.product()!.price) {
      return Math.round((1 - this.product()!.price / this.product()!.compare_price!) * 100);
    }
    return 0;
  }
  
  addToCart(): void {
    if (!this.product()) return;

    this.addingToCart.set(true);
    this.cartService.addItem(this.product()!.id, this.quantity).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.toastService.success('Producto añadido al carrito');
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        this.addingToCart.set(false);
        this.toastService.error('Error al añadir el producto');
      }
    });
  }
}
