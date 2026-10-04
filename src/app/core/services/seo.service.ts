import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '@env/environment';

export interface SeoConfig {
  /** Page title, without the brand suffix — set() appends " | CremaCuadrado". */
  title: string;
  /** Meta description, ≤155 characters. */
  description: string;
  /** Route path starting with '/', e.g. '/tienda/crema-pistacho-pura'. */
  path: string;
  /** Absolute image URL for og:image. Falls back to the site logo. */
  image?: string;
  /** og:type — defaults to 'website'; use 'product' or 'article' where relevant. */
  type?: string;
}

const DEFAULT_IMAGE = `${environment.siteUrl}/assets/images/logocrema2-100x100.png`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleService = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  // Canonical/OG URLs use the environment's configured public origin
  // (environment.siteUrl), regardless of which host actually served the
  // request (a Vercel deployment URL, a preview alias…). Non-production
  // environments are also served with noindex (server.ts), so they never
  // compete with the real site.
  private readonly siteOrigin = environment.siteUrl;

  set(config: SeoConfig): void {
    const fullTitle = `${config.title} | CremaCuadrado`;
    const canonicalUrl = `${this.siteOrigin}${config.path}`;

    this.titleService.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: config.image ?? DEFAULT_IMAGE });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.setCanonical(canonicalUrl);
  }

  /** Injects (or replaces) a JSON-LD block. `id` must be unique per block on the page. */
  setJsonLd(id: string, data: object): void {
    this.removeJsonLd(id);
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  removeJsonLd(id: string): void {
    this.document.getElementById(id)?.remove();
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
