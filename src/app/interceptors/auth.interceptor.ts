// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../environments/environment'; // Ensure this path is correct
import { AuthService } from '../Services/auth.service'; // Make sure this path is correct

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const authApiUrl = `${environment.apiUrl}/auth`;

  // Define endpoints that *do not* require your application's JWT token.
  // This now includes your authentication endpoints AND the Gemini API.
  const noAuthRequiredEndpoints = [
    `${authApiUrl}/login`,
    `${authApiUrl}/forgot-password`, // تم التصحيح ليتوافق مع اسم الدالة في AuthService
    `${authApiUrl}/reset-password`,
    // THIS IS THE FIX: Add Google's Gemini API base URL here to exclude it from JWT auth
    'https://generativelanguage.googleapis.com/'
  ];

  // Check if the current request URL starts with any of the excluded endpoints
  const isExcludedEndpoint = noAuthRequiredEndpoints.some(url => req.url.startsWith(url));

  let clonedRequest = req;

  // Only add the Authorization header if a token exists AND the endpoint is NOT excluded
  if (token && !isExcludedEndpoint) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // If a 401 error occurs and the user is logged in, then log them out.
      // This correctly handles cases where your *application's* token is expired/invalid.
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
