import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';

import { routes } from './app.routes';
import { serverApiUrlInterceptor } from './core/interceptors/server-api-url.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { SelectivePreloadingStrategy } from './core/strategies/selective-preloading.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(SelectivePreloadingStrategy),
      withViewTransitions(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' })
    ),
    provideHttpClient(
      // withFetch(): the fetch-based backend is required for SSR — the
      // default XHR backend doesn't exist in Node.
      withFetch(),
      // serverApiUrlInterceptor must run first: it rewrites the request URL
      // on the server, and credentialsInterceptor's prefix check depends on
      // seeing the final URL.
      withInterceptors([serverApiUrlInterceptor, credentialsInterceptor, authInterceptor, errorInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'es' },
    // Serializes GET responses fetched during SSR into the HTML so the
    // browser reuses them on hydration instead of re-fetching (SSR-16).
    provideClientHydration(withHttpTransferCacheOptions({ includePostRequests: false })),
  ]
};
