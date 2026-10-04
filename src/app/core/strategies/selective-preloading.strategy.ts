import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Preloads every lazy route except those marked `data: { preload: false }`
 * (admin/** and account/**, set in app.routes.ts).
 *
 * PreloadAllModules downloaded every lazy chunk right after bootstrap,
 * including the ~150 kB of admin-only chunks (products, users, orders…) for
 * every anonymous visitor who will never see /admin — wasted bandwidth that
 * competes with hydration for CPU and network on first load (SSR-12).
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] === false) {
      return of(null);
    }
    return load();
  }
}
