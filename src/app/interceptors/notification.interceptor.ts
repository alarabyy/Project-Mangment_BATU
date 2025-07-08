import { HttpInterceptorFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { NotificationService } from '../Services/notification-proxy.service';
// تأكد من أن هذا المسار صحيح، يجب أن يكون إلى notification.service.ts وليس notification-proxy.service.ts

export const notificationInterceptor: HttpInterceptorFn = (req, next) => {
  // استخدام inject للحصول على نسخة من الخدمة
  const notificationService = inject(NotificationService);
  const methodsToNotify = ['POST', 'PUT', 'DELETE'];

  // إذا لم يكن الطلب من الأنواع التي نريد تتبعها، نتجاهله
  if (!methodsToNotify.includes(req.method)) {
    return next(req);
  }

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      // نتأكد أن الحدث هو استجابة ناجحة من الخادم
      if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
        let action = 'updated';
        let type: 'success' | 'info' | 'error' = 'info';

        // نحدد نوع العملية والرسالة بناءً على نوع الطلب
        if (req.method === 'POST') {
          action = 'created';
          type = 'success';
        }
        if (req.method === 'DELETE') {
          action = 'deleted';
          type = 'error'; // يمكن جعلها 'success' أيضًا إذا كان الحذف يعتبر نجاحًا
        }

        // محاولة استخلاص اسم المورد من الرابط (URL)
        // مثال: 'api/Project/create' -> 'Project'
        const resourceName = req.url.split('/').slice(-2, -1)[0] || 'Item';
        const formattedResourceName = resourceName.replace(/([A-Z])/g, ' $1').trim();

        const message = `<strong>${formattedResourceName}</strong> was successfully ${action}.`;

        // **FIX: The function call is changed from 'addNotification' to 'showNotification'**
        notificationService.showNotification(message, type);
      }
    })
  );
};
