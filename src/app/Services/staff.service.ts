// src/app/services/staff.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, ObservableInput } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Staff, StaffCreatePayload, StaffUpdatePayload } from '../models/staff';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';
// إذا كنت تستخدم NotificationService للعرض، قم باستيراده
// import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  // ***** التعديل الرئيسي هنا: إضافة '/api/' *****
  // بناءً على السجل: `GET https://batuprojects.runasp.net/staff 404 (Not Found)`
  // هذا يعني أن الـ Backend يتوقع: https://batuprojects.runasp.net/api/staff
  private apiUrl = `${environment.apiUrl}/api/staff`;
  private imageServeUrl = environment.imageBaseUrl; // تأكد أن environment.imageBaseUrl معرف بشكل صحيح

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    // إذا كنت تستخدم NotificationService:
    // private notificationService: NotificationService
  ) { }

  /**
   * دالة مساعدة لبناء HttpHeaders مع رمز المصادقة.
   * سيتم استدعاؤها قبل كل طلب يتطلب مصادقة.
   */
  private getHeadersWithAuth(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Handles HTTP errors uniformly across the service.
   * Logs the full error and returns a new Error object with a formatted message.
   * @param error The HttpErrorResponse received from the API.
   * @returns An observable that throws a new Error with a user-friendly message.
   */
  private handleError(error: HttpErrorResponse): ObservableInput<any> {
    console.error('Staff Service Error:', error);

    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server returned status code: ${error.status}`;

      if (error.status === 401) {
          errorMessage = 'Authentication Required: You are not authorized to perform this action. Please ensure you are logged in.';
      } else if (error.status === 403) { // 403 Forbidden: Authorized but doesn't have permission
          errorMessage = 'Forbidden: You do not have the necessary permissions to perform this action.';
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
               if (error.error.errors) {
                 try {
                    const validationErrors = Object.values(error.error.errors).flat().filter(msg => typeof msg === 'string').join('; ');
                    if (validationErrors) {
                        errorMessage += `\nValidation Errors: ${validationErrors}`;
                    }
                 } catch (e) {
                    console.error('Failed to parse validation errors:', e);
                 }
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

  getAllStaff(): Observable<Staff[]> {
    // بناءً على السجل: `GET https://batuprojects.runasp.net/staff 404 (Not Found)`
    // هذا يعني أن الـ Backend يتوقع `GET https://batuprojects.runasp.net/api/staff` مباشرة لجلب الكل.
    // لذا، نستخدم `this.apiUrl` فقط هنا.
    return this.http.get<Staff[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getStaffById(id: number): Observable<Staff> {
     // افترض أن الـ Backend يتوقع `/api/staff/{id}`
     return this.http.get<Staff>(`${this.apiUrl}/${id}`, { headers: this.getHeadersWithAuth() }).pipe(
         catchError(this.handleError)
     );
  }

  createStaff(staffData: StaffCreatePayload): Observable<any> {
    const formData = new FormData();
    formData.append('name', staffData.name);
    formData.append('position', staffData.position);
    formData.append('about', staffData.about);
    if (staffData.image) {
      formData.append('image', staffData.image, staffData.image.name);
    }
    return this.http.post<any>(`${this.apiUrl}/create`, formData, { headers: this.getHeadersWithAuth() }).pipe(
      catchError(this.handleError)
    );
  }

  updateStaff(staffData: StaffUpdatePayload): Observable<any> {
     const formData = new FormData();
     formData.append('id', staffData.id.toString());
     formData.append('name', staffData.name);
     formData.append('position', staffData.position);
     formData.append('about', staffData.about);

     if (staffData.image instanceof File) {
       formData.append('image', staffData.image, staffData.image.name);
     }
     else if (staffData.removeImage === true) {
        formData.append('removeImage', 'true');
     }
    return this.http.put<any>(`${this.apiUrl}/update`, formData, { headers: this.getHeadersWithAuth() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteStaff(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete<any>(`${this.apiUrl}/delete`, { params, headers: this.getHeadersWithAuth() }).pipe(
      catchError(this.handleError)
    );
  }

  getStaffImageUrl(imagePath: string | undefined | null): string | undefined {
      if (!imagePath) {
          return undefined;
      }
      const baseUrl = this.imageServeUrl.endsWith('/') ? this.imageServeUrl : this.imageServeUrl + '/';
      const path = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      return `${baseUrl}${path}`;
  }
}
