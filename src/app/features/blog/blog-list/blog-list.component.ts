import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { BlogPostListItem } from '../../../core/models';

// Static blog data (from scraped content)
const STATIC_BLOGS: BlogPostListItem[] = [
  {
    id: 907,
    slug: 'pistachos-y-rendimiento-sexual',
    title: 'Pistachos y rendimiento sexual',
    excerpt: 'Pistachos y rendimiento sexual: ¿Realmente mejoran la función eréctil? El pistacho es un fruto seco conocido por sus propiedades nutricionales, pero recientemente ha ganado atención por su posible relación con la mejora de la función sexual...',
    featured_image_url: 'assets/images/blog/Pistachos-y-rendimiento-sexual-scaled.jpg',
    categories: [{ id: 1, slug: 'salud', name: 'Salud', description: null }],
    published_at: '2025-02-22T19:27:03'
  },
  {
    id: 1,
    slug: 'que-es-realmente-el-pistacho',
    title: '¿Qué es realmente el pistacho?',
    excerpt: 'Hace poco, un amigo me hizo una pregunta que nunca imaginé tener que responder: "¿Qué es realmente el pistacho?" Esta conversación me pareció interesante, así que aquí la comparto contigo...',
    featured_image_url: 'assets/images/blog/Fruto-pistacho-abierto.jpg',
    categories: [{ id: 2, slug: 'curiosidades', name: 'Curiosidades', description: null }],
    published_at: '2023-01-25T12:32:10'
  }
];

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="blog-page">
      <!-- Hero -->
      <section class="blog-hero">
        <div class="container">
          <h1>Blog</h1>
          <p class="subtitle">Descubre todo sobre el pistacho manchego</p>
        </div>
      </section>

      <!-- Blog Grid -->
      <section class="blog-section">
        <div class="container">
          @if (loading()) {
            <div class="loading">
              <div class="spinner"></div>
              <p>Cargando artículos...</p>
            </div>
          } @else if (posts().length === 0) {
            <div class="empty">
              <h2>No hay artículos disponibles</h2>
              <p>Próximamente publicaremos nuevo contenido</p>
            </div>
          } @else {
            <div class="blog-grid">
              @for (post of posts(); track post.id) {
                <article class="blog-card">
                  <a [routerLink]="['/blog', post.slug]" class="blog-card__image">
                    @if (post.featured_image_url) {
                      <img [src]="post.featured_image_url" [alt]="post.title">
                    } @else {
                      <div class="placeholder-image">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                      </div>
                    }
                  </a>
                  <div class="blog-card__content">
                    @if (post.categories.length > 0) {
                      <div class="blog-card__categories">
                        @for (cat of post.categories; track cat.id) {
                          <span class="category-tag">{{ cat.name }}</span>
                        }
                      </div>
                    }
                    <h2>
                      <a [routerLink]="['/blog', post.slug]">{{ post.title }}</a>
                    </h2>
                    @if (post.excerpt) {
                      <p class="blog-card__excerpt">{{ post.excerpt }}</p>
                    }
                    <div class="blog-card__meta">
                      @if (post.published_at) {
                        <span class="date">{{ post.published_at | date:'d MMM yyyy':'':'es' }}</span>
                      }
                      <a [routerLink]="['/blog', post.slug]" class="read-more">Leer más</a>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .blog-page {
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    // ── Blog page ─────────────────────────────────────
    .blog-page {
      background: #F4F1E9;
      min-height: 100vh;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* Hero */
    .blog-hero {
      background: #1A1208;
      padding: 4.5rem 0;
      text-align: center;

      h1 {
        font-family: 'Teko', sans-serif;
        font-size: 3.5rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        line-height: 1;
        color: #E6C15A;
        margin: 0 0 0.75rem;

        @media (max-width: 768px) { font-size: 2.5rem; }
      }

      .subtitle {
        font-family: 'Lora', serif;
        font-style: italic;
        font-size: 1.05rem;
        color: rgba(244, 241, 233, 0.75);
        margin: 0;
      }
    }

    /* Blog Section */
    .blog-section {
      padding: 3.5rem 0;
    }

    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .blog-card {
      background: #fff;
      border-radius: 2px;
      overflow: hidden;
      border: 1px solid #D9D3C5;
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(26, 18, 8, 0.11);
      }
    }

    .blog-card__image {
      display: block;
      height: 220px;
      overflow: hidden;
      background: #EDE9DD;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.45s ease;
      }

      &:hover img {
        transform: scale(1.05);
      }

      .placeholder-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #8C7F6A;
      }
    }

    .blog-card__content {
      padding: 1.5rem;
    }

    .blog-card__categories {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .category-tag {
      background: rgba(123, 23, 22, 0.08);
      color: #7B1716;
      padding: 2px 0.6rem;
      border-radius: 2px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .blog-card__content h2 {
      font-family: 'Teko', sans-serif;
      font-size: 1.55rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      line-height: 1.15;
      margin: 0.4rem 0 0.6rem;

      a {
        color: #1A1208;
        text-decoration: none;
        transition: color 0.2s;

        &:hover { color: #7B1716; }
      }
    }

    .blog-card__excerpt {
      font-family: 'Lora', serif;
      color: #5A4F3E;
      font-size: 0.9rem;
      line-height: 1.65;
      margin: 0 0 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .blog-card__meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #D9D3C5;

      .date {
        font-family: 'Poppins', sans-serif;
        color: #8C7F6A;
        font-size: 0.75rem;
        font-weight: 300;
      }

      .read-more {
        font-family: 'Poppins', sans-serif;
        color: #7B1716;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        transition: color 0.2s;

        &:hover { color: #E6C15A; }
      }
    }

    /* Loading & Empty */
    .loading, .empty {
      text-align: center;
      padding: 4rem 2rem;
      color: #5A4F3E;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 2px solid #D9D3C5;
      border-top-color: #7B1716;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty h2 {
      font-family: 'Teko', sans-serif;
      color: #7B1716;
      font-size: 2rem;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
  `]
})
export class BlogListComponent implements OnInit {
  private blogService = inject(BlogService);

  posts = signal<BlogPostListItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    // Try API first, fallback to static data
    this.blogService.getPosts(1, 10).subscribe({
      next: (response) => {
        if (response.items.length > 0) {
          this.posts.set(response.items);
        } else {
          // Use static data if API returns empty
          this.posts.set(STATIC_BLOGS);
        }
        this.loading.set(false);
      },
      error: () => {
        // Fallback to static data on error
        this.posts.set(STATIC_BLOGS);
        this.loading.set(false);
      }
    });
  }
}
