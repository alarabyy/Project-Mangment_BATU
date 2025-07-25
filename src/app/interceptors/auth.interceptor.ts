// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../Services/auth.service';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const authApiUrl = `${environment.apiUrl}/api/auth`;

  const noAuthRequiredEndpoints = [
    `${authApiUrl}/login`,
    `${authApiUrl}/register`,
    `${authApiUrl}/forgot-password`,
    `${authApiUrl}/reset-password`,
    'https://generativelanguage.googleapis.com/'
  ];

  const isExcludedEndpoint = noAuthRequiredEndpoints.some(url => req.url.startsWith(url));

  let clonedRequest = req;

  if (token && !isExcludedEndpoint) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('401 Unauthorized error caught by AuthInterceptor. Logging out if authenticated.', error);
        if (authService.isLoggedIn()) {
           authService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
