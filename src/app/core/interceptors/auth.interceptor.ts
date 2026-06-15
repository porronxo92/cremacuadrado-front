import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  
  // Add token to request if available
  if (token) {
    req = addToken(req, token);
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't try to refresh if the failing request is itself an auth endpoint.
      // /auth/refresh: prevents infinite recursion when the refresh token is invalid.
      // /auth/logout: the server-side logout failing doesn't require a retry.
      const isAuthInfraRequest =
        req.url.includes('/auth/refresh') || req.url.includes('/auth/logout');

      if (error.status === 401 && token && !isAuthInfraRequest) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap((tokens) => {
            if (tokens) {
              // Retry with new token
              return next(addToken(req, tokens.access_token));
            }
            return throwError(() => error);
          }),
          catchError(() => {
            // Refresh failed — session is irrecoverably stale
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
