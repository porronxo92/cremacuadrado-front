import { InjectionToken } from '@angular/core';

/**
 * Mutable box for the HTTP status code the server should respond with.
 *
 * Angular 18's CommonEngine.render() only returns an HTML string — there's
 * no RESPONSE_INIT token to set res.status() from inside the component tree
 * (that's Angular 19+). This token is provided once per request in
 * server.ts as a plain object; any component can inject it and mutate
 * `.code` (e.g. the 404 page, or a product/post that failed to load), and
 * server.ts reads the same object reference after render() resolves.
 *
 * Not provided at all on the client (browser bundle never imports this file
 * outside SSR-only code paths that already guard with isPlatformServer), so
 * `inject(RESPONSE_STATUS, { optional: true })` returns null there.
 */
export interface ResponseStatus {
  code: number;
}

export const RESPONSE_STATUS = new InjectionToken<ResponseStatus>('RESPONSE_STATUS');
