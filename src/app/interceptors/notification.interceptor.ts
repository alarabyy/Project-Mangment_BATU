import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from '../Services/notification-proxy.service';
// **هذا هو المسار الصحيح والموحّد للخدمة**

export const notificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const methodsToLog = ['POST', 'PUT', 'DELETE'];

  if (!methodsToLog.includes(req.method)) { return next(req); }

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
        let action = 'Updated';
        let type: 'success' | 'info' | 'error' = 'info';

        if (req.method === 'POST') { action = 'Created'; type = 'success'; }
        if (req.method === 'DELETE') { action = 'Deleted'; type = 'error'; }

        const endpointName = req.url.split('/')[2]?.replace(/([A-Z])/g, ' $1').trim() || 'item';
        const message = `An item in <strong>${endpointName}</strong> was successfully ${action}.`;

        notificationService.addNotification(message, type);
      }
    })
  );
};
