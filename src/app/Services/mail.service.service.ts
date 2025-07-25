// src/app/services/mail.service.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';
// import { NotificationService } from './notification.service'; // إذا كنت تستخدم NotificationService للعرض

export interface Mail {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  sentAt: string;
  isRead?: boolean;
  createdAt?: string;
  replier: {
    id: number;
    name: string;
  } | null;
}

export interface MailCreateRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface MailReplyRequest {
  id: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MailService {
  // ***** التعديل الرئيسي هنا: إضافة '/api/' *****
  // بناءً على الـ Endpoints التي أرسلتها للـ Backend: /api/mail/list
  private mailApiUrl = `${environment.apiUrl}/api/mail`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    // private notificationService: NotificationService // إذا كنت تستخدم NotificationService
  ) { }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Mail Service Error:', error);
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server returned status code: ${error.status}`;
      if (error.status === 401) {
          errorMessage = 'Authentication Required: You are not authorized. Please log in.';
      } else if (error.status === 403) {
          errorMessage = 'Forbidden: You do not have permission.';
      } else if (error.error) {
           if (typeof error.error === 'string' && error.error.length > 0) {
               errorMessage += ` - Details: ${error.error}`;
           } else if (error.error.message) {
                errorMessage += `\nMessage: ${error.error.message}`;
           } else if (error.error.title) {
               errorMessage += `\nTitle: ${error.error.title}`;
               if (error.error.detail) {
                  errorMessage += `\nDetail: ${error.error.detail}`;
               }
           } else {
                errorMessage += `\nDetails: ${JSON.stringify(error.error)}`;
           }
      }
    }
    console.error('Formatted Error Message:', errorMessage);
    // يمكنك استخدام خدمة التنبيهات هنا:
    // this.notificationService.showError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }


  createMail(mailData: MailCreateRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('[MailService] Sending public mail creation request (without auth headers):', mailData);
    // المسار: /api/mail/create
    return this.http.post(`${this.mailApiUrl}/create`, mailData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  listMails(): Observable<Mail[]> {
    const headers = this.authService.getAuthHeaders();
    console.log('[MailService] Fetching mail list (with auth headers)...');
    // المسار: /api/mail/list
    return this.http.get<Mail[]>(`${this.mailApiUrl}/list`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getMailById(id: number): Observable<Mail> {
    const headers = this.authService.getAuthHeaders();
    console.log(`[MailService] Fetching mail ${id} (with auth headers).`);
    // المسار: /api/mail/{id} - إذا كان الـ Backend يستخدم معرف الـ ID في الـ URL
    // بناءً على `/api/mail/list`، قد يكون `/api/mail/{id}` هو الأرجح
    return this.http.get<Mail>(`${this.mailApiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  markMailAsRead(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    console.log(`[MailService] Marking mail ${id} as read (with auth headers).`);
    // المسار: /api/mail/read?id={id}
    return this.http.put(`${this.mailApiUrl}/read?id=${id}`, null, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * يرسل رداً على رسالة بريد إلكتروني موجودة.
   * POST /api/mail/reply
   */
  replyMail(replyData: MailReplyRequest): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    console.log('[MailService] Sending mail reply request (with auth headers):', replyData);
    // المسار: /api/mail/reply
    return this.http.post(`${this.mailApiUrl}/reply`, replyData, { headers }).pipe(
      catchError(this.handleError)
    );
  }
}
