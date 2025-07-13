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
      // Customize which errors trigger notifications
      if (error.status === 0) {
        notificationService.showNotification('Network error: Could not connect to server.', 'error');
      } else if (error.status >= 500) {
        notificationService.showNotification(`Server error ${error.status}: Something went wrong.`, 'error');
      } else if (error.status >= 400 && error.status !== 401) {
        const errorMessage = error.error?.message || error.error?.title || `Error ${error.status}: ${error.statusText}`;
        notificationService.showNotification(`Request failed: ${errorMessage}`, 'error');
      }
      return throwError(() => error);
    })
  );
};
