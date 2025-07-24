import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

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
  private mailApiUrl = `${environment.apiUrl}/mail`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  createMail(mailData: MailCreateRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('[MailService] Sending public mail creation request (without auth headers):', mailData);
    return this.http.post(`${this.mailApiUrl}/create`, mailData, { headers });
  }

  listMails(): Observable<Mail[]> {
    const headers = this.authService.getAuthHeaders();
    console.log('[MailService] Fetching mail list (with auth headers)...');
    return this.http.get<Mail[]>(`${this.mailApiUrl}/list`, { headers });
  }

  getMailById(id: number): Observable<Mail> {
    const headers = this.authService.getAuthHeaders();
    console.log(`[MailService] Fetching mail ${id} (with auth headers).`);
    return this.http.get<Mail>(`${this.mailApiUrl}/${id}`, { headers });
  }

  markMailAsRead(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    console.log(`[MailService] Marking mail ${id} as read (with auth headers).`);
    return this.http.put(`${this.mailApiUrl}/read?id=${id}`, null, { headers });
  }

  /**
   * يرسل رداً على رسالة بريد إلكتروني موجودة.
   * POST /api/mail/reply
   * (هذا Endpoint يتطلب مصادقة، لذا يستخدم authService)
   */
  replyMail(replyData: MailReplyRequest): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    console.log('[MailService] Sending mail reply request (with auth headers):', replyData);
    return this.http.post(`${this.mailApiUrl}/reply`, replyData, { headers });
  }
}
