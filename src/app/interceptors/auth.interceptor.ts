import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../Services/auth.service'; // تأكد من المسار الصحيح
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const authApiUrl = `${environment.apiUrl}/api/auth`;

  // قائمة نقاط النهاية التي لا تتطلب مصادقة
  const noAuthRequiredEndpoints = [
    `${authApiUrl}/login`,
    // `${authApiUrl}/register`,
    `${authApiUrl}/forgot-password`,
    `${authApiUrl}/reset-password`,
    'https://generativelanguage.googleapis.com/' // إذا كنت تستخدم Gemini API أو أي API خارجي لا يتطلب توكنك الخاص
  ];

  // تحقق مما إذا كان الطلب إلى نقطة نهاية مستثناة
  const isExcludedEndpoint = noAuthRequiredEndpoints.some(url => {
    // استخدم console.log للتحقق من قيم URL
    console.log(`[AuthInterceptor] Checking URL: ${req.url}`);
    console.log(`[AuthInterceptor] Against public endpoint: ${url}`);
    const match = req.url.startsWith(url);
    if (match) {
      console.log(`[AuthInterceptor] Match found for public endpoint: ${url}`);
    }
    return match;
  });

  let clonedRequest = req;

  // أضف الـ Authorization header فقط إذا كان هناك توكن والطلب ليس لنقطة نهاية مستثناة
  if (token && !isExcludedEndpoint) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`[AuthInterceptor] Token ADDED to request: ${req.url}`);
  } else {
    console.log(`[AuthInterceptor] Token NOT added to request: ${req.url}. Is token present? ${!!token}. Is it an excluded endpoint? ${isExcludedEndpoint}`);
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('401 Unauthorized error caught by AuthInterceptor. Logging out if authenticated.', error);
        // تأكد من أننا نسجل الخروج فقط إذا كان المستخدم يُعتبر مسجل الدخول حاليًا
        // وهذا يمنع محاولة تسجيل الخروج مرارًا وتكرارًا إذا كان الـ AuthGuard قد أخرج المستخدم بالفعل
        if (authService.isLoggedIn()) {
           authService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
