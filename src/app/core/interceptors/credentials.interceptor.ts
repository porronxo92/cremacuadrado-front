import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Interceptor that adds withCredentials to all API requests.
 * This is necessary for cookies (like cart_session) to be sent with requests.
 */
export const credentialsInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Only add credentials for requests to our API
  if (req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      withCredentials: true
    });
  }

  return next(req);
};
