// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // 🔽🔽🔽 أهم خطوة: ضع مفتاح API الحقيقي الخاص بك هنا 🔽🔽🔽
  // WARNING: Hardcoding keys is not secure for production applications.
  private apiKey = 'AIzaSyA5uUncE_p0rXg9tsOFWR23O9g4chWccHw'; // <--- ❗️❗️❗️ استبدل هذا بمفتاحك الحقيقي

  // ✅ FIX: تم استخدام اسم الموديل الصحيح والمتاح حاليًا
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<string> {
    // ✅ FIX: إضافة فحص للتأكد من أن المطور قد وضع مفتاح API
    if (!this.apiKey || this.apiKey === 'AIzaSyA5uUncE_p0rXg9tsOFWR23O9g4chWccHw') {
      console.error('❌ API Key is missing. Please add it to chat.service.ts');
      return of('API Key is not configured. Please contact the administrator.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        // ✅ التحقق من وجود الرد قبل محاولة الوصول إليه لتجنب الأخطاء
        return response?.candidates?.[0]?.content?.parts?.[0]?.text
          || 'I received a response, but it was empty. Please try asking in a different way.';
      }),
      // ✅ FIX: نظام معالجة أخطاء مُحسَّن لإعطاء رسائل واضحة للمستخدم
      catchError((error: HttpErrorResponse) => {
        console.error('❌ API Error:', error);

        if (error.status === 400) {
          // خطأ 400 غالبًا يعني مشكلة في مفتاح API (غير صالح، منتهي الصلاحية، أو مقيد)
          return of('There is an issue with the API configuration (Error 400). It might be an invalid API Key. Please contact support.');
        } else if (error.status === 403) {
            // خطأ 403 يعني أنك غير مصرح لك
             return of('You are not authorized to use this service (Error 403). Please check your permissions.');
        } else if (error.status === 500) {
            // خطأ 500 يعني مشكلة في خوادم جوجل
            return of('The AI service is currently experiencing issues (Error 500). Please try again later.');
        }

        // رسالة خطأ عامة لأي مشكلة أخرى (مثل مشاكل الشبكة)
        return of('Sorry, I couldn\'t connect to the AI service. Please check your network connection and try again.');
      })
    );
  }
}
