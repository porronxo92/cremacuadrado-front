import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '@env/environment';

/**
 * Rewrites requests built against the relative environment.apiUrl to the
 * absolute environment.serverApiUrl when rendering on the server.
 *
 * A relative apiUrl (e.g. '/api/v1' in production) only resolves in the
 * browser, via the Vercel rewrite in vercel.json. Node's fetch has no origin
 * to resolve a relative URL against, so without this rewrite every SSR data
 * fetch throws (SSR-01). Must run before credentialsInterceptor, which keys
 * off the same apiUrl prefix.
 */
export const serverApiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (
    isPlatformServer(platformId) &&
    environment.apiUrl !== environment.serverApiUrl &&
    req.url.startsWith(environment.apiUrl)
  ) {
    req = req.clone({
      url: environment.serverApiUrl + req.url.slice(environment.apiUrl.length),
    });
  }

  return next(req);
};
