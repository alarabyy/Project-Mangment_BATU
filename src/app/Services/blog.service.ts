// src/app/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, ObservableInput } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Blog, BlogDetails } from '../models/Blog';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';
// إذا كنت تستخدم NotificationService للعرض، قم باستيراده
// import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  // ***** التعديل الرئيسي هنا: إضافة '/api/' *****
  // يجب أن يتطابق 'blogs' مع اسم الـ Controller في الـ Backend (مثال: BlogsController -> /api/Blogs)
  private apiUrl = `${environment.apiUrl}/api/blogs`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    // إذا كنت تستخدم NotificationService:
    // private notificationService: NotificationService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  private handleError(error: HttpErrorResponse): ObservableInput<any> {
    console.error('Blog Service Error:', error);

    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server returned status code: ${error.status}`;

      if (error.status === 401) {
          errorMessage = 'Authentication Required: You are not authorized to perform this action. Please ensure you are logged in.';
      } else if (error.status === 403) {
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


  getAllBlogs(): Observable<Blog[]> {
    // بناءً على السجل: `GET https://batuprojects.runasp.net/blogs/get/all 404`
    // هذا يعني أن الـ Backend يتوقع: https://batuprojects.runasp.net/api/blogs/get/all
    return this.http.get<Blog[]>(`${this.apiUrl}/get/all`).pipe(
      catchError(this.handleError)
    );
  }

  getBlogDetails(id: number): Observable<BlogDetails> {
    return this.http.get<BlogDetails>(`${this.apiUrl}/get/${id}`).pipe(
      map(blog => {
        if (typeof blog.images === 'string') {
          return {
            ...blog,
            images: (blog.images as string).split(',').filter(s => s.trim() !== '')
          };
        }
        return blog;
      }),
      catchError(this.handleError)
    );
  }

  createBlog(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/create`, formData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateBlog(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/update`, formData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteBlog(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id.toString());

    return this.http.delete<any>(`${this.apiUrl}/delete`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }
}
