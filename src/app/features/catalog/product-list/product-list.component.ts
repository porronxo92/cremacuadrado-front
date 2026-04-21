import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductFilters } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductListItem, Category } from '../../../core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="catalog">
      <div class="container">
        <!-- Header -->
        <div class="catalog__header">
          <h1>Nuestra Tienda</h1>
          <p>Descubre nuestras cremas de pistacho artesanales</p>
        </div>
        
        <div class="catalog__layout">
          <!-- Filters sidebar -->
          <aside class="catalog__filters">
            <div class="filter-section">
              <h3>Categorías</h3>
              <ul class="filter-list">
                <li>
                  <label>
                    <input 
                      type="radio" 
                      name="category" 
                      [checked]="!selectedCategory()"
                      (change)="selectCategory(null)">
                    Todas
                  </label>
                </li>
                @for (category of categories(); track category.id) {
                  <li>
                    <label>
                      <input 
                        type="radio" 
                        name="category" 
                        [checked]="selectedCategory() === category.slug"
                        (change)="selectCategory(category.slug)">
                      {{ category.name }}
                    </label>
                  </li>
                }
              </ul>
            </div>
            
            <div class="filter-section">
              <h3>Precio</h3>
              <div class="price-range">
                <input 
                  type="number" 
                  placeholder="Mín" 
                  [(ngModel)]="minPrice"
                  (change)="filterProducts()">
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Máx" 
                  [(ngModel)]="maxPrice"
                  (change)="filterProducts()">
              </div>
            </div>
            
            <div class="filter-section">
              <h3>Ordenar por</h3>
              <select [(ngModel)]="sortBy" (change)="filterProducts()">
                <option value="">Relevancia</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_asc">Nombre: A-Z</option>
                <option value="name_desc">Nombre: Z-A</option>
              </select>
            </div>
          </aside>
          
          <!-- Products grid -->
          <main class="catalog__products">
            @if (loading()) {
              <div class="loading">
                <div class="spinner"></div>
                <p>Cargando productos...</p>
              </div>
            } @else if (products().length === 0) {
              <div class="empty">
                <p>No se encontraron productos</p>
              </div>
            } @else {
              <div class="products-grid">
                @for (product of products(); track product.id) {
                  <div class="product-card">
                    <a [routerLink]="['/catalog', product.slug]" class="product-card__image">
                      <img [src]="product.primary_image || '/assets/images/placeholder.jpg'" [alt]="product.name">
                      @if (product.compare_price && product.compare_price > product.price) {
                        <span class="badge badge--sale">Oferta</span>
                      }
                      @if (product.is_featured) {
                        <span class="badge badge--featured">Destacado</span>
                      }
                    </a>
                    <div class="product-card__info">
                      <h3>
                        <a [routerLink]="['/catalog', product.slug]">{{ product.name }}</a>
                      </h3>
                      <p class="product-card__description">{{ product.short_description || '' | slice:0:80 }}...</p>
                      <div class="product-card__price">
                        @if (product.compare_price && product.compare_price > product.price) {
                          <span class="price-compare">{{ product.compare_price | currency:'EUR' }}</span>
                        }
                        <span class="price-current">{{ product.price | currency:'EUR' }}</span>
                      </div>
                      <button 
                        class="btn btn--primary" 
                        (click)="addToCart(product)"
                        [disabled]="!product.is_in_stock">
                        @if (product.is_in_stock) {
                          Añadir al carrito
                        } @else {
                          Agotado
                        }
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalog {
      padding: 2rem 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .catalog__header {
      text-align: center;
      margin-bottom: 2rem;
      
      h1 {
        color: #4a7c4e;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #666;
      }
    }
    
    .catalog__layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    
    .catalog__filters {
      @media (max-width: 768px) {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
    }
    
    .filter-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
      
      h3 {
        font-size: 1rem;
        margin-bottom: 0.75rem;
        color: #333;
      }
      
      @media (max-width: 768px) {
        flex: 1;
        min-width: 150px;
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
    }
    
    .filter-list {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        margin-bottom: 0.5rem;
      }
      
      label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
        color: #666;
        
        &:hover {
          color: #4a7c4e;
        }
      }
    }
    
    .price-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      input {
        width: 70px;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
      }
    }
    
    select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .product-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }
    }
    
    .product-card__image {
      display: block;
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }
      
      &:hover img {
        transform: scale(1.05);
      }
    }
    
    .badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      
      &--sale {
        background: #e74c3c;
        color: #fff;
      }
      
      &--featured {
        background: #4a7c4e;
        color: #fff;
        left: auto;
        right: 0.5rem;
      }
    }
    
    .product-card__info {
      padding: 1rem;
      
      h3 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
        
        a {
          color: #333;
          text-decoration: none;
          
          &:hover {
            color: #4a7c4e;
          }
        }
      }
    }
    
    .product-card__description {
      color: #666;
      font-size: 0.85rem;
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }
    
    .product-card__price {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      
      .price-compare {
        color: #999;
        text-decoration: line-through;
        font-size: 0.9rem;
      }
      
      .price-current {
        color: #4a7c4e;
        font-size: 1.2rem;
        font-weight: 700;
      }
    }
    
    .btn {
      width: 100%;
      padding: 0.75rem;
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
    }
    
    .loading, .empty {
      text-align: center;
      padding: 3rem;
      color: #666;
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
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  
  products = signal<ProductListItem[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  selectedCategory = signal<string | null>(null);
  
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: string = '';
  
  ngOnInit(): void {
    const categoryParam = this.route.snapshot.queryParamMap.get('category');
    if (categoryParam) {
      this.selectedCategory.set(categoryParam);
    }
    this.loadCategories();
    this.filterProducts();
  }
  
  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Error loading categories:', err)
    });
  }
  
  filterProducts(): void {
    this.loading.set(true);
    
    const params: ProductFilters = {};
    if (this.selectedCategory()) {
      params.category = this.selectedCategory()!;
    }
    if (this.minPrice) {
      params.min_price = this.minPrice;
    }
    if (this.maxPrice) {
      params.max_price = this.maxPrice;
    }
    if (this.sortBy) {
      const [field, order] = this.sortBy.split('_');
      params.sort_by = field as 'name' | 'price' | 'created_at';
      params.sort_order = order as 'asc' | 'desc';
    }
    
    this.productService.getProducts(params).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading.set(false);
      }
    });
  }
  
  selectCategory(categorySlug: string | null): void {
    this.selectedCategory.set(categorySlug);
    this.filterProducts();
  }
  
  addToCart(product: ProductListItem): void {
    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.toastService.success('Producto añadido al carrito');
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        this.toastService.error('Error al añadir el producto');
      }
    });
  }
}
