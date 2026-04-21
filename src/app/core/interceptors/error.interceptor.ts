import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            errorMessage = error.error?.detail || 'Solicitud incorrecta';
            break;
          case 401:
            errorMessage = error.error?.detail || 'No autorizado';
            break;
          case 403:
            errorMessage = error.error?.detail || 'Acceso denegado';
            break;
          case 404:
            errorMessage = error.error?.detail || 'No encontrado';
            break;
          case 422:
            // Validation error
            if (error.error?.detail) {
              if (Array.isArray(error.error.detail)) {
                errorMessage = error.error.detail.map((e: any) => e.msg).join(', ');
              } else {
                errorMessage = error.error.detail;
              }
            } else {
              errorMessage = 'Error de validación';
            }
            break;
          case 500:
            errorMessage = 'Error del servidor';
            break;
          default:
            errorMessage = error.error?.detail || `Error: ${error.status}`;
        }
      }
      
      // Log error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: req.url,
      });
      
      // Return error with the message
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        original: error
      }));
    })
  );
};
