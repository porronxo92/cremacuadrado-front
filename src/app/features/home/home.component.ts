import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { BlogService } from '../../core/services/blog.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductListItem, BlogPostListItem } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Hero section -->
    <section class="hero">
      <!-- Imagen responsiva: móvil/tablet ≤768px usa la versión vertical -->
      <picture class="hero__picture">
        <source media="(max-width: 768px)" srcset="assets/images/cabecera_tablet-movil.jpg">
        <img
          src="assets/images/Cabecera-web.jpg"
          alt="Cremacuadrado — Crema de pistacho artesanal"
          class="hero__bg-img"
          loading="eager"
          fetchpriority="high"
        >
      </picture>
      <!-- Gradiente inferior para legibilidad del CTA -->
      <div class="hero__overlay"></div>
      <div class="hero__content">
        <p class="hero__tagline">100% natural · sin aditivos</p>
        <a routerLink="/catalog" class="btn btn--cta">Descubrir productos</a>
      </div>
    </section>
    
    <!-- Features -->
    <section class="features">
      <div class="container">
        <div class="features__grid">
          <div class="feature">
            <div class="feature__icon">🌿</div>
            <h3>100% Natural</h3>
            <p>Sin conservantes ni aditivos artificiales</p>
          </div>
          <div class="feature">
            <div class="feature__icon">�🇸</div>
            <h3>Pistacho de Ciudad Real</h3>
            <p>Cultivado en España, en la mejor tierra para el pistacho</p>
          </div>
          <div class="feature">
            <div class="feature__icon">🚚</div>
            <h3>Envío Gratuito</h3>
            <p>En pedidos superiores a 30€</p>
          </div>
          <div class="feature">
            <div class="feature__icon">❤️</div>
            <h3>Hecho con Amor</h3>
            <p>Producción artesanal en pequeños lotes</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Featured products -->
    <section class="featured-products">
      <div class="container">
        <h2>Nuestros Productos</h2>
        <p class="section-subtitle">Cremas artesanales de pistacho para todos los gustos</p>
        
        @if (loadingProducts()) {
          <div class="loading">Cargando productos...</div>
        } @else {
          <div class="products-grid">
            @for (product of featuredProducts(); track product.id) {
              <div class="product-card">
                <a [routerLink]="['/catalog', product.slug]" class="product-card__image">
                  <img [src]="product.primary_image || '/assets/images/placeholder.jpg'" [alt]="product.name">
                  @if (product.compare_price && product.compare_price > product.price) {
                    <span class="badge badge--sale">Oferta</span>
                  }
                </a>
                <div class="product-card__info">
                  <h3>
                    <a [routerLink]="['/catalog', product.slug]">{{ product.name }}</a>
                  </h3>
                  <div class="product-card__price">
                    @if (product.compare_price && product.compare_price > product.price) {
                      <span class="price-compare">{{ product.compare_price | currency:'EUR' }}</span>
                    }
                    <span class="price-current">{{ product.price | currency:'EUR' }}</span>
                  </div>
                  <div class="product-card__actions">
                    <button class="btn btn--primary btn--sm" (click)="addToCart(product)">Añadir al carrito</button>
                    <button class="btn btn--cta-quick btn--sm" (click)="buyNow(product)">Compra en un clic</button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
        
        <div class="section-cta">
          <a routerLink="/catalog" class="btn btn--secondary">Ver todos los productos</a>
        </div>
      </div>
    </section>
    
    <!-- About section -->
    <section class="about">
      <div class="container">
        <div class="about__grid">
          <div class="about__image">
            <img src="/assets/images/nosotros/principal-quienes.somos2_.jpg" alt="Cremacuadrado">
          </div>
          <div class="about__content">
            <h2>Nuestra Historia</h2>
            <p>
              Cremacuadrado nació de la pasión por el auténtico sabor del pistacho español.
              Descubrimos que la provincia de Ciudad Real, con su clima continental y suelos únicos,
              produce un pistacho excepcional — nuestro mayor orgullo y el corazón de cada producto.
            </p>
            <p>
              Cada tarro de nuestra crema es elaborado artesanalmente con pistachos seleccionados
              de Ciudad Real, la región española que da vida a los mejores pistachos del país.
            </p>
            <a routerLink="/pages/sobre-nosotros" class="btn btn--outline">Conoce más sobre nosotros</a>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Blog section -->
    @if (latestPosts().length > 0) {
      <section class="blog-section">
        <div class="container">
          <h2>Del Blog</h2>
          <p class="section-subtitle">Recetas, consejos y novedades</p>
          
          <div class="blog-grid">
            @for (post of latestPosts(); track post.id) {
              <a [routerLink]="['/blog', post.slug]" class="blog-card">
                @if (post.featured_image_url) {
                  <div class="blog-card__image">
                    <img [src]="post.featured_image_url" [alt]="post.title">
                  </div>
                }
                <div class="blog-card__content">
                  <span class="blog-card__date">{{ post.published_at | date:'dd MMM yyyy' }}</span>
                  <h3>{{ post.title }}</h3>
                  <p>{{ post.excerpt }}</p>
                </div>
              </a>
            }
          </div>
          
          <div class="section-cta">
            <a routerLink="/blog" class="btn btn--secondary">Ver todos los artículos</a>
          </div>
        </div>
      </section>
    }
    
    <!-- Newsletter -->
    <section class="newsletter">
      <div class="container">
        <h2>Únete a nuestra comunidad</h2>
        <p>Recibe recetas exclusivas, ofertas especiales y novedades en tu correo.</p>
        <form class="newsletter__form" (submit)="subscribeNewsletter($event)">
          <input type="email" placeholder="Tu email" required>
          <button type="submit" class="btn btn--primary">Suscribirse</button>
        </form>
      </div>
    </section>
  `,
  styles: [`
    // ── Hero ──────────────────────────────────────────────
    .hero {
      position: relative;
      width: 100%;
      overflow: hidden;
      background-color: #F4F1E9; // fallback crema mientras carga
    }

    .hero__picture {
      display: block;
      width: 100%;
      line-height: 0;
    }

    .hero__bg-img {
      display: block;
      width: 100%;
      height: auto;
      // Desktop: imagen panorámica mantiene proporción natural (aprox. 1500x600)
      object-fit: cover;
    }

    // Gradiente sutil en la parte inferior para dar legibilidad al CTA
    .hero__overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 45%;
      background: linear-gradient(
        to top,
        rgba(244, 241, 233, 0.92) 0%,
        rgba(244, 241, 233, 0.55) 50%,
        rgba(244, 241, 233, 0) 100%
      );
      pointer-events: none;
    }

    .hero__content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: 3rem;
      gap: 1.25rem;
      z-index: 1;
    }

    .hero__tagline {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1rem;
      color: #5A4F3E;
      letter-spacing: 0.06em;
      margin: 0;
    }

    .btn--cta {
      display: inline-flex;
      align-items: center;
      background-color: #7B1716;
      color: #E6C15A;
      padding: 0.7rem 2.2rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-decoration: none;
      border-radius: 2px;
      border: 2px solid #7B1716;
      transition: background 200ms ease, color 200ms ease;

      &:hover {
        background-color: #8E1C1B;
        border-color: #8E1C1B;
        color: #F0D17A;
      }
    }

    // Móvil/tablet: imagen vertical más alta
    @media (max-width: 768px) {
      .hero__overlay {
        height: 35%;
      }

      .hero__content {
        padding-bottom: 2rem;
        gap: 1rem;
      }

      .hero__tagline {
        font-size: 0.875rem;
      }
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .features {
      padding: 4rem 0;
      background: #f9f9f9;
    }
    
    .features__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }
    
    .feature {
      text-align: center;
      
      &__icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      h3 {
        color: #333;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #666;
        font-size: 0.9rem;
      }
    }
    
    .featured-products {
      padding: 2.5rem 0;
      
      h2 {
        text-align: center;
        color: #333;
        margin-bottom: 0.5rem;
        font-size: 1.5rem;
      }
    }
    
    .section-subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    
    .product-card {
      background: #fff;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-3px);
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
      top: 0.4rem;
      left: 0.4rem;
      padding: 0.2rem 0.45rem;
      border-radius: 3px;
      font-size: 0.7rem;
      font-weight: 600;
      
      &--sale {
        background: #e74c3c;
        color: #fff;
      }
    }
    
    .product-card__info {
      padding: 0.75rem;
      
      h3 {
        margin: 0 0 0.35rem;
        font-size: 0.9rem;
        
        a {
          color: #333;
          text-decoration: none;
          
          &:hover {
            color: #7B1716;
          }
        }
      }
    }
    
    .product-card__price {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
      
      .price-compare {
        color: #999;
        text-decoration: line-through;
        font-size: 0.8rem;
      }
      
      .price-current {
        color: #7B1716;
        font-size: 1rem;
        font-weight: 700;
      }
    }

    .product-card__actions {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    
    .section-cta {
      text-align: center;
      margin-top: 2rem;
    }
    
    .about {
      padding: 4rem 0;
      background: #f9f9f9;
    }
    
    .about__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    
    .about__image {
      border-radius: 8px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: auto;
      }
    }
    
    .about__content {
      h2 {
        color: #4a7c4e;
        margin-bottom: 1rem;
      }
      
      p {
        color: #666;
        line-height: 1.8;
        margin-bottom: 1rem;
      }
    }
    
    .blog-section {
      padding: 4rem 0;
      
      h2 {
        text-align: center;
        color: #333;
      }
    }
    
    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .blog-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-decoration: none;
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-4px);
      }
      
      &__image {
        aspect-ratio: 16/9;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      &__content {
        padding: 1.5rem;
      }
      
      &__date {
        font-size: 0.8rem;
        color: #999;
      }
      
      h3 {
        color: #333;
        margin: 0.5rem 0;
        font-size: 1.1rem;
      }
      
      p {
        color: #666;
        font-size: 0.9rem;
        line-height: 1.6;
        margin: 0;
      }
    }
    
    .newsletter {
      padding: 4rem 0;
      background: #4a7c4e;
      color: #fff;
      text-align: center;
      
      h2 {
        margin-bottom: 0.5rem;
      }
      
      p {
        opacity: 0.9;
        margin-bottom: 1.5rem;
      }
      
      &__form {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        max-width: 400px;
        margin: 0 auto;
        
        input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        @media (max-width: 480px) {
          flex-direction: column;
        }
      }
    }
    
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;
      text-align: center;

      &--sm {
        padding: 0.45rem 0.75rem;
        font-size: 0.78rem;
      }
      
      &--primary {
        background: #7B1716;
        color: #E6C15A;
        
        &:hover {
          background: #8E1C1B;
        }
      }

      &--cta-quick {
        background: #E6C15A;
        color: #7B1716;
        border: 1px solid #D4AF48;

        &:hover {
          background: #D4AF48;
        }
      }
      
      &--secondary {
        background: #333;
        color: #fff;
        
        &:hover {
          background: #222;
        }
      }
      
      &--outline {
        background: none;
        border: 2px solid #4a7c4e;
        color: #4a7c4e;
        
        &:hover {
          background: #4a7c4e;
          color: #fff;
        }
      }
      
      &--large {
        padding: 1rem 2rem;
        font-size: 1.1rem;
      }
    }
    
    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `]
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private blogService = inject(BlogService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  
  featuredProducts = signal<ProductListItem[]>([]);
  latestPosts = signal<BlogPostListItem[]>([]);
  loadingProducts = signal(true);
  
  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadLatestPosts();
  }
  
  loadFeaturedProducts(): void {
    this.productService.getFeaturedProducts().subscribe({
      next: (products) => {
        this.featuredProducts.set(products.slice(0, 4));
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
      }
    });
  }
  
  loadLatestPosts(): void {
    this.blogService.getPosts(1, 3).subscribe({
      next: (response) => {
        this.latestPosts.set(response.items);
      }
    });
  }
  
  addToCart(product: ProductListItem): void {
    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.toastService.success('Producto añadido al carrito');
      },
      error: (err) => {
        this.toastService.error('Error al añadir el producto');
      }
    });
  }

  buyNow(product: ProductListItem): void {
    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.router.navigate(['/checkout']);
      },
      error: () => {
        this.toastService.error('Error al procesar la compra');
      }
    });
  }

  subscribeNewsletter(event: Event): void {
    event.preventDefault();
    this.toastService.success('¡Gracias por suscribirte! Pronto recibirás novedades.');
  }
}
