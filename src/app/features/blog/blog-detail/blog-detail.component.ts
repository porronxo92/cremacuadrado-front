import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { BlogPost } from '../../../core/models';

// Static blog data with full content
const STATIC_BLOG_POSTS: Record<string, BlogPost> = {
  'pistachos-y-rendimiento-sexual': {
    id: 907,
    slug: 'pistachos-y-rendimiento-sexual',
    title: 'Pistachos y rendimiento sexual',
    excerpt: 'Pistachos y rendimiento sexual: ¿Realmente mejoran la función eréctil?',
    content: `<h2>Pistachos y rendimiento sexual: ¿Realmente mejoran la función eréctil?</h2>
<p>El pistacho es un fruto seco conocido por sus propiedades nutricionales, pero recientemente ha ganado atención por su posible relación con la mejora de la función sexual. Un estudio realizado en Turquía sugiere que el consumo de pistachos podría beneficiar la salud sexual masculina, especialmente en el rendimiento sexual. Pero ¿es esto concluyente? En este artículo analizamos la evidencia disponible y los nutrientes que podrían influir en el rendimiento sexual, centrándonos en los pistachos y rendimiento sexual.</p>

<h3>¿Qué dice la ciencia sobre los pistachos y la capacidad sexual?</h3>
<p>Un estudio llevado a cabo por el Hospital Universitario y Centro de Investigación Atatürk de Ankara (Aldemir et al., 2011) examinó los efectos del consumo de pistachos en hombres con disfunción eréctil. Durante tres semanas, 17 hombres consumieron 100 gramos de pistachos diariamente. Los resultados mostraron mejoras en la función eréctil, el deseo sexual y la satisfacción general en las relaciones.</p>

<p>Según los investigadores, estas mejoras podrían deberse al contenido de <strong>arginina</strong> en los pistachos, un aminoácido precursor del óxido nítrico, que ayuda a dilatar los vasos sanguíneos y mejorar el flujo sanguíneo, incluyendo el de la región genital.</p>

<h3>¿Pistachos y Viagra natural?</h3>
<p>Es interesante notar que los pistachos y rendimiento sexual están ligados a la mejora de la salud cardiovascular, lo que a su vez impacta positivamente en la función eréctil.</p>

<p>Dada la relación entre los pistachos y la mejora del flujo sanguíneo, algunas personas han comenzado a referirse a estos frutos secos como una especie de «Viagra natural». Incluso en algunas regiones se les ha apodado el «Viagra de La Mancha», en referencia a su origen y sus supuestos beneficios en la salud sexual.</p>

<h3>¿Es concluyente este estudio?</h3>
<p>Si bien los resultados son interesantes, es importante considerar algunos factores que limitan su validez:</p>
<ul>
<li><strong>Tamaño de la muestra:</strong> Solo 17 personas participaron en el estudio, lo que es insuficiente para sacar conclusiones definitivas.</li>
<li><strong>Falta de estudios replicados:</strong> No existen otros estudios a gran escala que hayan replicado estos resultados.</li>
<li><strong>Duración del estudio:</strong> Tres semanas es un periodo corto para evaluar los efectos a largo plazo del consumo de pistachos en la función sexual.</li>
</ul>

<h3>Nutrientes del pistacho que podrían beneficiar el rendimiento sexual</h3>
<p>Aunque la relación directa entre pistachos y función sexual no está completamente demostrada, algunos de sus nutrientes tienen efectos positivos en la salud en general y podrían influir en el rendimiento sexual:</p>
<ul>
<li><strong>Arginina:</strong> Favorece la producción de óxido nítrico, lo que mejora la circulación sanguínea.</li>
<li><strong>Grasas saludables:</strong> Contribuyen a la salud cardiovascular, clave para una buena irrigación sanguínea.</li>
<li><strong>Antioxidantes:</strong> Protegen las células del estrés oxidativo, lo que podría tener un impacto positivo en la salud reproductiva.</li>
<li><strong>Selenio y zinc:</strong> Minerales esenciales para la fertilidad y el mantenimiento de niveles saludables de testosterona.</li>
</ul>

<h3>¿Cómo incorporar los pistachos en la dieta?</h3>
<p>Para aprovechar sus beneficios, puedes incluir los pistachos en diversas formas:</p>
<ul>
<li>Como snack saludable entre comidas.</li>
<li>Añadiéndolos a batidos o yogures.</li>
<li>En ensaladas y platos salados.</li>
<li>Utilizando crema de pistacho como aderezo o untado en pan integral.</li>
</ul>

<p>Si buscas una forma deliciosa de consumirlos, prueba nuestra <strong>crema de pistacho 100% artesanal</strong>, hecha con un proceso único de tostado ligero y molido en piedra.</p>

<h3>Conclusión</h3>
<p>El pistacho es un alimento rico en nutrientes beneficiosos, y aunque existe un estudio que sugiere su impacto positivo en la función sexual, la evidencia científica sigue siendo limitada. Sin embargo, su consumo dentro de una dieta equilibrada podría contribuir indirectamente a la salud sexual al mejorar la circulación sanguínea y la función cardiovascular. Aunque se les llame «Viagra natural» o incluso «Viagra de La Mancha», los pistachos no deben considerarse un sustituto de los tratamientos médicos para la disfunción eréctil.</p>

<h3>Preguntas frecuentes (FAQs)</h3>
<h4>¿Cuántos pistachos hay que comer al día para mejorar la circulación?</h4>
<p>No hay una cantidad exacta recomendada para este fin, pero estudios sugieren que unos 30-50 gramos al día pueden ser beneficiosos para la salud cardiovascular.</p>

<h4>¿Los pistachos pueden sustituir los tratamientos médicos para la disfunción eréctil?</h4>
<p>No. Aunque pueden contribuir a mejorar la circulación, no sustituyen medicamentos ni tratamientos médicos. Consulta siempre con un especialista.</p>

<h4>¿El pistacho tiene efectos en la testosterona?</h4>
<p>El pistacho contiene zinc y selenio, minerales clave en la producción de testosterona, pero no hay evidencia directa de que aumente significativamente sus niveles.</p>`,
    author_name: 'Cremacuadrado',
    featured_image_url: 'https://cremacuadrado.com/wp-content/uploads/2025/02/Pistachos-y-rendimiento-sexual-scaled.jpg',
    status: 'published',
    categories: [{ id: 1, slug: 'salud', name: 'Salud', description: null }],
    published_at: '2025-02-22T19:27:03',
    created_at: '2025-02-22T19:27:03',
    updated_at: '2025-02-22T19:27:03'
  },
  'que-es-realmente-el-pistacho': {
    id: 1,
    slug: 'que-es-realmente-el-pistacho',
    title: '¿Qué es realmente el pistacho?',
    excerpt: 'Hace poco, un amigo me hizo una pregunta que nunca imaginé tener que responder: "¿Qué es realmente el pistacho?"',
    content: `<h2>¿Qué es realmente el pistacho?</h2>
<p>Hace poco, un amigo me hizo una pregunta que nunca imaginé tener que responder: "¿Qué es realmente el pistacho?" Esta conversación me pareció interesante, así que aquí la comparto contigo.</p>

<h3>¿Pistacho? Mucho más que un simple fruto seco</h3>
<p>Cuando hablamos de pistacho, nos referimos tanto al delicioso alimento que consumimos como al árbol del que proviene, conocido como <strong>pistachero</strong>.</p>

<h3>Lo que comemos: la semilla del pistacho</h3>
<p>A menudo, el pistacho se clasifica como un «fruto seco», pero lo curioso es que en realidad lo que comemos es su <strong>semilla</strong>. Lo que llamamos «cáscara» es la parte interna del fruto que protege la semilla.</p>

<h3>La parte comestible: ¿semilla o fruto?</h3>
<p>Cuando disfrutas un pistacho, en realidad estás comiendo su semilla, igual que harías con una pipa. La pulpa externa del fruto se elimina tras la cosecha, y lo que queda es el embrión fecundado con sus primeras hojitas. Sin la presencia de pistacheros machos para polinizar a las hembras, no habría pistachos comestibles.</p>

<h3>Semejanzas con otros frutos</h3>
<p>El pistacho comparte características con otros frutos como la almendra o el melocotón. Mientras que en el caso del melocotón nos comemos la pulpa y desechamos la semilla, con la almendra hacemos lo contrario: conservamos la semilla y desechamos el fruto.</p>

<h3>Beneficios nutricionales que hacen del pistacho un superalimento</h3>
<p>Los frutos secos, incluyendo el pistacho, tienen en común:</p>
<ul>
<li><strong>Grasas saludables</strong>, una excelente fuente de energía.</li>
<li><strong>Proteínas</strong>, esenciales para la construcción de tejidos.</li>
</ul>
<p>Estos nutrientes permiten que la semilla tenga la energía y los recursos necesarios para germinar y convertirse en una nueva planta.</p>

<h3>Más allá del snack: disfruta el pistacho en nuevas recetas</h3>
<p>Los pistachos no solo son un snack delicioso, sino que también pueden transformar tus platos. En Cremacuadrado, elaboramos una <strong>crema de pistacho 100% natural</strong>, sin aditivos, perfecta para llevar tus recetas al siguiente nivel.</p>

<p>Prueba nuestra crema en:</p>
<ul>
<li>Salsas irresistibles.</li>
<li>Postres cremosos.</li>
<li>Untada en pan o tostadas.</li>
</ul>

<p>Imagina unas patatas fritas con una salsa de pistacho o un helado con un toque especial… ¡Las posibilidades son infinitas!</p>

<h3>Prueba la diferencia</h3>
<p>Descúbrela en nuestra tienda.</p>`,
    author_name: 'Cremacuadrado',
    featured_image_url: 'https://cremacuadrado.com/wp-content/uploads/2023/01/Fruto-pistacho-abierto.jpg',
    status: 'published',
    categories: [{ id: 2, slug: 'curiosidades', name: 'Curiosidades', description: null }],
    published_at: '2023-01-25T12:32:10',
    created_at: '2023-01-25T12:32:10',
    updated_at: '2023-01-25T12:32:10'
  }
};

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="blog-detail">
      <div class="container">
        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Cargando artículo...</p>
          </div>
        } @else if (!post()) {
          <div class="not-found">
            <h2>Artículo no encontrado</h2>
            <p>El artículo que buscas no existe o ha sido eliminado.</p>
            <a routerLink="/blog" class="btn btn--primary">Volver al blog</a>
          </div>
        } @else {
          <!-- Breadcrumb -->
          <nav class="breadcrumb">
            <a routerLink="/">Inicio</a>
            <span>/</span>
            <a routerLink="/blog">Blog</a>
            <span>/</span>
            <span>{{ post()!.title }}</span>
          </nav>

          <article class="article">
            <!-- Header -->
            <header class="article__header">
              @if (post()!.categories.length > 0) {
                <div class="article__categories">
                  @for (cat of post()!.categories; track cat.id) {
                    <span class="category-tag">{{ cat.name }}</span>
                  }
                </div>
              }
              <h1>{{ post()!.title }}</h1>
              <div class="article__meta">
                @if (post()!.author_name) {
                  <span class="author">Por {{ post()!.author_name }}</span>
                }
                @if (post()!.published_at) {
                  <span class="date">{{ post()!.published_at | date:'d MMMM yyyy':'':'es' }}</span>
                }
              </div>
            </header>

            <!-- Featured Image -->
            @if (post()!.featured_image_url) {
              <div class="article__image">
                <img [src]="post()!.featured_image_url" [alt]="post()!.title">
              </div>
            }

            <!-- Content -->
            <div class="article__content" [innerHTML]="post()!.content"></div>

            <!-- Footer -->
            <footer class="article__footer">
              <a routerLink="/blog" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Volver al blog
              </a>

              <div class="cta-box">
                <h3>¿Te ha gustado este artículo?</h3>
                <p>Descubre nuestra crema de pistacho 100% natural</p>
                <a routerLink="/catalog" class="btn btn--primary">Ver productos</a>
              </div>
            </footer>
          </article>
        }
      </div>
    </div>
  `,
  styles: [`
    .blog-detail {
      min-height: 100vh;
      padding: 2rem 0 4rem;
      background: #fafafa;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      flex-wrap: wrap;

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

    /* Article */
    .article {
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .article__header {
      padding: 2rem 2rem 1.5rem;
      text-align: center;

      @media (max-width: 480px) {
        padding: 1.5rem 1rem 1rem;
      }
    }

    .article__categories {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .category-tag {
      background: #f0f7f0;
      color: #4a7c4e;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .article__header h1 {
      font-size: 2rem;
      color: #333;
      margin: 0 0 1rem;
      line-height: 1.3;

      @media (max-width: 480px) {
        font-size: 1.5rem;
      }
    }

    .article__meta {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      color: #999;
      font-size: 0.9rem;
    }

    .article__image {
      width: 100%;
      max-height: 400px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .article__content {
      padding: 2rem;
      line-height: 1.8;
      color: #444;

      @media (max-width: 480px) {
        padding: 1.5rem 1rem;
      }

      ::ng-deep {
        h2 {
          font-size: 1.5rem;
          color: #333;
          margin: 2rem 0 1rem;

          &:first-child {
            margin-top: 0;
          }
        }

        h3 {
          font-size: 1.25rem;
          color: #333;
          margin: 1.75rem 0 0.75rem;
        }

        h4 {
          font-size: 1.1rem;
          color: #333;
          margin: 1.5rem 0 0.5rem;
        }

        p {
          margin: 0 0 1rem;
        }

        ul, ol {
          margin: 0 0 1rem;
          padding-left: 1.5rem;

          li {
            margin-bottom: 0.5rem;
          }
        }

        strong {
          color: #333;
        }

        a {
          color: #4a7c4e;
          text-decoration: underline;

          &:hover {
            text-decoration: none;
          }
        }
      }
    }

    .article__footer {
      padding: 2rem;
      border-top: 1px solid #eee;

      @media (max-width: 480px) {
        padding: 1.5rem 1rem;
      }
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #4a7c4e;
      text-decoration: none;
      font-weight: 500;
      margin-bottom: 2rem;
      transition: color 0.2s;

      &:hover {
        color: #3d6640;
      }
    }

    .cta-box {
      background: linear-gradient(135deg, #f0f7f0 0%, #e8f2e8 100%);
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;

      h3 {
        font-size: 1.2rem;
        color: #333;
        margin: 0 0 0.5rem;
      }

      p {
        color: #666;
        margin: 0 0 1rem;
      }
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;

      &--primary {
        background: #4a7c4e;
        color: #fff;

        &:hover {
          background: #3d6640;
        }
      }
    }

    /* Loading & Not found */
    .loading, .not-found {
      text-align: center;
      padding: 4rem 2rem;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      h2 {
        color: #333;
        margin-bottom: 0.5rem;
      }

      p {
        color: #666;
        margin-bottom: 1.5rem;
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
export class BlogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);

  post = signal<BlogPost | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.loadPost(params['slug']);
      }
    });
  }

  loadPost(slug: string): void {
    this.loading.set(true);

    // Try API first
    this.blogService.getPost(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: () => {
        // Fallback to static data
        const staticPost = STATIC_BLOG_POSTS[slug];
        if (staticPost) {
          this.post.set(staticPost);
        }
        this.loading.set(false);
      }
    });
  }
}
