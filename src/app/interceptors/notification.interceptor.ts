// src/app/interceptors/notification.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { NotificationService } from '../Services/notification-proxy.service';

export const notificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred.';

      if (error.status === 0) {
        // Client-side or network error (e.g., disconnected, CORS issues)
        errorMessage = 'Network error: Could not connect to server. Please check your internet connection.';
        notificationService.showError(errorMessage);
      } else if (error.status >= 500) {
        // Server-side errors (5xx status codes)
        errorMessage = `Server error ${error.status}: Something went wrong on the server.`;
        // Attempt to get more specific message from server response body
        if (error.error && typeof error.error === 'object') {
          errorMessage = error.error.message || error.error.title || errorMessage;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        notificationService.showError(errorMessage);
      } else if (error.status >= 400 && error.status !== 401 && error.status !== 403) {
        // Client-side errors (4xx status codes, excluding 401 Unauthorized and 403 Forbidden
        // which might be handled by an authentication interceptor or specific login logic).
        errorMessage = `Request failed (${error.status}): ${error.statusText || 'Bad Request'}`;
        // Attempt to get more specific message from server response body
        if (error.error && typeof error.error === 'object') {
          errorMessage = error.error.message || error.error.title || errorMessage;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        notificationService.showError(errorMessage);
      }
      // For 401 Unauthorized or 403 Forbidden, you might have a dedicated interceptor
      // or logic to redirect to login, so we might not show a generic toast here.
      // If no specific handling, the error will still be re-thrown.

      return throwError(() => error); // Re-throw the error so downstream components can handle it
    })
  );
};
