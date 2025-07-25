// src/app/Services/faculty.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Faculty } from '../models/faculty';
import { environment } from '../environments/environment';
// import { NotificationService } from './notification.service'; // إذا كنت تستخدم NotificationService

@Injectable({
  providedIn: 'root'
})
export class FacultyService {
  private apiUrl = `${environment.apiUrl}/api/faculty`;

  constructor(
    private http: HttpClient,
    // private notificationService: NotificationService
  ) { }

  // تم التأكيد على اسم الدالة: getAllFaculties
  getAllFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.apiUrl}/get/all`).pipe(
      catchError(this.handleError)
    );
  }

  getFacultyById(id: number): Observable<Faculty> {
    return this.http.get<Faculty>(`${this.apiUrl}/get/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createFaculty(facultyData: any): Observable<Faculty> {
    return this.http.post<Faculty>(`${this.apiUrl}/create`, facultyData).pipe(
      catchError(this.handleError)
    );
  }

  updateFaculty(facultyData: Faculty): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, facultyData).pipe(
      catchError(this.handleError)
    );
  }

  deleteFaculty(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(`${this.apiUrl}/delete`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Faculty Service Error:', error);
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
}
