import { ApplicationRef, DestroyRef, inject } from '@angular/core';
import { first } from 'rxjs/operators';

/**
 * Ejecuta `fn` cuando la aplicación queda estable por primera vez.
 *
 * Con SSR + hidratación, Angular solo elimina el HTML "deshidratado" que pintó
 * el servidor (p. ej. el botón «Mi Cuenta» antes de saber que hay sesión, el
 * banner de cookies o el «carrito vacío») cuando la app está estable. Un
 * setInterval/setTimeout largo arrancado antes lo impide y deja ese HTML
 * duplicado y sin vida en pantalla. Por eso los temporizadores van aquí.
 *
 * Llamar en un contexto de inyección (constructor o inicializador de campo).
 */
export function runAfterStable(fn: () => void): void {
  const appRef = inject(ApplicationRef);
  const destroyRef = inject(DestroyRef);
  const sub = appRef.isStable.pipe(first(stable => stable)).subscribe(() => fn());
  destroyRef.onDestroy(() => sub.unsubscribe());
}
