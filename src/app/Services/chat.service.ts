import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // سيقرأ المفتاح الصحيح تلقائياً حسب البيئة (محلية أو إنتاج)
  private apiKey = environment.geminiApiKey;

  // بناء الرابط باستخدام المفتاح
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<string> {
    // التحقق من وجود المفتاح
    if (!this.apiKey) {
      console.error('❌ Gemini API Key is not configured. Check your environment files and Vercel settings.');
      return of('API Key is not configured. Please contact the administrator.');
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { contents: [{ parts: [{ text: prompt }] }] };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        return response?.candidates?.[0]?.content?.parts?.[0]?.text
          || 'I received a response, but it was empty. Please try asking in a different way.';
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ API Error:', error);
        if (error.status === 400) {
          return of('There is an issue with the API configuration (Error 400). The API Key might be invalid or restricted. Please contact support.');
        } else if (error.status === 403) {
            return of('You are not authorized to use this service (Error 403). Please check your permissions.');
        } else if (error.status === 500) {
            return of('The AI service is currently experiencing issues (Error 500). Please try again later.');
        }
        return of('Sorry, I couldn\'t connect to the AI service. Please check your network connection and try again.');
      })
    );
  }
}
